const ghPages = require('gh-pages');
const tmx = require('./tmx');
const tmx2 = require('./tmx2');
const { log } = require('./utils');

const game = process.argv[2];
const output = process.argv[3] || __dirname + '/../api';
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
            await tmx(game, output, maxFetch);
        }

        await tmx2(output, maxFetch);

        ghPages.publish(
            output,
            {
                repo: 'https://github.com/NeKzor/tmx-records.git',
                branch: 'api',
                message: 'Update',
                user: {
                    name: 'NeKzBot',
                    email: '44978126+NeKzBot@users.noreply.github.com'
                },
            },
            (err) => log(err || 'Published.'),
        );
    }
})();
