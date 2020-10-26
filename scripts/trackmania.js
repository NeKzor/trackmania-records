const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences, Campaigns, Zones } = require('./trackmania/api');
const { log, tryExportJson, tryMakeDir, importJson } = require('./utils');
const DiscordIntegration = require('./trackmania/discord');
const TwitterIntegration = require('./trackmania/twitter');

require('dotenv').config();

const sessionFile = path.join(__dirname, '/../.login');
const gameFile = path.join(__dirname, '../games/trackmania.json');

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

Array.prototype.chunk = function (size) {
    return this.reduce((acc, val, idx) => {
        const chunk = Math.floor(idx / size);
        acc[chunk] = [].concat(acc[chunk] || [], val);
        return acc;
    }, []);
};

let trackmania = new TrackmaniaClient();
let zones = null;
let game = [];
let gameInfo = { cheaters: [], training: { groupId: null, maps: [] } };
let discord = null;
let imported = [];

const cleanup = () => {
    trackmania = null;
    zones = null;
    game = [];
    gameInfo = { cheaters: [], training: { groupId: null, maps: [] } };
    discord = null;
    imported = [];
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
        latest.tracks.forEach((track) => {
            const wr = track.wrs[0];

            track.history = track.history.filter((historyWr) => {
                if (autoban(historyWr.user.id)) {
                    return false;
                }

                if ((wr && historyWr.score >= wr.score) || historyWr.note) {
                    return true;
                }

                return false;
            });

            track.history.forEach((wr, idx, items) => {
                const thisWr = moment(wr.date);
                const nextWr = moment(items[idx + 1] ? items[idx + 1].date : undefined);
                wr.duration = nextWr.diff(thisWr, 'days');
                wr.durationMs = nextWr.diff(thisWr, 'milliseconds');
            });
        });
    }

    return latest;
};

const twitter = new TwitterIntegration(
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET_KEY,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_TOKEN_SECRET,
);

const main = async (outputDir, snapshot = true) => {
    tryMakeDir(outputDir);
    tryMakeDir(path.join(outputDir, '/trackmania'));
    tryMakeDir(path.join(outputDir, '/trackmania/campaign'));
    tryMakeDir(path.join(outputDir, '/trackmania/totd'));
    tryMakeDir(path.join(outputDir, '/trackmania/rankings'));

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
    zones.data.forEach((zone) => delete zone.icon);

    gameInfo = importJson(gameFile);
    discord = new DiscordIntegration(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);

    try {
        await dumpOfficialCampaign(outputDir);
        await dumpTrackOfTheDay(outputDir);
        await resolveGame(snapshot);

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
            game.push(importJson(importFile));
        });

        updateTwitterBot();

        const overallOfficial = game
            .filter((campaign) => campaign.isOfficial)
            .map((campaign) => campaign.tracks)
            .flat();
        const overallTotd = game
            .filter((campaign) => !campaign.isOfficial)
            .map((campaign) => campaign.tracks)
            .reduce((acc, val) => acc.concat(val), []);

        game.forEach((campaign) => Object.assign(campaign, generateRankings(campaign.tracks)));

        tryExportJson(`${outputDir}/trackmania/rankings/campaign.json`, generateRankings(overallOfficial), true, true);
        tryExportJson(`${outputDir}/trackmania/rankings/totd.json`, generateRankings(overallTotd), true, true);
        tryExportJson(
            `${outputDir}/trackmania/rankings/combined.json`,
            generateRankings([...overallOfficial, ...overallTotd]),
            true,
            true,
        );
    } catch (error) {
        discord.client.destroy();
        cleanup();

        throw error;
    } finally {
        if (discord) {
            discord.client.destroy();
        }
    }

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

    cleanup();
};

