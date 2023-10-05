import mongoose from 'mongoose';

export enum UserStatus {
  Active = 0,
  Inactive = 1,
  Banned = 2,
}

export enum UserPermissions {
  api_MANAGE_USERS = 1 << 0,
  api_MANAGE_DATA = 1 << 1,

  trackmania_DOWNLOAD_FILES = 1 << 5,
  trackmania_MANAGE_MEDIA = 1 << 6,
  trackmania_MANAGE_DATA = 1 << 7,

  maniaplanet_DOWNLOAD_FILES = 1 << 10,
  maniaplanet_MANAGE_MEDIA = 1 << 11,
  maniaplanet_MANAGE_DATA = 1 << 12,
}

export const User = mongoose.model(
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

export const Update = mongoose.model(
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

export const Audit = mongoose.model(
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

export const Tag = mongoose.model(
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

export const Campaign = mongoose.model(
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

export const TrackSchema = new mongoose.Schema({
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

export const Track = mongoose.model('Track', TrackSchema);

export const RecordSchema = new mongoose.Schema({
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

export const Record = mongoose.model('Record', RecordSchema);

export const VRecord = mongoose.model(
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

export const VTrackRecordSchema = RecordSchema.clone();
VTrackRecordSchema.add({
  track: TrackSchema,
});

export const VTrackRecord = mongoose.model('V_TrackRecord', VTrackRecordSchema);

export const Ranking = mongoose.model(
  'Ranking',
  new mongoose.Schema({
    isOfficial: {
      type: Boolean,
      required: true,
    },
    campaign_id: {
      type: String,
      required: true,
      index: true,
    },
    leaderboard: [
      {
        user: {
          id: {
            type: String,
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
        wrs: {
          type: Number,
        },
      },
    ],
    countryLeaderboard: [
      {
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
        wrs: {
          type: Number,
        },
      },
    ],
    historyLeaderboard: [
      {
        user: {
          id: {
            type: String,
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
        wrs: {
          type: Number,
        },
      },
    ],
    historyCountryLeaderboard: [
      {
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
        wrs: {
          type: Number,
        },
      },
    ],
    uniqueLeaderboard: [
      {
        user: {
          id: {
            type: String,
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
        wrs: {
          type: Number,
        },
      },
    ],
    uniqueCountryLeaderboard: [
      {
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
        wrs: {
          type: Number,
        },
      },
    ],
  }),
);

export const Inspection = mongoose.model(
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

export const Competition = mongoose.model(
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

export const CompetitionResult = mongoose.model(
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

// export const Stat = mongoose.model(
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

export const IntegrationEvent = mongoose.model(
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

export enum Games {
  Nations = 'nations',
  Original = 'original',
  Sunrise = 'sunrise',
  Trackmania2 = 'tm2',
  NationsForever = 'tmnforever',
  TrackmaniaWii = 'tmwii',
  Trackmania = 'trackmania',
  United = 'united',
}

export const Replay = mongoose.model(
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
