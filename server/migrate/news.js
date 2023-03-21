require('dotenv').config();

const db = require('../db');
const { Update } = require('../models');

const main = async () => {
    await Update.create({
        date: new Date('2023-01-01'),
        title: '',
        text: `- Migrated all Trackmania records to the database backend.
- Added Super Royal competition.
- Replaced Hat-Trick statistic with Qualifier+Match statistic.
- The first 50 people, who logged in previously into this site without any reasons as there was nothing to benefit from, are now able to try out the new replay inspection button for every available Trackmania replay.
- Paused Trackmania competition updates.`,
    });
    await Update.create({
        date: new Date('2022-07-01'),
        title: '',
        text: `- Removed duration statistics from Trackmania player rankings.
- Enabled Nations ESWC updates, history and statistics.`,
    });
    await Update.create({
        date: new Date('2022-02-01'),
        title: '',
        text: `- Added support for new tmx-exchange.com website! Updates for Nations ESWC are still paused at the moment.`,
    });
    await Update.create({
        date: new Date('2021-11-01'),
        title: '',
        text: `- User Authentication via Ubisoft/Maniaplanet!! Right now it's probably useless for you since there are almost no benefits when logged in.
- Download button to public replays has been removed for older records because they might not be available anymore. Instead we provide backups from our servers. This service requires permission from us!`,
    });
};

db.on('open', () => main().catch(console.error));