const dumpOfficialCampaign = async (outputDir) => {
    const campaigns = (await trackmania.campaigns(Campaigns.Official)).collect();

    for (const { seasonUid, name, playlist } of campaigns) {
        const latestCampaign = importLatest(
            `${outputDir}/trackmania/campaign/${name.replace(/ /, '-').toLowerCase()}.json`,
        );

        const isTraining = name === 'Training';
        //log.info(name, seasonUid);

        const maps = await trackmania.maps(playlist.map((map) => map.mapUid));
        const mapList = maps.collect();

        const tracks = [];

        for (const { mapUid } of playlist) {
            const { name, mapId, thumbnailUrl } = mapList.find((map) => map.mapUid === mapUid);
            //log.info(name, mapUid);

            const leaderboard = await trackmania.leaderboard(seasonUid, mapUid, 0, 5);
            const rankings = leaderboard.collect()[0].top;

            let wrs = [];
            let wr = undefined;

            const latestTrack = latestCampaign ? latestCampaign.tracks.find((track) => track.id === mapUid) : undefined;

            for (const { accountId, zoneId, score } of rankings) {
                if (autoban(accountId, score, isTraining)) {
                    continue;
                }

                if (wr === undefined || wr === score) {
                    const zone = zones.search(zoneId);

                    const latestScore = latestTrack && latestTrack.wrs[0] ? latestTrack.wrs[0].score : undefined;
                    const latestWr = latestTrack
                        ? latestTrack.wrs.find((wr) => wr.user.id === accountId && wr.score === score)
                        : undefined;

                    wrs.push({
                        user: {
                            id: accountId,
                            zone,
                        },
                        score: (wr = score),
                        delta: Math.abs(latestWr ? latestWr.delta : latestScore ? score - latestScore : 0),
                        isNew: !latestWr && latestScore ? true : false,
                    });
                    continue;
                }
            }

            tracks.push({
                id: mapUid,
                _id: mapId,
                name,
                wrs,
                isOfficial: true,
                history: latestTrack && latestTrack.history ? latestTrack.history : [],
                thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
            });
        }

        const totalTime = tracks.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

        game.push({
            isOfficial: true,
            name,
            tracks,
            stats: {
                totalTime,
            },
        });
    }
};

const dumpTrackOfTheDay = async (outputDir) => {
    const campaigns = await trackmania.campaigns(Campaigns.TrackOfTheDay, 0, 1);

    for (const { year, month, days } of campaigns) {
        const name = `${moment()
            .set('month', month - 1)
            .format('MMMM')} ${year}`;

        log.info(name);
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

        for (const { mapUid, seasonUid, monthDay } of trackDays) {
            const { name, mapId, thumbnailUrl } = mapList.find((map) => map.mapUid === mapUid);
            log.info(name, seasonUid, mapUid);

            const leaderboard = await trackmania.leaderboard(seasonUid, mapUid, 0, 5);
            const rankings = leaderboard.collect()[0].top;

            let wrs = [];
            let wr = undefined;

            const latestTrack = latestCampaign ? latestCampaign.tracks.find((track) => track.id === mapUid) : undefined;

            for (const { accountId, zoneId, score } of rankings) {
                if (autoban(accountId, score)) {
                    continue;
                }

                if (wr === undefined || wr === score) {
                    const zone = zones.search(zoneId);

                    const latestScore = latestTrack && latestTrack.wrs[0] ? latestTrack.wrs[0].score : undefined;
                    const latestWr = latestTrack
                        ? latestTrack.wrs.find((wr) => wr.user.id === accountId && wr.score === score)
                        : undefined;

                    wrs.push({
                        user: {
                            id: accountId,
                            zone,
                        },
                        score: (wr = score),
                        delta: Math.abs(latestWr ? latestWr.delta : latestScore ? score - latestScore : 0),
                        isNew: !latestWr && latestScore ? true : false,
                    });
                    continue;
                }
            }

            tracks.push({
                id: mapUid,
                _id: mapId,
                name,
                monthDay,
                wrs,
                isOfficial: false,
                history: latestTrack && latestTrack.history ? latestTrack.history : [],
                thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
            });
        }

        const totalTime = tracks.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

        game.push({
            isOfficial: false,
            year,
            month,
            name,
            tracks,
            stats: {
                totalTime,
            },
        });
    }
};

const autoban = (accountId, score, isTraining = false) => {
    if (gameInfo.cheaters.find((cheater) => cheater === accountId)) {
        return true;
    }

    if (score !== undefined && score <= (isTraining ? 4000 : 13000)) {
        log.warn('banned: ' + accountId);
        gameInfo.cheaters.push(accountId);
        return true;
    }

    return false;
};

