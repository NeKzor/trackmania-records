require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { UbisoftClient, TrackmaniaClient, Audiences, Campaigns } = require('./trackmania/api');
const { log, tryMakeDir } = require('./utils');
const { updateCompetition, updateHatTrick, CompetitionTypes } = require('./trackmania_competitions');
const { Replay, Audit, Tag, Campaign, Track, Record, IntegrationEvent } = require('./trackmania/models');

const sessionFile = path.join(__dirname, '/../.login');
const replayFolder = process.env.TRACKMANIA_REPLAYS_FOLDER || path.join(__dirname, '../replays');

// Ubisoft login session
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

let trackmania = new TrackmaniaClient();
let zones = null;
let isUpdating = false;
let bannedUsers = [];
let unbannedUsers = [];

const cleanup = () => {
    trackmania = null;
    zones = null;
    isUpdating = false;
    bannedUsers = [];
    unbannedUsers = [];
};

// TODO: Re-use old code to figure out how to calculate duration
// const fixHistory = (campaign) => {
//     const now = moment().unix();
//     const nowOrEndOfSeason = moment.unix(campaign.event && campaign.event.endsAt < now ? campaign.event.endsAt : now);

//     campaign.tracks.forEach((track) => {
//         const endOfEvent = track.isOfficial
//             ? nowOrEndOfSeason
//             : moment.unix(track.event && track.event.endsAt < now ? track.event.endsAt : now);

//         track.history.forEach((wr, idx, wrs) => {
//             const nextWr = wrs.slice(idx + 1).find((nextWR) => nextWR.score < wr.score);

//             wr.duration = moment(nextWr ? nextWr.date : endOfEvent).diff(moment(wr.date), 'days');

//             if (wr.duration < 0) {
//                 log.warn(`negative duration for ${wr.user.name} -> ${wr.score} -> ${wr.date} -> ${track.name}`);
//             }
//         });
//     });
// };

const main = async () => {
    if (isUpdating) {
        log.warn('ignoring update');
        return;
    }

    isUpdating = true;

    // TODO: Better scan rates: COTD/A08 match starts until winner could be found
    //                          Hat-Trick starts when COTD match ends until TOTD ends
    const shouldUpdateCupOfTheDay = moment().add(10, 'seconds').format('HH:mm') === '21:15';
    const shouldUpdateA08Forever = moment().add(10, 'seconds').format('DD HH:mm') === '08 22:00';
    const shouldUpdateHatTrick = moment().add(10, 'seconds').format('HH:mm') === '19:00';

    tryMakeDir(path.join(replayFolder));

    const ubisoft = new UbisoftClient(process.env.UBI_EMAIL, process.env.UBI_PW);

    try {
        // Save this session locally or we get rate limited
        if (!loadSession(ubisoft)) {
            await ubisoft.login();
            saveSession(ubisoft);
        }

        trackmania = new TrackmaniaClient(ubisoft.loginData.ticket);

        await trackmania.login();

        // Required for leaderboard only
        await trackmania.loginNadeo(Audiences.NadeoLiveServices);

        zones = await trackmania.zones();
        zones.data.forEach((zone) => {
            Object.keys(zone).forEach((key) => {
                if (!['name', 'parentId', 'zoneId'].includes(key)) {
                    delete zone[key];
                }
            });
        });

        // bannedUsers = (await Tag.find({ name: 'Banned', user_id: { $ne: null } })).map(({ user_id }) => user_id);
        // unbannedUsers = (await Tag.find({ name: 'Unbanned', user_id: { $ne: null } })).map(({ user_id }) => user_id);

        // await updateOfficialCampaign();
        // await updateTrackOfTheDay();

        if (shouldUpdateCupOfTheDay) await updateCompetition(trackmania, CompetitionTypes.CupOfTheDay);
        if (shouldUpdateA08Forever) await updateCompetition(trackmania, CompetitionTypes.A08Forever);
        if (shouldUpdateHatTrick) await updateHatTrick(trackmania);
    } catch (error) {
        log.error(`${error.message}\n${error.stack}`);
    }

    cleanup();
};

