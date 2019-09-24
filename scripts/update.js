const tmx = require('./tmx');
const tmx2 = require('./tmx2');

const game = process.argv[2];
const output = process.argv[3] || 'api';
const maxFetch = process.argv[4];

(async () => {
    if (game !== undefined) {
        if (game === 'tm2') {
            await tmx2(output, maxFetch);
        } else {
            await tmx(game, output, maxFetch);
        }
    } else {
        for (let game of ['tmnforever', 'united', 'nations', 'sunrise', 'original']) {
            try {
                await tmx(game, output, maxFetch);
            } catch (err) {
                console.error(err);
            }
        }
        await tmx2(output, maxFetch);
    }
})();
