const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const tryExportJson = (file, obj, overwrite = false, format = false) => {
    try {
        if (!overwrite && fs.existsSync(file)) {
            log.error('File ' + file + ' already exists!');
            return;
        }
        fs.writeFileSync(file, JSON.stringify(obj, null, format ? 4 : null));
    } catch (error) {
        log.error(error);
    }
};

const tryMakeDir = (dir) => {
    try {
        fs.mkdirSync(dir);
    } catch (error) {}
};

const importJson = (file) => {
    return JSON.parse(fs.readFileSync(file));
};

const log = {
    info: (...msg) =>
        console.log(chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format('HH:mm:ss')}]} ${msg.join(' ')}`),
    success: (...msg) =>
        console.log(
            chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format(
                'HH:mm:ss',
            )}]} {greenBright ${msg.join(' ')}}`,
        ),
    warn: (...msg) =>
        console.log(
            chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format(
                'HH:mm:ss',
            )}]} {yellowBright ${msg.join(' ')}}`,
        ),
    error: (...msg) => {
        msg.forEach(console.error);
        console.log(
            chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format('HH:mm:ss')}]} {redBright ${msg.join(' ')}}`,
        );
    },
};

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

module.exports = {
    delay,
    importJson,
    log,
    tryExportJson,
    tryMakeDir,
    formatScore,
};
