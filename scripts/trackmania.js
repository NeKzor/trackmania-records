const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences, Campaigns, Zones } = require('./trackmania/api');
const { log, tryExportJson, tryMakeDir, importJson } = require('./utils');

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

let trackmania = null;
let zones = null;
let game = [];
let cheaters = [];
let latest = [];

const main = async (outputDir, snapshot = true) => {
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

    cheaters = importJson(gameFile).cheaters;
    latest = importJson(`${outputDir}/trackmania/latest.json`);

    await dumpOfficialCampaign();
    await dumpTrackOfTheDay();
    await resolveGame();

    tryMakeDir(outputDir);
    tryMakeDir(path.join(outputDir, '/trackmania'));
    tryExportJson(`${outputDir}/trackmania/latest.json`, game, true);

    if (snapshot) {
        tryExportJson(`${outputDir}/trackmania/${moment().format('YYYY-MM-DD')}.json`, game, true);
    }

    tryExportJson(gameFile, { cheaters }, true, true);

    trackmania = null;
    zones = null;
    game = [];
    cheaters = [];
    latest = [];
};

const dumpOfficialCampaign = async () => {
    const campaigns = await trackmania.campaigns(Campaigns.Official);

    for (const { seasonUid, name, playlist } of campaigns) {
        //log.info(name, seasonUid);

        const latestCampaign = latest.find((campaign) => campaign.name === name);

        const maps = await trackmania.maps(playlist.map((map) => map.mapUid));

        const tracks = [];

        for (const { mapUid } of playlist) {
            const { name, filename, mapId } = maps.collect().find((map) => map.mapUid === mapUid);
            //log.info(name, mapUid);

            const leaderboard = await trackmania.leaderboard(seasonUid, mapUid, 0, 5);
            const rankings = leaderboard.collect()[0].top;

            let wrs = [];
            let wr = undefined;

            const latestTrack = latestCampaign ? latestCampaign.tracks.find((track) => track.id === mapUid) : null;

            for (const { accountId, zoneId, score } of rankings) {
                if (autoban(accountId, score)) {
                    continue;
                }

                if (wr === undefined || wr === score) {
                    const zone = zones.search(zoneId);

                    const latestScore = latestTrack && latestTrack.wrs[0] ?  latestTrack.wrs[0].score : null;
                    const latestWr = latestTrack
                        ? latestTrack.wrs.find((wr) => wr.user.id === accountId && wr.score === score)
                        : null;

                    wrs.push({
                        user: {
                            id: accountId,
                            zone,
                        },
                        score: (wr = score),
                        delta: latestWr ? latestWr.delta : latestScore ? score - latestScore : 0,
                    });
                    continue;
                }
            }

            tracks.push({
                id: mapUid,
                _id: mapId,
                name: filename.slice(0, -8),
                wrs,
            });
        }

        game.push({
            isOfficial: true,
            name,
            tracks,
            ...generateStats(tracks),
        });
    }
};

const dumpTrackOfTheDay = async () => {
    const campaigns = await trackmania.campaigns(Campaigns.TrackOfTheDay, 0, 2);

    for (const { year, month, days } of campaigns) {
        //log.info(year, month);

        const latestCampaign = latest.find((campaign) => campaign.year === year && campaign.month === month);

        const maps = await trackmania.maps(days.map((map) => map.mapUid).filter((uid) => uid));

        const tracks = [];

        for (const { mapUid, seasonUid, monthDay } of days.filter((map) => map.mapUid !== '')) {
            const { name, mapId } = maps.collect().find((map) => map.mapUid === mapUid);
            //log.info(name, seasonUid, mapUid);

            const leaderboard = await trackmania.leaderboard(seasonUid, mapUid, 0, 5);
            const rankings = leaderboard.collect()[0].top;

            let wrs = [];
            let wr = undefined;

            const latestTrack = latestCampaign ? latestCampaign.tracks.find((track) => track.id === mapUid) : null;

            for (const { accountId, zoneId, score } of rankings) {
                if (autoban(accountId, score)) {
                    continue;
                }

                if (wr === undefined || wr === score) {
                    const zone = zones.search(zoneId);

                    const latestScore = latestTrack && latestTrack.wrs[0] ?  latestTrack.wrs[0].score : null;
                    const latestWr = latestTrack
                        ? latestTrack.wrs.find((wr) => wr.user.id === accountId && wr.score === score)
                        : null;

                    wrs.push({
                        user: {
                            id: accountId,
                            zone,
                        },
                        score: (wr = score),
                        delta: latestWr ? latestWr.delta : latestScore ? score - latestScore : 0,
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
            });
        }

        game.push({
            isOfficial: false,
            year,
            month,
            name: `${moment()
                .set('month', month - 1)
                .format('MMMM')} ${year}`,
            tracks,
        });
    }
};

const generateStats = (tracks) => {
    const totalTime = tracks.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

    const users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
    const wrs = tracks.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

    const frequency = users.reduce((count, user) => {
        count[user.name] = (count[user.name] || 0) + 1;
        return count;
    }, {});

    const leaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.name === key),
            wrs: frequency[key],
            duration: wrs
                .filter((r) => r.user.name === key)
                .map((r) => r.duration)
                .reduce((a, b) => a + b, 0),
        }));

    const countryLeaderboard = [...new Set(users.map((user) => user.zone[Zones.Country].zoneId))]
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
        stats: {
            totalTime,
        },
        leaderboard,
        countryLeaderboard,
    };
};

const autoban = (accountId, score) => {
    if (cheaters.find((cheater) => cheater === accountId)) {
        return true;
    }

    if (score <= 13000) {
        log.warn('banned: ' + accountId);
        cheaters.push(accountId);
        return true;
    }

    return false;
};

const resolveGame = async () => {
    const users = new Map();

    game.map(({ tracks }) => tracks)
        .reduce((acc, val) => acc.concat(val), [])
        .forEach(({ _id, wrs }) => {
            wrs.forEach((wr) => {
                const user = users.get(wr.user.id);
                if (user) {
                    user.push({ _id, wr });
                } else {
                    users.set(wr.user.id, [{ _id, wr }]);
                }
            });
        });

    for (const userIds of [...users.keys()].chunk(10)) {
        const accounts = (await trackmania.accounts(userIds)).collect();

        for (const userId of userIds) {
            const user = users.get(userId);
            const { displayName } = accounts.find((account) => account.accountId === userId);

            /* chunk this if Hefest or one of the totd hunters gets more wrs... maybe */
            const mapIds = user.map(({ _id }) => _id);
            const records = await trackmania.mapRecords([userId], mapIds);

            records.collect().forEach(({ mapId, timestamp, url }) => {
                const { wr } = user.find(({ _id }) => _id === mapId);

                wr.user.name = displayName;
                wr.date = timestamp;
                wr.duration = moment().diff(moment(timestamp), 'd');
                wr.replay = url.slice(url.lastIndexOf('/') + 1);
            });
        }
    }

    game.forEach((campaign) => Object.assign(campaign, generateStats(campaign.tracks)));
};

const inspect = (obj) => console.dir(obj, { depth: 6 });

if (process.argv[2] === '--test') {
    main(path.join(__dirname, '../api/')).catch(inspect);
}

module.exports = main;
