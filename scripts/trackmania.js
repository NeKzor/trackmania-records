require('dotenv').config();
require('./db');

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences, Campaigns, Zones } = require('./trackmania/api');
const { delay, log, tryExportJson, tryMakeDir, importJson } = require('./utils');
const DiscordIntegration = require('./trackmania/discord');
const TwitterIntegration = require('./trackmania/twitter');
const dumpCompetitions = require('./trackmania_competitions');
const { Replay } = require('./trackmania/models');
const { TrackmaniaOAuthClient } = require('./trackmania/oauth');

const sessionFile = path.join(__dirname, '/../.login');
const gameFile = path.join(__dirname, '../games/trackmania.json');
const replayFolder = process.env.TRACKMANIA_REPLAYS_FOLDER || path.join(__dirname, '../replays');

const loadSession = (client) => {
    try {
        client.loginData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));

        if (moment(client.loginData.expiration).diff(moment().utc(), 'seconds') <= 0) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
};

const saveSession = (client) => {
    fs.writeFileSync(sessionFile, JSON.stringify(client.loginData));
};

const oauthClient = new TrackmaniaOAuthClient({
    id: process.env.TRACKMANIA_CLIENT_ID,
    secret: process.env.TRACKMANIA_CLIENT_SECRET,
});

let trackmania = new TrackmaniaClient();
let zones = null;
let game = [];
let gameInfo = {
    cheaters: [],
    whitelist: [],
    training: {
        seasonUid: null,
        playlist: [],
    },
    snow_discovery: {
        seasonUid: null,
        playlist: [],
    },
    rally_discovery: {
        seasonUid: null,
        playlist: [],
    },
};
let discord = null;
let imported = [];
let isUpdating = false;

const cleanup = () => {
    trackmania = null;
    zones = null;
    game = [];
    gameInfo = {
        cheaters: [],
        whitelist: [],
        training: {
            seasonUid: null,
            playlist: [],
        },
        snow_discovery: {
            seasonUid: null,
            playlist: [],
        },
        rally_discovery: {
            seasonUid: null,
            playlist: [],
        },
    };
    discord = null;
    imported = [];
    isUpdating = false;
    if (discord && discord.client) {
        discord.client.destroy();
    }
};

const fixHistory = (campaign) => {
    const now = moment().unix();
    const nowOrEndOfSeason = moment.unix(campaign.event && campaign.event.endsAt < now ? campaign.event.endsAt : now);
    const nowOrStartOfSeason = campaign.event ? campaign.event.startsAt : null;

    campaign.tracks.forEach((track) => {
        const wrScore = (() => {
            const [wr] = track.wrs;
            return wr ? wr.score : null;
        })();

        const startOfEvent = track.isOfficial
            ? nowOrStartOfSeason
            : (track.event ? track.event.startsAt : null);

        const endOfEvent = track.isOfficial
            ? nowOrEndOfSeason
            : moment.unix(track.event && track.event.endsAt < now ? track.event.endsAt : now);

        track.history = track.history.filter((historyWr) => {
            if (gameInfo.cheaters.find((cheater) => cheater === historyWr.user.id)) {
                return false;
            }

            if (historyWr.note) {
                return true;
            }

            const timestamp = moment(historyWr.date).unix();

            if (startOfEvent && timestamp < startOfEvent) {
                log.warn(`started before event (${track.name} -> ${timestamp} < ${startOfEvent})`);
                inspect(historyWr);
                return false;
            }

            return (wrScore && historyWr.score >= wrScore) || historyWr.note;
        });

        track.history.forEach((wr, idx, wrs) => {
            const nextWr = wrs.slice(idx + 1).find((nextWR) => nextWR.score < wr.score);

            wr.duration = moment(nextWr ? nextWr.date : endOfEvent).diff(moment(wr.date), 'days');

            if (wr.duration < 0) {
                log.warn(`negative duration for ${wr.user.name} -> ${wr.score} -> ${wr.date} -> ${track.name}`);
            }
        });

        const [firstWr] = track.history;
        if (firstWr) {
            firstWr.delta = 0;
        }
    });
};

const validRecords = (record) => record.note === undefined;

const importLatest = (file) => {
    imported.push(file);

    const latest = (() => {
        try {
            return importJson(file);
        } catch {
            return null;
        }
    })();

    if (latest) {
        fixHistory(latest);
    }

    return latest;
};

const twitter = new TwitterIntegration(
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET_KEY,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_TOKEN_SECRET,
);
twitter.enabled = process.argv.some((arg) => arg === '--twitter');

