require('dotenv').config();
require('./db');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const session = require('koa-session');
const helmet = require('koa-helmet');
const { info, error } = require('./logger');
const { Status, Permissions } = require('./permissions');
const {
    User,
    Campaign,
    Track,
    Record,
    VRecord,
    VTrackRecord,
    Inspection,
    Update,
    Tag,
    Audit,
    CompetitionResult,
} = require('./models');
const { Replay } = require('./trackmania/models');

const app = new Koa({ proxy: true });
const publicRouter = new Router();
const privateRouter = new Router();
const authentication = new Router();
const apiV1 = new Router();
const apiV1Trackmania = new Router();

console.log('NODE_ENV:', process.env.NODE_ENV);

const requiresAuth = (ctx, next) => {
    if (ctx.session.user) {
        return next();
    }

    ctx.throw(401, { message: 'Unauthorized.' });
};

const requiresPermission = (permissions) => async (ctx, next) => {
    if (ctx.session.user) {
        const user = await User.findById(ctx.session.user._id);
        if (user !== null && user.status === Status.ACTIVE && (user.permissions & permissions) !== 0) {
            return next();
        }
    }

    ctx.throw(401, { message: 'Unauthorized.' });
};

authentication
    .get('/login/trackmania', async (ctx) => {
        const data = {
            response_type: 'code',
            client_id: process.env.TRACKMANIA_CLIENT_ID,
            redirect_uri:
                process.env.NODE_ENV !== 'production'
                    ? 'https://trackmania.dev.local:3000/login/trackmania'
                    : 'https://trackmania.nekz.me/login/trackmania',
        };

        const query = Object.entries(data)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        ctx.redirect('https://api.trackmania.com/oauth/authorize?' + query);
    })
    .get('/login/trackmania/authorize', async (ctx) => {
        const { code } = ctx.query;

        const client_id = process.env.TRACKMANIA_CLIENT_ID;
        const redirect_uri =
            process.env.NODE_ENV !== 'production'
                ? 'https://trackmania.dev.local:3000/login/trackmania'
                : 'https://trackmania.nekz.me/login/trackmania';

        const data = {
            grant_type: 'authorization_code',
            client_id,
            client_secret: process.env.TRACKMANIA_CLIENT_SECRET,
            code,
            redirect_uri,
        };

        const route = 'https://api.trackmania.com/api/access_token';
        const response = await fetch(route, {
            method: 'POST',
            headers: {
                'User-Agent': 'api.nekz.me',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: Object.entries(data)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&'),
        });

        const json = await response.json();
        console.log(`[API POST]`, route, response.status, response.statusText);

        if (response.status === 200) {
            const { access_token } = json;

            const response = await fetch('https://api.trackmania.com/api/user', {
                method: 'GET',
                headers: {
                    'User-Agent': 'api.nekz.me',
                    'Authorization': 'Bearer ' + access_token,
                },
            });

            const userData = await response.json();
            console.log(`[API GET]`, route, response.status, response.statusText, userData);

            const source = 'api.trackmania.com';
            const login_id = String(userData.account_id);

            let user = await User.findOne({ source, login_id });
            if (!user) {
                user = await User.create({
                    source,
                    login_id,
                    nickname: userData.display_name,
                });
            }

            ctx.session.user = user;
            ctx.body = user;
        } else {
            ctx.body = json;
        }
    })
    .get('/login/maniaplanet', async (ctx) => {
        const data = {
            response_type: 'code',
            client_id: process.env.MANIAPLANET_CLIENT_ID,
            redirect_uri:
                process.env.NODE_ENV !== 'production'
                    ? 'https://trackmania.dev.local:3000/login/maniaplanet'
                    : 'https://trackmania.nekz.me/login/maniaplanet',
            scope: ['basic'].join(' '),
        };

        const query = Object.entries(data)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        ctx.redirect('https://prod.live.maniaplanet.com/login/oauth2/authorize?' + query);
    })
    .get('/login/maniaplanet/authorize', async (ctx) => {
        const { code } = ctx.query;

        const client_id = process.env.MANIAPLANET_CLIENT_ID;
        const redirect_uri =
            process.env.NODE_ENV !== 'production'
                ? 'https://trackmania.dev.local:3000/login/maniaplanet'
                : 'https://trackmania.nekz.me/login/maniaplanet';

        const data = {
            grant_type: 'authorization_code',
            client_id,
            client_secret: process.env.MANIAPLANET_CLIENT_SECRET,
            code,
            redirect_uri,
        };

        const route = 'https://prod.live.maniaplanet.com/login/oauth2/access_token';
        const response = await fetch(route, {
            method: 'POST',
            headers: {
                'User-Agent': 'api.nekz.me',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: Object.entries(data)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&'),
        });

        const json = await response.json();
        console.log(`[API POST]`, route, response.status, response.statusText);

        if (response.status === 200) {
            const { access_token } = json;

            const response = await fetch('https://prod.live.maniaplanet.com/webservices/me', {
                method: 'GET',
                headers: {
                    'User-Agent': 'api.nekz.me',
                    'Authorization': 'Bearer ' + access_token,
                },
            });

            const userData = await response.json();
            console.log(`[API GET]`, route, response.status, response.statusText, userData);

            const source = 'prod.live.maniaplanet.com';
            const login_id = String(userData.login);

            let user = await User.findOne({ source, login_id });
            if (!user) {
                user = await User.create({
                    source,
                    login_id,
                    nickname: userData.nickname,
                });
            }

            ctx.session.user = user;
            ctx.body = user;
        } else {
            ctx.body = json;
        }
    })
    .get('/logout', async (ctx) => {
        ctx.session = null;
        ctx.redirect('/');
    })
    .get('/@me', async (ctx) => {
        if (ctx.session.isNew) {
            ctx.throw(401, { message: 'Unauthorized.' });
        } else {
            ctx.body = ctx.session.user;
        }
    })
    .get('/', async (ctx) => {
        if (ctx.session.isNew) {
            ctx.body = `
                <a href="/login/trackmania">Login with Trackmania (Ubisoft Connect)</a>
                <br>
                <a href="/login/maniaplanet">Login with Trackmania² (Maniaplanet)</a>
            `;
        } else {
            ctx.body = `
                <span>Go to </span><a href="https://trackmania.nekz.me">trackmania.nekz.me</a>            
                <br>
                <a href="/logout">Logout</a>
                <br>
                <br>
                <code style="white-space: pre;">${JSON.stringify(ctx.session.user, null, 4)}</code>
            `;
        }
    });

apiV1.get('/users', requiresPermission(Permissions.api_MANAGE_USERS), async (ctx) => {
    // TODO: pagination
    const users = await User.find();
    ctx.body = { data: users };
});
apiV1.get('/users/edit', requiresPermission(Permissions.api_MANAGE_USERS), async (ctx) => {
    // TODO
});
apiV1.get('/updates', async (ctx) => {
    // TODO: pagination
    const updates = await Update.find();
    ctx.body = { data: updates };
});
apiV1.get('/updates/edit', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO
});
apiV1.get('/tags', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO: pagination
    const tags = await Tag.find();
    ctx.body = { data: tags };
});
apiV1.get('/tags/edit', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO
});
apiV1.get('/audits', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO: pagination
    const audits = await Audit.find();
    ctx.body = { data: audits };
});

