const moment = require('moment');
const fetch = require('node-fetch');
const { delay, tryExportJson, tryMakeDir } = require('./utils');

const output = process.argv[2] || 'api';

const day = moment().format('YYYY-MM-DD');

const tmx = ['tmnforever'/* , 'united', 'nations', 'sunrise', 'original' */];

const config = { headers: { 'User-Agent': 'tmx-records-v1' } };
const maxFetch = undefined;

const scrap = async (gameName) => {
    const campaigns = require('./games/' + gameName);

    const apiRoute = (action, id) => `https://${gameName}.tm-exchange.com/apiget.aspx?action=${action}&id=${id}`;

    let game = [];
    for (let campaign of campaigns) {
        let tracks = [];
        console.log('  ' + campaign.name);

        let count = 0;
        for (let id of campaign.tracks) {
            let recordsRes = await fetch(apiRoute('apitrackrecords', id), config);
            let trackInfoRes = await fetch(apiRoute('apitrackinfo', id), config);
            console.log(`    ${id} (${++count}/${campaign.tracks.length})`);

            let trackInfo = (await trackInfoRes.text()).split('\t');
            let records = (await recordsRes.text()).split('\n').map((row) => row.split('\t'));

            let wrs = [];
            let wr = undefined;

            for (let record of records) {
                let time = parseInt(record[3], 10);
                if (wr === undefined || wr === time) {
                    wrs.push({
                        user: {
                            id: parseInt(record[1], 10),
                            name: record[2],
                        },
                        time: (wr = time),
                        date: record[4],
                        replay: parseInt(record[0], 10),
                    });
                    continue;
                }
                break;
            }

            tracks.push({
                id,
                name: trackInfo[1],
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
            tracks,
            stats: {
                totalTime,
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(`${output}/${gameName}`);

    tryExportJson(`${output}/${gameName}/${day}.json`, game);
    tryExportJson(`${output}/${gameName}/latest.json`, game, true);
};

console.log(day);

for (let game of tmx) {
    console.log(game);
    scrap(game);
}
