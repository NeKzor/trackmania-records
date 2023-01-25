const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.simple(),
        winston.format.colorize(),
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '/../logs/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '/../logs/access.log'), level: 'info' }),
    ],
});

logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format((info) =>  info.ignoreConsole ? false : info)(),
        winston.format.simple(),
        winston.format.colorize(),
    ),
}));

module.exports = logger;
