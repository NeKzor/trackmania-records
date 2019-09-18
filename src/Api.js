class Api {
    async request(game, date) {
        if (process.env.NODE_ENV === 'development') {
            return require(`./api/${game}/${date || 'latest'}.json`);
        }
        let res = await fetch(`https://raw.githubusercontent.com/NeKzor/tmx-records/api/${game}/${date || 'latest'}.json`);
        console.log(`GET ${res.url} (${res.status})`);
        return res.ok ? await res.json() : [];
    }
}

export default new Api();
