require('dotenv').config();

const db = require('../db');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Replay, Inspection } = require('./models.js');
const { Replay: GbxReplay } = require('../node_modules/gbx-replay/src/gbx-replay');

const parserOptions = { parseGhost: true };

const update = async () => {
    console.log('[inspector] checking for new replays...');

    const replays = await Replay.aggregate()
        .lookup({
            from: 'inspections',
            localField: 'replay_id',
            foreignField: 'record_id',
            as: 'inspection',
        })
        .match({
            inspection: {
                $eq: [],
            },
        });

    console.log('[inspector] found', replays.length, 'replays');

    for (const replay of replays) {
        try {
            console.log('[inspector] parsing', replay.filename);
            const { ghost } = GbxReplay.default().read(
                fs.readFileSync(path.join(process.env.TRACKMANIA_REPLAYS_FOLDER, replay.filename)),
                parserOptions,
            );

            if (typeof ghost !== 'string') {
                await Inspection.insertMany({
                    record_id: replay.replay_id,
                    ghostLogin: ghost.ghostLogin,
                    challengeUid: ghost.challengeUid,
                    gameVersion: ghost.gameVersion,
                    exeChecksum: ghost.exeChecksum,
                    checkpoints: ghost.checkpoints,
                    inputs: ghost.inputs,
                });
                console.log('[inspector] inserted', replay.replay_id);
            } else {
                console.error('[inspector] failed to parse ghost of file');
            }
        } catch (err) {
            console.error(err);
        }
    }
};

let isUpdating = false;

if (process.argv.some((arg) => arg === '--test')) {
    db.on('open', () => update().catch(console.error));
} else {
    cron.schedule('*/1 * * * *', () => {
        if (!isUpdating) {
            isUpdating = true;
            update()
                .then(() => (isUpdating = false))
                .catch(console.error);
        }
    });
}
