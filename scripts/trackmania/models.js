const mongoose = require('mongoose');

const Replay = mongoose.model('Replay', new mongoose.Schema({
    replay_id: {
        type: String,
        unique: true,
        required: true,
    },
    filename: {
        type: String,
        unique: true,
        required: true,
    },
}));

module.exports = {
    Replay,
};
