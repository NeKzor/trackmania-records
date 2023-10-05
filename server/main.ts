// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import 'dotenv/load.ts';
import { Application, Context, CookiesSetDeleteOptions, Middleware, Router, Status, STATUS_TEXT } from 'oak/mod.ts';
import { ResponseBody, ResponseBodyFunction } from 'oak/response.ts';
import Session from 'oak_sessions/src/Session.ts';
import CookieStore from 'oak_sessions/src/stores/CookieStore.ts';
import { oakCors } from 'cors/mod.ts';
import { logger } from './logger.ts';
import { Replay, User, UserPermissions } from './models.ts';
import { db } from './db.ts';
import { encodeUrlForm, getReplaysFilePath, getStorageFilePath } from './utils.ts';
import { rateLimits } from './rate_limits.ts';

const TMR_PUBLIC_URI = Deno.env.get('TMR_PUBLIC_URI')!;
const TMR_PUBLIC_HOST = new URL(TMR_PUBLIC_URI).host;

const SERVER_HOST = Deno.env.get('SERVER_HOST')!;
const SERVER_PORT = parseInt(Deno.env.get('SERVER_PORT')!, 10);

const cookieOptions: CookiesSetDeleteOptions = {
  expires: new Date(Date.now() + 86_400_000 * 30),
  sameSite: 'lax',
  secure: true,
  ignoreInsecure: true,
};

const store = new CookieStore(Deno.env.get('COOKIE_SECRET_KEY')!, {
  cookieSetDeleteOptions: cookieOptions,
});
const useSession = Session.initMiddleware(store, {
  cookieSetOptions: cookieOptions,
});

db.connect({
  username: Deno.env.get('DB_USER')!,
  password: Deno.env.get('DB_PASS')!,
  host: Deno.env.get('DB_HOST')!,
  port: Deno.env.get('DB_PORT')!,
  database: Deno.env.get('DB_NAME')!,
});

const requiresAuth: Middleware<AppState> = async (ctx, next) => {
  if (!ctx.state.session.get('user')) {
    return Err(ctx, Status.Unauthorized);
  }

  await next();
};

await logger.initFileLogger('/logs/server', {
  rotate: true,
  maxBytes: 100_000_000,
  maxBackupCount: 7,
});

addEventListener('unhandledrejection', (ev) => {
  ev.preventDefault();
  console.error(ev.reason);
});

const hasPermission = (permission: UserPermissions): Middleware<AppState> => (ctx) => {
  const user = ctx.state.session.get('user');
  return user && user.permissions & permission;
};

const Ok = (
  ctx: Context,
  body?: ResponseBody | ResponseBodyFunction,
  type?: string,
) => {
  ctx.response.status = Status.OK;
  ctx.response.type = type ?? 'application/json';
  ctx.response.body = body ?? {};
};

const Err = (ctx: Context, status?: Status, message?: string) => {
  ctx.response.status = status ?? Status.InternalServerError;
  ctx.response.type = 'application/json';
  ctx.response.body = {
    status: ctx.response.status,
    message: message ??
      (status ? STATUS_TEXT[status] : STATUS_TEXT[Status.InternalServerError]),
  };
};

const apiV1 = new Router<AppState>();

apiV1
  // Get a replay file.
  .get('/replays/:id', hasPermission(UserPermissions.trackmania_DOWNLOAD_FILES), async (ctx) => {
    const replay = await Replay.findOne({ replay_id: String(ctx.params.id) });
    if (replay !== null) {
      try {
        const file = await Deno.readFile(getReplaysFilePath(replay.filename));

        ctx.response.headers.set(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(replay.filename)}"`,
        );

        Ok(ctx, file, 'application/octet-stream');
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          logger.error(err);
        }
      }
    }

    ctx.response.status = Status.NotFound;
    ctx.response.headers.set('content-type', 'text/html');
    ctx.response.body = `<span>Replay not found :(</span>
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
</span>`;
  })
  .get('/(.*)', (ctx) => {
    Err(ctx, Status.NotFound, 'Route not found :(');
  });

// Login routes.

const login = new Router<AppState>();

