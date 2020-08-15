const fetch = require('node-fetch');

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

class TrackmaniaClient {
    constructor(ticket) {
        this.baseUrl = 'https://prod.trackmania.core.nadeo.online';
        this.baseUrlNadeo = 'https://live-services.trackmania.nadeo.live/api/token';

        createHiddenField(this, 'auth', ticket);
        createHiddenField(this, 'loginData', null);
        createHiddenField(this, 'loginDataNadeo', null);
    }
    async login() {
        const res = await fetch(`${this.baseUrl}/v2/authentication/token/ubiservices`, {
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

        const res = await fetch(`${this.baseUrl}/v2/authentication/token/nadeoservices`, {
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
    async get(route, nadeo) {
        if (!nadeo && !this.loginData) {
            throw new Error('need to be logged in first');
        }

        if (nadeo && !this.loginDataNadeo) {
            throw new Error('need to be logged in with nadeo first');
        }

        const accessToken = nadeo ? this.loginDataNadeo.accessToken : this.loginData.accessToken;
        const baseUrl = nadeo ? this.baseUrlNadeo : this.baseUrl;

        const res = await fetch(baseUrl + route, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'nadeo_v1 t=' + accessToken,
            },
        });

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
    async leaderboard(groupOrSeasonid, mapId, start, end) {
        return await Leaderboard.default(this).update(groupOrSeasonid, mapId, start, end);
    }
    async mapRecords(accountIdList, mapIdList) {
        return await MapRecords.default(this).update(accountIdList, mapIdList);
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
        return this;
    }
    *[Symbol.iterator]() {
        for (const zone of this.data) {
            yield zone;
        }
    }
    search(zoneId) {
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
            const idType = this.ids[0].length === 27 ? 'Uid' : 'Id';

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

        const parameters = [];
        if (this.offset !== undefined) parameters.push(`offset=${this.offset}`);
        if (this.length !== undefined) parameters.push(`length=${this.length}`);

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
    async update(groupOrSeasonId, mapId, start, end) {
        if (groupOrSeasonId !== undefined) this.groupId = groupOrSeasonId;
        if (mapId !== undefined) this.mapId = mapId;
        if (start !== undefined) this.start = start;
        if (end !== undefined) this.end = end;

        if (!this.groupId) {
            throw new Error('group or season id required');
        }

        if (!this.mapId) {
            throw new Error('map id required');
        }

        if (this.end - this.start > 50) {
            throw new Error('cannot fetch more than 50 entries');
        }

        this.data = await this.client.get(
            //`/leaderboard/group/${this.groupId}/map/${this.mapId}/surround/${this.start}/${this.end}`,
            `/leaderboard/group/${this.groupId}/map/${this.mapId}/top`,
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
            yield mapRecord;
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
