const fetch = require('node-fetch');
const { log } = require('../utils');

const createHiddenField = (obj, fieldName, value) => {
    Object.defineProperty(obj, fieldName, {
        enumerable: false,
        writable: true,
        value: value,
    });
};

class ResponseError extends Error {
    constructor(res) {
        super();
        this.message = 'request failed';
        this.response = res;
    }
}

const Audiences = {
    NadeoLiveServices: 'NadeoLiveServices',
    NadeoClubServices: 'NadeoClubServices',
};

class UbisoftClient {
    constructor(email, password) {
        if (!email) throw new Error('email is required');
        if (!password) throw new Error('password is required');

        this.baseUrl = 'https://public-ubiservices.ubi.com';
        this.loginData = null;

        createHiddenField(this, 'auth', Buffer.from(`${email}:${password}`).toString('base64'));
    }
    async login() {
        const res = await fetch(`${this.baseUrl}/v3/profiles/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ubi-AppId': '86263886-327a-4328-ac69-527f0d20a237',
                'Authorization': 'Basic ' + this.auth,
            },
        });
        this.loginData = await res.json();

        return this;
    }
}

const ApiEndpoint = {
    Prod: 'https://prod.trackmania.core.nadeo.online',
    LiveServices: 'https://live-services.trackmania.nadeo.live/api/token',
    Competition: 'https://competition.trackmania.nadeo.club/api',
};

class TrackmaniaClient {
    constructor(ticket) {
        createHiddenField(this, 'auth', ticket);
        createHiddenField(this, 'loginData', null);
        createHiddenField(this, 'loginDataNadeo', null);
    }
    async login() {
        const res = await fetch(`${ApiEndpoint.Prod}/v2/authentication/token/ubiservices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'ubi_v1 t=' + this.auth,
            },
        });

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        this.loginData = await res.json();

        return this;
    }
    async loginNadeo(audience) {
        if (!this.loginData) {
            throw new Error('need to be logged in first');
        }

        audience = audience || Audiences.NadeoLiveServices;

        const res = await fetch(`${ApiEndpoint.Prod}/v2/authentication/token/nadeoservices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'nadeo_v1 t=' + this.loginData.accessToken,
            },
            body: JSON.stringify({ audience }),
        });

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        this.loginDataNadeo = await res.json();

        return this;
    }
    async refresh() {
        const res = await fetch(`${ApiEndpoint.Prod}/v2/authentication/token/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'nadeo_v1 t=' + this.loginData.refreshToken,
            },
        });

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        return this;
    }
    async get(route, nadeo, nadeoEndpont = ApiEndpoint.LiveServices) {
        if (!nadeo && !this.loginData) {
            throw new Error('need to be logged in first');
        }

        if (nadeo && !this.loginDataNadeo) {
            throw new Error('need to be logged in with nadeo first');
        }

        const accessToken = nadeo ? this.loginDataNadeo.accessToken : this.loginData.accessToken;
        const baseUrl = nadeo ? nadeoEndpont : ApiEndpoint.Prod;

        const res = await fetch(baseUrl + route, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'nadeo_v1 t=' + accessToken,
            },
        });

        log.info(`[API CALL] GET -> ${baseUrl + route} : ${res.status} `);

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        return await res.json();
    }
    async zones() {
        return await Zones.default(this).update();
    }
    async season(id) {
        return await Season.default(this).update(id);
    }
    async accounts(ids) {
        return await Accounts.default(this).update(ids);
    }
    async maps(ids) {
        return await Maps.default(this).update(ids);
    }
    async campaigns(campaign, offset, length) {
        return await Campaigns.default(this).update(campaign, offset, length);
    }
    async leaderboard(groupOrSeasonid, mapId, offset, length) {
        return await Leaderboard.default(this).update(groupOrSeasonid, mapId, offset, length);
    }
    async mapRecords(accountIdList, mapIdList) {
        return await MapRecords.default(this).update(accountIdList, mapIdList);
    }
    async competitions(competitionId) {
        return await Competitions.default(this).update(competitionId);
    }
    async competitionsRounds(competitionId) {
        return await CompetitionsRounds.default(this).update(competitionId);
    }
    async rounds(roundId) {
        return await Rounds.default(this).update(roundId);
    }
    async matches(matchId) {
        return await Matches.default(this).update(matchId);
    }
    async matches(matchId) {
        return await Matches.default(this).update(matchId);
    }
    async challenges(challengeId) {
        return await Challenges.default(this).update(challengeId);
    }
    async challengesLeaderboard(matchId) {
        return await ChallengesLeaderboard.default(this).update(matchId);
    }
    async clubActivity(clubId) {
        return await ClubActivity.default(this).update(clubId);
    }
    async clubCampaign(clubId, campaignId) {
        return await ClubCampaign.default(this).update(clubId, campaignId);
    }
}

