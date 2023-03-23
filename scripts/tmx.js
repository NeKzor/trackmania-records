require('dotenv').config();
const db = require('./db');
const path = require('path');
const moment = require('moment');
const fetch = require('node-fetch');
const { importJson, log } = require('./utils');
const models = require('./models/tmx');

const tmx = ['tmnforever', 'united', 'nations', 'sunrise', 'original'];

const apis = {
    tmnforever: 'tmnf.exchange',
    united: 'tmuf.exchange',
};

const config = { headers: { 'User-Agent': 'trackmania-records-v2' } };

const byDate = (a, b) => a.ReplayAt.localeCompare(b.ReplayAt);

const update = async (gameName) => {
    if (!tmx.find((x) => x === gameName)) {
        throw new Error('Invalid game name.');
    }

    const { Campaign, Track, Record } = models[gameName];

    const apiRoute = (route, trackid) => {
        const domain = apis[gameName] ?? `${gameName}.tm-exchange.com`;
        const garbage = `&fields=ReplayId%2CUser.UserId%2CUser.Name%2CReplayTime%2CReplayScore%2CReplayRespawns%2C` +
            `TrackAt%2CValidated%2CReplayAt%2CScore`;
        return `https://${domain}${route}?trackid=${trackid}&count=1000${garbage}`;
    };

    const gameCampaign = importJson(path.join(__dirname, '/../games/', `${gameName}.json`));

    for (const { name: campaignName, tracks } of gameCampaign) {
        const campaign = {
            name: campaignName,
        };

        await Campaign.findOneAndUpdate({ name: campaignName }, campaign, { upsert: true });

        for (const { id, name, type } of tracks) {
            const track = {
                id,
                campaign_name: campaign.name,
                name,
                type,
            };

            await Track.findOneAndUpdate({ id }, track, { upsert: true });

            const url = apiRoute('/api/replays', id);
            const res = await fetch(url, config);

            log.info(`[GET] ${url} : ${res.status} (${name})`);

            const json = await res.json();
            const records = json.Results.sort(byDate);

            let wr = undefined;

            const isStuntsMode = type === 'Stunts';
            const isWorldRecord = isStuntsMode ? (score, wr) => score >= wr : (score, wr) => score <= wr;

            for (const record of records) {
                const score = isStuntsMode ? record.ReplayScore : record.ReplayTime;

                if (wr === undefined || isWorldRecord(score, wr)) {
                    wr = score;

                    const entry = await Record.findOne({ id: record.ReplayId });
                    if (entry) {
                        continue;
                    }

                    await Record.create({
                        id: record.ReplayId,
                        campaign_name: campaign.name,
                        track_id: track.id,
                        user: {
                            id: record.User.UserId,
                            name: record.User.Name,
                        },
                        score,
                        date: moment(record.ReplayAt, 'YYYY-MM-DDTHH:mm:ss').toISOString(),
                        replay: record.ReplayId,
                        validated: record.Validated,
                        duration: 0,
                        delta: 0,
                    });
                }
            }

            // TODO: rewrite
            // wrs.forEach((wr, idx, items) => {
            //     const prev = items[idx - 1];
            //     const next = wrs.slice(idx + 1).find((nextWr) => nextWr.score < wr.score);
            //     wr.duration = moment(next ? next.date : undefined).diff(moment(wr.date), 'd');
            //     wr.delta = Math.abs(prev ? prev.score - wr.score : 0);
            // });
        }
    }
};

// TODO: rewrite
const generateRankings = (tracks) => {
    const mapWrs = tracks
        .map((track) => {
            const isStuntTrack = track.type === 'Stunts';

            const beatenByWr = isStuntTrack
                ? (wr) => (item) => item.score > wr.score
                : (wr) => (item) => item.score < wr.score;

            return track.history.map((wr) => {
                const beatenBy = track.history.find(beatenByWr(wr));

                return {
                    ...wr,
                    id: wr.replay,
                    track: {
                        ...track,
                        wrs: undefined,
                        history: undefined,
                    },
                    beatenBy: beatenBy
                        ? [
                              {
                                  id: beatenBy.replay,
                                  date: beatenBy.date,
                                  user: { ...beatenBy.user },
                                  score: beatenBy.score,
                              },
                          ]
                        : [],
                };
            });
        })
        .flat();

    const getNextWr = (wr) => {
        if (
            wr.beatenBy.length > 0 &&
            !wr.beatenBy.some(({ id }) => id === wr.id) &&
            wr.beatenBy.some(({ user }) => user.id === wr.user.id)
        ) {
            const ids = wr.beatenBy.map(({ id }) => id);
            const newWrs = mapWrs.filter((wr) => ids.some((id) => wr.id === id));
            const newWr = newWrs.find(({ user }) => user.id === wr.user.id);

            if (newWr) {
                return getNextWr(newWr);
            }
        }

        return wr;
    };

    const createLeaderboard = (key) => {
        const calculateExactDuration = key === 'history';

        const wrs = tracks.map((t) => (t[key].length > 0 ? t[key] : t.wrs)).flat();

        const users = tracks
            .map((t) => (t[key].length > 0 ? t[key] : t.wrs).map(({ user, date }) => ({ ...user, date })))
            .flat();

        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => {
                const user = users
                    .filter((u) => u.id.toString() === key)
                    .sort((a, b) => b.date.localeCompare(a.date))[0];
                delete user.date;

                const durationExact = mapWrs
                    .filter((r) => r.user.id.toString() === key && r.duration)
                    .map((r) => {
                        if (!calculateExactDuration) {
                            return r.duration;
                        }

                        const reignWr = getNextWr(r);
                        const [beatenBy] = reignWr.beatenBy;
                        return moment(beatenBy ? beatenBy.date : undefined).diff(moment(r.date), 'd');
                    })
                    .reduce((a, b) => a + b, 0);

                return {
                    user,
                    wrs: frequency[key],
                    duration: durationExact,
                };
            });
    };

    const leaderboard = createLeaderboard('wrs');
    const historyLeaderboard = createLeaderboard('history');

    const users = tracks
        .map((t) => {
            const all = (t.history.length > 0 ? t.history : t.wrs).map(({ user, date }) => ({ ...user, date }));
            const ids = [...new Set(all.map((user) => user.id))];
            return ids.map((id) => all.find((user) => user.id === id));
        })
        .flat();
    const frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const uniqueLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => {
            const user = users.filter((u) => u.id.toString() === key).sort((a, b) => b.date.localeCompare(a.date))[0];
            delete user.date;
            return {
                user,
                wrs: frequency[key],
            };
        });

    return {
        leaderboard,
        historyLeaderboard,
        uniqueLeaderboard,
    };
};

