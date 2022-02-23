const flags = require('country-flag-emoji');
const Discord = require('discord.js');
const { formatScore, log } = require('../utils');

class DiscordIntegration {
    constructor(id, token) {
        this.client = new Discord.WebhookClient(id, token);
        this.username = 'Trackmania';
        this.enabled = true;
    }
    send(data) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        return this.client
            .send('', { embeds: [this.buildEmbed(data)] })
            .then(console.log)
            .catch(console.error);
    }
    buildEmbed({ wr, track }) {
        const country = wr.user.zone[2] ? wr.user.zone[2].name : null;
        const countryFlag = country ? flags.list.find((flag) => flag.name === country) : null;

        return {
            title: track.name.replace(/(\$[0-9a-fA-F]{3}|\$[WNOITSGZBEMwnoitsgzbem]{1})/g, ''),
            url: 'https://trackmania.io/#/leaderboard/' + track.id,
            color: 15772743,
            fields: [
                {
                    name: 'WR',
                    value: `${formatScore(wr.score)} (-${formatScore(wr.delta)})`,
                    inline: true,
                },
                {
                    name: 'By',
                    value: Discord.Util.escapeMarkdown(wr.user.name) + (countryFlag ? ' ' + countryFlag.emoji : ''),
                    inline: true,
                },
            ],
        };
    }
    createRankingsMessage(campaign) {
        const getScore = (wr) => {
            return formatScore(wr.score);
        };
        
        const getEmojiFlag = (user) => {
            const country = user.zone[2] ? user.zone[2].name : null;
            const flag = country ? flags.list.find((flag) => flag.name === country) : null;
            return flag ? ' ' + flag.emoji : '';
        };

        const wrs = campaign.tracks
            .map((track) =>
                track.wrs.length > 0
                    ? track.wrs.map(
                        (wr) =>
                            `${track.name.split(' - ')[1]} | ${getScore(wr)} by ${Discord.Util.escapeMarkdown(
                                wr.user.name,
                            )}${getEmojiFlag(wr.user)}`,
                    )
                    : null,
            )
            .filter((x) => x)
            .flat();

        const wrRankings = campaign.leaderboard.map(
            ({ user, wrs }) => `${Discord.Util.escapeMarkdown(user.name)}${getEmojiFlag(user)} (${wrs})`,
        );

        const campaignRankings = campaign.rankings.map(
            ({ user, points }) => `${Discord.Util.escapeMarkdown(user.name)}${getEmojiFlag(user)} (${points})`,
        );

        return [
            `**${campaign.name} - World Records**\n${wrs.join('\n')}`,
            `**${campaign.name} - WR Rankings**\n${wrRankings.join('\n')}`,
            `**${campaign.name} - Campaign Rankings\n${campaignRankings.join('\n')}`
        ].join('\n');
    }
    sendRankingsMessage(message) {
        this.client.send(message)
            .then((message) => {
                log.info('sent initial rankings message');
                console.log(message);
            });
    }
    editRankingsMessage(messageId, message) {
        this.client.editMessage(messageId, message)
            .then((message) => {
                log.info('updated rankings message');
                //console.log(message);
            });
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
}

module.exports = DiscordIntegration;
