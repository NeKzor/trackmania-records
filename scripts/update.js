const ghPages = require('gh-pages');
const cron = require('node-cron');
const tmx = require('./tmx');
const tmx2 = require('./tmx2');
const tmwii = require('./tmwii');
const { log } = require('./utils');

const output = process.argv[3] || __dirname + '/../api';

cron.schedule('0 18 * * *', async () => {
    const now = new Date();
    const tm1 = ['tmnforever', 'united', 'nations'];

    if (now.getDate() === 1) {
        tm1.push('sunrise', 'original');
    }

    for (const game of tm1) {
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

    try {
        log.info('scraping tmwii');
        await tmwii(output);
    } catch (err) {
        log.error(err);
    }

    ghPages.publish(
        output,
        {
            repo: `https://${process.env.GITHUB_TOKEN}@github.com/NeKzBot/tmx-records.git`,
            silent: true,
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
