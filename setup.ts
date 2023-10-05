// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { Command } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts';
import { colors } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts';
import { Select } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts';

type Environment = 'dev' | 'prod';

// Used for template file in docker/compose, for the public URI in .env files and for generating SSL certs.
const devHostname = 'tmr.api.local';

// Used to download files for prod setup.
const repositoryUrl = 'https://raw.githubusercontent.com/NeKzor/trackmania-records/master/';

let volumeFolder = '';
let publicUri = '';

/** String as volume folder. */
const v = (strings: TemplateStringsArray, ...values: string[]) =>
  volumeFolder + strings.reduce((acc, val, idx) => acc + val + (values[idx] ?? ''), '');

const cli = new Command()
  .name('trackmania-records-setup')
  .version('1.0.0')
  .description('Command line setup tool for the trackmania-records project.')
  .option('-p, --prod', 'Run setup for the production system.')
  .option('-s, --sync', 'Sync latest files for the production system.');

const main = async () => {
  const { options: { prod, sync } } = await cli.parse(Deno.args);

  if (sync && !prod) {
    console.error(
      colors.bold('[-]'),
      `Syncing files is not allowed. Did you mean to run this for a production system? Try: --prod --sync`,
    );
    Deno.exit(1);
  }

  const env: Environment = prod ? 'prod' : 'dev';

  volumeFolder = prod ? '' : 'docker/volumes/';

  if (!sync) {
    await createDockerComposeFile(env);
    await createConfigAndEnv(env);
    await createEntryPointFiles(env);
    await createDirectories();
  }

  if (prod) {
    await downloadRemoteFiles();
    await downloadStorageFiles();
  } else {
    await createSslCerts();
  }

  console.log(colors.bold('[+]'), colors.green(`Done`));
};

const tryStat = async (file: string) => {
  try {
    return await Deno.stat(file);
  } catch {
    return null;
  }
};

const tryCopy = async (source: string, destination: string) => {
  try {
    const stat = await tryStat(destination);
    if (stat) {
      return;
    }

    await Deno.copyFile(source, destination);
  } catch (err) {
    console.log(colors.bold('[-]'), colors.red(`Failed to copy "${source}" to "${destination}"`));
    console.error(err);
  }
};

const tryMkdir = async (path: string) => {
  try {
    const stat = await tryStat(path);
    if (stat) {
      return;
    }

    await Deno.mkdir(path, { recursive: true });
  } catch (err) {
    console.log(colors.bold('[-]'), colors.red(`Failed to create directory "${path}"`));
    console.error(err);
  }
};

const setEnv = (env: string[], key: string, value: string) => {
  key += '=';
  const index = env.findIndex((line) => line.startsWith(key));
  if (index !== -1) {
    env[index] = key + value;
  }
};

const downloadFromRepository = async (remote: string, local: string, skipIfExists?: boolean) => {
  if (skipIfExists) {
    const stat = await tryStat(local);
    if (stat) {
      return;
    }
  }

  const url = repositoryUrl + remote;

  const res = await fetch(url, {
    headers: {
      'User-Agent': cli.getName(),
    },
  });

  console.log(colors.bold(`[${res.ok ? '+' : '-'}]`), `GET ${url} : ${res.status}`);

  if (!res.ok || !res.body) {
    console.log(colors.bold('[-]'), `Unable to download file from repository: ${res.statusText}`);
    Deno.exit(1);
  }

  try {
    await Deno.remove(local);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.error(colors.bold('[-]'), `Unable to delete file: ${local}`);
      console.error(err);
      Deno.exit(1);
    }
  }

  try {
    const file = await Deno.open(local, { create: true, write: true, truncate: true });
    await res.body.pipeTo(file.writable);
    console.log(colors.bold('[+]'), `    File written to ${local}`);
  } catch (err) {
    console.error(err);
    Deno.exit(1);
  }
};

/**
 * Gets a docker-compose file from the "docker/compose/" folder.
 */
const createDockerComposeFile = async (env: Environment) => {
  if (env === 'prod') {
    const template = await Select.prompt({
      message: 'Choose a docker-compose template:',
      options: [
        {
          name: 'tmr.api.nekz.me.yml',
          value: 'docker/compose/tmr.api.nekz.me.yml',
        },
      ],
    });

    await downloadFromRepository(template, `docker-compose.yml`, true);

    //publicUri = `https://${template.split('/').at(-1)!.slice(0, -4)}`;
    publicUri = `https://trackmania.nekz.me`;
  } else {
    await tryCopy(`docker/compose/${devHostname}.yml`, 'docker-compose.yml');

    //publicUri = `https://${devHostname}`;
    publicUri = `https://localhost:3000`;
  }
};

