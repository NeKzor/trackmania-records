const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Audiences, Zones } = require('./trackmania/api');
const { delay, log, importJson, tryMakeDir, tryExportJson } = require('./utils');

const main = async (trackmania, zones) => {
    log.info('dumping competitions');

    /* required for competitions */
    await trackmania.loginNadeo(Audiences.NadeoClubServices);

    const fetchCompetitionData = async (competition, isA08Forever) => {
        const rounds = (await trackmania.competitionsRounds(competition.id)).collect();
        if (!rounds.length) {
            log.info('no rounds');
            return null;
        }

        const [roundId, qualifierId] = (() => {
            const firstRound = rounds[0];
            const lastRound = rounds[rounds.length - 1];

            return isA08Forever
                ? [
                    lastRound.id,
                    firstRound.qualifier_challenge_id,
                ] : [
                    firstRound.id,
                    firstRound.qualifier_challenge_id,
                ];
        })();

        //const challenges = await trackmania.challenges(qualifierId);

        const qualifier = await (async () => {
            if (qualifierId) {
                log.info('qualifier id', qualifierId);

                const qualifier = await trackmania.challengesLeaderboard(qualifierId);

                const [qualifierWinner, qualifierSecond] = qualifier.data.results;
                if (!qualifierWinner) {
                    return null;
                }

                const [player] = await trackmania.accounts([qualifierWinner.player]);

                player.score = qualifierWinner.score;
                player.delta = qualifierSecond.score - qualifierWinner.score;
                player.zone = qualifierWinner.zone;

                return  {
                    id: qualifierId,
                    winner: player,
                };
            }

            log.info('no qualifier');
            return null;
        })();

        const match = await (async () => {
            const [round] = (await trackmania.rounds(roundId)).collect();

            if (!round) {
                return null;
            }

            const match = await trackmania.matches(round.id);
            const [winner] = match.data.results;

            if (!winner) {
                return null;
            }

            const [participant] = await trackmania.accounts([winner.participant]);
            participant.zone = winner.zone;

            return {
                id: round.id,
                name: round.name,
                winner: participant,
            };
        })();

        return {
            id: competition.id,
            name: competition.name,
            nb_players: competition.nb_players,
            start_date: competition.start_date,
            end_date: competition.end_date,
            round: {
                qualifier,
                match,
            },
        };
    };

    const competitions = await fetchCompetitions(trackmania);

    const dumpCompetition = async (isA08Forever) => {
        const compName = isA08Forever ? 'a08forever' : 'cotd';

        const latestComp = isA08Forever ? 'A08 forever' : `Cup of the Day ${moment().format('YYYY-MM-DD')} #1`;
        const competitionsToDump = competitions.filter((comp) => comp.name.startsWith(latestComp)).slice(0, 1);

        for (const compCompetition of competitionsToDump) {
            const updatedComp = await trackmania.competitions(compCompetition.id);
            compCompetition.nb_players = updatedComp.data.nb_players;

            const comp = await fetchCompetitionData(compCompetition, isA08Forever);

            if (comp) {
                const compFolder = path.join(__dirname, '/../api/trackmania/competitions/' + compName);
                tryMakeDir(compFolder);
    
                const start = moment.unix(comp.start_date);
                comp.monthDay = parseInt(start.format('D'), 10);
    
                const filename = path.join(compFolder, '/' + start.format(isA08Forever ? 'YYYY' : 'MMMM-YYYY').toLowerCase() + '.json');
    
                try {
                    const data = importJson(filename);
                    data.push(comp);
                    tryExportJson(filename, data, true);
                } catch {
                    tryExportJson(filename, [comp]);
                }
            }
        }

        const rankings = getCompdRankings(isA08Forever, zones);
        const rankingsFile = path.join(__dirname, `/../api/trackmania/rankings/${compName}.json`);

        tryExportJson(rankingsFile, rankings, true, true);
    };

    /* run this at around 8:15 PM UST */
    await dumpCompetition(false);
    await dumpCompetition(true);
};