const main = async (outputDir, snapshot = true) => {
    tryMakeDir(outputDir);
    tryMakeDir(path.join(outputDir, '/trackmania'));
    tryMakeDir(path.join(outputDir, '/trackmania/campaign'));
    tryMakeDir(path.join(outputDir, '/trackmania/totd'));
    tryMakeDir(path.join(outputDir, '/trackmania/rankings'));
    tryMakeDir(path.join(replayFolder));

    const ubisoft = new UbisoftClient(process.env.UBI_EMAIL, process.env.UBI_PW);

    /* save this session locally or we get rate limited */
    if (!loadSession(ubisoft)) {
        await ubisoft.login();
        saveSession(ubisoft);
    }

    trackmania = new TrackmaniaClient(ubisoft.loginData.ticket);

    await trackmania.login();

    /* required for leaderboard only */
    await trackmania.loginNadeo(Audiences.NadeoLiveServices);

    zones = await trackmania.zones();
    zones.data.forEach((zone) => {
        Object.keys(zone).forEach((key) => {
            if (!['name', 'parentId', 'zoneId'].includes(key)) {
                delete zone[key];
            }
        });
    });

    gameInfo = importJson(gameFile);
    discord = new DiscordIntegration(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);
    discord.enabled = process.argv.some((arg) => arg === '--discord');

    try {
        if (isUpdating) {
            log.warn('ignoring update');
            return;
        }

        const isTimeToDumpCupOfTheDay = false; //moment().add(10, 'seconds').format('HH:mm') === '21:15';
        const isTimeToDumpA08Forever = false; //moment().add(10, 'seconds').format('DD HH:mm') === '08 22:00';

        isUpdating = true;

        await dumpOfficialCampaign(outputDir);
        await dumpTrackOfTheDay(outputDir, snapshot);

        const toImport = [];

        for (const importFile of fs.readdirSync(`${outputDir}/trackmania/campaign`)) {
            if (!imported.some((file) => file.endsWith(importFile))) {
                toImport.push(`${outputDir}/trackmania/campaign/${importFile}`);
            }
        }

        for (const importFile of fs.readdirSync(`${outputDir}/trackmania/totd`)) {
            if (!imported.some((file) => file.endsWith(importFile))) {
                toImport.push(`${outputDir}/trackmania/totd/${importFile}`);
            }
        }

        toImport.forEach((importFile) => {
            const campaign = importJson(importFile);
            fixHistory(campaign);
            game.push(campaign);
        });

        updateTwitterBot();

        const overallOfficial = game.filter((campaign) => campaign.isOfficial);
        const overallTotd = game.filter((campaign) => !campaign.isOfficial);

        game.forEach((campaign) => Object.assign(campaign, generateRankings([campaign])));

        tryExportJson(`${outputDir}/trackmania/rankings/campaign.json`, generateRankings(overallOfficial), true, true);
        tryExportJson(`${outputDir}/trackmania/rankings/totd.json`, generateRankings(overallTotd), true, true);
        tryExportJson(
            `${outputDir}/trackmania/rankings/combined.json`,
            generateRankings(game),
            true,
            true,
        );

        game.forEach((campaign) => {
            const path = campaign.isOfficial ? 'campaign' : 'totd';
            tryExportJson(
                `${outputDir}/trackmania/${path}/${campaign.name.replace(/ /, '-').toLowerCase()}.json`,
                campaign,
                true,
                true,
            );
        });

        tryExportJson(gameFile, gameInfo, true, true);

        if (isTimeToDumpCupOfTheDay) await dumpCompetitions(trackmania, zones, false);
        if (isTimeToDumpA08Forever) await dumpCompetitions(trackmania, zones, true);
    } catch (error) {
        log.error(error);
    }

    cleanup();
};

const dumpOfficialCampaign = async (outputDir) => {
    const campaigns = (await trackmania.campaigns(Campaigns.Official)).collect();
    campaigns.push(gameInfo.training);
    campaigns.push(gameInfo.snow_discovery);
    campaigns.push(gameInfo.rally_discovery);

    for (const { seasonUid, name, playlist, startTimestamp, endTimestamp } of campaigns) {
        const currentCampaign = {
            isOfficial: true,
            name,
            id: seasonUid,
            event: {
                startsAt: startTimestamp,
                endsAt: endTimestamp,
            },
        };

        const latestCampaign = importLatest(
            `${outputDir}/trackmania/campaign/${name.replace(/ /, '-').toLowerCase()}.json`,
        );

        log.info(name, seasonUid);

        const maps = await trackmania.maps(playlist.map((map) => map.mapUid));
        const mapList = maps.collect();

        const tracks = [];

        for (const { mapUid } of playlist) {
            const { name, mapId, thumbnailUrl } = mapList.find((map) => map.mapUid === mapUid);
            log.info(name, mapUid);

            const track = {
                id: mapUid,
                _id: mapId,
                name,
                isOfficial: true,
                thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
            };

            await resolveRecords(track, currentCampaign, latestCampaign);

            tracks.push(track);
        }

        currentCampaign.tracks = tracks;

        const totalTime = tracks
            .filter((t) => t.wrs[0])
            .map((t) => t.wrs[0].score)
            .reduce((a, b) => a + b, 0);

        currentCampaign.stats = { totalTime };

        game.push(currentCampaign);
    }
};