login.get('/trackmania', async (ctx) => {
  const data = {
    response_type: 'code',
    client_id: Deno.env.get('TRACKMANIA_CLIENT_ID')!,
    redirect_uri: Deno.env.get('TRACKMANIA_REDIRECT_URI')!,
  };

  ctx.response.redirect('https://api.trackmania.com/oauth/authorize?' + encodeUrlForm(data));
});
login.get('/trackmania/authorize', rateLimits.authorize, useSession, async (ctx) => {
  const data = {
    grant_type: 'authorization_code',
    client_id: Deno.env.get('TRACKMANIA_CLIENT_ID')!,
    client_secret: Deno.env.get('TRACKMANIA_CLIENT_SECRET')!,
    code: ctx.request.url.searchParams.get('code') ?? '',
    redirect_uri: Deno.env.get('TRACKMANIA_REDIRECT_URI')!,
  };

  const route = 'https://api.trackmania.com/api/access_token';
  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'User-Agent': Deno.env.get('USER_AGENT')!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeUrlForm(data),
  });

  const json = await response.json();
  logger.info(`[API POST]`, route, response.status, response.statusText);

  if (response.status === 200) {
    const { access_token } = json;

    const response = await fetch('https://api.trackmania.com/api/user', {
      method: 'GET',
      headers: {
        'User-Agent': Deno.env.get('USER_AGENT')!,
        'Authorization': 'Bearer ' + access_token,
      },
    });

    const userData = await response.json();
    logger.info(`[API GET]`, route, response.status, response.statusText, userData);

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

    ctx.state.session.set('user', user);
    Ok(ctx, user);
  } else {
    Ok(ctx, json);
  }
});
login.get('/maniaplanet', async (ctx) => {
  const data = {
    response_type: 'code',
    client_id: Deno.env.get('MANIAPLANET_CLIENT_ID')!,
    redirect_uri: Deno.env.get('MANIAPLANET_REDIRECT_URI')!,
    scope: [
      'basic',
    ].join(' '),
  };

  ctx.response.redirect('https://prod.live.maniaplanet.com/login/oauth2/authorize?' + encodeUrlForm(data));
});
login.get('/maniaplanet/authorize', rateLimits.authorize, useSession, async (ctx) => {
  const data = {
    grant_type: 'authorization_code',
    client_id: Deno.env.get('MANIAPLANET_CLIENT_ID')!,
    client_secret: Deno.env.get('MANIAPLANET_CLIENT_SECRET')!,
    code: ctx.request.url.searchParams.get('code') ?? '',
    redirect_uri: Deno.env.get('MANIAPLANET_REDIRECT_URI')!,
  };

  const route = 'https://prod.live.maniaplanet.com/login/oauth2/access_token';
  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'User-Agent': Deno.env.get('USER_AGENT')!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeUrlForm(data),
  });

  const json = await response.json();
  logger.info(`[API POST]`, route, response.status, response.statusText);

  if (response.status === 200) {
    const { access_token } = json;

    const response = await fetch('https://prod.live.maniaplanet.com/webservices/me', {
      method: 'GET',
      headers: {
        'User-Agent': Deno.env.get('USER_AGENT')!,
        'Authorization': 'Bearer ' + access_token,
      },
    });

    const userData = await response.json();
    logger.info(`[API GET]`, route, response.status, response.statusText, userData);

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

    ctx.state.session.set('user', user);
    Ok(ctx, user);
  } else {
    Ok(ctx, json);
  }
});

const router = new Router<AppState>();

// Web API routes.

router.use('/api/v1', apiV1.routes());
router.use('/login', login.routes());
router.get('/users/@me', useSession, requiresAuth, (ctx) => {
  Ok(ctx, ctx.state.session.get('user'));
});
router.get('/logout', useSession, async (ctx) => {
  await ctx.state.session.deleteSession();
  await ctx.cookies.delete('session');
  await ctx.cookies.delete('session_data');
  ctx.response.redirect('/');
});
router.get('/', useSession, async (ctx) => {
  const user = ctx.state.session.get('user');
  if (!user) {
    Ok(
      ctx,
      `<a href="/login/trackmania">Ubisoft Connect</a>
<br>
<a href="/login/maniaplanet">Maniaplanet</a>`,
      'text/html',
    );
  } else {
    Ok(
      ctx,
      `<span>Go to </span><a href="${TMR_PUBLIC_URI}">${TMR_PUBLIC_HOST}</a>            
<br>
<a href="/logout">Logout</a>
<br>
<br>
<code style="white-space: pre;">${JSON.stringify(user, null, 4)}</code>`,
      'text/html',
    );
  }
});

router.get('/security.txt', async (ctx) => {
  Ok(ctx, await Deno.readFile(getStorageFilePath('security.txt')), 'text/plain');
});
router.get('/.well-known/security.txt', async (ctx) => {
  Ok(ctx, await Deno.readFile(getStorageFilePath('security.txt')), 'text/plain');
});
router.get('/(.*)', (ctx) => {
  Err(ctx, Status.NotFound, 'Route not found :(');
});

type AppState = {
  session: Session & { get(key: 'user'): typeof User | undefined };
};

const app = new Application<AppState>({
  proxy: true,
  logErrors: false,
});

const noisyErrors = [
  'Http: connection error: Connection reset by peer',
  'Http: error writing a body to connection: Connection reset by peer',
  'Http: error writing a body to connection: Broken pipe',
  'Http: connection closed before message completed',
  'TypeError: cannot read headers: request closed',
  'BadResource: Bad resource ID',
];

app.addEventListener('error', (ev) => {
  try {
    const message = ev.error?.toString() ?? '';

    if (noisyErrors.some((noise) => message.startsWith(noise))) {
      return;
    }

    logger.error(ev.error);
  } catch (err) {
    console.error('This should not happen!', err, ev?.error);
  }
});

app.use(oakCors());
app.use(async (ctx, next) => {
  const method = ctx.request.method;
  const url = ctx.request.url;
  const ua = ctx.request.headers.get('user-agent')?.replace(/[\n\r]/g, '') ?? '';
  const ip = ctx.request.ip;
  logger.info(`${method} ${url} : ${ip} : ${ua}`);
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());

logger.info(`Server listening at http://${SERVER_HOST}:${SERVER_PORT}`);

await app.listen({
  hostname: SERVER_HOST,
  port: SERVER_PORT,
  secure: false,
});
