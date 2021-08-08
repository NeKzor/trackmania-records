const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences, Campaigns, Zones } = require('./trackmania/api');
const { log, tryExportJson, tryMakeDir, importJson } = require('./utils');
const DiscordIntegration = require('./trackmania/discord');

require('dotenv').config();

const sessionFile = path.join(__dirname, '/../.login');
const gameFile = path.join(__dirname, '../games/trackmania.json');
const replayFolder = path.join(__dirname, '../replays');
const sendInitialRankings = process.argv.some((arg) => arg === '--rankings');

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
let discord2 = null;
let imported = [];
let isUpdating = false;

const cleanup = () => {
    trackmania = null;
    zones = null;
    game = [];
    gameInfo = { cheaters: [], training: { groupId: null, maps: [] } };
    discord = null;
    discord2 = null;
    imported = [];
    isUpdating = false;

    if (discord && discord.client) {
        discord.client.destroy();
    }
    if (discord2 && discord2.client) {
        discord2.client.destroy();
    }
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

            if (latest.isOfficial) {
                track.history.forEach((wr, idx, wrs) => {
                    const nextWr =  wrs
                        .slice(idx + 1)
                        .find((nextWR) => nextWR.score < wr.score);

                    wr.duration = moment(nextWr ? nextWr.date : undefined).diff(moment(wr.date), 'days');
                });
            }
        });
    }

    return latest;
};

const main = async (outputDir) => {
    tryMakeDir(outputDir);
    tryMakeDir(path.join(outputDir, '/trackmania'));
    tryMakeDir(path.join(outputDir, '/trackmania/campaign'));
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
    zones.data.forEach((zone) => delete zone.icon);

    gameInfo = importJson(gameFile);
    discord = new DiscordIntegration(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);
    discord.enabled = process.argv.some((arg) => arg === '--discord');

    discord2 = new DiscordIntegration(process.env.WEBHOOK_ID_LEADERBOARD, process.env.WEBHOOK_TOKEN_LEADERBOARD);
    discord2.enabled = process.argv.some((arg) => arg === '--discord');

    try {
        if (isUpdating) {
            log.warn('ignoring update');
            return;
        }

        isUpdating = true;

        /* Bad Ideas Zone */
        const clubId = 9507;

        const sendCampaignRankings = await dumpOfficialCampaign(clubId, outputDir);

        /* const toImport = [];

        for (const importFile of fs.readdirSync(`${outputDir}/trackmania/campaign`)) {
            if (!imported.some((file) => file.endsWith(importFile))) {
                toImport.push(`${outputDir}/trackmania/campaign/${importFile}`);
            }
        }

        toImport.forEach((importFile) => {
            game.push(importJson(importFile));
        });

        const overallOfficial = game
            .filter((campaign) => campaign.isOfficial)
            .map((campaign) => campaign.tracks)
            .flat(); */

        game.forEach((campaign) => Object.assign(campaign, generateRankings(campaign.tracks)));

        const [campaign] = game;

        if (sendInitialRankings) {
            const message = discord.createRankingsMessage(campaign);
            discord2.sendRankingsMessage(message);
        } else if (sendCampaignRankings) {
            const message = discord.createRankingsMessage(campaign);
            discord2.editRankingsMessage(process.env.WEBHOOK_MESSAGE_ID_LEADERBOARD, message);
        }

        /* tryExportJson(`${outputDir}/trackmania/rankings/campaign.json`, generateRankings(overallOfficial), true, true); */

        game.forEach((campaign) => {
            tryExportJson(
                `${outputDir}/trackmania/campaign/${campaign.name.replace(/ /g, '-').toLowerCase()}.json`,
                campaign,
                true,
                true,
            );
        });
    
        tryExportJson(gameFile, gameInfo, true, true);
    } catch (error) {
        log.error(error);
    }

    cleanup();
};

