const { model: Model, Schema } = require('mongoose');

const CampaignSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
    },
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
    campaign_id: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
});

const RecordSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    campaign_id: {
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
        country: {
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
    media: {
        type: String,
    },
});

module.exports = {
    Campaign: new Model('TMWii_Campaign', CampaignSchema),
    Track: new Model('TMWii_Track', TrackSchema),
    Record: new Model('TMWii_Record', RecordSchema),
};
