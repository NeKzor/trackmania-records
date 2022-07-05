const ghPages = require('gh-pages');
const cron = require('node-cron');
const tmxHistory = require('./tmx_history');
const tmx2 = require('./tmx2');
const tmwii = require('./tmwii');
const trackmania = require('./trackmania');
const { log } = require('./utils');

const output = require('path').join(__dirname, '/../api');
const now = process.argv.some((arg) => arg === '-n' || arg === '--now');
const nowTrackmania = process.argv.some((arg) => arg === '-ntm' || arg === '--now-trackmania');
const nowHistory = process.argv.some((arg) => arg === '-htm' || arg === '--now-history');

const main = async () => {
    for (const game of ['tmnforever', 'united', 'nations']) {
        try {
            log.info(`scraping ${game} history...`);
            await tmxHistory(game, output);
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

const historyOnly = async () => {
    for (const game of ['tmnforever', 'united']) {
        try {
            log.info(`scraping ${game} history...`);
            await tmxHistory(game, output);
        } catch (err) {
            log.error(err);
        }
    }
};

if (now) {
    main();
}

if (nowTrackmania) {
    trackmaniaOnly();
}

if (nowHistory) {
    historyOnly();
}

cron.schedule('12 0 * * *', main);
cron.schedule('0 * * * * *', trackmaniaOnly);
//cron.schedule('5,10,15,20,25,30,35,45,50,55 19 * * *', trackmaniaOnly);
//cron.schedule('0,5,10,15,20,25,30,35,45,50,55 0-18,20-23 * * *', trackmaniaOnly);
//cron.schedule('15,30,45 19 * * *', trackmaniaOnly);
//cron.schedule('0,15,30,45 0-18,20-23 * * *', trackmaniaOnly);