class Entity {
    constructor(client) {
        this.client = client;
        this.data = null;
    }
    static default(client) {
        return new this(client);
    }
    async update() {
        throw new Error('update() not implemented');
    }
    collect() {
        const result = [];
        for (const item of this) {
            result.push(item);
        }
        return result;
    }
}

class Zones extends Entity {
    static World = 0;
    static Continent = 1;
    static Country = 2;
    static Region = 3;

    async update() {
        this.data = await this.client.get('/zones');
        this.cache = {};
        this.cachePaths = {};
        return this;
    }
    *[Symbol.iterator]() {
        for (const zone of this.data) {
            yield zone;
        }
    }
    search(zoneId) {
        const cachedZone = this.cache[zoneId];
        if (cachedZone) {
            return cachedZone;
        }

        return (this.cache[zoneId] = this._search(zoneId));
    }
    _search(zoneId) {
        const result = [];

        for (const zone of this.data) {
            if (zone.zoneId === zoneId) {
                if (zone.parentId !== null) {
                    result.push(...this.search(zone.parentId));
                }
                result.push(zone);
            }
        }

        return result;
    }
    searchByNamePath(zonePath) {
        const cachedZone = this.cachePaths[zonePath];
        if (cachedZone) {
            return cachedZone;
        }

        const result = [];
        const zoneNames = zonePath.split('|');

        let lastParentId = null;

        for (const zoneName of zoneNames) {
            for (const zone of this.data) {
                if (zone.name === zoneName && lastParentId === zone.parentId) {
                    result.push(zone);
                    lastParentId = zone.zoneId;
                }
            }
        }

        if (zonePath.length === 0) {
            console.warn('zone by path not found:', zonePath);
        }

        return (this.cachePaths[zonePath] = result);
    }
}

class Season extends Entity {
    async update(id) {
        if (id) this.id = id;

        if (!this.id) {
            throw new Error('missing id parameter');
        }

        this.data = await this.client.get('/seasons/' + this.id);

        return this;
    }
    *[Symbol.iterator]() {
        for (const season of this.data.seasonMapList) {
            yield season;
        }
    }
}

class Accounts extends Entity {
    async update(ids) {
        if (ids) this.ids = ids;

        if (!this.ids) {
            throw new Error('missing ids parameter');
        }

        this.ids = this.ids.filter((id) => id);

        if (this.ids.length > 10) {
            throw new Error('cannot fetch more than 10 accounts');
        }

        if (this.ids.length > 0) {
            this.data = await this.client.get('/accounts/displayNames?accountIdList=' + this.ids.join(','));
        } else {
            this.data = [];
        }

        return this;
    }
    *[Symbol.iterator]() {
        for (const account of this.data) {
            yield account;
        }
    }
}

class Maps extends Entity {
    async update(ids) {
        if (ids) this.ids = ids;

        if (!this.ids) {
            throw new Error('missing ids parameter');
        }

        this.ids = this.ids.filter((id) => id);

        /* if (this.ids.length > 10) {
            throw new Error('cannot fetch more than 10 maps');
        } */

        if (this.ids.length > 0) {
            const idType = this.ids[0].length === 36 ? 'Id' : 'Uid';

            this.data = await this.client.get(`/maps?map${idType}List=` + this.ids.join(','));
        } else {
            this.data = [];
        }

        return this;
    }
    *[Symbol.iterator]() {
        for (const map of this.data) {
            yield map;
        }
    }
}

