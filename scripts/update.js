const ghPages = require('gh-pages');
const cron = require('node-cron');
const tmx = require('./tmx');
const tmx2 = require('./tmx2');
const { log } = require('./utils');

const output = process.argv[3] || __dirname + '/../api';

cron.schedule('0 18 * * *', async () => {
    for (let game of ['tmnforever', 'united', 'nations', 'sunrise', 'original']) {
        try {
            log.info(`scraping ${game}...`);
            await tmx(game, output);
        } catch (err) {
            log.error(err);
        }
    }

    try {
        log.info('scraping tm2');
        await tmx2(output);
    } catch (err) {
        log.error(err);
    }

    ghPages.publish(
        output,
        {
            repo: 'https://github.com/NeKzBot/tmx-records.git',
            branch: 'api',
            message: 'Update',
            user: {
                name: 'NeKzBot',
                email: '44978126+NeKzBot@users.noreply.github.com',
            },
        },
        (err) => (err ? log.error(err) : log.success('Published')),
    );
});
