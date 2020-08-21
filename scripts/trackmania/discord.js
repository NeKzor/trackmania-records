const Discord = require('discord.js');

const formatScore = (score) => {
    if (score === undefined || score === null) {
        return '';
    }

    let msec = score % 1000;
    let tsec = Math.floor(score / 1000);
    let sec = tsec % 60;
    let min = Math.floor(tsec / 60);

    return (
        (min > 0 ? min + ':' : '') +
        (sec < 10 && min > 0 ? '0' + sec : sec) +
        '.' +
        (msec < 100 ? (msec < 10 ? '00' + msec : '0' + msec) : msec)
    );
};

class DiscordIntegration {
    constructor(id, token) {
        this.client = new Discord.WebhookClient(id, token);
        this.username = 'Trackmania';
    }
    sendWebhook(data) {
        return this.client
            .send('', { embeds: [this.buildEmbed(data)] })
            .then(console.log)
            .catch(console.error);
    }
    buildEmbed({ wr, track }) {
        return {
            title: 'New World Record',
            url: track.isOfficial
                ? 'https://nekz.me/trackmania/#/summer2020/' + parseInt(track.name.split(' - ')[1], 10)
                : undefined,
            color: 295077,
            footer: {
                text: 'nekz.me/trackmania-records',
            },
            /* image: {
                url: `https://raw.githubusercontent.com/NeKzor/nekzor.github.io/master/trackmania/images/summer2020/${mapId}.webp`,
            }, */
            fields: [
                {
                    name: 'Track',
                    value: track.name,
                    inline: true,
                },
                {
                    name: 'Time',
                    value: formatScore(wr.score, 'tm2'),
                    inline: true,
                },
                {
                    name: 'Timesave',
                    value: '-' + formatScore(wr.delta, 'tm2'),
                    inline: true,
                },
                {
                    name: 'Player',
                    value: DiscordIntegration.sanitiseText(wr.user.name),
                    inline: true,
                },
                {
                    name: 'Country',
                    value: wr.user.zone[2].name,
                    inline: true,
                },
                {
                    name: 'Ghost File',
                    value: `[Download](https://prod.trackmania.core.nadeo.online/storageObjects/${wr.replay})`,
                    inline: true,
                },
            ],
        };
    }
    static getTestData() {
        return {
            id: 'XJ_JEjWGoAexDWe8qfaOjEcq5l8',
            _id: '749f0c3c-a25f-4f3a-918a-60cd780eff3e',
            name: 'Summer 2020 - 01',
            wrs: [
                {
                    user: {
                        id: 'a9cbdeff-daa3-4bc2-998c-b2838183fb97',
                        zone: [
                            {
                                name: 'World',
                                parentId: null,
                                zoneId: '301e1b69-7e13-11e8-8060-e284abfd2bc4',
                            },
                            {
                                name: 'Europe',
                                parentId: '301e1b69-7e13-11e8-8060-e284abfd2bc4',
                                zoneId: '301e2106-7e13-11e8-8060-e284abfd2bc4',
                            },
                            {
                                name: 'Switzerland',
                                parentId: '301e2106-7e13-11e8-8060-e284abfd2bc4',
                                zoneId: '30228733-7e13-11e8-8060-e284abfd2bc4',
                            },
                            {
                                name: 'Vaud',
                                parentId: '30228733-7e13-11e8-8060-e284abfd2bc4',
                                zoneId: '30229617-7e13-11e8-8060-e284abfd2bc4',
                            },
                        ],
                        name: 'AffiTM',
                    },
                    score: 19454,
                    delta: -1000,
                    date: '2020-07-20T21:02:47+00:00',
                    duration: 31,
                    replay: '5960e274-b0a9-47f1-97c9-e1ab286a28ff',
                },
            ],
        };
    }
    static sanitiseText(text) {
        return text.replace('/(\\*|_|`|~)/miu', '\\\\$1');
    }
}

module.exports = DiscordIntegration;
