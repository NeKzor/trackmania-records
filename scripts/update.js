const cron = require('node-cron');
const tmx = require('./tmx_history');
const tmx2 = require('./tmx2');
const tmwii = require('./tmwii');
const trackmania = require('./trackmania');
const { log } = require('./utils');

const now = process.argv.some((arg) => arg === '-n');
const nowTrackmania = process.argv.some((arg) => arg === '-ntm');

const main = async () => {
    await tmx().catch((error) => log.error(error.message, error.stack));
    await tmx2().catch((error) => log.error(error.message, error.stack));
    await tmwii().catch((error) => log.error(error.message, error.stack));
};

const trackmaniaOnly = async () => {
    await trackmania().catch((error) => log.error(error.message, error.stack));
};

if (now) {
    main();
}

if (nowTrackmania) {
    trackmaniaOnly();
}

cron.schedule('12 0 * * *', main);
cron.schedule('0 * * * * *', trackmaniaOnly);
