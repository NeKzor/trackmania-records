require('dotenv').config();

const db = require('../db');
const fs = require('fs');
const path = require('path');
const { Tag } = require('../models');

db.on('open', async () => {
    const options = { upsert: true };

    const { cheaters, whitelist } = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../games/trackmania.json'), { encoding: 'utf-8' }),
    );

    for (const user_id of whitelist) {
        await Tag.findOneAndUpdate({ name: 'Unbanned', user_id }, { name: 'Unbanned', user_id }, options)
            .then(() => console.log('upserted Unbanned tag for', user_id))
            .catch((err) => console.error(`failed to insert Unbanned tag for ${user_id}: ${err}`));
    }

    for (const user_id of cheaters) {
        await Tag.findOneAndUpdate({ name: 'Banned', user_id }, { name: 'Banned', user_id }, options)
            .then(() => console.log('upserted Banned tag for', user_id))
            .catch((err) => console.error(`failed to insert Banned tag for ${user_id}: ${err}`));
    }
});
