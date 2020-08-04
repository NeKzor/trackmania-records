const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences, Campaigns, Zones } = require('./trackmania/api');
const { log, tryExportJson, tryMakeDir } = require('./utils');

require('dotenv').config();

const sessionFile = path.join(__dirname, '/../.login');

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

let trackmania = null;
let zones = null;
let game = [];

const main = async (outputDir) => {
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

    await dumpOfficialCampaign();
    await dumpTrackOfTheDay();

    tryMakeDir(outputDir);
    tryMakeDir(path.join(outputDir, '/trackmania'));

    tryExportJson(`${outputDir}/trackmania/${moment().format('YYYY-MM-DD')}.json`, game, true);
    tryExportJson(`${outputDir}/trackmania/latest.json`, game, true);

    trackmania = null;
    zones = null;
    game = [];
};

const dumpOfficialCampaign = async () => {
    const campaigns = await trackmania.campaigns(Campaigns.Official);

    for (const { seasonUid, name, playlist } of campaigns) {
        log.info(name, seasonUid);

        const maps = await trackmania.maps(playlist.map((map) => map.mapUid));

        const tracks = [];

        for (const { mapUid } of playlist) {
            const { name, filename } = maps.collect().find((map) => map.mapUid === mapUid);
            log.info(name, mapUid);

            const leaderboard = await trackmania.leaderboard(seasonUid, mapUid, 0, 5);
            const rankings = leaderboard.collect()[0].top;
            const accounts = await trackmania.accounts(rankings.map((rank) => rank.accountId));

            let wrs = [];
            let wr = undefined;

            for (const { accountId, zoneId, score } of rankings) {
                if (score <= 10 * 1000) {
                    continue;
                }

                if (wr === undefined || wr === score) {
                    const account = accounts.collect().find((account) => account.accountId === accountId);
                    const zone = zones.search(zoneId);

                    log.info(account.displayName, zone[Zones.Country].name, score);

                    wrs.push({
                        user: {
                            name: account.displayName,
                            zone,
                        },
                        score: (wr = score),
                    });
                    continue;
                }
            }

            tracks.push({
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
        log.info(year, month);

        const maps = await trackmania.maps(days.map((map) => map.mapUid).filter((uid) => uid));

        const tracks = [];

        for (const { mapUid, seasonUid, monthDay } of days.filter((map) => map.mapUid !== '')) {
            const { name } = maps.collect().find((map) => map.mapUid === mapUid);
            log.info(name, seasonUid, mapUid);

            const leaderboard = await trackmania.leaderboard(seasonUid, mapUid, 0, 5);
            const rankings = leaderboard.collect()[0].top;
            const accounts = await trackmania.accounts(rankings.map((rank) => rank.accountId));

            let wrs = [];
            let wr = undefined;

            for (const { accountId, zoneId, score } of rankings) {
                if (score <= 10 * 1000) {
                    continue;
                }

                if (wr === undefined || wr === score) {
                    const account = accounts.collect().find((account) => account.accountId === accountId);
                    const zone = zones.search(zoneId);

                    log.info(account.displayName, zone[Zones.Country].name, score);

                    wrs.push({
                        user: {
                            name: account.displayName,
                            zone,
                        },
                        score: (wr = score),
                    });
                    continue;
                }
            }

            tracks.push({
                name: name.replace(/(\$[0-9a-fA-F]{1,3}|\$[wnoisgz]{1})/g, ''),
                monthDay,
                wrs,
            });
        }

        game.push({
            isOfficial: false,
            year,
            month,
            name: `${moment().set('month', month - 1).format('MMMM')} ${year}`,
            tracks,
            ...generateStats(tracks),
        });
    }
};

const generateStats = (tracks) => {
    const totalTime = tracks.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

    const users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);

    const frequency = users.reduce((count, user) => {
        count[user.name] = (count[user.name] || 0) + 1;
        return count;
    }, {});

    const leaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.name === key),
            wrs: frequency[key],
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

const inspect = (obj) => console.dir(obj, { depth: 6 });

//main().catch(inspect);

module.exports = main;
