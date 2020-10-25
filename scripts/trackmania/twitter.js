const Twitter = require('twitter-lite');
const { formatScore, log } = require('../utils');

require('dotenv').config();

const locations = ['Limburg, Germany', 'A01'];

const rng = (max) => Math.floor(Math.random() * Math.floor(max));

const defaultBioOptions = { status: '#ONLINE', wrsThisWeek: 0 };

class TwitterIntegration {
    constructor(consumer_key, consumer_secret, access_token_key, access_token_secret) {
        this.client = new Twitter({
            subdomain: 'api',
            version: '1.1',
            consumer_key,
            consumer_secret,
            access_token_key,
            access_token_secret,
        });

        this.lastBioOptions = defaultBioOptions;
    }
    send(data) {
        const status = this.buildStatus(data).trim();

        log.info(status);

        return this.client.post('statuses/update', { status })
            .then(() => log.info('[twitter] status updated'))
            .catch(log.error);
    }
    buildStatus({ wr, track }) {
        return `
${track.name}
${formatScore(wr.score)} (-${formatScore(wr.delta)})
${wr.user.name}`;
    }
    updateBio(options) {
        const { status, wrsThisWeek } = {
            ...this.lastBioOptions,
            ...options,
        };

        if (options.wrsThisWeek !== undefined) {
            this.lastBioOptions.wrsThisWeek = options.wrsThisWeek;
        }

        const description = `
Trackmania Campaign World Records ${status}
Property of @nekznekz

WRs set this week: ${wrsThisWeek}`.trim();

        const location = locations[rng(locations.length)];

        return this.client
            .post('account/update_profile', { description, location })
            .then(() => log.info('[twitter] account profile updated'))
            .catch(log.error);
    }
}

module.exports = TwitterIntegration;