const getTrainingCampaign = () => {
    //const tracks = await Track.find({ name: 'Training' });

    return {
        name: 'Training',
        seasonUid: 'NLS-QgdzyWx3sNU7IOGuJGKVBKkps6rMiNTGesM',
        startTimestamp: 1593622800,
        eventEnd: null,
        //playlist: tracks.map(({ uid }) => ({ mapUid: uid })),
        playlist: [
            { mapUid: 'olsKnq_qAghcVAnEkoeUnVHFZei' },
            { mapUid: 'btmbJWADQOS20ginP9DJ0i8sh3f' },
            { mapUid: 'lNP8O0sqatiHqecUXrhH65rpQ8a' },
            { mapUid: 'ga3zTKvSo7yJca60Ry_Z003L031' },
            { mapUid: 'xSOA3Fs8k3bGNHFQhwskyAjN3Nh' },
            { mapUid: 'LcBa4OZLeElnJksgbBEpQggitsh' },
            { mapUid: 'vTqUpE1iiXupNABp5Mfx0YOf33j' },
            { mapUid: 'OeJCW8sHENIcYscK8o5zVHAxADd' },
            { mapUid: 'us4gaCDQSxmjVMtp5nYfReezTqh' },
            { mapUid: 'DyNBxhQ6006991FwvVOaBX9Gcv1' },
            { mapUid: 'PhJGvGjkCaw299rBhVsEhNJKX1' },
            { mapUid: 'AJFJd6yABuSMfgJGc8UpWRwUVa0' },
            { mapUid: 'Nw8BZ8CtZZcFO547WnqdPzp8ydi' },
            { mapUid: 'eOA1X_xnvKbdDSuyymweOZzSrQ3' },
            { mapUid: '0hI2P3y8sENgIkruI_X7s3efES' },
            { mapUid: 'RlZ2HVhAwN5nD7I1lLciKhPsbb7' },
            { mapUid: 'EnMnBg3D4Uvb5bz8VLod73z6n47' },
            { mapUid: 'TVUF91YlnL78BFJwG5ADkNlymqe' },
            { mapUid: 'SsCdL6nGC__n8UrYnsX8xaqnjCh' },
            { mapUid: 'Yakz8xDlVWDfVCfXxW2_paCaHil' },
            { mapUid: 'f1tlOzXvdELVhwrhPpoJDsg9xs8' },
            { mapUid: 'OHRxJCE_cKxEGOGmhF9z6Hf0YZb' },
            { mapUid: 'qQEgNKxDhXtTsxWYRW0V4pvpER7' },
            { mapUid: '1rwAkLrbqhN47zCsVvJJFJimlcf' },
            { mapUid: 'TkyKsOEG7gHqVqjjc3A1Qj5rPgi' },
        ],
    };
};

const updateOfficialCampaign = async () => {
    const campaigns = (await trackmania.campaigns(Campaigns.Official)).collect();

    campaigns.push(getTrainingCampaign());

    for (const { seasonUid, name, playlist, startTimestamp, endTimestamp } of campaigns) {
        let campaign = await Campaign.findOne({ id: seasonUid });
        const tracks = campaign ? await Track.find({ campaign_id: campaign.id }) : [];

        if (!campaign) {
            campaign = await Campaign.create({
                isOfficial: true,
                id: seasonUid,
                name,
                event: {
                    startsAt: startTimestamp,
                    endsAt: endTimestamp,
                },
            });
        }

        const isTraining = name === 'Training';
        log.info(name, seasonUid);

        const maps = (await trackmania.maps(playlist.map((map) => map.mapUid))).collect();

        for (const { mapUid } of playlist) {
            const { name, mapId, thumbnailUrl } = maps.find((map) => map.mapUid === mapUid);
            log.info(name, mapUid);

            const track =
                tracks.find((track) => track.uid === mapUid) ??
                (await Track.create({
                    id: mapId,
                    uid: mapUid,
                    campaign_id: campaign.id,
                    name,
                    isOfficial: true,
                    thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
                }));

            await resolveRecords(campaign, track, isTraining);
        }
    }
};

