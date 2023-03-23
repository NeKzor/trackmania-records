require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences } = require('./trackmania/api');
const { delay, log } = require('./utils');
const { Competition, CompetitionResult, Record, Stat } = require('./trackmania/models');

const migrate = process.argv.some((arg) => arg === '--migrate');

const CompetitionTypes = {
    A08Forever: 'a08forever',
    CupOfTheDay: 'cotd',
    SuperRoyal: 'superroyal',
    Unknown: 'unknown',
};

const CompetitionTimeslot = {
    Any: 0,
    First: 1,
    Second: 2,
    Third: 3,
};

const CompetitionCreators = {
    A08Forever: '54e4dda4-522d-496f-8a8b-fe0d0b5a2a8f',
    CupOfTheDay: 'afe7e1c1-7086-48f7-bde9-a7e320647510',
    SuperRoyal: 'afe7e1c1-7086-48f7-bde9-a7e320647510',
};

const getTimeslotFromName = (name) => {
    if (name.at(-2) !== '#') {
        // COTDs before 2021-07-21 did not have re-runs
        return CompetitionTimeslot.First;
    }

    const timeslot = parseInt(name.slice(-1), 10);
    if (
        timeslot !== CompetitionTimeslot.First &&
        timeslot !== CompetitionTimeslot.Second &&
        timeslot !== CompetitionTimeslot.Third
    ) {
        log.warn(`Unknown timeslot value ${timeslot} for "${name}"`);
        return CompetitionTimeslot.Any;
    }

    return timeslot;
};

const fetchLatestCompetitions = async (trackmania) => {
    const latestCompetition = await Competition.findOne({}).sort({ id: -1 }).select('id');
    if (!latestCompetition) {
        log.warn('Failed to find latest competition. Starting from index 1.');
    }

    let index = 1;
    const competitionsToFetch = [
        CompetitionTypes.A08Forever,
        CompetitionTypes.CupOfTheDay,
        CompetitionTypes.SuperRoyal,
    ];

    const nameMatchesA08Forever = (data) => data.name.startsWith('A08 forever');
    const nameMatchesCOTD = (data) => data.name.startsWith('COTD') || data.name.startsWith('Cup of the Day');
    const nameMatchesSRoyal = (data) => data.name.startsWith('SRoyal') || data.name.startsWith('Super royal');

    const maxFetchCount = 10;
    let retries = 3;

    while (index <= maxFetchCount && retries >= 0) {
        try {
            const { data } = await trackmania.competitions((latestCompetition?.id ?? 0) + index);

            log.info('competition', data.name);

            const type =
                data.creator === CompetitionCreators.A08Forever && nameMatchesA08Forever(data)
                    ? CompetitionTypes.A08Forever
                    : data.creator === CompetitionCreators.CupOfTheDay && nameMatchesCOTD(data)
                    ? CompetitionTypes.CupOfTheDay
                    : data.creator === CompetitionCreators.SuperRoyal && nameMatchesSRoyal(data)
                    ? CompetitionTypes.SuperRoyal
                    : CompetitionTypes.Unknown;

            const startDate = moment.unix(data.startDate);

            const timeslot =
                type === CompetitionTypes.CupOfTheDay || type === CompetitionTypes.SuperRoyal
                    ? getTimeslotFromName(data.name)
                    : CompetitionTimeslot.Any;

            const competition = {
                id: data.id,
                name: data.name,
                timeslot,
                type,
                creator: data.creator,
                nb_players: data.nbPlayers,
                startDate: data.startDate,
                endDate: data.endDate,
                year: startDate.year(),
                month: startDate.month() + 1,
            };

            await Competition.findOneAndUpdate({ id: competition.id }, competition, { upsert: true });
            log.info(`upserted competition ${competition.id}`);

            if (!competitionsToFetch.includes(competition.type)) {
                continue;
            }

            if (migrate) {
                const result = await fetchCompetitionResult(trackmania, competition);
                if (result) {
                    const start = moment.unix(result.start_date);

                    if (!start.isValid()) {
                        log.warn(
                            `ignoring competition result ${competition.id} due to invalid start date: ${result.start_date}`,
                        );
                        continue;
                    }

                    result.year = start.year();
                    result.month = start.month() + 1;
                    result.monthDay = start.date();

                    await CompetitionResult.findOneAndUpdate({ competition_id: result.competition_id }, result, {
                        upsert: true,
                    });
                    log.info(`upserted competition result for ${competition.id}`);
                } else {
                    log.error(`failed to get result for competition ${competition.id}`);
                }
            }

            //await delay(100);
        } catch (error) {
            --retries;

            if (typeof error === 'object' && error.constructor.name === 'Error') {
                log.error(error.message, error.stack);
            } else {
                log.error(error);
            }
        } finally {
            ++index;
        }
    }
};