const dumpOfficialCampaign = async (clubId, outputDir) => {
    // TODO: Get campaign data with API
    // In the meantime: Thanks trackmania.io :^)

    //const campaigns = (await trackmania.campaigns(Campaigns.Official)).collect();

    const campaigns = [
        [
            'NLS-SBxKMpIg0PUGCSTxtNvfPTejaKM3fihHZ6K',
            'Summer 2021 Reverse',
            [
                'DmBYmhGcTmgCRHevGSpnCEH5xcb',
                'BOVSy1CUkx5303luT0DG5UASMki',
                'Yd_dFFdAMpO1c0rLoDchBerJFKm',
                'dGlb9eUHy7g0SDvXyzLO9Dulgn7',
                'ZtRTyCQAi2Ok91IRLUa4Oy5vbcj',
                'N8ETYwaejqjwQwUUQ90PqwrmCy8',
                'jzImpG5cO8PvprpmBav0yuwJ9yj',
                'RncnmzxthFcUFWT5zIdfgI8d7pc',
                'yaswKN0M8lQwjPT_H41_R5RGbMi',
                'Luil4F0YgPOstJLhewJC9pQKhY7',
                'CCKTuCWZFEGf80v0XxVHmVExlxl',
                'HbguFHUMsbuZNBTtqI5t5v5QfD9',
                'aP_3g8mxSCAni0UJJYGoPZ8xNV4',
                'cioAOldH_8_TwkmWhqfUhT2OvAi',
                'AKUAxwK0C0lPjwiFnZRXFiif6km',
                'XnaUQgSypHMPmPwEsK51fyBLhJe',
                'UkFsHn_mn_EXdiDsREJDdqBxXXi',
                'tQ81B9mU2RgskF1i4ZHph3R9qaa',
                'Er94ZBXL_qsF1AZQTlwas8kFjQb',
                'sHQZQxP1p2ErgChOX138V2ZENuj',
                'kiyw_c6TANhjTMT7EhSxz37GEK0',
            ]
        ],
    ];

    let sendCampaignRankings = false;

    for (const [seasonUid, name, playlist] of campaigns) {
        const latestCampaign = importLatest(
            `${outputDir}/trackmania/campaign/${name.replace(/ /g, '-').toLowerCase()}.json`,
        );

        const isTraining = name === 'Training';
        log.info(name, seasonUid);

        const maps = await trackmania.maps(playlist);
        const mapList = maps.collect();

        const tracks = [];

        for (const mapUid of playlist) {
            const { name, mapId, thumbnailUrl } = mapList.find((map) => map.mapUid === mapUid);
            log.info(name, mapUid);

            const [wrs, history, newRecords] = await resolveRecords(clubId, seasonUid, mapUid, mapId, latestCampaign, isTraining, name, mapUid);

            sendCampaignRankings = sendCampaignRankings || newRecords;

            tracks.push({
                id: mapUid,
                _id: mapId,
                name,
                wrs,
                isOfficial: true,
                history,
                thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
            });
        }

        const totalTime = tracks
            .filter((t) => t.wrs[0])
            .map((t) => t.wrs[0].score)
            .reduce((a, b) => a + b, 0);

        game.push({
            isOfficial: true,
            name,
            id: seasonUid,
            tracks,
            stats: {
                totalTime,
            },
        });
    }

    return sendCampaignRankings;
};

const autoban = (accountId, score, isTraining = false) => {
    if (gameInfo.cheaters.find((cheater) => cheater === accountId)) {
        return true;
    }

    /* if (score !== undefined && score <= (isTraining ? 4000 : 13000)) {
        log.warn('banned: ' + accountId);
        gameInfo.cheaters.push(accountId);
        return true;
    } */

    return false;
};

const resolveRecords = async (clubId, seasonUid, mapUid, mapId, latestCampaign, isTraining, trackName, trackId) => {
    const [worldLeaderboard] = (await trackmania.leaderboard(seasonUid, mapUid, clubId)).collect();

    const wrs = [];
    const latestTrack = latestCampaign ? latestCampaign.tracks.find((track) => track.id === mapUid) : undefined;
    const history = latestTrack && latestTrack.history ? latestTrack.history : [];

    const historyCount = history.length;

    let wrScore = undefined;

    for (const { accountId, zoneId, score } of worldLeaderboard.top) {
        if (autoban(accountId, score, isTraining)) {
            continue;
        }

        if (wrScore === undefined || wrScore === score) {
            wrScore = score;

            const latestWr = latestTrack
                ? latestTrack.wrs.find((wr) => wr.user.id === accountId && wr.score === score)
                : undefined;

            if (latestWr) {
                const wr = { ...latestWr };
                wr.duration = moment().diff(moment(wr.date), 'd');
                wrs.push(wr);
                continue;
            }

            const [account] = (await trackmania.accounts([accountId])).collect();
            const [record] = (await trackmania.mapRecords([accountId], [mapId])).collect();

            const latestScore = latestTrack && latestTrack.wrs[0] ? latestTrack.wrs[0].score : undefined;

            const wr = {
                user: {
                    id: accountId,
                    zone: zones.search(zoneId),
                    name: account ? account.displayName : '',
                },
                date: record ? record.timestamp : '',
                replay: record ? record.url.slice(record.url.lastIndexOf('/') + 1) : '',
                duration: record ? moment().diff(moment(record.timestamp), 'd') : 0,
                score,
                delta: Math.abs(latestWr ? latestWr.delta : latestScore ? score - latestScore : 0),
            };

            const inHistory = history
                .filter(validRecords)
                .find((formerWr) => formerWr.score === wr.score && formerWr.user.id === wr.user.id);

            if (!inHistory) {
                history.push(wr);
                log.info('NEW RECORD', wr.user.name, wr.score);

                const data = { wr, track: { name: trackName, id: trackId } };
                for (const integration of [discord]) {
                    integration.send(data);
                }

                fs.writeFileSync(
                    path.join(
                        replayFolder,
                        `/${trackName.replace(/ /g, '_')}_${record.recordScore.time}_${wr.user.name}.replay.gbx`
                    ),
                    await record.downloadReplay(),
                );
            }

            wrs.push(wr);
            continue;
        }
    }

    return [wrs, history, historyCount !== history.length];
};

const generateRankings = (tracks) => {
    const createLeaderboard = (key) => {
        const wrs = tracks.map((t) => (t[key].length > 0 ? t[key] : t.wrs).filter(validRecords)).flat();
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
                    const user = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date))[0];
                    delete user.date;

                    return {
                        user,
                        wrs: frequency[key],
                        duration: wrs
                            .filter((r) => r.user.id === key && r.duration)
                            .map((r) => r.duration)
                            .reduce((a, b) => a + b, 0),
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
            const user = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date))[0];
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

const inspect = (obj) => console.dir(obj, { depth: 6 });

if (process.argv.some((arg) => arg === '--test')) {
    main(path.join(__dirname, '../api/'), false).catch(inspect);
}

module.exports = main;
