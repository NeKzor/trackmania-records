const { JSDOM } = require('jsdom');
const moment = require('moment');
const fetch = require('node-fetch');
const { delay, formatTime, getTime, tryExportJson, tryMakeDir } = require('./utils');

const output = process.argv[2] || 'api';

const day = moment().format('YYYY-MM-DD');

const tmx = ['tmnforever', 'united', 'nations', 'sunrise', 'original'];

const config = { headers: { 'User-Agent': 'tmx-scraper-v1' } };
const maxFetch = 6;

const scrap = async (gameName) => {
    const campaigns = require('./games/' + gameName);

    const api = `https://${gameName}.tm-exchange.com`;

    const trackUrl = (id) => `${api}/main.aspx?action=trackshow&id=${id}`;
    const imageUrl = (id) => `${api}/getclean.aspx?action=trackscreenscreens&id=${id}`;
    const replayUrl = (id) => `${api}/get.aspx?action=recordgbx&id=${id}`;
    const userUrl = (id) => `${api}/main.aspx?action=usershow&id=${id}`;

    let game = [];
    for (let campaign of campaigns) {
        let tracks = [];
        console.log('  ' + campaign.name);

        var count = 0;
        for (let id of campaign.tracks) {
            let page = await fetch(trackUrl(id), config);
            console.log(`    ${id} (${++count}/${campaign.tracks.length})`);

            let html = await page.text();
            let document = new JSDOM(html).window.document;

            let name = document.querySelector('#ctl03_ShowTrackName').textContent.trim();

            let wrs = [];
            let records = document.querySelector('#ctl03_Windowrow11').children[0].children[0].children;

            let wr = undefined;
            for (let record of records) {
                if (record.children[0].children[0] !== undefined) {
                    let time = record.children[0].children[0].textContent.trim();
                    if (wr === undefined || wr === time) {
                        wr = time;
                        let replay = record.children[0].children[0].getAttribute('href').slice(29);
                        let id = record.children[1].children[0].getAttribute('href');
                        id = id.slice(29, id.indexOf('#'));
                        let name = record.children[1].children[2].textContent.trim();
                        wrs.push({
                            user: {
                                id,
                                name,
                            },
                            time,
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

        let times = tracks.map((t) => getTime(t.wrs[0].time));
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
            tracks,
            stats: {
                totalTime: formatTime(times.reduce((a, b) => a + b, 0)),
            },
            leaderboard,
        });
        break;
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
    break;
}