const getCompdRankings = (isA08Forever,  zones) => {
    const compName = isA08Forever ? 'a08forever' : 'cotd';

    const compFolder = path.join(__dirname, `/../api/trackmania/competitions/${compName}`);
    const totdFolder = path.join(__dirname, '/../api/trackmania/totd');

    const comp = [];
    const hattricks = [];

    for (const importFile of fs.readdirSync(compFolder)) {
        const compData = importJson(path.join(compFolder, '/' + importFile));
        comp.push(...compData);
        
        if (isA08Forever) {
            continue;
        }

        const totdData = importJson(path.join(totdFolder, '/' + importFile));

        hattricks.push(...compData.filter((y) => {
            if (!y.round.qualifier || !y.round.match) {
                return false;
            }

            const track = totdData.tracks.find(x => x.monthDay === y.monthDay);
            if (!track) {
                return false;
            }

            const wrIds = track.wrs.map(x => x.user.id);

            return y.round.qualifier.winner.accountId === y.round.match.winner.accountId
                && wrIds.find(x => x === y.round.match.winner.accountId);
        }));
    }

    const qualifierWinners = comp
        .map((t) => t.round.qualifier ? { ...t.round.qualifier.winner, score: undefined, delta: undefined } : null)
        .filter(x => !!x)
        .map((x) => {
            x.zone = zones.searchByNamePath(x.zone);
            return x;
        });

    const winners = comp
        .map((t) => t.round.match ? t.round.match.winner : null)
        .filter(x => !!x)
        .map((x) => {
            x.zone = zones.searchByNamePath(x.zone);
            return x;
        });

    const frequencyQualifiers = qualifierWinners.reduce((count, user) => {
        count[user.accountId] = (count[user.accountId] || 0) + 1;
        return count;
    }, {});

    const frequencyWinners = winners.reduce((count, user) => {
        count[user.accountId] = (count[user.accountId] || 0) + 1;
        return count;
    }, {});

    const [leaderboardQualifiers, leaderboard] = [
        Object.keys(frequencyQualifiers)
            .sort((a, b) => frequencyQualifiers[b] - frequencyQualifiers[a])
            .map((key) => {
                const user = qualifierWinners
                    .find((u) => u.accountId === key);

                return {
                    user,
                    wins: {
                        qualifiers: frequencyQualifiers[key],
                        matches: 0,
                        hattricks: 0,
                    },
                };
            }),
        Object.keys(frequencyWinners)
            .sort((a, b) => frequencyWinners[b] - frequencyWinners[a])
            .map((key) => {
                const user = winners
                    .find((u) => u.accountId === key);

                return {
                    user,
                    wins: {
                        qualifiers: 0,
                        matches: frequencyWinners[key],
                        hattricks: 0,
                    },
                };
            })
    ];

    for (const entry of leaderboard) {
        const qualifierEntry = leaderboardQualifiers.find((qualEntry) => qualEntry.user.accountId === entry.user.accountId);
        if (qualifierEntry) {
            entry.wins.qualifiers = qualifierEntry.wins.qualifiers;
            entry.wins.hattricks = hattricks.filter((comp) => comp.round.match.winner.accountId === entry.user.accountId).length;
        }
    }

    for (const entry of leaderboardQualifiers) {
        const matchEntry = leaderboard.find((matchEntry) => matchEntry.user.accountId === entry.user.accountId);
        if (!matchEntry) {
            leaderboard.push(entry);
        }
    }

    const byWins = (a, b) => {
        const v1 = a.wins.matches;
        const v2 = b.wins.matches;

        if (v1 === v2) {
            const vv1 = a.wins.qualifiers;
            const vv2 = b.wins.qualifiers;

            if (vv1 === vv2) {
                const vvv1 = a.wins.hattricks;
                const vvv2 = b.wins.hattricks;

                return vvv1 === vvv2 ? 0 : vvv1 < vvv2 ? 1 : -1;
            }

            return vv1 < vv2 ? 1 : -1;
        }

        return v1 < v2 ? 1 : -1;
    };

    const countryLeaderboard = [
            ...new Set(
                leaderboard.map(
                    ({ user }) => (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId,
                ),
            ),
        ]
            .map((zoneId) => ({
                zone: zones.search(zoneId).slice(0, 3),
                wins: leaderboard
                    .filter(
                        ({ user }) =>
                            (user.zone[Zones.Country] ? user.zone[Zones.Country] : user.zone[Zones.World]).zoneId ===
                            zoneId,
                    )
                    .reduce((a, b) => {
                        a.qualifiers += b.wins.qualifiers;
                        a.matches += b.wins.matches;
                        a.hattricks += b.wins.hattricks;
                        return a;
                    }, { qualifiers: 0, matches: 0, hattricks: 0 }),
            }));

    return {
        leaderboard: leaderboard.sort(byWins),
        countryLeaderboard: countryLeaderboard.sort(byWins),
    };
};

const fetchCompetitions = async (trackmania) => {
    const competitionsFile = path.join(__dirname, '/../competitions.json');

    const competitions = importJson(competitionsFile);
    const lastCompetition = competitions[competitions.length - 1];

    if (lastCompetition) {
        let index = 1;

        while (index <= 50) {
            try {
                const competition = await trackmania.competitions(lastCompetition.id + index);
                const data = competition.data;

                log.info('new competition:', data.name);
                competitions.push(data);

                await delay(100);
            } catch (error) {
                log.info(error);
                break;
            }
            ++index;
        }
    }

    tryExportJson(competitionsFile, competitions, true);

    return competitions.reverse();
};

module.exports = main;
