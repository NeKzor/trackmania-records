require('dotenv').config();
require('./db');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const session = require('koa-session');
const helmet = require('koa-helmet');
const { info, error } = require('./logger');
const { Status, Permissions } = require('./permissions');
const { User, Campaign, Track, Record, Inspection, Update, Tag, Audit } = require('./models');
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

    ctx.throw(401, JSON.stringify({ message: 'Unauthorized.' }, null, 4));
};

const requiresPermission = (permissions) => async (ctx, next) => {
    if (ctx.session.user) {
        const user = await User.findById(ctx.session.user._id);
        if (user !== null && user.status === Status.ACTIVE && (user.permissions & permissions) !== 0) {
            return next();
        }
    }

    ctx.throw(401, JSON.stringify({ message: 'Unauthorized.' }, null, 4));
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
            if (user === null) {
                user = await User.create({
                    source,
                    login_id,
                    nickname: userData.display_name,
                });
            }

            ctx.session.user = user;
            ctx.body = JSON.stringify(user, null, 4);
        } else {
            ctx.body = JSON.stringify(json, null, 4);
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
            if (user === null) {
                user = await User.create({
                    source,
                    login_id,
                    nickname: userData.nickname,
                });
            }

            ctx.session.user = user;
            ctx.body = JSON.stringify(user, null, 4);
        } else {
            ctx.body = JSON.stringify(json, null, 4);
        }
    })
    .get('/logout', async (ctx) => {
        ctx.session = null;
        ctx.redirect('/');
    })
    .get('/@me', async (ctx) => {
        if (ctx.session.isNew) {
            ctx.throw(401, JSON.stringify({ message: 'Unauthorized.' }, null, 4));
        } else {
            ctx.body = JSON.stringify(ctx.session.user, null, 4);
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
    ctx.body = JSON.stringify({ data: users }, null, 4);
});
apiV1.get('/users/edit', requiresPermission(Permissions.api_MANAGE_USERS), async (ctx) => {
    // TODO
});
apiV1.get('/updates', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO: pagination
    const updates = await Update.find();
    ctx.body = JSON.stringify({ data: updates }, null, 4);
});
apiV1.get('/updates/edit', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO
});
apiV1.get('/tags', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO: pagination
    const tags = await Tag.find();
    ctx.body = JSON.stringify({ data: tags }, null, 4);
});
apiV1.get('/tags/edit', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO
});
apiV1.get('/audits', requiresPermission(Permissions.api_MANAGE_DATA), async (ctx) => {
    // TODO: pagination
    const audits = await Audit.find();
    ctx.body = JSON.stringify({ data: audits }, null, 4);
});

apiV1Trackmania.get('/campaigns', async (ctx) => {
    const campaigns = await Campaign.find({ isOfficial: ctx.params.isOfficial ?? true });
    ctx.body = JSON.stringify(campaigns, null, 4);
});

const generateRankings = (tracks) => {    
    const validRecords = (record) => record.note === undefined;

    class Zones {
        static World = 0;
        static Continent = 1;
        static Country = 2;
        static Region = 3;
    }

    const users = tracks
        .map((t) => {
            const all = (t.history.length > 0 ? t.history : t.wrs)
                .filter(validRecords)
                .map(({ user, date }) => ({ ...user, date }));
            const ids = [...new Set(all.map((user) => user.id))];
            return ids.map((id) => all.find((user) => user.id === id));
        })
        .flat();

    const getZoneId = (user) => (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId;
    const zones = users.reduce((zones, user) => {
        const zoneId = getZoneId(user);
        if (zones[zoneId] === undefined) {
            zones[zoneId] = user.zone.slice(0, 3);
        }
        return zones;
    }, {});

    const createLeaderboard = (key) => {
        const users = tracks
            .map((t) =>
                (t[key].length > 0 ? t[key] : t.wrs).filter(validRecords).map(({ user, date }) => ({ ...user, date })),
            )
            .flat();

        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        return [
            Object.keys(frequency)
                .sort((a, b) => frequency[b] - frequency[a])
                .map((key) => {
                    const [user] = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date));
                    delete user.date;

                    return {
                        user,
                        wrs: frequency[key],
                        duration: 0,
                    };
                }),
            [...new Set(users.map(getZoneId))]
                .map((zoneId) => ({
                    zone: zones[zoneId],
                    wrs: users.filter((user) => getZoneId(user) === zoneId).length,
                }))
                .sort((a, b) => {
                    const v1 = a.wrs;
                    const v2 = b.wrs;
                    return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
                }),
        ];
    };

    const [leaderboard, countryLeaderboard] = createLeaderboard('wrs');
    const [historyLeaderboard, historyCountryLeaderboard] = createLeaderboard('history');

    const frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const uniqueLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => {
            const [user] = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date));
            delete user.date;
            return {
                user,
                wrs: frequency[key],
            };
        });
    const uniqueCountryLeaderboard = [...new Set(users.map(getZoneId))]
        .map((zoneId) => ({
            zone: zones[zoneId],
            wrs: users.filter((user) =>getZoneId(user) === zoneId).length,
        }))
        .sort((a, b) => {
            const v1 = a.wrs;
            const v2 = b.wrs;
            return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
        });

    const totalTime = tracks
        .filter((t) => t.wrs.at(0))
        .map((t) => t.wrs.at(0).score)
        .reduce((a, b) => a + b, 0);

    return {
        stats: { totalTime },
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
            ? { $or: [{ id: String(ctx.params.idOrName) }, { name: String(ctx.params.idOrName) }]  }
            : { year: Number(ctx.params.year), month: Number(ctx.params.month) },
    );

    if (campaign === null) {
        ctx.throw(404, JSON.stringify({ message: 'Campaign not found.' }, null, 4));
        return;
    }

    const campaignTracks = await Track.find({ campaign_id: campaign.id }).sort({
        [campaign.isOfficial ? 'name' : 'monthDay']: 1,
    });

    const records = await Record.find({ campaign_id: campaign.id }).sort({ date: 1 });

    const tracks = campaignTracks.map((doc) => {
        const track = doc.toObject();
        track.history = records.filter((record) => record.track_id === track.id);

        const wrScore = track.history.at(-1)?.score;
        track.wrs = wrScore ? track.history.filter((record) => record.score === wrScore && !record.note) : [];
        return track;
    });

    ctx.body = JSON.stringify({ ...campaign.toObject(), tracks, ...generateRankings(tracks) }, null, 4);
};