const dumpTrackOfTheDay = async (outputDir, snapshot) => {
    const campaigns = await trackmania.campaigns(Campaigns.TrackOfTheDay);

    for (const { year, month, days } of campaigns) {
        const name = `${moment()
            .set('month', month - 1)
            .format('MMMM')} ${year}`;

        const currentCampaign = {
            isOfficial: false,
            year,
            month,
            name,
        };

        const latestCampaign = importLatest(
            `${outputDir}/trackmania/totd/${name.replace(/ /, '-').toLowerCase()}.json`,
        );

        const playable = days.filter((day) => day.mapUid !== '');

        const trackDays = latestCampaign
            ? playable.filter((day) => !latestCampaign.tracks.slice(0, -1).find((track) => track.id === day.mapUid))
            : playable;

        const tracks = latestCampaign ? latestCampaign.tracks.slice(0, -1) : [];

        const maps = await trackmania.maps(trackDays.map((map) => map.mapUid));
        const mapList = maps.collect();

        for (const { mapUid, seasonUid, monthDay, startTimestamp, endTimestamp } of trackDays) {
            const { name, mapId, thumbnailUrl } = mapList.find((map) => map.mapUid === mapUid);
            log.info(name, seasonUid, mapUid);

            const track = {
                id: mapUid,
                _id: mapId,
                season: seasonUid,
                name,
                monthDay,
                isOfficial: false,
                thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
                event: {
                    startsAt: startTimestamp,
                    endsAt: endTimestamp,
                },
            };

            await resolveRecords(track, currentCampaign, latestCampaign, false);

            tracks.push(track);
        }

        currentCampaign.tracks = tracks;

        const totalTime = tracks
            .filter((t) => t.wrs[0])
            .map((t) => t.wrs[0].score)
            .reduce((a, b) => a + b, 0);

        currentCampaign.stats = { totalTime };

        game.push(currentCampaign);
    }
};

const autoban = (accountId, score, track) => {
    if (gameInfo.whitelist.find((whitelisted) => whitelisted === accountId)) {
        return false;
    }

    if (gameInfo.cheaters.find((cheater) => cheater === accountId)) {
        return true;
    }

    if (score !== undefined && score <= 3000) {
        ban(accountId, score, track);
        return true;
    }

    return false;
};

const ban = (account, score, track) => {
    const accountId = typeof account === 'string' ? account : account.accountId;

    log.warn('banned: ' + accountId);
    gameInfo.cheaters.push(accountId);

    try {
        const sendBanAlert = (accountInfo) => {
            discord.send({
                user: {
                    id: accountInfo.accountId,
                    name: accountInfo.displayName,
                },
                score,
                track,
            }, true);
        };

        if (typeof account !== 'string') {
            sendBanAlert(account);
        } else {
            oauthClient.displayNames([accountId])
                .then((displayNames) => {

                    log.info('ban(displayNames)', displayNames);

                    const displayName = displayNames[accountId];
                    if (displayName) {
                        sendBanAlert({
                            accountId,
                            displayName,
                        });
                    }
                });
            }
    } catch (oops) {
        log.error(oops);
    }
};

const saveReplay = async (record, wr, campaign, track) => {
    const subFolder = getReplayFolder(campaign, track);
    tryMakeDir(path.join(replayFolder, subFolder));

    // TODO: Replace all invalid path characters for Windows
    const filename = path.join(subFolder, `${track.name.replace(/ /g, '_')}_${wr.score}_${wr.user.name}.replay.gbx`);

    fs.writeFileSync(
        path.join(replayFolder, filename),
        await record.downloadReplay(),
    );

    await Replay
        .findOneAndUpdate({ replay_id: wr.replay }, { filename }, { upsert: true })
        .then((doc) => log.info('inserted', doc))
        .catch(log.error);
};

