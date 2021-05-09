const cron = require('node-cron');
const trackmania = require('./trackmania');
const { log } = require('./utils');

const output = require('path').join(__dirname, '/../edge');
const now = process.argv.some((arg) => arg === '-n' || arg === '--now');

const main = async () => {
    try {
        log.info('scraping trackmania');
        await trackmania(output);
    } catch (err) {
        log.error(err);
    }
};

if (now) {
    main();
}

//cron.schedule('0,15,30,45 * * * *', main);
cron.schedule('0,5,10,15,20,25,30,35,40,45,50,55 * * * *', main);
