const { JSDOM } = require('jsdom');
const moment = require('moment');
const fetch = require('node-fetch');
const { delay, formatTime2, getTime2, tryExportJson, tryMakeDir } = require('./utils');

const output = process.argv[2] || 'api';

const day = moment().format('YYYY-MM-DD');

const config = { headers: { 'User-Agent': 'tmx2-scraper-v1' } };
const maxFetch = 1;

const api = `https://tm.mania-exchange.com`;

const trackUrl = (id) => `${api}/tracks/${id}`;
const imageUrl = (id) => `${api}/tracks/screenshot/normal/${id}`;
const replayUrl = (id) => `${api}/replays/download/${id}`;
const userUrl = (id) => `${api}/user/profile/${id}`;

(async () => {
    console.log(day);

    const campaigns = require('./games/tm2');

    let game = [];
    for (let campaign of campaigns) {
        console.log(campaign.name);

        let tracks = [];
        var count = 0;

        for (let id of campaign.tracks) {
            let page = await fetch(trackUrl(id), config);
            console.log(`  ${id} (${++count}/${campaign.tracks.length})`);

            let html = await page.text();
            let document = new JSDOM(html).window.document;

            let panels = document.querySelectorAll('.panel-content');
            let name = panels[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[1].textContent.trim();

            let wrs = [];
            let wr = undefined;
            for (let record of panels[1].children[0].children[0].children) {
                if (record.children[0].children[0] !== undefined) {
                    let time = record.children[0].children[1].textContent.trim();
                    if (wr === undefined || wr === time) {
                        wr = time;
                        let replay = record.children[0].children[0].getAttribute('href').slice(24);
                        let preMp4 = record.children[1].children[0].tagName === 'SPAN';
                        let id = record.children[1].children[preMp4 ? 1 : 0].getAttribute('href').slice(14);
                        let name = record.children[1].children[preMp4 ? 3 : 2].textContent.trim();
                        let date = moment(record.children[3].textContent.trim(), 'DD-MM-YY').unix();
                        wrs.push({
                            user: {
                                id,
                                name,
                            },
                            time,
                            preMp4,
                            date,
                            replay,
                        });
                        continue;
                    }
                    break;
                }
            }

            tracks.push({
                id,
                name,
                wrs,
            });

            if (maxFetch !== undefined && count === maxFetch) break;

            await delay(1000);
        }

        let times = tracks.map((t) => getTime2(t.wrs[0].time));
        let users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);

        let frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        let leaderboard = Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => ({ user: users.find((u) => u.id === key), wrs: frequency[key] }));

        game.push({
            name: campaign.name,
            tracks: tracks.sort((t) => t.name),
            stats: {
                totalTime: formatTime2(times.reduce((a, b) => a + b, 0)),
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(output + '/tm2');

    tryExportJson(`${output}/tm2/${day}.json`, game);
    tryExportJson(`${output}/tm2/latest.json`, game, true);
})();
