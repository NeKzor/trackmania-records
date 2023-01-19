const mongoose = require('mongoose');

const Replay = mongoose.model('Replay', new mongoose.Schema({
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
}));

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

const Track = mongoose.model(
    'Track',
    new mongoose.Schema({
        id: {
            type: String,
            unique: true,
            required: true,
        },
        campaign_id:  {
            type: String,
            required: true,
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
    }),
);

const Record = mongoose.model(
    'Record',
    new mongoose.Schema({
        id: {
            type: String,
            unique: true,
            required: true,
        },
        track_id: {
            type: String,
            required: true,
        },
        campaign_id: {
            type: String,
            required: true,
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
                    },
                },
            ],
        },
    }),
);

const Inspection = mongoose.model(
    'Inspection',
    new mongoose.Schema({
        record_id: {
            type: String,
            unique: true,
            required: true,
        },
        ghostLogin: {
            type: String,
        },
        challengeUid: {
            type: String,
        },
        checkpoints: [
            {
                time: {
                    type: Number,
                },
                stuntScore: {
                    type: Number,
                },
            }
        ],
        inputs:  [
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
            }
        ],
    }),
);

const Competition = mongoose.model(
    'Competition',
    new mongoose.Schema({
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    }),
);

const CompetitionResult = mongoose.model(
    'CompetitionResult',
    new mongoose.Schema({
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    }),
);

const IntegrationEvent = mongoose.model(
    'IntegrationEvent',
    new mongoose.Schema({
        record_id: {
            type: String,
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
    Inspection,
    Competition,
    CompetitionResult,
    IntegrationEvent,
    Games,
    Replay,
};
