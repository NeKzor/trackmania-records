require('dotenv').config()
require('./db');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const session = require('koa-session');
const helmet = require('koa-helmet');
const { info, error } = require('./logger');
const { Status, Permissions } = require('./permissions');
const { User } = require('./models');
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
            redirect_uri: process.env.NODE_ENV !== 'production'
                ? 'https://trackmania.dev.local:3000/login/trackmania'
                : 'https://trackmania.nekz.me/login/trackmania',
        };

        const query = Object
            .entries(data)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        ctx.redirect('https://api.trackmania.com/oauth/authorize?' + query);
    })
    .get('/login/trackmania/authorize', async (ctx) => {
        const { code } = ctx.query;

        const client_id = process.env.TRACKMANIA_CLIENT_ID;
        const redirect_uri = process.env.NODE_ENV !== 'production'
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
            body: Object
                .entries(data)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&'),
        });

        const json = await response.json();
        console.log(`[API POST]`, route, response.status, response.statusText);

        if (response.status === 200) {
            const { access_token } = json;

            const response = await fetch('https://api.trackmania.com/api/user',{
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
            redirect_uri: process.env.NODE_ENV !== 'production'
                ? 'https://trackmania.dev.local:3000/login/maniaplanet'
                : 'https://trackmania.nekz.me/login/maniaplanet',
            scope: [
                'basic',
            ].join(' '),
        };

        const query = Object
            .entries(data)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        ctx.redirect('https://prod.live.maniaplanet.com/login/oauth2/authorize?' + query);
    })
    .get('/login/maniaplanet/authorize', async (ctx) => {
        const { code } = ctx.query;

        const client_id = process.env.MANIAPLANET_CLIENT_ID;
        const redirect_uri = process.env.NODE_ENV !== 'production'
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
            body: Object
                .entries(data)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&'),
        });

        const json = await response.json();
        console.log(`[API POST]`, route, response.status, response.statusText);

        if (response.status === 200) {
            const { access_token } = json;

            const response = await fetch('https://prod.live.maniaplanet.com/webservices/me',{
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

apiV1
    .get('/users', requiresPermission(Permissions.api_MANAGE_USERS), async (ctx) => {
        const users = await User.find();
        ctx.body = JSON.stringify({ data: users }, null, 4);
    });

apiV1Trackmania
    .get('/replays/:id', requiresPermission(Permissions.trackmania_DOWNLOAD_FILES), async (ctx) => {
        const replay = await Replay.findOne({ replay_id: String(ctx.params.id) });
        if (replay !== null) {
            const filename = `${process.env.TRACKMANIA_REPLAYS_FOLDER}/${replay.filename}`;

            if (fs.existsSync(filename)) {
                ctx.body = fs.createReadStream(filename);
                ctx.attachment(filename);
                return;
            }
        }

        ctx.throw(400, JSON.stringify({ message: 'Replay not available.' }, null, 4));
    });

publicRouter.use('', authentication.routes(), authentication.allowedMethods());
privateRouter.use('/api/v1', requiresAuth, apiV1.routes(), apiV1.allowedMethods());
privateRouter.use('/api/v1/trackmania', requiresAuth, apiV1Trackmania.routes(), apiV1Trackmania.allowedMethods());

app.keys = [process.env.RANDOM_SESSION_KEY];

app
    .on('error', (err, ctx) => {
        const message = err.message.replace(/[\n\r]/g, '');
        const timestamp = (new Date().toISOString().slice(0, 19).replace('T', ' '));
        const ua = ctx.headers['user-agent'];
        const userAgent = (ua ? ua : '').replace(/[\n\r]/g, '');
        error(`[${timestamp}] ${message} : ${ctx.originalUrl} : ${ctx.ip} : ${userAgent}`);
    })
    .use(cors({
        allowMethods: ['GET', 'POST', 'PATCH'],
        origin: (ctx) => {
            console.log('ctx.origin', ctx.origin);
            return process.env.NODE_ENV !== 'production'
                ? 'https://trackmania.dev.local:3000'
                : 'https://api.nekz.me';
        },
        credentials: true,
    }))
    .use(helmet())
    .use(koaBody({ json: true }))
    .use(session({
        key: 'auth',
        maxAge: 86400000,
        autoCommit: true,
        overwrite: true,
        httpOnly: true,
        signed: true,
        rolling: false,
        renew: false,
        secure: true,
        sameSite: 'none',
        domain: 'api.nekz.me',
    }, app))
    .use((ctx, next) => {
        ctx.cookies.secure = true;
        return next();
    })
    .use(async (ctx, next) => {
        const timestamp = (new Date().toISOString().slice(0, 19).replace('T', ' '));
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
