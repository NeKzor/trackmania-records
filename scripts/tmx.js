const moment = require('moment');
const fetch = require('node-fetch');
const { delay, importJson, tryExportJson, tryMakeDir } = require('./utils');

const tmx = ['tmnforever', 'united', 'nations', 'sunrise', 'original'];

const config = { headers: { 'User-Agent': 'tmx-records-v1' } };

module.exports = async (gameName, output, maxFetch = undefined) => {
    if (!tmx.find((x) => x === gameName)) {
        throw new Error('Invalid game name.');
    }

    const day = moment().format('YYYY-MM-DD');

    const apiRoute = (action, id) => `http://${gameName}.tm-exchange.com/apiget.aspx?action=${action}&id=${id}`;

    console.log(day, gameName);

    let game = [];
    for (let campaign of importJson(__dirname + '/../games/' + gameName + '.json')) {
        let tracks = [];
        console.log('  ' + campaign.name);

        let count = 0;
        for (let { id, name, type } of campaign.tracks) {
            let res = await fetch(apiRoute('apitrackrecords', id), config);
            let records = (await res.text()).split('\n').map((row) => row.split('\t'));

            console.log(`    ${id} (${++count}/${campaign.tracks.length})`);

            let wrs = [];
            let wr = undefined;

            for (let record of records) {
                let score = parseInt(record[3], 10);
                if (wr === undefined || wr === score) {
                    wrs.push({
                        user: {
                            id: parseInt(record[1], 10),
                            name: record[2],
                        },
                        score: (wr = score),
                        date: record[4],
                        duration: moment().diff(moment(record[4]), 'd'),
                        replay: parseInt(record[0], 10),
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

            //await delay(1000);
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
    tryMakeDir(`${output}/${gameName}`);

    tryExportJson(`${output}/${gameName}/${day}.json`, game);
    tryExportJson(`${output}/${gameName}/latest.json`, game, true);
};
