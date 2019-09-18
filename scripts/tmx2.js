const moment = require('moment');
const fetch = require('node-fetch');
const { delay, tryExportJson, tryMakeDir } = require('./utils');

const output = process.argv[2] || 'api';

const day = moment().format('YYYY-MM-DD');

const config = { headers: { 'User-Agent': 'tmx-records-v1' } };
const maxFetch = 1;

const baseApi = 'https://api.mania-exchange.com/tm';

const tracksRoute = (id) => `/tracks/${id}`;
const replaysRoute = (id, amount = 5) => `/replays/${id}/${amount}`;

(async () => {
    console.log(day);

    const campaigns = require('./games/tm2');

    let game = [];
    for (let campaign of campaigns) {
        console.log(campaign.name);

        let tracks = [];
        let count = 0;

        for (let id of campaign.tracks) {
            let tracksRes = await fetch(baseApi + tracksRoute(id), config);
            let replaysRes = await fetch(baseApi + replaysRoute(id), config);
            console.log(`  ${id} (${++count}/${campaign.tracks.length})`);

            let track = (await tracksRes.json())[0];
            let records = await replaysRes.json();

            let wrs = [];
            let wr = undefined;

            for (let record of records) {
                let time = parseInt(record['ReplayTime'], 10);
                if (wr === undefined || wr === time) {
                    wrs.push({
                        user: {
                            id: parseInt(record['UserID'], 10),
                            name: record['Username'],
                        },
                        time: (wr = time),
                        date: record['UploadedAt'],
                        replay: parseInt(record['ReplayID'], 10),
                    });
                    continue;
                }
                break;
            }

            tracks.push({
                id,
                name: track['Name'],
                wrs,
            });

            if (maxFetch !== undefined && count === maxFetch) break;

            await delay(1000);
        }

        let totalTime = tracks.map((t) => t.wrs[0].time).reduce((a, b) => a + b, 0);
        let users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);

        let frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        let leaderboard = Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => ({ user: users.find((u) => u.id.toString() === key), wrs: frequency[key] }));

        game.push({
            name: campaign.name,
            tracks: tracks.sort((a, b) => b.name > a.name),
            stats: {
                totalTime,
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(output + '/tm2');

    tryExportJson(`${output}/tm2/${day}.json`, game);
    tryExportJson(`${output}/tm2/latest.json`, game, true);
})();