class Campaigns extends Entity {
    static Official = 'official';
    static TrackOfTheDay = 'month';

    async update(campaign, offset, length) {
        if (campaign !== undefined) this.campaign = campaign;
        if (offset !== undefined) this.offset = offset;
        if (length !== undefined) this.length = length;

        if (!this.campaign) {
            throw new Error('campaign type is required');
        }

        const api = ['/campaign/' + this.campaign];

        if (this.offset === undefined) this.offset = 0;
        if (this.length === undefined) this.length = 1;

        const parameters = [`offset=${this.offset}`, `length=${this.length}`];

        if (parameters.length > 0) {
            api.push(parameters.join('&'));
        }

        this.data = await this.client.get(api.join('?'), true);

        return this;
    }
    *[Symbol.iterator]() {
        const mapList = this.campaign === Campaigns.TrackOfTheDay ? this.data.monthList : this.data.campaignList;

        for (const campaign of mapList) {
            yield campaign;
        }
    }
}

class Leaderboard extends Entity {
    async update(groupOrSeasonId, mapId, offset, length) {
        if (groupOrSeasonId !== undefined) this.groupId = groupOrSeasonId;
        if (mapId !== undefined) this.mapId = mapId;
        if (offset !== undefined) this.offset = offset;
        if (length !== undefined) this.length = length;

        if (!this.groupId) {
            throw new Error('group or season id required');
        }

        this.data = await this.client.get(
            `/leaderboard/group/${this.groupId}${this.mapId ? `/map/${this.mapId}` : ''}/top` +
            `?offset=${this.offset}&length=${this.length}&onlyWorld=1`,
            true,
        );

        return this;
    }
    *[Symbol.iterator]() {
        for (const top of this.data.tops) {
            yield top;
        }
    }
}

class MapRecord {
    accountId = null;
    filename = null;
    gameMode = null;
    gameModeCustomData = null;
    mapId = null;
    medal = null;
    recordScore = { respawnCount: null, score: null, time: null };
    removed = null;
    scopeId = null;
    scopeType = null;
    timestamp = null;
    url = null;
    respawnCount = null;
    score = null;
    time = null;

    constructor(data) {
        Object.assign(this, data);
    }
    async downloadReplay() {
        const res = await fetch(this.url);

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        return await res.buffer();
    }
}

class CompetitionRound {
    qualifier_challenge_id = null;
    training_challenge_id = null;
    id = null;
    position = 0;
    name = '';
    start_date = 0;
    end_date = 0;
    lock_date = null;
    status = '';
    is_locked = false;
    auto_needs_matches = false;
    match_score_direction = '';
    leaderboard_compute_type = '';
    team_leaderboard_compute_type = null;
    deleted_on = null;
    nb_matches = 0;

    constructor(data) {
        Object.assign(this, data);
    }
}

class RoundMatch {
    constructor(data) {
        Object.assign(this, data);
    }
}

class Match {
    constructor(data) {
        Object.assign(this, data);
    }
}

class LeaderboardChallenge {
    constructor(data) {
        Object.assign(this, data);
    }
}

class MapRecords extends Entity {
    async update(accountIdList, mapIdList) {
        if (accountIdList !== undefined) this.accountIdList = accountIdList;
        if (mapIdList !== undefined) this.mapIdList = mapIdList;

        if (!this.accountIdList) {
            throw new Error('accountIdList id required');
        }

        if (!this.mapIdList) {
            throw new Error('mapIdList required');
        }

        this.data = await this.client.get(
            `/mapRecords?accountIdList=${accountIdList.join(',')}&mapIdList=${mapIdList.join(',')}`,
        );

        return this;
    }
    *[Symbol.iterator]() {
        for (const mapRecord of this.data) {
            yield new MapRecord(mapRecord);
        }
    }
}

