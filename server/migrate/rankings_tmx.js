require('dotenv').config();
require('../db');
const models = require('../models/tmx');

const tmx = ['tmnforever', 'united', 'nations', 'sunrise', 'original'];

const main = async () => {
    for (const game of tmx) {
        const { Campaign, VRecord } = models[game];

        const campaigns = await Campaign.find({});

        for (const campaign of campaigns) {
            campaign.leaderboard = await VRecord.aggregate()
                .match({ 'track.campaign_name': campaign.name })
                .unwind({
                    path: '$wrs',
                    preserveNullAndEmptyArrays: false,
                })
                .sort({
                    'wrs.date': -1,
                })
                .group({
                    _id: '$wrs.user.id',
                    user: {
                        $first: '$wrs.user',
                    },
                    wrs: {
                        $sum: 1,
                    },
                })
                .project({ _id: 0 })
                .sort({
                    wrs: -1,
                })
                .allowDiskUse(true);

            await campaign.save();

            console.log(`updated game ${game} ranking ${campaign.name}`);
        }
    }

    console.log('done');
};

main();