const getReplayFolder = (campaign, track) => {
    if (campaign.name === 'Training') {
        const trackFolder = track.name.slice(track.name.indexOf(campaign.name) + campaign.name.length + 3);
        return path.join('training', trackFolder);
    }

    if (campaign.name === 'SNOW DISCOVERY') {
        const trackId = gameInfo.snow_discovery.playlist.findIndex((map) => map.mapUid === track.id) + 1;
        const trackFolder = trackId.toString().padStart(2, '0');
        return path.join('snow_discovery', trackFolder);
    }

    if (campaign.name === 'Rally discovery') {
        const trackId = gameInfo.rally_discovery.playlist.findIndex((map) => map.mapUid === track.id) + 1;
        const trackFolder = trackId.toString().padStart(2, '0');
        return path.join('rally_discovery', trackFolder);
    }

    if (campaign.isOfficial) {
        const [season, year] = campaign.name.split(' ');
        const yearFolder = year;
        const seasonFolder = season.toLowerCase();
        const trackFolder = track.name.slice(track.name.indexOf(campaign.name) + campaign.name.length + 3);

        return path.join('campaign', yearFolder, seasonFolder, trackFolder);
    }

    const [month, year] = campaign.name.split(' ');    
    const yearFolder = year;
    const monthFolder = month.toLowerCase();
    const dayFolder = track.monthDay.toString();

    return path.join('totd', yearFolder, monthFolder, dayFolder);
};

const resolveRecords = async (track, currentCampaign, latestCampaign) => {
    const eventStart = track.isOfficial ? currentCampaign.event.startsAt : track.event.startsAt;
    const eventEnd = track.isOfficial ? currentCampaign.event.endsAt : track.event.endsAt;
    const oneWeekAfterOfficialCampaignStart = track.isOfficial ? moment.unix(eventStart).add(7, 'days').unix() : 0;

    const [leaderboard] = (
        await trackmania.leaderboard(currentCampaign.isOfficial ? currentCampaign.id : track.season, track.id, 0, 5)
    ).collect();

    const wrs = [];
    const latestTrack = latestCampaign ? latestCampaign.tracks.find(({ id }) => id === track.id) : undefined;
    const history = latestTrack && latestTrack.history ? latestTrack.history : [];

    let wrScore = undefined;

    for (const { accountId, zoneId, score } of leaderboard.top) {
        if (autoban(accountId, score, track)) {
            continue;
        }

        if (wrScore === undefined || wrScore === score) {
            const latestWr = latestTrack
                ? latestTrack.wrs.find((wr) => wr.user.id === accountId && wr.score === score)
                : undefined;

            if (latestWr) {
                const wr = { ...latestWr };
                wr.duration = moment().diff(moment(wr.date), 'd');
                wrs.push(wr);

                wrScore = score;
                continue;
            }

            const [displayNames, webIdentities] = await Promise.all([
                oauthClient.displayNames([accountId]),
                trackmania.webIdentities([accountId]),
            ]);

            // I keep this for historical reasons:
            //      Fck you Nando for removing the timestamp!!

            /* ban if account is too young */
            const [webIdentity] = webIdentities.collect();
            if (webIdentity && track.isOfficial && moment().diff(moment(webIdentity.timestamp), 'hours') <= (24 * 7)) {
                if (!gameInfo.whitelist.find((whitelistId) => whitelistId === accountId)) {
                    ban(accountId, score, track);
                    continue;
                }
            }

            wrScore = score;

            const [record] = (await trackmania.mapRecords([accountId], [track._id])).collect();
            if (!record) {
                log.error(`unable to get map record info from ${accountId} on ${track._id}`);
                continue;
            }

            const timestamp = moment(record.timestamp);

            if (timestamp.unix() < eventStart || timestamp.unix() > eventEnd) {
                log.warn(`ignored record: time was not driven during the event (${record.timestamp} -> ${eventStart} -> ${eventEnd})`);
                continue;
            }

            const latestScore = latestTrack && latestTrack.wrs[0] ? latestTrack.wrs[0].score : undefined;

            const wr = {
                user: {
                    id: accountId,
                    zone: zones.search(zoneId),
                    name: displayNames[accountId] ?? '',
                },
                date: record ? record.timestamp : '',
                replay: record ? record.url.slice(record.url.lastIndexOf('/') + 1) : '',
                duration: record ? moment().diff(timestamp, 'd') : 0,
                score,
                delta: Math.abs(latestWr ? latestWr.delta : latestScore ? score - latestScore : 0),
            };

            const inHistory = history
                .filter(validRecords)
                .find((formerWr) => formerWr.score === wr.score && formerWr.user.id === wr.user.id);

            if (!inHistory) {
                history.push(wr);
                log.info('NEW RECORD', wr.user.name, wr.score);
                inspect(wr);

                const data = { wr: { ...wr }, track: { ...track } };

                if (track.isOfficial && currentCampaign !== 'Training' && timestamp.unix() >= oneWeekAfterOfficialCampaignStart) {
                    for (const integration of [twitter]) {
                        integration.send(data);
                    }
                }

                try {
                    await saveReplay(record, wr, currentCampaign, track);
                } catch (error) {
                    log.error(error);
                }
            }

            wrs.push(wr);
            continue;
        }
    }

    const latestWrs = latestTrack?.wrs ?? [];

    if (latestWrs.length && !wrs.length) {
        log.error(`unable to resolve records ${track.name}`);
        track.wrs = latestWrs;
        track.history = latestTrack.history;
    } else {
        track.wrs = wrs;
        track.history = history;
    }
};

