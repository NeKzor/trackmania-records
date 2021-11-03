const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '/../logs/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '/../logs/access.log'), level: 'info' }),
    ],
});

logger.add(new winston.transports.Console({
    format: winston.format.simple(),
}));

module.exports = logger;
