const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    login_id: {
        type: String,
        unique: true,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    nickname: {
        type: String,
        index: true,
        required: true,
        minLength: 3,
        maxLength: 32,
    },
    permissions: {
        type: Number,
        default: 0,
        required: true,
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
}));


module.exports = {
    User,
};
