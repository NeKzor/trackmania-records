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
    info: (msg) => console.log(chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format('HH:mm:ss')}]} ${msg}`),
    success: (msg) =>
        console.log(chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format('HH:mm:ss')}]} {greenBright ${msg}}`),
    warn: (msg) =>
        console.log(chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format('HH:mm:ss')}]} {yellowBright ${msg}}`),
    error: (msg) => console.log(chalk`{bold.white [${moment().format('YYYY-MM-DD')}] [${moment().format('HH:mm:ss')}]} {redBright ${msg}}`),
};

module.exports = {
    delay,
    importJson,
    log,
    tryExportJson,
    tryMakeDir,
};