const generateRankings = (campaigns) => {
    const now = moment().unix();

    const tracks = campaigns
        .map((campaign) => {
            const nowOrEndOfEvent = campaign.event && campaign.event.endsAt < now ? campaign.event.endsAt : now;
            return campaign.tracks.map((track) => ({ ...track, nowOrEndOfEvent }));
        })
        .flat();

    const createLeaderboard = (key) => {
        const users = tracks
            .map((t) =>
                (t[key].length > 0 ? t[key] : t.wrs).filter(validRecords).map(({ user, date }) => ({ ...user, date })),
            )
            .flat();

        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        return [
            Object.keys(frequency)
                .sort((a, b) => frequency[b] - frequency[a])
                .map((key) => {
                    const [user] = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date));
                    delete user.date;

                    return {
                        user,
                        wrs: frequency[key],
                        duration: 0,
                    };
                }),
            [
                ...new Set(
                    users.map(
                        (user) => (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId,
                    ),
                ),
            ]
                .map((zoneId) => ({
                    zone: zones.search(zoneId).slice(0, 3),
                    wrs: users.filter(
                        (user) =>
                            (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId ===
                            zoneId,
                    ).length,
                }))
                .sort((a, b) => {
                    const v1 = a.wrs;
                    const v2 = b.wrs;
                    return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
                }),
        ];
    };

    const [leaderboard, countryLeaderboard] = createLeaderboard('wrs');
    const [historyLeaderboard, historyCountryLeaderboard] = createLeaderboard('history');

    const users = tracks
        .map((t) => {
            const all = (t.history.length > 0 ? t.history : t.wrs)
                .filter(validRecords)
                .map(({ user, date }) => ({ ...user, date }));
            const ids = [...new Set(all.map((user) => user.id))];
            return ids.map((id) => all.find((user) => user.id === id));
        })
        .flat();
    const frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const uniqueLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => {
            const [user] = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date));
            delete user.date;
            return {
                user,
                wrs: frequency[key],
            };
        });
    const uniqueCountryLeaderboard = [
        ...new Set(
            users.map((user) => (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId),
        ),
    ]
        .map((zoneId) => ({
            zone: zones.search(zoneId).slice(0, 3),
            wrs: users.filter(
                (user) =>
                    (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId === zoneId,
            ).length,
        }))
        .sort((a, b) => {
            const v1 = a.wrs;
            const v2 = b.wrs;
            return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
        });

    return {
        leaderboard,
        countryLeaderboard,
        historyLeaderboard,
        historyCountryLeaderboard,
        uniqueLeaderboard,
        uniqueCountryLeaderboard,
    };
};

const updateTwitterBot = () => {
    const monday = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const sunday = moment().endOf('isoWeek').format('YYYY-MM-DD');
    log.info(`week start -> end: ${monday} -> ${sunday}`);

    const wrsThisWeek = game
        .map((c) => c.tracks)
        .flat()
        .filter((t) => t.isOfficial)
        .map((t) => t.history.filter(validRecords))
        .flat()
        .reduce((sum, wr) => {
            const date = wr.date.slice(0, 10);
            return date >= monday && date <= sunday ? sum + 1 : sum;
        }, 0);

    twitter.updateBio({ wrsThisWeek });
};

const inspect = (obj) => {
    log.info(JSON.stringify(obj));
    console.dir(obj, { depth: 6 });
};

if (process.argv.some((arg) => arg === '--test')) {
    main(path.join(__dirname, '../api/'), false).catch(inspect);
}

module.exports = main;
