require('dotenv').config();

const db = require('./db');
const cron = require('node-cron');
const Twitter = require('twitter-lite');
const { formatScore, log } = require('../utils');
const { Record, Track, IntegrationEvent } = require('./models.js');

const bio = `Trackmania Campaign World Records\nProperty of @nekznekz`;
const locations = ['A01', 'Training - 01'];

const rng = (max) => Math.floor(Math.random() * Math.floor(max));

class TwitterBot {
    constructor(consumer_key, consumer_secret, access_token_key, access_token_secret) {
        this.client = new Twitter({
            subdomain: 'api',
            version: '1.1',
            consumer_key,
            consumer_secret,
            access_token_key,
            access_token_secret,
        });
    }
    send() {
        const status = this.buildStatus(data).trim();

        log.info(status);

        return this.client
            .post('statuses/update', { status })
            .then(() => log.info('[twitter] status updated'))
            .catch(log.error);
    }
    buildStatus({ wr, track }) {
        return `
${track.name.replace(/(\$[0-9a-fA-F]{3}|\$[WNOITSGZBEMwnoitsgzbem]{1})/g, '')}
${formatScore(wr.score)} (-${formatScore(wr.delta)})
${wr.user.name}`;
    }
    updateBio() {
        const monday = moment().startOf('isoWeek').format('YYYY-MM-DD');
        const sunday = moment().endOf('isoWeek').format('YYYY-MM-DD');

        log.info(`[twitter] week start -> end: ${monday} -> ${sunday}`);

        const wrsThisWeek = Record.find({
            isOfficial: true,
            note: { $exists: false },
            date: { $gte: monday, $lte: sunday },
        }).count();
        const description = `${bio}\n\nWRs set this week: ${wrsThisWeek}`.trim();
        const location = locations[rng(locations.length)];

        return this.client
            .post('account/update_profile', { description, location })
            .then(() => log.info('[twitter] account profile updated'))
            .catch(log.error);
    }
}

const bot = new TwitterBot(
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET_KEY,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_TOKEN_SECRET,
);

const update = async () => {
    const events = IntegrationEvent.find({ twitter: 'pending' });
    if (!events.length) {
        return;
    }

    const records = Record.find({ id: { $in: events.map(({ record_id }) => record_id) } });
    const tracks = Track.find({ id: { $in: records.map(({ track_id }) => track_id) } });

    for (const record of records) {
        try {
            const update = await IntegrationEvent.updateOne({ record_id: record.id }, { twitter: 'sending' });
            if (update.matchedCount !== 1) {
                console.error(`[twitter] failed to update sending status of record ${record.id}`);
                continue;
            }

            const track = tracks.find((track) => track.id === record.track_id);
            if (!track) {
                console.error(`[twitter] failed to find track for record ${record.id}`);
                continue;
            }

            await bot.send(record, track);
            await IntegrationEvent.deleteOne({ record_id: record.id });
        } catch (err) {
            console.error(err);
        }
    }
};

let isUpdating = false;

cron.schedule('*/1 * * * *', () => {
    if (!isUpdating) {
        isUpdating = true;
        update()
            .then(() => (isUpdating = false))
            .catch(console.error);
    }
});
