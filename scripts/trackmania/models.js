const mongoose = require('mongoose');

const Replay = mongoose.model(
    'Replay',
    new mongoose.Schema({
        replay_id: {
            type: String,
            unique: true,
            required: true,
        },
        filename: {
            type: String,
            unique: true,
            required: true,
        },
    }),
);

const User = mongoose.model(
    'User',
    new mongoose.Schema({
        login_id: {
            type: String,
            unique: true,
            required: true,
        },
        source: {
            type: String,
            required: true,
        },
        nickname: {
            type: String,
            index: true,
            required: true,
            minLength: 3,
            maxLength: 32,
        },
        permissions: {
            type: Number,
            default: 0,
            required: true,
        },
        status: {
            type: Number,
            default: 0,
            required: true,
        },
    }),
);

const Update = mongoose.model(
    'Update',
    new mongoose.Schema({
        date: {
            type: Date,
            default: Date.now,
        },
        title: {
            type: String,
        },
        text: {
            type: String,
        },
        publisher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: undefined,
        },
    }),
);

const Audit = mongoose.model(
    'Audit',
    new mongoose.Schema({
        date: {
            type: Date,
            default: Date.now,
        },
        auditType: {
            type: Number,
            required: true,
        },
        moderator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: undefined,
        },
        moderatorNote: {
            type: String,
            maxlength: 128,
        },
        serverNote: {
            type: String,
            required: true,
            maxlength: 128,
        },
        affected: {
            users: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            ],
            record: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Record',
                },
            ],
        },
    }),
);

const Tag = mongoose.model(
    'Tag',
    new mongoose.Schema({
        name: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
        },
        reason: {
            type: String,
        },
    }),
);

const Campaign = mongoose.model(
    'Campaign',
    new mongoose.Schema({
        isOfficial: {
            type: Boolean,
            required: true,
        },
        id: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            default: null,
        },
        month: {
            type: Number,
            default: null,
        },
        event: {
            startsAt: {
                type: Number,
            },
            endsAt: {
                type: Number,
            },
        },
    }),
);

const TrackSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    campaign_id: {
        type: String,
        required: true,
        index: true,
    },
    uid: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
    },
    year: {
        type: Number,
    },
    month: {
        type: Number,
    },
    monthDay: {
        type: Number,
    },
    season: {
        type: String,
    },
    isOfficial: {
        type: Boolean,
    },
    thumbnail: {
        type: String,
    },
    event: {
        startsAt: {
            type: Number,
        },
        endsAt: {
            type: Number,
        },
    },
});

const Track = mongoose.model(
    'Track',
    TrackSchema,
);

const RecordSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    track_id: {
        type: String,
        required: true,
        index: true,
    },
    campaign_id: {
        type: String,
        required: true,
        index: true,
    },
    date: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    delta: {
        type: Number,
    },
    duration: {
        type: Number,
    },
    replay: {
        type: String,
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
        zone: [
            {
                name: {
                    type: String,
                },
                parentId: {
                    type: String,
                },
                zoneId: {
                    type: String,
                    index: true,
                },
            },
        ],
    },
});

const Record = mongoose.model(
    'Record', RecordSchema
    ,
);

const VRecord = mongoose.model(
    'V_Record',
    new mongoose.Schema({
        wrScore: {
            type: Number,
        },
        history: [RecordSchema],
        wrs: [RecordSchema],
        track: TrackSchema,
    }),
);

const VTrackRecord = Record.discriminator(
    'V_TrackRecord',
    new mongoose.Schema({
        track: TrackSchema,
    }),
);

const Inspection = mongoose.model(
    'Inspection',
    new mongoose.Schema({
        record_id: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },
        ghostLogin: {
            type: String,
        },
        challengeUid: {
            type: String,
        },
        gameVersion: {
            type: String,
        },
        exeChecksum: {
            type: Number,
        },
        checkpoints: [
            {
                time: {
                    type: Number,
                },
                stuntScore: {
                    type: Number,
                },
            },
        ],
        inputs: [
            {
                dx: {
                    type: Number,
                },
                dy: {
                    type: Number,
                },
                steering: {
                    type: Number,
                },
                accelerate: {
                    type: Number,
                },
                brake: {
                    type: Number,
                },
            },
        ],
    }),
);

const Competition = mongoose.model(
    'Competition',
    new mongoose.Schema({
        id: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        timeslot: {
            type: Number,
        },
        type: {
            type: String,
            required: true,
        },
        creator: {
            type: String,
            required: true,
        },
        nb_players: {
            type: Number,
        },
        startDate: {
            type: Number,
        },
        endDate: {
            type: Number,
        },
        year: {
            type: Number,
        },
        month: {
            type: Number,
        },
    }),
);

const CompetitionResult = mongoose.model(
    'CompetitionResult',
    new mongoose.Schema({
        competition_id: {
            type: Number,
            unique: true,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        timeslot: {
            type: Number,
        },
        type: {
            type: String,
            required: true,
        },
        nb_players: {
            type: Number,
        },
        start_date: {
            type: Number,
        },
        end_date: {
            type: Number,
        },
        year: {
            type: Number,
        },
        month: {
            type: Number,
        },
        monthDay: {
            type: Number,
        },
        round: {
            qualifier: {
                id: {
                    type: Number,
                },
                winner: {
                    accountId: {
                        type: String,
                        index: true,
                    },
                    displayName: {
                        type: String,
                    },
                    timestamp: {
                        type: String,
                    },
                    score: {
                        type: Number,
                    },
                    delta: {
                        type: Number,
                    },
                    zone: {
                        type: String,
                    },
                },
            },
            match: {
                id: {
                    type: Number,
                },
                name: {
                    type: String,
                },
                winner: {
                    accountId: {
                        type: String,
                        index: true,
                    },
                    displayName: {
                        type: String,
                    },
                    timestamp: {
                        type: String,
                    },
                    zone: {
                        type: String,
                    },
                },
                winners: [
                    {
                        accountId: {
                            type: String,
                            index: true,
                        },
                        displayName: {
                            type: String,
                        },
                        timestamp: {
                            type: String,
                        },
                        zone: {
                            type: String,
                        },
                    },
                ],
            },
        },
    }),
);

// const Stat = mongoose.model(
//     'Stat',
//     new mongoose.Schema({
//         type: {
//             type: String,
//             required: true,
//         },
//         competition_id: {
//             type: Number,
//         },
//         user: {
//             id: {
//                 type: String,
//                 required: true,
//             },
//             name: {
//                 type: String,
//             },
//             zone: [
//                 {
//                     name: {
//                         type: String,
//                     },
//                     parentId: {
//                         type: String,
//                     },
//                     zoneId: {
//                         type: String,
//                     },
//                 },
//             ],
//         },
//     }),
// );

const IntegrationEvent = mongoose.model(
    'IntegrationEvent',
    new mongoose.Schema({
        record_id: {
            type: String,
            index: true,
        },
        twitter: {
            type: String,
            default: null,
        },
    }),
);

const Games = {
    Nations: 'nations',
    Original: 'original',
    Sunrise: 'sunrise',
    Trackmania2: 'tm2',
    NationsForever: 'tmnforever',
    TrackmaniaWii: 'tmwii',
    Trackmania: 'trackmania',
    United: 'united',
};

module.exports = {
    User,
    Update,
    Audit,
    Tag,
    Campaign,
    Track,
    Record,
    VRecord,
    VTrackRecord,
    Inspection,
    Competition,
    CompetitionResult,
    IntegrationEvent,
    Games,
    Replay,
};
