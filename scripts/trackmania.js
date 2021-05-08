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

    try {
        /* Bad Ideas Zone */
        const clubId = 9507;

        await dumpOfficialCampaign(clubId, outputDir);

        const toImport = [];

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
            .flat();

        game.forEach((campaign) => Object.assign(campaign, generateRankings(campaign.tracks)));

        tryExportJson(`${outputDir}/trackmania/rankings/campaign.json`, generateRankings(overallOfficial), true, true);
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
        tryExportJson(
            `${outputDir}/trackmania/campaign/${campaign.name.replace(/ /g, '-').toLowerCase()}.json`,
            campaign,
            true,
            true,
        );
    });

    tryExportJson(gameFile, gameInfo, true, true);

    cleanup();
};

const dumpOfficialCampaign = async (clubId, outputDir) => {
    // TODO: Get campaign data with API
    // In the meantime: Thanks trackmania.io :^)

    //const campaigns = (await trackmania.campaigns(Campaigns.Official)).collect();

    const campaigns = [
        [
            'NLS-fkseoTFAICfevb1jc4pI4P5xPXM1wo5IzWu',
            'Spring 2021 Reverse',
            [
                'amyrPdVcVRGCF7gAFmTZPGAoBBa',
                'GyhcxYlP2Snhw4a76e9N9FbvxW1',
                'nAnPF3HKbFLckiReRKF7i_HeLyd',
                'bW4h8UxXgT3ORFFaBPaWPm1P6v7',
                'uN8vPtKvQf9KIklAGVeHfboMG5e',
                'iecOr8V7sipQhtX7mA0RpTFwwj8',
                'fCJm5SNddhb85K8SnmOOhj9irW',
                '6sLpdFwj6dCYBpI0lFEyCvPg2Vf',
                'I2RsKYxe_WofuIqbgsbJ7iIySfm',
                'yVMQ2WctJCsylHzcxsVTt4IpWT5',
                'OMSXmt0TgGlMqkynsWzIFJSL5X9',
                '4JJiQmwPPpftwgbPosumIxBu2Kg',
                'K8pbh0nWFiwuEzfoYhI9Oh2EE3c',
                'QwkvQfx0RCwdYt2r1ctP7ZPVqzl',
                'ycXSLqGMSuhCOViB3LxBzz1Vwl1',
                's6_oapo_qQh7EXh0XKzxTshh51b',
                'BAoxs3qFNPNArjxt70K7b_Qhtcm',
                'JyZLsVfAbZnO8nu3KTQ64uAFUr',
                'Crqbu2NdzqjVXJ1_KHj2FIzbsb9',
                'YB55Nb9SPAONH4UuY6JxC0gzr97',
                'oSeuVSainC5A8FtYs6OgDb7pYK1',
                'aR_ritUjAD0GKZPA2zswoR68Dbc',
                'eHcWFTw8Boh8i_mJFNRuN_bFAg6',
                '0WXJlQUpzl5fVS1vQLJ7YEZRCP8',
                'X9lXNOamaU3cnR0klf3zVaeVytf',
            ],
        ],
    ];

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

            const [wrs, history] = await resolveRecords(clubId, seasonUid, mapUid, mapId, latestCampaign, isTraining, name);

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

const resolveRecords = async (clubId, seasonUid, mapUid, mapId, latestCampaign, isTraining, trackName) => {
    const [worldLeaderboard] = (await trackmania.leaderboard(seasonUid, mapUid, clubId)).collect();

    const wrs = [];
    const latestTrack = latestCampaign ? latestCampaign.tracks.find((track) => track.id === mapUid) : undefined;
    const history = latestTrack && latestTrack.history ? latestTrack.history : [];

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

                const data = { wr, track: { name: trackName } };
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

    return [wrs, history];
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