// TODO: rewrite
const generateStats = (tracks) => {
    const mapWrs = tracks
        .map((track) => {
            const isStuntTrack = track.type === 'Stunts';

            const beatenByWr = isStuntTrack
                ? (wr) => (item) => item.score > wr.score
                : (wr) => (item) => item.score < wr.score;

            return track.history.map((wr) => {
                const beatenBy = track.history.find(beatenByWr(wr));

                return {
                    ...wr,
                    id: wr.replay,
                    track: {
                        ...track,
                        wrs: undefined,
                        history: undefined,
                    },
                    beatenBy: beatenBy
                        ? [
                              {
                                  id: beatenBy.replay,
                                  date: beatenBy.date,
                                  user: { ...beatenBy.user },
                                  score: beatenBy.score,
                              },
                          ]
                        : [],
                };
            });
        })
        .flat();

    const getNextWr = (wr) => {
        if (
            wr.beatenBy.length > 0 &&
            !wr.beatenBy.some(({ id }) => id === wr.id) &&
            wr.beatenBy.some(({ user }) => user.id === wr.user.id)
        ) {
            const ids = wr.beatenBy.map(({ id }) => id);
            const newWrs = mapWrs.filter((wr) => ids.some((id) => wr.id === id));
            const newWr = newWrs.find(({ user }) => user.id === wr.user.id);

            if (newWr) {
                newWrs.forEach((newWr) => (newWr.excludeReign = true));
                return getNextWr(newWr);
            }
        }

        return wr;
    };

    const maxRows = 100;
    const byTrackType = (trackType) => ({ track }) => track.type === trackType;

    const largestImprovement = [...mapWrs.sort((a, b) => (a.delta === b.delta ? 0 : a.delta < b.delta ? 1 : -1))];
    const longestLasting = [
        ...mapWrs.sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1)),
    ];
    const longestDomination = mapWrs
        .map((wr) => {
            wr.reign = {
                lastWr: {
                    ...getNextWr(wr),
                },
            };

            return wr;
        })
        .map((wr) => {
            const reignWr =
                !wr.excludeReign && wr.reign.lastWr
                    ? {
                          ...wr,
                          beatenBy: wr.reign.lastWr.beatenBy,
                          lastScore: wr.reign.lastWr.score,
                          excludeReign: undefined,
                          reign: undefined,
                      }
                    : null;

            if (reignWr) {
                const [beatenBy] = reignWr.beatenBy;
                reignWr.duration = moment(beatenBy ? beatenBy.date : undefined).diff(moment(reignWr.date), 'd');
            }

            delete wr.reign;
            delete wr.excludeReign;

            return reignWr;
        })
        .filter((wr) => wr)
        .sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1));

    return {
        largestImprovement: [
            ...largestImprovement.filter(byTrackType('Race')).slice(0, maxRows),
            ...largestImprovement.filter(byTrackType('Stunts')).slice(0, maxRows),
        ],
        longestLasting: [
            ...longestLasting.filter(byTrackType('Race')).slice(0, maxRows),
            ...longestLasting.filter(byTrackType('Stunts')).slice(0, maxRows),
        ],
        longestDomination: [
            ...longestDomination.filter(byTrackType('Race')).slice(0, maxRows),
            ...longestDomination.filter(byTrackType('Stunts')).slice(0, maxRows),
        ],
    };
};

const main = async () => {
    for (const game of tmx) {
        await update(game).catch((error) => log.error(error.message, error.stack));
    }
};

if (process.argv.some((arg) => arg === '--test')) {
    db.on('open', async () => {
        await main();
    });
}

module.exports = main;