class Competitions extends Entity {
    async update(competitionId) {
        this.competitionId = competitionId || this.competitionId;

        if (!this.competitionId) {
            throw new Error('competition id is required');
        }

        this.data = await this.client.get(`/competitions/${this.competitionId}`, true, ApiEndpoint.Competition);

        return this;
    }
    *[Symbol.iterator]() {
        for (const entry of Object.entries(this.data || {})) {
            yield entry;
        }
    }
}

class CompetitionsRounds extends Entity {
    async update(competitionId) {
        this.competitionId = competitionId || this.competitionId;

        if (!this.competitionId) {
            throw new Error('competition id is required');
        }

        this.data = await this.client.get(`/competitions/${this.competitionId}/rounds`, true, ApiEndpoint.Competition);

        return this;
    }
    *[Symbol.iterator]() {
        for (const round of this.data) {
            yield new CompetitionRound(round);
        }
    }
}

class Rounds extends Entity {
    async update(roundId) {
        this.roundId = roundId || this.roundId;

        if (!this.roundId) {
            throw new Error('round id is required');
        }

        this.data = await this.client.get(`/rounds/${this.roundId}/matches`, true, ApiEndpoint.Competition);

        return this;
    }
    *[Symbol.iterator]() {
        for (const round of this.data.matches) {
            yield new RoundMatch(round);
        }
    }
}

class Matches extends Entity {
    async update(matchId) {
        this.matchId = matchId || this.matchId;

        if (!this.matchId) {
            throw new Error('match id is required');
        }

        this.data = await this.client.get(`/matches/${this.matchId}/results`, true, ApiEndpoint.Competition);

        return this;
    }
    *[Symbol.iterator]() {
        for (const match of this.data) {
            yield new Match(match);
        }
    }
}

class Challenges extends Entity {
    async update(challengeId) {
        this.challengeId = challengeId || this.challengeId;

        if (!this.challengeId) {
            throw new Error('challenge id is required');
        }

        this.data = await this.client.get(`/challenges/${this.challengeId}`, true, ApiEndpoint.Competition);

        return this;
    }
    *[Symbol.iterator]() {
        for (const entry of Object.entries(this.data || {})) {
            yield entry;
        }
    }
}

class ChallengesLeaderboard extends Entity {
    async update(challengeId) {
        this.challengeId = challengeId || this.challengeId;

        if (!this.challengeId) {
            throw new Error('challenge id is required');
        }

        this.data = await this.client.get(`/challenges/${this.challengeId}/leaderboard`, true, ApiEndpoint.Competition);

        return this;
    }
    *[Symbol.iterator]() {
        for (const leaderboard of this.data) {
            yield new LeaderboardChallenge(leaderboard);
        }
    }
}

class ClubActivity extends Entity {
    async update(clubId) {
        this.clubId = clubId || this.clubId;

        if (!this.clubId) {
            throw new Error('club id is required');
        }

        this.data = await this.client.get(`/club/${this.clubId}/activity?offset=0&length=10&active=1`, true);

        return this;
    }
    *[Symbol.iterator]() {
        for (const activity of this.data.activityList) {
            yield activity;
        }
    }
}

class ClubCampaign extends Entity {
    async update(clubId, campaignId) {
        this.clubId = clubId || this.clubId;
        this.campaignId = campaignId || this.campaignId;

        if (!this.clubId) {
            throw new Error('club id is required');
        }

        if (!this.campaignId) {
            throw new Error('campaign id is required');
        }

        this.data = await this.client.get(`/club/${this.clubId}/campaign/${this.campaignId}`, true);

        return this;
    }
    *[Symbol.iterator]() {
        for (const map of this.data.campaign.playlist) {
            yield map;
        }
    }
}

module.exports = {
    UbisoftClient,
    TrackmaniaClient,
    Audiences,
    Campaigns,
    Entity,
    Zones,
    Season,
    Accounts,
    Maps,
    Campaigns,
    Leaderboard,
};
