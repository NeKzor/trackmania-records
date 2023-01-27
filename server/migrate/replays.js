require('dotenv').config();

const db = require('../db');
const fs = require('fs');
const path = require('path');
const { Replay } = require('../trackmania/models');

const newReplayFolder = '/home/nekz/GitHub/trackmania-records/replays';

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

db.once('open', async () => {
    const campaignApi = path.join(__dirname, '../../api/trackmania/campaign/');
    //const campaignApi = path.join(__dirname, '../../api/trackmania/totd/');

    for (const campaignFile of fs.readdirSync(campaignApi)) {
        const campaign = JSON.parse(fs.readFileSync(path.join(campaignApi, campaignFile), { encoding: 'utf-8' }));
        const isTraining = campaign.name === 'Training';

        for (const track of campaign.tracks) {
            for (const wr of track.history.filter((wr) => wr.replay)) {
                const subFolder = getReplayFolder(campaign, track, isTraining);
                const filename = path.join(subFolder, `${track.name.replace(/ /g, '_')}_${wr.score}_${wr.user.name}.replay.gbx`);

                // if (fs.existsSync(path.join(newReplayFolder, filename))) {
                //     console.info('file found:', filename);

                    await Replay
                        .findOneAndUpdate({ replay_id: wr.replay }, { filename }, { upsert: true })
                        .then(() => console.log('inserted'))
                        .catch(console.error);
                // } else {
                //     console.error('file not found:', filename);
                // }
            }
        }
    }

    console.log('done');
    process.exit();
});
