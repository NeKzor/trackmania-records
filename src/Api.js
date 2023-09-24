class Api {
    constructor() {
        this.baseApi =
            process.env.NODE_ENV === 'development'
                ? 'http://localhost:8081'
                : 'https://raw.githubusercontent.com/NeKzBot/trackmania-records/api';
    }
    async request(game, file) {
        const res = await fetch(`${this.baseApi}/${game}/${file || 'latest'}.json`);
        console.log(`GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }
}

class ApiV2 {
    constructor() {
        this.baseApi = process.env.NODE_ENV === 'development'
            ? 'https://trackmania.dev.local:8080'
            : 'https://api.nekz.me';
        this.options =  { credentials: 'include' };
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
}

export const api2 = new ApiV2();
export default new Api();
