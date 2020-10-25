class Api {
    constructor() {
        this.baseApi =
            process.env.NODE_ENV === 'development'
                ? 'http://localhost:8080'
                : 'https://raw.githubusercontent.com/NeKzBot/tmx-records/api';
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

export default new Api();
