const moment = require('moment');
const fetch = require('node-fetch');
const { importJson, tryExportJson, tryMakeDir } = require('./utils');

const config = { headers: { 'User-Agent': 'trackmania-records-v1' } };

const tmwii = '369p3m31';
const baseApi = 'https://www.speedrun.com/api/v1';

const userCache = {};

const resolveUser = async (id) => {
    const name = userCache[id];
    if (name) return name;

    const res = await fetch(`${baseApi}/users/${id}`, config);

    const {
        names: { international },
        location: {
            country: { code },
        },
    } = (await res.json()).data;

    const user = {
        id,
        name: international,
        country: code,
    };

    userCache[id] = user;
    return user;
};

const main = async (output, maxFetch = undefined) => {
    const { categories, levels } = importJson(__dirname + '/../games/tmwii.json');

    const game = [];
    for (const category of categories) {
        const tracks = [];
        let count = 0;

        const puzzleOrPlatform = category.name === 'Puzzle' || category.name === 'Platform';

        for (const level of levels) {
            if (puzzleOrPlatform && level.name.startsWith('F')) {
                break;
            }

            const res = await fetch(`${baseApi}/leaderboards/${tmwii}/level/${level.id}/${category.id}`, config);
            const leaderboard = (await res.json()).data;

            const wrs = [];
            for (const { place, run } of leaderboard.runs) {
                if (place !== 1) break;

                wrs.push({
                    user: await resolveUser(run.players[0].id),
                    score: Math.round(run.times.primary_t * 1000),
                    date: run.status['verify-date'],
                    duration: moment().diff(run.status['verify-date'], 'd'),
                    media: run.videos.links[0].uri,
                    id: run.id,
                });
            }

            tracks.push({
                name: level.name,
                wrs,
            });

            ++count;
            if (maxFetch !== undefined && count === maxFetch) break;
        }

        const totalTime = tracks.map((t) => (t.wrs.length ? t.wrs[0].score : 0)).reduce((a, b) => a + b, 0);

        const users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
        const wrs = tracks.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        const leaderboard = Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => ({
                user: users.find((u) => u.id.toString() === key),
                wrs: frequency[key],
                duration: wrs
                    .filter((r) => r.user.id.toString() === key)
                    .map((r) => r.duration)
                    .reduce((a, b) => a + b, 0),
            }));

        game.push({
            name: category.name,
            tracks,
            stats: {
                totalTime,
                totalPoints: 0,
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(output + '/tmwii');

    tryExportJson(`${output}/tmwii/latest.json`, game, true);
};

module.exports = main;
