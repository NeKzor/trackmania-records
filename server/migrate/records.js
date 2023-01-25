require('dotenv').config();

const db = require('../db');
const fs = require('fs');
const path = require('path');
const { Campaign, Track, Record } = require('../models');

const main = async () => {
    const rootDir = path.join(__dirname, '../../api');
    const options = { upsert: true };
    const toMigrate = [];

    const info = (msg) => console.log(msg);
    const errors = [];
    const error = (err) => {
        errors.push(err);
        console.error(err);
    };

    for (const importFile of fs.readdirSync(`${rootDir}/trackmania/campaign`)) {
        toMigrate.push(`${rootDir}/trackmania/campaign/${importFile}`);
    }

    for (const importFile of fs.readdirSync(`${rootDir}/trackmania/totd`)) {
        toMigrate.push(`${rootDir}/trackmania/totd/${importFile}`);
    }

    for (const file of toMigrate) {
        console.log(file);

        const campaign = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }));
        const campaign_id = campaign.id ?? `${campaign.year}_${campaign.month}`;

        await Campaign.findOneAndUpdate(
            { id: campaign_id },
            {
                id: campaign_id,
                name: campaign.name,
                isOfficial: campaign.isOfficial,
                year: campaign.year,
                month: campaign.month,
                event: campaign.event,
            },
            options,
        )
            .then(() => info('upserted campaign', campaign.id ?? campaign.name))
            .catch((err) => error(`failed to insert campaign ${campaign._id}: ${err}`));

        for (const track of campaign.tracks) {
            const track_id = track._id;
            const track_uid = track.id;
            const records = track.history;

            delete track._id;
            delete track.id;
            delete track.wrs;
            delete track.history;

            await Track.findOneAndUpdate(
                { id: track_id },
                { ...track, id: track_id, uid: track_uid, campaign_id },
                options,
            )
                .then(() => info('upserted track', track_id))
                .catch((err) => error(`failed to insert track ${track_id}: ${err}`));

            for (const record of records) {
                const record_id = record.replay;
                delete record.replay;

                await Record.findOneAndUpdate(
                    { id: record_id },
                    { ...record, id: record_id, replay: record_id, track_id, campaign_id },
                    options,
                )
                    .then(() => info('upserted record', record_id))
                    .catch((err) => error(`failed to insert record ${record_id}: ${err}`));
            }
        }
    }

    if (errors.length) {
        info(`[-] done. found ${errors.length} errors.`);
        console.dir(errors);
    } else {
        info('[+] done. 0 errors.');
    }
};

db.on('open', () => main().catch(console.error));
