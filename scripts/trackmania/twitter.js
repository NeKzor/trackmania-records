const Twitter = require('twitter-lite');
const { formatScore, log } = require('../utils');

require('dotenv').config();

const locations = ['Limburg, Germany', 'A01', 'Training - 01'];

const rng = (max) => Math.floor(Math.random() * Math.floor(max));

const defaultBioOptions = { wrsThisWeek: 0 };

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
        this.enabled = true;
    }
    send(data) {
        if (!this.enabled) {
            return Promise.resolve();
        }

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
    updateBio(options) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        const { wrsThisWeek } = {
            ...this.lastBioOptions,
            ...options,
        };

        if (options.wrsThisWeek !== undefined) {
            this.lastBioOptions.wrsThisWeek = options.wrsThisWeek;
        }

        const description = `
Trackmania Campaign World Records
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
