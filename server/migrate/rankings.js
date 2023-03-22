require('dotenv').config();
require('../db');
const {
    Campaign,
    VRecord,
    VTrackRecord,
    Ranking,
} = require('../models');

const updateRankings = async (isOfficial, campaignId, isCombined) => {
    const leaderboard = await VRecord.aggregate()
        .match(isCombined ? ({}) : {
            ...(campaignId ? { 'track.campaign_id': campaignId } : { 'track.isOfficial': isOfficial }),
        })
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
        });

    const countryLeaderboard = await VRecord.aggregate()
        .match(isCombined ? ({}) : {
            ...(campaignId ? { 'track.campaign_id': campaignId } : { 'track.isOfficial': isOfficial }),
        })
        .unwind({
            path: '$wrs',
            preserveNullAndEmptyArrays: false,
        })
        .sort({
            'wrs.date': -1,
        })
        .group({
            _id: {
                $arrayElemAt: ['$wrs.user.zone.zoneId', 2],
            },
            zone: {
                $first: {
                    $slice: ['$wrs.user.zone', 3],
                },
            },
            wrs: {
                $sum: 1,
            },
        })
        .project({ _id: 0 })
        .sort({
            wrs: -1,
        });

    const historyLeaderboard = await VTrackRecord.aggregate()
        .match(isCombined ? ({}) : {
            ...(campaignId ? { 'track.campaign_id': campaignId } : { 'track.isOfficial': isOfficial }),
            note: {
                $exists: false,
            },
        })
        .group({
            _id: '$user.id',
            wrs: {
                $sum: 1,
            },
            user: {
                $first: '$user',
            },
        })
        .project({ _id: 0 })
        .sort({
            wrs: -1,
        });

    const historyCountryLeaderboard = await VTrackRecord.aggregate()
        .match(isCombined ? ({}) : {
            ...(campaignId ? { 'track.campaign_id': campaignId } : { 'track.isOfficial': isOfficial }),
            note: {
                $exists: false,
            },
        })
        .group({
            _id: {
                $arrayElemAt: ['$user.zone.zoneId', 2],
            },
            wrs: {
                $sum: 1,
            },
            zone: {
                $first: {
                    $slice: ['$user.zone', 3],
                },
            },
        })
        .project({ _id: 0 })
        .sort({
            wrs: -1,
        });

    const uniqueLeaderboard = await VTrackRecord.aggregate()
        .match(isCombined ? ({}) : {
            ...(campaignId ? { 'track.campaign_id': campaignId } : { 'track.isOfficial': isOfficial }),
            note: {
                $exists: false,
            },
        })
        .group({
            _id: {
                user_id: '$user.id',
                track_id: '$track_id',
            },
            user: {
                $first: '$user',
            },
        })
        .group({
            _id: '$user.id',
            wrs: {
                $sum: 1,
            },
            user: {
                $first: '$user',
            },
        })
        .project({ _id: 0 })
        .sort({
            wrs: -1,
        });

    const uniqueCountryLeaderboard = await VTrackRecord.aggregate()
        .match(isCombined ? ({}) : {
            ...(campaignId ? { 'track.campaign_id': campaignId } : { 'track.isOfficial': isOfficial }),
            note: {
                $exists: false,
            },
        })
        .group({
            _id: {
                zone_id: {
                    $arrayElemAt: ['$user.zone.zoneId', 2],
                },
                track_id: '$track_id',
            },
            zone: {
                $first: {
                    $slice: ['$user.zone', 3],
                },
            },
        })
        .group({
            _id: {
                $arrayElemAt: ['$zone.zoneId', 2],
            },
            wrs: {
                $sum: 1,
            },
            zone: {
                $first: '$zone',
            },
        })
        .project({ _id: 0 })
        .sort({
            wrs: -1,
        });

    const ranking = {
        isOfficial,
        campaign_id: campaignId ?? null,
        leaderboard,
        countryLeaderboard,
        historyLeaderboard,
        historyCountryLeaderboard,
        uniqueLeaderboard,
        uniqueCountryLeaderboard,
    };

    await Ranking.updateOne({ isOfficial, campaign_id: campaignId ?? null }, { $set: ranking }, { upsert: true });
};

const main = async () => {
    const campaigns = await Campaign.find({});
    for (const campaign of campaigns) {
            await updateRankings(campaign.isOfficial, campaign.id);
            console.log('updated ranking for ', campaign.id);
    }

    const official = [true];
    const totd = [false];
    const combined = [,,true];

    await updateRankings(...official);
    console.log('updated official ranking');

    await updateRankings(...totd);
    console.log('updated totd ranking');

    await updateRankings(...combined);
    console.log('updated combined ranking');
};

main();
