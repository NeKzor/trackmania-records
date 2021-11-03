require('dotenv').config();

const db = require('../db');
const fs = require('fs');
const path = require('path');
const { Replay } = require('../trackmania/models');

db.once('open', async () => {
    const campaignApi = path.join(__dirname, '../../trackmania/campaign/');

    for (const campaignFile of fs.readdirSync(campaignApi)) {
        const campaign = JSON.parse(fs.readFileSync(path.join(campaignApi, campaignFile), { encoding: 'utf-8' }));
        for (const track of campaign.tracks) {
            for (const wr of track.history.filter((wr) => wr.replay)) {
                const filename = `${track.name.replace(/ /g, '_')}_${wr.score}_${wr.user.name}.replay.gbx`;

                if (fs.existsSync(`${process.env.TRACKMANIA_REPLAYS_FOLDER}/${filename}`)) {
                    console.info('file found:', filename);

                    await Replay
                        .findOneAndUpdate({ replay_id: wr.replay }, { filename }, { upsert: true })
                        .then(() => console.log('inserted'))
                        .catch(console.error);
                } else {
                    console.error('file not found:', filename);
                }
            }
        }
    }

    console.log('done');
    process.exit();
});