apiV1Trackmania.get('/campaigns', async (ctx) => {
    const campaigns = await Campaign.find({ isOfficial: ctx.params.isOfficial ?? true });
    ctx.body = campaigns;
});

class Zones {
    static World = 0;
    static Continent = 1;
    static Country = 2;
    static Region = 3;
}

const generateRankings = async (isOfficial, campaignId) => {
    const leaderboard = await VRecord.aggregate()
        .match({
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
        .sort({
            wrs: -1,
        });

    const countryLeaderboard = await VRecord.aggregate()
        .match({
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
        .sort({
            wrs: -1,
        });

    const historyLeaderboard = await VTrackRecord.aggregate()
        .match({
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
        .sort({
            wrs: -1,
        });

    const historyCountryLeaderboard = await VTrackRecord.aggregate()
        .match({
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
        .sort({
            wrs: -1,
        });

    const uniqueLeaderboard = await VTrackRecord.aggregate()
        .match({
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
        .sort({
            wrs: -1,
        });

    const uniqueCountryLeaderboard = await VTrackRecord.aggregate()
        .match({
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
        .sort({
            wrs: -1,
        });

    return {
        leaderboard,
        countryLeaderboard,
        historyLeaderboard,
        historyCountryLeaderboard,
        uniqueLeaderboard,
        uniqueCountryLeaderboard,
    };
};

const getCampaign = async (ctx) => {
    const campaign = await Campaign.findOne(
        ctx.params.idOrName
            ? { $or: [{ id: String(ctx.params.idOrName) }, { name: String(ctx.params.idOrName) }] }
            : { year: Number(ctx.params.year), month: Number(ctx.params.month) },
    );

    if (!campaign) {
        ctx.throw(404, { message: 'Campaign not found.' });
        return;
    }

    const records = await VRecord.aggregate()
        .match({
            'track.campaign_id': campaign.id,
        })
        .sort({
            [campaign.isOfficial ? 'track.name' : 'track.monthDay']: 1,
        });

    const stats = {
        totalTime: 0,
    };

    const result = campaign.toObject();

    result.tracks = records.map((doc) => {
        const track = doc.track;
        track.wrs = doc.wrs;
        track.history = doc.history;

        stats.totalTime += doc.wrScore;

        return track;
    });

    ctx.body = { ...result, stats, ...(await generateRankings(campaign.isOfficial, campaign.id)) };
};

const getHistory = async (ctx) => {
    const track = await Track.find({ id: String(ctx.params.id) });
    if (!track) {
        ctx.throw(404, { message: 'Track not found.' });
        return;
    }

    const records = await Record.find({ track_id: track.id }).sort({ date: 1 });
    ctx.body = { track, records };
};

const getRecordInspection = async (ctx) => {
    const record = await Record.findOne({ id: String(ctx.params.id) });
    if (!record) {
        ctx.throw(404, { message: 'Record not found.' });
        return;
    }

    const track = await Track.findOne({ id: record.track_id });
    if (!track) {
        ctx.throw(404, { message: 'Track not found.' });
        return;
    }

    const records = [
        ...(await Record.find({ track_id: record.track_id, score: { $gte: record.score }, id: { $ne: record.id } })
            .sort({ date: 1 })
            .limit(5)),
        ...(await Record.find({ track_id: record.track_id, score: { $lte: record.score } })
            .sort({ date: 1 })
            .limit(5)),
    ];

    const inspections = await Inspection.find({ record_id: { $in: records.map((record) => record.id) } });

    ctx.body = { track, records, inspections };
};

const getPlayerProfile = async (ctx) => {
    const records = await Record.find({ user: { id: String(ctx.params.id) } }).sort({ date: 1 });

    const tracks = await Track.find({ track_id: { $in: records.map(({ track_id }) => track_id) } });

    const campaigns = await Campaign.find({ campaign_id: { $in: tracks.map(({ campaign_id }) => campaign_id) } });

    // TODO: competitions, user

    ctx.body = { records, tracks, campaigns };
};

const getReplay = async (ctx) => {
    const replay = await Replay.findOne({ replay_id: String(ctx.params.id) });
    if (replay !== null) {
        const filename = path.join(process.env.TRACKMANIA_REPLAYS_FOLDER, replay.filename);

        if (fs.existsSync(filename)) {
            ctx.body = fs.createReadStream(filename);
            ctx.attachment(filename);
            return;
        }
    }

    ctx.body = `
            <span>Replay not found :(</span>
            <br>
            <br>
            <div style="max-width: 700px">
                Note that older world record replays prior to 2021 have not been saved automatically by this system. They
                also do not exist on Nadeo servers anymore since the game only stores a player's personal best, which
                means their latest record would overwrite their previous one.
            </div>
            <br>
            <span>
                If you think this replay should be available, feel free to report this issue at:
                <a href="https://github.com/NeKzor/trackmania-records/issues">trackmania-records/issues</a>
            </span>
        `;

    //ctx.throw(400, JSON.stringify({ message: 'Replay not available.' }, null, 4));
};

const getRankings = async (ctx) => {
    if (!['campaign', 'totd', 'combined'].includes(ctx.params.name)) {
        ctx.throw(404, { message: 'Ranking name not found.' });
        return;
    }

    const isOfficial = ctx.params.name === 'campaign';

    ctx.body = await generateRankings(isOfficial);
};

const getCompetition = async (ctx) => {
    if (!['cotd', 'a08forever', 'superroyal'].includes(ctx.params.type)) {
        ctx.throw(404, { message: 'Competition not found.' });
        return;
    }

    const isA08Forever = ctx.params.type === 'a08forever';
    const timeslot = parseInt(ctx.params.timeslot ?? '0', 10);

    const results = await CompetitionResult.find({
        type: ctx.params.type,
        year: Number(ctx.params.year),
        ...(isA08Forever ? {} : { month: Number(ctx.params.month) }),
        ...(timeslot >= 1 && timeslot <= 3 ? { timeslot } : {}),
    });

    ctx.body = results;
};

const getCompetitionRankings = async (ctx) => {
    if (!['cotd', 'a08forever', 'superroyal'].includes(ctx.params.type)) {
        ctx.throw(404, { message: 'Competition not found.' });
        return;
    }

    const isCotd = ctx.params.type === 'cotd';
    const isSuperRoyal = ctx.params.type === 'superroyal';
    const timeslot = parseInt(ctx.params.timeslot ?? '0', 10);

    const qualifierWinners = isCotd
        ? await CompetitionResult.aggregate()
              .match({
                  'round.qualifier.winner.accountId': { $exists: 1 },
                  type: ctx.params.type,
                  ...(timeslot >= 1 && timeslot <= 3 ? { timeslot } : {}),
              })
              .group({
                  _id: '$round.qualifier.winner.accountId',
                  qualifiers: {
                      $sum: 1,
                  },
                  player: {
                      '$first': '$$ROOT.round.qualifier.winner',
                  },
              })
              .project({ qualifiers: 1, 'player.accountId': 1, 'player.displayName': 1, 'player.zone': 1 })
        : [];

    const matchWinners = isSuperRoyal
        ? await CompetitionResult.aggregate()
              .match({
                  'round.match.winners': { $exists: 1, $ne: [] },
                  type: ctx.params.type,
                  ...(timeslot >= 1 && timeslot <= 3 ? { timeslot } : {}),
              })
              .unwind('$round.match.winners')
              .group({
                  _id: '$round.match.winners.accountId',
                  matches: {
                      $sum: 1,
                  },
                  player: {
                      $first: '$$ROOT.round.match.winners',
                  },
              })
              .project({ matches: 1, 'player.accountId': 1, 'player.displayName': 1, 'player.zone': 1 })
        : await CompetitionResult.aggregate()
              .match({
                  'round.match.winner.accountId': { $exists: 1 },
                  type: ctx.params.type,
                  ...(timeslot >= 1 && timeslot <= 3 ? { timeslot } : {}),
              })
              .group({
                  _id: '$round.match.winner.accountId',
                  matches: {
                      $sum: 1,
                  },
                  player: {
                      '$first': '$$ROOT.round.match.winner',
                  },
              })
              .project({ matches: 1, 'player.accountId': 1, 'player.displayName': 1, 'player.zone': 1 });

    const qualifierAndMatchWins = await CompetitionResult.aggregate()
        .match({
            type: 'cotd',
            ...(timeslot >= 1 && timeslot <= 3 ? { timeslot } : {}),
            $expr: {
                $eq: ['$round.qualifier.winner.accountId', '$round.match.winner.accountId'],
            },
        })
        .group({
            _id: {
                ...(timeslot >= 1 && timeslot <= 3 ? { timeslot: '$timeslot' } : {}),
                winner: '$round.match.winner.accountId',
            },
            qualifierAndMatch: {
                $sum: 1,
            },
        });

    const players = [
        ...new Set([
            ...qualifierWinners.map(({ player }) => player.accountId),
            ...matchWinners.map(({ player }) => player.accountId),
        ]),
    ];

    const getCountry = ({ player }) => {
        const zones = player.zone.split('|');
        return zones.at(2) ?? zones.at(0);
    };

    const toZone = (value) => value.split('|').map((name) => ({ name }));

    const toLeaderboard = (leaderboards, id) => {
        const [leaderboard, countryLeaderboard] = leaderboards;

        const qualifierWinner = qualifierWinners.find(({ player }) => player.accountId === id);
        const matchWinner = matchWinners.find(({ player }) => player.accountId === id);
        const winner = qualifierWinner ?? matchWinner;
        const qualifiers = qualifierWinner?.qualifiers ?? 0;
        const matches = matchWinner?.matches ?? 0;
        const qualifierAndMatch = qualifierAndMatchWins
            .filter(({ _id }) => _id.winner === id)
            .reduce((sum, { qualifierAndMatch }) => (sum += qualifierAndMatch), 0);

        leaderboard.push({
            user: winner.player,
            wins: {
                qualifiers,
                matches,
                qualifierAndMatch,
            },
        });

        const country = getCountry(winner);
        const countryItem = countryLeaderboard.get(country);

        countryLeaderboard.set(country, {
            zone: toZone(winner.player.zone),
            wins: {
                qualifiers: (countryItem?.wins?.qualifiers ?? 0) + qualifiers,
                matches: (countryItem?.wins?.matches ?? 0) + matches,
                qualifierAndMatch: (countryItem?.wins?.qualifierAndMatch ?? 0) + qualifierAndMatch,
            },
        });

        return leaderboards;
    };

    const [leaderboard, countryLeaderboard] = players.reduce(toLeaderboard, [[], new Map()]);

    const byWins = (a, b) => {
        const ma = a.wins.matches;
        const mb = b.wins.matches;

        if (ma === mb) {
            const qa = a.wins.qualifiers;
            const qb = b.wins.qualifiers;

            if (qa === qb) {
                const ha = a.wins.qualifierAndMatch;
                const hb = b.wins.qualifierAndMatch;

                return ha === hb ? 0 : ha < hb ? 1 : -1;
            }

            return qa < qb ? 1 : -1;
        }

        return ma < mb ? 1 : -1;
    };

    const rankings = {
        leaderboard: leaderboard.sort(byWins),
        countryLeaderboard: [...countryLeaderboard.values()].sort(byWins),
    };

    ctx.body = rankings;
};

apiV1Trackmania.get('/campaign/:idOrName', getCampaign);
apiV1Trackmania.get('/campaign/:year(\\d+)/:month(\\d+)', getCampaign);
apiV1Trackmania.get('/track/:id/history', getHistory);
apiV1Trackmania.get(
    '/record/:id/inspect',
    /*requiresPermission(Permissions.trackmania_INSPECTION),*/ getRecordInspection,
);
apiV1Trackmania.get('/player/:id/profile', getPlayerProfile);
apiV1Trackmania.get('/replays/:id', requiresPermission(Permissions.trackmania_DOWNLOAD_FILES), getReplay);
apiV1Trackmania.get('/rankings/:name', getRankings);
apiV1Trackmania.get('/competition/:type/:year(\\d+)/:month(\\d+)?/:timeslot(\\d+)?', getCompetition);
apiV1Trackmania.get('/competition/:type/rankings/:timeslot(\\d+)?', getCompetitionRankings);

publicRouter.use('', authentication.routes(), authentication.allowedMethods());
privateRouter.use('/api/v1', apiV1.routes(), apiV1.allowedMethods());
privateRouter.use('/api/v1/trackmania', apiV1Trackmania.routes(), apiV1Trackmania.allowedMethods());

app.keys = [process.env.RANDOM_SESSION_KEY];

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        const allowError = [401, 404].includes(err.statusCode);
        if (allowError) {
            ctx.status = err.statusCode ?? 500;
            ctx.type = 'json';
            ctx.body = { message: (typeof err === 'object' ? err.message : undefined) ?? 'Internal server error.' };
        }
        ctx.app.emit('error', err, ctx);
    }
})
    .on('error', (err, ctx) => {
        const ignoreError = [401, 404].includes(err.statusCode);
        if (ignoreError && typeof err === 'object' && err.message) {
            return;
        }

        const message = err.message.replace(/[\n\r]/g, '');
        const stack = err.stack;
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const userAgent = ctx.headers['user-agent']?.replace(/[\n\r]/g, '') ?? '';

        error(`[${timestamp}] ${message} ${stack} : ${ctx.originalUrl} : ${ctx.ip} : ${userAgent}`, {
            ignoreConsole: process.env.NODE_ENV === 'production',
        });
    })
    .use(
        cors({
            allowMethods: ['GET', 'POST', 'PATCH'],
            origin: () => {
                return process.env.NODE_ENV !== 'production'
                    ? 'https://trackmania.dev.local:3000'
                    : 'https://trackmania.nekz.me';
            },
            credentials: true,
        }),
    )
    .use(helmet())
    .use(koaBody({ json: true }))
    .use(
        session(
            {
                key: 'auth',
                maxAge: 31536000000,
                autoCommit: true,
                overwrite: true,
                httpOnly: true,
                signed: true,
                rolling: false,
                renew: false,
                secure: true,
                sameSite: 'none',
                domain: process.env.NODE_ENV !== 'production' ? 'trackmania.dev.local' : 'api.nekz.me',
            },
            app,
        ),
    )
    .use((ctx, next) => {
        ctx.cookies.secure = true;
        return next();
    })
    .use(async (ctx, next) => {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const ua = ctx.headers['user-agent'];
        info(`[${timestamp}] ${ctx.originalUrl} : ${ctx.ip} : ${(ua ? ua : '').replace(/[\n\r]/g, '')}`);
        await next();
    })
    .use(publicRouter.routes())
    .use(publicRouter.allowedMethods())
    .use(privateRouter.routes())
    .use(privateRouter.allowedMethods())
    .listen(3003);

console.log('started server at https://trackmania.dev.local:3003');