const resolveGame = async (snapshot) => {
    const users = new Map();

    game.map(({ tracks }) => tracks)
        .reduce((acc, val) => acc.concat(val), [])
        .forEach(({ wrs, ...track }) => {
            wrs.forEach((wr) => {
                const user = users.get(wr.user.id);
                if (user) {
                    user.push({ track, wr });
                } else {
                    users.set(wr.user.id, [{ track, wr }]);
                }
            });
        });

    for (const userIds of [...users.keys()].chunk(10)) {
        const accounts = (await trackmania.accounts(userIds)).collect();

        for (const userId of userIds) {
            const user = users.get(userId);
            const { displayName } = accounts.find((account) => account.accountId === userId);

            /* chunk this if Hefest or one of the totd hunters gets more wrs... maybe */
            const mapIds = user.map(({ track }) => track._id);
            const records = await trackmania.mapRecords([userId], mapIds);

            for (const { mapId, timestamp, url } of records) {
                const { wr, track } = user.find(({ track }) => track._id === mapId);

                wr.user.name = displayName;
                wr.date = timestamp;
                wr.replay = url.slice(url.lastIndexOf('/') + 1);
                wr.duration = moment().diff(moment(timestamp), 'd');

                const inHistory = track.history.filter(validRecords).find((formerWr) => {
                    return formerWr.score === wr.score && formerWr.user.id === wr.user.id;
                });

                if (wr.isNew && !inHistory && (track.isOfficial || !snapshot)) {
                    //track.history = track.history.filter((formerWr) => formerWr.score >= wr.score);
                    track.history.push(wr);

                    const data = { wr, track };
                    for (const integration of [/* discord,  */ twitter]) {
                        integration.send(data);
                    }
                }

                delete wr.isNew;
            }
        }
    }
};

const generateRankings = (tracks) => {
    const createLeaderboard = (key) => {
        const wrs = tracks
            .map((t) => (t[key].length > 0 ? t[key] : t.wrs).filter(validRecords))
            .reduce((acc, val) => acc.concat(val), []);
        const users = tracks
            .map((t) => t[key].filter(validRecords).map((r) => r.user))
            .reduce((acc, val) => acc.concat(val), []);

        const frequency = users.reduce((count, user) => {
            count[user.name] = (count[user.name] || 0) + 1;
            return count;
        }, {});

        return [
            Object.keys(frequency)
                .sort((a, b) => frequency[b] - frequency[a])
                .map((key) => ({
                    user: users.find((u) => u.name === key),
                    wrs: frequency[key],
                    duration: wrs
                        .filter((r) => r.user.name === key && r.duration)
                        .map((r) => r.duration)
                        .reduce((a, b) => a + b, 0),
                    durationMs: wrs
                        .filter((r) => r.user.name === key && r.durationMs)
                        .map((r) => r.durationMs)
                        .reduce((a, b) => a + b, 0),
                })),
            [...new Set(users.map((user) => user.zone[Zones.Country].zoneId))]
                .map((zoneId) => ({
                    zone: zones.search(zoneId).slice(0, 3),
                    wrs: users.filter((user) => user.zone[Zones.Country].zoneId === zoneId).length,
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
            const all = (t.history.length > 0 ? t.history : t.wrs).filter(validRecords).map((r) => r.user);
            const ids = [...new Set(all.map((user) => user.id))];
            return ids.map((id) => all.find((user) => user.id === id));
        })
        .reduce((acc, val) => acc.concat(val), []);
    const frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const uniqueLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.id === key),
            wrs: frequency[key],
        }));
    const uniqueCountryLeaderboard = [...new Set(users.map((user) => user.zone[Zones.Country].zoneId))]
        .map((zoneId) => ({
            zone: zones.search(zoneId).slice(0, 3),
            wrs: users.filter((user) => user.zone[Zones.Country].zoneId === zoneId).length,
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
    const monday = moment().weekday(1).hour(0).minute(0).second(0);
    const sunday = moment().weekday(7).hour(23).minute(59).second(59);

    let wrsThisWeek = 0;

    game.map((c) => c.tracks)
        .flat()
        .map((t) => t.history.filter(validRecords))
        .flat()
        .forEach((wr) => {
            if (moment(wr.date).isBetween(monday, sunday)) {
                ++wrsThisWeek;
            }
        });

    twitter.updateBio({ wrsThisWeek });
};

const inspect = (obj) => console.dir(obj, { depth: 6 });

if (process.argv[2] === '--test') {
    main(path.join(__dirname, '../api/'), false).catch(inspect);
}

process.on('SIGINT', () => {
    twitter.updateBio({ status: '#OFFLINE' }).finally(() => process.exit());
});

module.exports = main;
