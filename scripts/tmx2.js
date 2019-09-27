const moment = require('moment');
const fetch = require('node-fetch');
const { delay, importJson, tryExportJson, tryMakeDir } = require('./utils');

const config = { headers: { 'User-Agent': 'tmx-records-v1' } };

const baseApi = 'https://api.mania-exchange.com/tm';

module.exports = async (output, maxFetch = undefined) => {
    const day = moment().format('YYYY-MM-DD');

    console.log(day, 'tm2');

    let game = [];
    for (let campaign of importJson(__dirname + '/../games/tm2.json')) {
        console.log(campaign.name);

        let tracks = [];
        let count = 0;

        for (let { id, name, type } of campaign.tracks) {
            let res = await fetch(baseApi + `/replays/${id}/5`, config);
            let records = await res.json();

            console.log(`  ${id} (${++count}/${campaign.tracks.length})`);

            let wrs = [];
            let wr = undefined;

            for (let record of records) {
                let score = record['ReplayTime'];
                if (wr === undefined || wr === score) {
                    wrs.push({
                        user: {
                            id: record['UserID'],
                            name: record['Username'],
                        },
                        score: (wr = score),
                        date: record['UploadedAt'],
                        duration: moment().diff(moment(record['UploadedAt']), 'd'),
                        replay: record['ReplayID'],
                    });
                    continue;
                }
                break;
            }

            tracks.push({
                id,
                name,
                type,
                wrs,
            });

            if (maxFetch !== undefined && count === maxFetch) break;

            //wait delay(1000);
        }

        let totalTime = tracks
            .filter((t) => t.type !== 'Stunts')
            .map((t) => t.wrs[0].score)
            .reduce((a, b) => a + b, 0);
        let totalPoints = tracks
            .filter((t) => t.type === 'Stunts')
            .map((t) => t.wrs[0].score)
            .reduce((a, b) => a + b, 0);

        let users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
        let wrs = tracks.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

        let frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        let leaderboard = Object.keys(frequency)
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
            name: campaign.name,
            tracks,
            stats: {
                totalTime,
                totalPoints,
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(output + '/tm2');

    tryExportJson(`${output}/tm2/${day}.json`, game);
    tryExportJson(`${output}/tm2/latest.json`, game, true);
};
