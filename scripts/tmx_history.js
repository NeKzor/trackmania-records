const { JSDOM } = require('jsdom');
const moment = require('moment');
const fetch = require('node-fetch');
const { delay, importJson, log, tryExportJson, tryMakeDir } = require('./utils');

const tmx = ['tmnforever', 'united', 'nations', 'sunrise', 'original'];

const config = { headers: { 'User-Agent': 'trackmania-records-v1' } };

const tryParseJson = (text) => {
    try {
        return JSON.parse(text);
    } catch (err) {
        log.warn(err);
        console.log(text);
    }

    return [];
};

module.exports = async (gameArgs, output, maxFetch = undefined) => {
    const [gameName, supportsReplayHistory] = gameArgs;

    if (!tmx.find((x) => x === gameName)) {
        throw new Error('Invalid game name.');
    }

    const day = moment().format('YYYY-MM-DD');

    const apiRoute = (action, id) => `http://${gameName}.tm-exchange.com/apiget.aspx?action=${action}&id=${id}`;

    const game = [];
    for (const campaign of importJson(__dirname + '/../games/' + gameName + '.json')) {
        const tracks = [];

        let count = 0;
        for (const { id, name, type } of campaign.tracks) {
            const url = apiRoute('trackreplayshow', id);
            const res = await fetch(url, config);

            //const text = require('fs').readFileSync('yes.html', 'utf-8');
            //require('fs').writeFileSync('yes.html', await res.text(), { encoding: 'utf-8' });

            log.info(`${url} : ${res.status} (${name})`);

            const text = await res.text();

            const document = (new JSDOM(text)).window.document;
            const input = document.querySelector('#ctl00_ReplayData') || document.querySelector('#_ctl0_ReplayData');

            if (!input) {
                log.warn('input element not found');
                continue;
            }

            const byDate = (a, b) => a.ReplayAt.localeCompare(b.ReplayAt);
            const inputValue = input.getAttribute('value');
            const records = tryParseJson(inputValue).sort(byDate);

            const wrs = [];
            let wr = undefined;

            for (const record of records) {
                const score = record.ReplayTime;
                if (wr === undefined || score <= wr) {
                    wrs.push({
                        user: {
                            id: record.UserId,
                            name: record.LoginId,
                        },
                        score: (wr = score),
                        date: record.ReplayAt,
                        replay: record.ReplayId,
                    });
                }
            }

            wrs.forEach((wr, idx, items) => {
                const prev = items[idx - 1];
                const next = items[idx + 1];
                wr.duration = moment(next ? next.date : undefined).diff(moment(wr.date), 'd');
                wr.delta = Math.abs(prev ? prev.score - wr.score : 0);
            });

            tracks.push({
                id,
                name,
                type,
                wrs: wrs.filter(x => x.score === wr),
                history: wrs,
            });

            if (maxFetch !== undefined && count === maxFetch) break;

            //await delay(1000);
        }

        const totalTime = tracks
            .filter((t) => t.type !== 'Stunts')
            .map((t) => t.wrs[0] ? t.wrs[0].score : 0)
            .reduce((a, b) => a + b, 0);
        const totalPoints = tracks
            .filter((t) => t.type === 'Stunts')
            .map((t) => t.wrs[0] ? t.wrs[0].score : 0)
            .reduce((a, b) => a + b, 0);

        const users = tracks.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
        const wrs = tracks.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        const leaderboard = Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => ({
                user: users.find((u) => u.id.toString() === key),
                wrs: frequency[key],
                duration: wrs
                    .filter((r) => r.user.id.toString() === key)
                    .map((r) => r.duration)
                    .reduce((a, b) => a + b, 0),
            }));

        game.push({
            name: campaign.name,
            tracks,
            stats: {
                totalTime,
                totalPoints,
            },
            leaderboard,
        });
    }

    tryMakeDir(output);
    tryMakeDir(`${output}/${gameName}`);

    const ranks = ({ name, leaderboard, tracks }) => ({ name, leaderboard, ...generateRankings(tracks) });
    const stats = ({ name, tracks }) => ({ name, ...generateStats(tracks) });

    tryExportJson(`${output}/${gameName}/latest.json`, game, true, true);
    tryExportJson(`${output}/${gameName}/ranks.json`, game.map(ranks), true, true);
    tryExportJson(`${output}/${gameName}/stats.json`, game.map(stats), true, true);
};

const generateRankings = (tracks) => {
    const createLeaderboard = (key) => {
        const wrs = tracks.map((t) => (t[key].length > 0 ? t[key] : t.wrs)).flat();
        const users = tracks
            .map((t) =>
                (t[key].length > 0 ? t[key] : t.wrs).map(({ user, date }) => ({ ...user, date })),
            )
            .flat();

        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => {
                const user = users.filter((u) => u.id.toString() === key).sort((a, b) => b.date.localeCompare(a.date))[0];
                delete user.date;

                return {
                    user,
                    wrs: frequency[key],
                    duration: wrs
                        .filter((r) => r.user.id.toString() === key && r.duration)
                        .map((r) => r.duration)
                        .reduce((a, b) => a + b, 0),
                };
            });
    };

    const leaderboard = createLeaderboard('wrs');
    const historyLeaderboard = createLeaderboard('history');

    const users = tracks
        .map((t) => {
            const all = (t.history.length > 0 ? t.history : t.wrs)
                .map(({ user, date }) => ({ ...user, date }));
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

const generateStats = (tracks) => {
    const mapWrs = tracks
        .map((track) => {
            track.history.forEach((wr) => {
                const beatenBy = track.history.find((item) => item.score < wr.score);
                wr.track = {
                    ...track,
                    wrs: undefined,
                    history: undefined,
                };
                wr.beatenBy = beatenBy ? [{ date: beatenBy.date, user: { ...beatenBy.user } }] : [];
            });

            return track.history;
        })
        .flat();

    const getNextDuration = (wr) => {
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
                const [nextDuration, lastWr] = getNextDuration(newWr);
                return [wr.duration + nextDuration, lastWr];
            }
        }

        return [wr.duration, wr];
    };

    const regignDuration = (wr) => {
        const [duration, lastWr] = getNextDuration(wr);

        wr.reign = {
            duration,
            lastWr: {
                ...lastWr,
            },
        };

        return wr;
    };

    const maxRows = 100;

    const largestImprovement = mapWrs
        .sort((a, b) => (a.delta === b.delta ? 0 : a.delta < b.delta ? 1 : -1))
        .slice(0, maxRows);
    const longestLasting = mapWrs
        .sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1))
        .slice(0, maxRows);
    const longestDomination = mapWrs
        .map(regignDuration)
        .map((wr) => {
            reignWr =
                !wr.excludeReign && wr.reign.lastWr
                    ? {
                          ...wr,
                          duration: wr.reign.duration,
                          beatenBy: wr.reign.lastWr.beatenBy,
                          lastScore: wr.reign.lastWr.score,
                          excludeReign: undefined,
                          reign: undefined,
                      }
                    : null;

            delete wr.reign;
            delete wr.excludeReign;

            return reignWr;
        })
        .filter((wr) => wr)
        .sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1))
        .slice(0, maxRows);

    return { largestImprovement, longestLasting, longestDomination };
};


module.exports(['united'], require('path').join(__dirname, '/../api/'));