const getHistory = async (ctx) => {
    const track = await Track.find({ id: String(ctx.params.id) });
    if (track === null) {
        ctx.throw(404, JSON.stringify({ message: 'Track not found.' }, null, 4));
        return;
    }

    const records = await Record.find({ track_id: track.id }).sort({ date: 1 });
    ctx.body = JSON.stringify({ track, records }, null, 4);
};

const getRecordInspection = async (ctx) => {
    const record = await Record.findOne({ id: String(ctx.params.id) });
    if (record === null) {
        ctx.throw(404, JSON.stringify({ message: 'Record not found.' }, null, 4));
        return;
    }

    const track = await Track.findOne({ id: record.track_id });
    if (track === null) {
        ctx.throw(404, JSON.stringify({ message: 'Track not found.' }, null, 4));
        return;
    }

    const records = [
        ...await Record.find({ id: record.track_id, score: { $gte: record.score } }).sort({ date: 1 }).limit(5),
        ...await Record.find({ id: record.track_id, score: { $lte: record.score } }).sort({ date: 1 }).limit(5),
    ];

    const inspections = await Inspection.find({ record_id: { $in: records.map((record) => record.id) } });

    ctx.body = JSON.stringify({ track, records, inspections }, null, 4);
};

const getPlayerProfile = async (ctx) => {
    const records = await Record.find({ user: { id: String(ctx.params.id) } })
        .sort({ date: 1 });

    const tracks = await Track
        .find({ track_id: { $in: records.map(({ track_id }) => track_id) } });

    const campaigns = await Campaign
        .find({ campaign_id: { $in: tracks.map(({ campaign_id }) => campaign_id) } });

    // TODO: competitions, user

    ctx.body = JSON.stringify({ records, tracks, campaigns }, null, 4);
};

apiV1Trackmania.get('/campaign/:idOrName', getCampaign);
apiV1Trackmania.get('/campaign/:year(\\d+)/:month(\\d+)', getCampaign);
apiV1Trackmania.get('/track/:id/history', getHistory);
apiV1Trackmania.get('/record/:id/inspect', getRecordInspection);
apiV1Trackmania.get('/player/:id/profile', getPlayerProfile);

apiV1Trackmania.get('/replays/:id', requiresPermission(Permissions.trackmania_DOWNLOAD_FILES), async (ctx) => {
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
});

publicRouter.use('', authentication.routes(), authentication.allowedMethods());
privateRouter.use('/api/v1', apiV1.routes(), apiV1.allowedMethods());
privateRouter.use('/api/v1/trackmania', apiV1Trackmania.routes(), apiV1Trackmania.allowedMethods());

app.keys = [process.env.RANDOM_SESSION_KEY];

app.on('error', (err, ctx) => {
    const message = err.message.replace(/[\n\r]/g, '');
    const stack = err.stack;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const ua = ctx.headers['user-agent'];
    const userAgent = (ua ? ua : '').replace(/[\n\r]/g, '');
    error(`[${timestamp}] ${message} ${stack} : ${ctx.originalUrl} : ${ctx.ip} : ${userAgent}`);
})
    .use(
        cors({
            allowMethods: ['GET', 'POST', 'PATCH'],
            origin: () => {
                return process.env.NODE_ENV !== 'production'
                    ? 'http://localhost:3000'
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

console.log('started server at http://localhost:3003');
