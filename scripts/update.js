const ghPages = require('gh-pages');
const cron = require('node-cron');
const tmx = require('./tmx');
const tmx2 = require('./tmx2');
const tmwii = require('./tmwii');
const trackmania = require('./trackmania');
const { log } = require('./utils');

const output = require('path').join(__dirname, '/../api');
const now = process.argv.some((arg) => arg === '-n' || arg === '--now');
const nowTrackmania = process.argv.some((arg) => arg === '-ntm' || arg === '--now-trackmania');

const main = async () => {
    for (const game of ['tmnforever', 'united', 'nations']) {
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

    try {
        log.info('scraping trackmania');
        await trackmania(output);
    } catch (err) {
        log.error(err);
    }

    publish();
};

const publish = () => {
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
};

const trackmaniaOnly = async () => {
    try {
        log.info('scraping trackmania');
        await trackmania(output, false);
        publish();
    } catch (err) {
        log.error(err);
    }
};

if (now) {
    main();
}

if (nowTrackmania) {
    trackmaniaOnly();
}

cron.schedule('0 19 * * *', main);
cron.schedule('0,15,30,45 0-18,20-23 * * *', trackmaniaOnly);
cron.schedule('15,30,45 19 * * *', trackmaniaOnly);