const downloadRemoteFiles = async () => {
   await downloadFromRepository('docker/volumes/initdb/_create.js', 'initdb/_create.js');
   await downloadFromRepository('docker/volumes/initdb/_init.js', 'initdb/_init.js');
   await downloadFromRepository('docker/volumes/initdb/_populate.js', 'initdb/_populate.js');
  await downloadFromRepository('deno.json', 'deno.json');
  await downloadFromRepository('deno.lock', 'deno.lock');
};

/**
 * Storage files:
 *    security.txt          -> Security policy, see https://www.rfc-editor.org/rfc/rfc9116
 */
const downloadStorageFiles = async () => {
  const remoteStorageFiles = 'docker/volumes/storage/files/';
  await downloadFromRepository(`${remoteStorageFiles}security.txt`, 'storage/files/security.txt');
};

/**
 * Configuration files:
 *    .env        -> used by docker
 *    .env.server -> used by the server (mounted by docker)
 */
const createConfigAndEnv = async (env: Environment) => {
  if (env === 'prod') {
    await downloadFromRepository('.env.example', '.env', true);
    await downloadFromRepository('src/server/.env.example', v`.env.server`, true);
  } else {
    await tryCopy('.env.example', '.env');
    await tryCopy('src/server/.env.example', v`.env.server`);
  }

  const serverEnv = (await Deno.readTextFile(v`.env.server`)).split('\n');

  const cookieSecretKey = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))));
  setEnv(serverEnv, 'COOKIE_SECRET_KEY', cookieSecretKey);

  setEnv(serverEnv, 'TMR_PUBLIC_URI', publicUri);

  await Deno.writeTextFile(v`.env.server`, serverEnv.join('\n'));

  console.log(colors.bold('[+]'), `Created .env files`);
};

/**
 * Entrypoint files for Docker:
 *    entrypoint.server.sh -> Script when starting the server
 */
const createEntryPointFiles = async (env: Environment) => {
  const serverEntryPoint = v`entrypoint.server.sh`;

  if (!await tryStat(serverEntryPoint)) {
    await Deno.writeTextFile(serverEntryPoint, `deno task ${env}\n`);
    await Deno.chmod(serverEntryPoint, 0o755);
  }
};

/**
 * Mounted directories:
 *    backups     -> Folder for database dumps
 *    initdb      -> Initialization scripts for the database
 *    mongo       -> Server database
 *    logs        -> Server logs
 *    storage     -> Server file storage
 */
const createDirectories = async () => {
  await tryMkdir(v`backups`);
  await tryMkdir(v`initdb`);
  await tryMkdir(v`mongo`);
  await tryMkdir(v`logs/server`);
  await tryMkdir(v`storage/replays`);
  await tryMkdir(v`storage/files`);

  console.log(colors.bold('[+]'), `Created directories`);
};

/**
 * Self-signed certificate for development only.
 */
const createSslCerts = async () => {
  const stat = await tryStat(v`ssl/${devHostname}.crt`);
  if (stat) {
    console.log(colors.bold('[+]'), colors.white(`Skipped self-signed certificate`));
    return;
  }

  await tryMkdir(v`ssl`);

  const mkcert = new Deno.Command('mkcert', {
    args: [
      `-cert-file`,
      v`ssl/${devHostname}.crt`,
      `-key-file`,
      v`ssl/${devHostname}.key`,
      devHostname,
    ],
  });

  try {
    const process = mkcert.spawn();
    const { code } = await process.output();

    if (code === 0) {
      console.log(colors.bold('[+]'), colors.white(`Created self-signed certificate`));
    } else {
      console.log(colors.bold('[-]'), colors.red(`Failed to create self-signed certificate`));
    }
  } catch (err) {
    console.error(err);
    if (err instanceof Deno.errors.NotFound) {
      console.log(
        colors.bold('[-]'),
        colors.red(`mkcert does not seem to be installed. Failed to generate ssl certificates`),
      );
    }
  }
};

await main();
