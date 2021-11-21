const path = require('path');
const moment = require('moment');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}] ${level} : ${message}`;
        }),
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '/../logs/error-scripts.log'),
            level: 'error',
            maxsize: 100 * 1000 * 1000,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '/../logs/info-scripts.log'),
            level: 'info',
            maxsize: 100 * 1000 * 1000,
        }),
    ],
});

logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}] ${level} : ${message}`;
        }),
    ),
}));

module.exports = logger;
