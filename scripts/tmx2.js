const moment = require('moment');
const fetch = require('node-fetch');
const { delay, importJson, tryExportJson, tryMakeDir } = require('./utils');

const output = process.argv[2] || 'api';

const day = moment().format('YYYY-MM-DD');

const config = { headers: { 'User-Agent': 'tmx-records-v1' } };
const maxFetch = undefined;

const baseApi = 'https://tm.mania-exchange.com';

if (process.argv[2] === '--fetch-game') {
    let game = [];
    let page = 1;

    const fetchPage = async () => {
        let res = await fetch(baseApi + '/tracksearch2/search?api=on&mode=1&authorid=21&limit=100&priord=1&page=' + page, config);
        let search = await res.json();

        for (let track of search.results) {
            let campaign = game.find((c) => c.name === track['TitlePack']);
            if (!campaign) {
                game.push({
                    name: track['TitlePack'],
                    tracks: [
                        {
                            id: track['TrackID'],
                            name: track['Name'],
                        },
                    ],
                });
            } else {
                campaign.tracks.push({
                    id: track['TrackID'],
                    name: track['Name'],
                });
            }
        }

        while (search.totalItemCount - 100 * page > 0) {
            ++page;
            await fetchPage();
        }
    };

    fetchPage().then(() => {
        tryMakeDir('./games');
        tryExportJson('./games/tm2.json', game, true, true);
    });
    return;
}

(async () => {
    console.log(day, 'tm2');

    let game = [];
    for (let campaign of importJson('./games/tm2.json')) {
        console.log(campaign.name);

        let tracks = [];
        let count = 0;

        for (let { id, name } of campaign.tracks) {
            let res = await fetch(baseApi + `/replays/${id}/5`, config);
            let records = await res.json();

            console.log(`  ${id} (${++count}/${campaign.tracks.length})`);

            let wrs = [];
            let wr = undefined;

            for (let record of records) {
                let time = record['ReplayTime'];
                if (wr === undefined || wr === time) {
                    wrs.push({
                        user: {
                            id: record['UserID'],
                            name: record['Username'],
                        },
                        time: (wr = time),
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
                wrs,
            });

            if (maxFetch !== undefined && count === maxFetch) break;

            //wait delay(1000);
        }

        let totalTime = tracks.map((t) => t.wrs[0].time).reduce((a, b) => a + b, 0);
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
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(output + '/tm2');

    tryExportJson(`${output}/tm2/${day}.json`, game);
    tryExportJson(`${output}/tm2/latest.json`, game, true);
})();
