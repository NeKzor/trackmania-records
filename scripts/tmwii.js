require('dotenv').config();
const db = require('./db');
const path = require('path');
const fetch = require('node-fetch');
const { delay, importJson, log } = require('./utils');
const { Campaign, Track, Record } = require('./models/tmwii');

const config = { headers: { 'User-Agent': 'trackmania-records-v1' } };

const tmwii = '369p3m31';
const baseApi = 'https://www.speedrun.com/api/v1';

let userCache = {};

const resolveUser = async (id) => {
    if (!id) {
        return null;
    }

    const name = userCache[id];
    if (name) {
        return name;
    }

    const res = await fetch(`${baseApi}/users/${id}`, config);

    const {
        names: { international },
        location,
    } = (await res.json()).data;

    const user = {
        id,
        name: international,
        country: location?.country?.code ?? null,
    };

    userCache[id] = user;
    return user;
};

const update = async () => {
    const { categories, levels } = importJson(path.join(__dirname, '/../games/tmwii.json'));

    for (const category of categories) {
        const campaign = {
            id: category.id,
            name: category.name,
        };

        await Campaign.findOneAndUpdate({ id: category.id }, campaign, { upsert: true });

        const puzzleOrPlatform = category.name === 'Puzzle' || category.name === 'Platform';

        for (const level of levels) {
            if (puzzleOrPlatform && level.name.startsWith('F')) {
                break;
            }

            const track = {
                id: level.id,
                campaign_id: campaign.id,
                name: level.name,
            };

            await Track.findOneAndUpdate({ id: level.id }, track, { upsert: true });

            const url = `${baseApi}/leaderboards/${tmwii}/level/${level.id}/${category.id}`;
            let res = await fetch(url, config);
            log.info('[GET] ' + url + ' : ' + res.status);

            if (!res.ok) {
                log.info('retry in 10 seconds...');
                await delay(10000);

                res = await fetch(url, config);
                log.info('[GET] ' + url + ' : ' + res.status);
    
                if (!res.ok) {
                    log.warn('fetch failed');
                    await delay(500);
                    continue;
                }
            }

            const leaderboard = (await res.json()).data;

            for (const { place, run } of leaderboard.runs) {
                if (place !== 1) {
                    break;
                }

                const record = await Record.findOne({ id: run.id });
                if (record) {
                    continue;
                }

                const user = await resolveUser(run.players.at(0)?.id);

                await Record.create({
                    id: run.id,
                    campaign_id: campaign.id,
                    track_id: track.id,
                    user,
                    score: Math.round(run.times.primary_t * 1000),
                    date: run.status['verify-date'],
                    media: run.videos.links.at(0)?.uri ?? '',
                });
            }

            await delay(50);
        }
    }
};

const main = async () => {
    try { 
        await update();
    } catch (err) {
        throw err;
    } finally {
        userCache = {};
    }
};

if (process.argv.some((arg) => arg === '--test')) {
    db.on('open', async () => {
        await main().catch(console.error);
    });
}

module.exports = main;
