require('dotenv').config();
const db = require('./db');
const path = require('path');
const fetch = require('node-fetch');
const { importJson, log } = require('./utils');
const { tm2: { Campaign, Track, Record } } = require('./models/tmx');

const config = { headers: { 'User-Agent': 'trackmania-records-v2' } };

const baseApi = 'https://api.mania-exchange.com';

const main = async () => {
    const gameCampaign = importJson(path.join(__dirname, '/../games/tm2.json'));

    for (const { name: campaignName, tracks } of gameCampaign) {
        const campaign = {
            name: campaignName,
        };

        await Campaign.findOneAndUpdate({ name: campaignName }, campaign, { upsert: true });

        for (let { id, name, type } of tracks) {
            const track = {
                id,
                campaign_name: campaign.name,
                name,
                type,
            };

            await Track.findOneAndUpdate({ id }, track, { upsert: true });

            const url = `${baseApi}/tm/replays/${id}/5`;
            const res = await fetch(url, config);
            const records = await res.json();

            log.info(`[GET] ${url} : ${res.status} (${name})`);

            let wr = undefined;

            for (const record of records) {
                const score = record.ReplayTime;

                if (wr !== undefined && wr !== score) {
                    break;
                }

                wr = score;

                const entry = await Record.findOne({ id: record.ReplayID });
                if (!entry) {
                    await Record.create({
                        id: record.ReplayID,
                        campaign_name: campaign.name,
                        track_id: track.id,
                        user: {
                            id: record.UserID,
                            name: record.Username,
                        },
                        score,
                        date: record.UploadedAt,
                        replay: record.ReplayID,
                        duration: 0,
                        delta: 0,
                    });
                }
            }
        }
    }
};

if (process.argv.some((arg) => arg === '--test')) {
    db.on('open', async () => {
        await main().catch((error) => log.error(error.message, error.stack));
    });
}

module.exports = main;
