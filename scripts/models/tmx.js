const { model: Model, Schema } = require('mongoose');

const CampaignSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true,
    },
});

const TrackSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
    },
    campaign_name: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
});

const RecordSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    campaign_name: {
        type: String,
        required: true,
        index: true,
    },
    track_id: {
        type: String,
        required: true,
        index: true,
    },
    user: {
        id: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
        },
    },
    score: {
        type: Number,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    replay: {
        type: String,
    },
    validated: {
        type: String,
    },
    duration: {
        type: Number,
    },
    delta: {
        type: Number,
    },
});

module.exports = {
    tmnforever: {
        Campaign: new Model('tmnforever_Campaign', CampaignSchema),
        Track: new Model('tmnforever_Track', TrackSchema),
        Record: new Model('tmnforever_Record', RecordSchema),
    },
    united: {
        Campaign: new Model('united_Campaign', CampaignSchema),
        Track: new Model('united_Track', TrackSchema),
        Record: new Model('united_Record', RecordSchema),
    },
    nations: {
        Campaign: new Model('nations_Campaign', CampaignSchema),
        Track: new Model('nations_Track', TrackSchema),
        Record: new Model('nations_Record', RecordSchema),
    },
    sunrise: {
        Campaign: new Model('sunrise_Campaign', CampaignSchema),
        Track: new Model('sunrise_Track', TrackSchema),
        Record: new Model('sunrise_Record', RecordSchema),
    },
    original: {
        Campaign: new Model('original_Campaign', CampaignSchema),
        Track: new Model('original_Track', TrackSchema),
        Record: new Model('original_Record', RecordSchema),
    },
    tm2: {
        Campaign: new Model('tm2_Campaign', CampaignSchema),
        Track: new Model('tm2_Track', TrackSchema),
        Record: new Model('tm2_Record', RecordSchema),
    },
};