const updateTrackOfTheDay = async () => {
    const campaigns = await trackmania.campaigns(Campaigns.TrackOfTheDay);

    for (const { year, month, days } of campaigns) {
        let campaign = await Campaign.findOne({ id: `${year}_${month}` });
        let tracks = campaign ? await Track.find({ campaign_id: campaign.id }) : [];

        if (!campaign) {
            campaign = await Campaign.create({
                id: `${year}_${month}`,
                isOfficial: false,
                name: `${moment()
                    .set('month', month - 1)
                    .format('MMMM')} ${year}`,
                year,
                month,
            });
            tracks = await Track.find({ campaign_id: campaign.id });
        }

        const trackDays = days
            .filter((day) => day.mapUid !== '')
            .filter((day) => !tracks.find((track) => track.id === day.mapUid));

        const maps = (await trackmania.maps(trackDays.map((map) => map.mapUid))).collect();

        for (const { mapUid, seasonUid, monthDay, startTimestamp, endTimestamp } of trackDays) {
            const { name, mapId, thumbnailUrl } = maps.find((map) => map.mapUid === mapUid);
            log.info(name, seasonUid, mapUid);

            const track =
                tracks.find((track) => track.uid === mapUid) ??
                (await Track.create({
                    id: mapId,
                    uid: mapUid,
                    campaign_id: campaign.id,
                    name,
                    monthDay,
                    season: seasonUid,
                    isOfficial: false,
                    thumbnail: thumbnailUrl.slice(thumbnailUrl.lastIndexOf('/') + 1, -4),
                    event: {
                        startsAt: startTimestamp,
                        endsAt: endTimestamp,
                    },
                }));

            await resolveRecords(campaign, track, false);
        }
    }
};

const autoban = (accountId, score, track, isTraining = false) => {
    if (unbannedUsers.find((user) => user.user_id === accountId)) {
        return false;
    }

    if (bannedUsers.find((user) => user.user_id === accountId)) {
        return true;
    }

    if (score !== undefined && score <= 3000) {
        ban(accountId, score, track);
        return true;
    }

    return false;
};

const ban = (account, score, track, reason) => {
    const accountId = typeof account === 'string' ? account : account.accountId;

    log.warn('banned: ' + accountId);

    try {
        Tag.create({ name: 'Banned', user_id: accountId, reason: reason ?? 'Invalid score' }).exec();
    } catch (oops) {
        log.error(oops);
    }

    try {
        Audit.create({
            //auditType: AuditType.PlayerBan,
            serverNote: `Banned player ${accountId} with an invalid score ${score} on ${track.name}`,
            affected: {
                //records: [record.id],
            },
        }).exec();
    } catch (oops) {
        log.error(oops);
    }
};

const saveReplay = async (record, wr, campaign, track, isTraining) => {
    const subFolder = getReplayFolder(campaign, track, isTraining);
    tryMakeDir(path.join(replayFolder, subFolder));

    // TODO: Replace all invalid path characters for Windows
    const filename = path.join(subFolder, `${track.name.replace(/ /g, '_')}_${wr.score}_${wr.user.name}.replay.gbx`);

    fs.writeFileSync(path.join(replayFolder, filename), await record.downloadReplay());

    await Replay.findOneAndUpdate({ replay_id: wr.replay }, { filename }, { upsert: true })
        .then((doc) => log.info('inserted replay', doc))
        .catch(log.error);
};

