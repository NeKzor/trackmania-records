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

class TrackmaniaOAuthClient {
    constructor(options) {
        createHiddenField(this, 'id', options.id);
        createHiddenField(this, 'secret', options.secret);
        createHiddenField(this, 'loginData', null);
    }
    async login() {
        const url = `https://api.trackmania.com/api/access_token`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${this.id}&client_secret=${this.secret}`
        });

        log.info(`[API CALL] POST -> ${url} : ${res.status}`);

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        this.loginData = await res.json();

        return this;
    }
    async displayNames(ids) {
        if (this.loginData == null) {
            await this.login();
        }

        const url = `https://api.trackmania.com/api/display-names?accountId[]=${ids.join('&accountId[]=')}`;

        const fetchDisplayNames = async () => {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.loginData.access_token}`,
                },
            });

            log.info(`[API CALL] POST -> ${url} : ${res.status}`);

            return res;
        }

        let res = await fetchDisplayNames();

        if (res.status !== 200) {
            if (res.status === 401) {
                this.login();

                res = await fetchDisplayNames();
                if (res.status !== 200) {
                    throw new ResponseError(res);
                }
            } else {
                throw new ResponseError(res);
            }
        }

        const json = await res.json();

        // WTF!? Why are they returning an empty array instead of an empty object??
        return Array.isArray(json) ? Object.create(null) : json;
    }
}

module.exports = {
    TrackmaniaOAuthClient,
};
