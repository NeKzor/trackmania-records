class ApiV2 {
    constructor() {
        this.baseApi = process.env.NODE_ENV === 'development' ? '' : 'https://api.nekz.me';
        this.options = { credentials: 'include' };
    }
    loginStart(source) {
        window.open(`${this.baseApi}/login/${source}`, '_self');
    }
    async login(source, query) {
        const res = await fetch(`${this.baseApi}/login/${source}/authorize${query}`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async logout() {
        const res = await fetch(`${this.baseApi}/logout`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }
    }
    async getMe() {
        const res = await fetch(`${this.baseApi}/@me`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    replayUrl(id) {
        return `${this.baseApi}/api/v1/trackmania/replays/${id}`;
    }
    async getUsers() {
        const res = await fetch(`${this.baseApi}/api/v1/users`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getUpdates() {
        const res = await fetch(`${this.baseApi}/api/v1/updates`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getAudits() {
        const res = await fetch(`${this.baseApi}/api/v1/audits`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getTags() {
        const res = await fetch(`${this.baseApi}/api/v1/tags`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getGameCampaign(game, campaign) {
        const res = await fetch(`${this.baseApi}/api/v1/${game}/campaign/${campaign}`);
        console.log(`GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getGameRanks(game, campaign) {
        const res = await fetch(`${this.baseApi}/api/v1/${game}/campaign/${campaign}/ranks`);
        console.log(`GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getGameStats(game, campaign) {
        const res = await fetch(`${this.baseApi}/api/v1/${game}/campaign/${campaign}/stats`);
        console.log(`GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
}

class TrackmaniaApi {
    constructor() {
        this.baseApi =
            process.env.NODE_ENV === 'development'
                ? '/api/v1/trackmania'
                : 'https://api.nekz.me/api/v1/trackmania';
        this.options = { credentials: 'include' };
    }
    async getCampaigns() {
        const res = await fetch(`${this.baseApi}/campaigns`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getCampaign(name) {
        const res = await fetch(`${this.baseApi}/campaign/${name}`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getRankings(name) {
        const res = await fetch(`${this.baseApi}/rankings/${name}`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getCompetitions() {
        const res = await fetch(`${this.baseApi}/competitions`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getCompetition(type, params) {
        const res = await fetch(`${this.baseApi}/competition/${type}/${params}`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getCompetitionRankings(type, timeslot) {
        const res = await fetch(
            `${this.baseApi}/competition/${type}/rankings${timeslot ? '/' + timeslot : ''}`,
            this.options,
        );
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getHistory(trackId) {
        const res = await fetch(`${this.baseApi}/track/${trackId}/history`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getInspection(recordId) {
        const res = await fetch(`${this.baseApi}/record/${recordId}/inspect`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
    async getPlayer(playerId) {
        const res = await fetch(`${this.baseApi}/player/${playerId}/profile`, this.options);
        console.log(`[API] GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
}

export const api2 = new ApiV2();
export const trackmaniaApi = new TrackmaniaApi();