const getReplayFolder = (campaign, track, isTraining) => {
    if (isTraining) {
        const trackFolder = track.name.slice(track.name.indexOf(campaign.name) + campaign.name.length + 3);

        return path.join('training', trackFolder);
    }

    if (campaign.isOfficial) {
        const [season, year] = campaign.name.split(' ');
        const yearFolder = year;
        const seasonFolder = season.toLowerCase();
        const trackFolder = track.name.slice(track.name.indexOf(campaign.name) + campaign.name.length + 3);

        return path.join('campaign', yearFolder, seasonFolder, trackFolder);
    }

    const [month, year] = campaign.name.split(' ');
    const yearFolder = year;
    const monthFolder = month.toLowerCase();
    const dayFolder = track.monthDay.toString();

    return path.join('totd', yearFolder, monthFolder, dayFolder);
};

const resolveRecords = async (campaign, track, isTraining) => {
    if (isTraining) {
        isTraining = true;
    }
    const eventStart = track.isOfficial ? campaign.event.startsAt : track.event.startsAt;
    const eventEnd = track.isOfficial ? campaign.event.endsAt : track.event.endsAt;
    const oneWeekAfterOfficialCampaignStart = track.isOfficial ? moment.unix(eventStart).add(7, 'days').unix() : 0;

    const [leaderboard] = (
        await trackmania.leaderboard(campaign.isOfficial ? campaign.id : track.season, track.uid, 0, 5)
    ).collect();

    let wrScore = undefined;

    for (const { accountId, zoneId, score } of leaderboard.top) {
        // TODO: Insert banned records as "isBanned" + server audit
        if (autoban(accountId, score, track, isTraining)) {
            continue;
        }

        if (wrScore === undefined || wrScore === score) {
            const savedRecord = await Record.findOne({ 'user.id': accountId, score });

            if (savedRecord) {
                // TODO: Check if banned when we insert banned records
                wrScore = score;
                continue;
            }

            const [account] = (await trackmania.accounts([accountId])).collect();

            const isAccountTooYoung = account ? moment().diff(moment(account.timestamp), 'hours') <= 24 * 7 : false;
            if (track.isOfficial && isAccountTooYoung) {
                if (!unbannedUsers.find((user) => user.user_id === accountId)) {
                    ban(
                        accountId,
                        score,
                        track,
                        `Account is too young (${moment(account.timestamp).format('YYYY-MM-DD')}`,
                    );
                    continue;
                }
            }

            wrScore = score;

            const [record] = (await trackmania.mapRecords([accountId], [track.id])).collect();
            if (!record) {
                log.error(`unable to get map record info from ${accountId} on ${track.id}`);
                continue;
            }

            const timestamp = moment(record.timestamp);

            if (timestamp.unix() < eventStart || (eventEnd && timestamp.unix() > eventEnd)) {
                log.warn(
                    `ignored record: time was not driven during the event (${eventStart} < ${record.timestamp} < ${eventEnd})`,
                );
                continue;
            }

            const latestWr = await Record.findOne({ track_id: track.id, score: { $gte: score } });
            const replay_id = record ? record.url.slice(record.url.lastIndexOf('/') + 1) : '';

            const wr = {
                id: replay_id,
                track_id: track.id,
                campaign_id: campaign.id,
                user: {
                    id: accountId,
                    zone: zones.search(zoneId),
                    name: account?.displayName ?? '',
                },
                date: record ? record.timestamp : '',
                replay: replay_id,
                duration: record ? moment().diff(timestamp, 'd') : 0,
                score,
                delta: Math.abs(latestWr?.score ? score - latestWr.score : 0),
            };

            log.info('NEW RECORD', wr.user.name, wr.score);
            inspect(wr);

            await Record.create(wr);

            try {
                await saveReplay(record, wr, campaign, track, isTraining);
            } catch (error) {
                log.error(error);
            }

            try {
                if (track.isOfficial && !isTraining && timestamp.unix() >= oneWeekAfterOfficialCampaignStart) {
                    await IntegrationEvent.create({ record_id: wr.id, twitter: 'pending' });
                }
            } catch (error) {
                log.error(error);
            }
        }
    }
};

const inspect = (obj) => {
    log.info(JSON.stringify(obj));
    console.dir(obj, { depth: 6 });
};

if (process.argv.some((arg) => arg === '--test')) {
    db.on('open', () => main().catch(inspect));
}

module.exports = main;
