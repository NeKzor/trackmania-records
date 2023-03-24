const { model: Model, Schema } = require('mongoose');

const CampaignSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true,
    },
    leaderboard: [
        {
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
            wrs: {
                type: Number,
            },
        },
    ],
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

const VRecordSchema = new Schema({
    wrScore: {
        type: Number,
    },
    history: [RecordSchema],
    wrs: [RecordSchema],
    track: TrackSchema,
});

const VTrackRecordSchema = RecordSchema.clone();
VTrackRecordSchema.add({
    track: TrackSchema,
});

module.exports = {
    tmnforever: {
        Campaign: new Model('tmnforever_Campaign', CampaignSchema),
        Track: new Model('tmnforever_Track', TrackSchema),
        Record: new Model('tmnforever_Record', RecordSchema),
        VRecord: new Model('VRecord_tmnforever', VRecordSchema, 'v_records_tmnforever'),
        VTrackRecord: new Model('VTrackRecord_tmnforever', VTrackRecordSchema, 'v_trackrecords_tmnforever'),
    },
    united: {
        Campaign: new Model('united_Campaign', CampaignSchema),
        Track: new Model('united_Track', TrackSchema),
        Record: new Model('united_Record', RecordSchema),
        VRecord: new Model('VRecord_united', VRecordSchema, 'v_records_united'),
        VTrackRecord: new Model('VTrackRecord_united', VTrackRecordSchema, 'v_trackrecords_united'),
    },
    nations: {
        Campaign: new Model('nations_Campaign', CampaignSchema),
        Track: new Model('nations_Track', TrackSchema),
        Record: new Model('nations_Record', RecordSchema),
        VRecord: new Model('VRecord_nations', VRecordSchema, 'v_records_nations'),
        VTrackRecord: new Model('VTrackRecord_nations', VTrackRecordSchema, 'v_trackrecords_nations'),
    },
    sunrise: {
        Campaign: new Model('sunrise_Campaign', CampaignSchema),
        Track: new Model('sunrise_Track', TrackSchema),
        Record: new Model('sunrise_Record', RecordSchema),
        VRecord: new Model('VRecord_sunrise', VRecordSchema, 'v_records_sunrise'),
        VTrackRecord: new Model('VTrackRecord_sunrise', VTrackRecordSchema, 'v_trackrecords_sunrise'),
    },
    original: {
        Campaign: new Model('original_Campaign', CampaignSchema),
        Track: new Model('original_Track', TrackSchema),
        Record: new Model('original_Record', RecordSchema),
        VRecord: new Model('VRecord_original', VRecordSchema, 'v_records_original'),
        VTrackRecord: new Model('VTrackRecord_original', VTrackRecordSchema, 'v_trackrecords_original'),
    },
    tm2: {
        Campaign: new Model('tm2_Campaign', CampaignSchema),
        Track: new Model('tm2_Track', TrackSchema),
        Record: new Model('tm2_Record', RecordSchema),
        VRecord: new Model('VRecord_tm2', VRecordSchema, 'v_records_tm2'),
        VTrackRecord: new Model('VTrackRecord_tm2', VTrackRecordSchema, 'v_trackrecords_tm2'),
    },
};
