const fetch = require('node-fetch');
const { delay, importJson, tryExportJson, tryMakeDir } = require('./utils');

const gameName = process.argv[2] || 'tmnforever';
const apiFile = process.argv[3];

const tmx = ['tm2', 'tmnforever', 'united', 'nations', 'sunrise', 'original'];

if (!tmx.find((x) => x === gameName)) {
    throw new Error('Invalid game name.');
}

const apiRoute = (action, id) => `http://${gameName}.tm-exchange.com/apiget.aspx?action=${action}&id=${id}`;

const config = { headers: { 'User-Agent': 'tmx-records-v1' } };

if (apiFile) {
    let game = importJson(`./games/${gameName}.json`);
    let api = importJson(`./api/${gameName}/${apiFile}.json`);
    api.forEach((campaign) => {
        campaign.tracks.forEach((track, idx) => {
            let newTrack = game.find((c) => c.name === campaign.name).tracks.find((t) => t.id === track.id);
            if (!newTrack) throw new Error('huh');
            campaign.tracks[idx] = {
                ...track,
                ...newTrack,
            };
        });
    });
    tryExportJson(`./api/${gameName}/${apiFile}.json`, api, true);
    return;
}

(async () => {
    let game = importJson(`./games/${gameName}.json`);
    for (let campaign of game) {
        for (let track of campaign.tracks) {
            let res = await fetch(apiRoute('apitrackinfo', track.id), config);
            let data = (await res.text()).split('\t');
            track.type = data[7];
            console.log(track.type);
        }
    }
    tryExportJson(`./games/${gameName}.json`, game, true, true);
})();