const updateCompetition = async (trackmania, type) => {
    const competition = await Competition.findOne({ type }).sort({ id: -1 });
    if (!competition) {
        log.error('failed to find latest competition');
        return;
    }

    log.info('updating competition', competition.name);

    const { data } = await trackmania.competitions(competition.id);

    await Competition.updateOne({ competition }, { $set: { nb_players: data.nb_players } });
    log.info(`updated competition ${competition.id}`);

    const result = await fetchCompetitionResult(trackmania, competition);
    if (!result) {
        log.error(`failed to get result for competition ${competition.id}`);
        return;
    }

    const start = moment.unix(result.start_date);
    if (!start.isValid()) {
        log.warn(`ignoring competition result ${competition.id} due to invalid start date: ${result.start_date}`);
        return;
    }

    result.year = start.year();
    result.month = start.month() + 1;
    result.monthDay = start.date();

    await CompetitionResult.findOneAndUpdate({ competition_id: result.competition_id }, result, { upsert: true });
    log.info(`upserted competition result for ${competition.id}`);
};

const fetchCompetitionResult = async (trackmania, competition) => {
    const rounds = (await trackmania.competitionsRounds(competition.id)).collect();
    if (!rounds.length) {
        log.info('no rounds');
        return null;
    }

    const isA08Forever = competition.type === CompetitionTypes.A08Forever;
    const isCupOfTheDay = competition.type === CompetitionTypes.CupOfTheDay;
    const isSuperRoyal = competition.type === CompetitionTypes.SuperRoyal;

    const [roundId, qualifierId] = (() => {
        const firstRound = rounds.at(0);
        const lastRound = rounds.at(-1);

        return isA08Forever
            ? [lastRound.id, firstRound.qualifierChallengeId]
            : [firstRound.id, firstRound.qualifierChallengeId];
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

            return {
                id: qualifierId,
                winner: player,
            };
        }

        if (isCupOfTheDay) {
            log.warn('no qualifier');
        }
        return null;
    })();

    const match = await (async () => {
        const [round] = (await trackmania.rounds(roundId)).collect();

        if (!round) {
            return null;
        }

        const match = await trackmania.matches(round.id);

        if (isSuperRoyal) {
            const winningTeam = match.data.teams.find((team) => team.rank === 1)?.team;
            if (!winningTeam) {
                return null;
            }

            const winners = match.data.results.filter(({ team }) => team === winningTeam);
            if (!winners.length) {
                return null;
            }

            const participants = (await trackmania.accounts(winners.map((winner) => winner.participant))).collect();
            participants.forEach((participant) => {
                const winner = winners.find((winner) => participant.accountId === winner.participant);
                // BUG: Nadeo only provides "World" :(
                participant.zone = winner.zone;
            });

            return {
                id: round.id,
                name: round.name,
                winners: participants,
            };
        }

        const winner = match.data.results.find(({ rank }) => rank === 1);
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
        competition_id: competition.id,
        name: competition.name,
        timeslot: competition.timeslot,
        type: competition.type,
        nb_players: competition.nb_players,
        start_date: competition.startDate,
        end_date: competition.endDate,
        round: {
            qualifier,
            match,
        },
    };
};

const updateSuperRoyal = async (trackmania) => {
    const competitions = await Competition.find({ type: CompetitionTypes.SuperRoyal }).sort({ startDate: -1 }).limit(3);

    for (const competition of competitions) {
        log.info(`fetching competition ${competition.id}`);

        const { data } = await trackmania.competitions(competition.id);

        competition.nb_players = data.nbPlayers;

        await Competition.updateOne({ id: competition.id }, { $set: { nb_players: competition.nb_players } });

        const result = await fetchCompetitionResult(trackmania, competition);
        if (result) {
            const start = moment.unix(result.start_date);

            if (!start.isValid()) {
                log.warn(
                    `ignoring competition result ${competition.id} due to invalid start date: ${result.start_date}`,
                );
                continue;
            }

            result.year = start.year();
            result.month = start.month() + 1;
            result.monthDay = start.date();

            await CompetitionResult.findOneAndUpdate({ competition_id: result.competition_id }, result, {
                upsert: true,
            });
            log.info(`upserted competition result for ${competition.id}`);
        } else {
            log.error(`failed to get result for competition ${competition.id}`);
        }

        //await delay(100);
    }
};

if (process.argv.some((arg) => arg === '--test')) {
    db.on('open', async () => {
        const sessionFile = path.join(__dirname, '/../.login');

        const loadSession = (client) => {
            try {
                client.loginData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));

                if (moment(client.loginData.expiration).diff(moment().utc(), 'seconds') <= 0) {
                    return false;
                }

                return true;
            } catch {
                return false;
            }
        };
        const saveSession = (client) => {
            fs.writeFileSync(sessionFile, JSON.stringify(client.loginData));
        };

        const ubisoft = new UbisoftClient(process.env.UBI_EMAIL, process.env.UBI_PW);

        if (!loadSession(ubisoft)) {
            await ubisoft.login();
            saveSession(ubisoft);
        }

        const trackmania = new TrackmaniaClient(ubisoft.loginData.ticket);

        await trackmania.login();
        await trackmania.loginNadeo(Audiences.NadeoClubServices);

        await fetchLatestCompetitions(trackmania).catch((error) => log.info(error.message, error.stack));

        // await updateCompetition(trackmania, CompetitionTypes.A08Forever).catch((error) =>
        //     log.error(error.message, error.stack),
        // );

        // await updateCompetition(trackmania, CompetitionTypes.CupOfTheDay).catch((error) =>
        //     log.error(error.message, error.stack),
        // );

        //await updateSuperRoyal(trackmania);
    });
}

module.exports = {
    fetchLatestCompetitions,
    updateCompetition,
    CompetitionTypes,
};
