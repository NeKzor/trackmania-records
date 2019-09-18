const fs = require('fs');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const tryExportJson = (file, obj, overwrite = false) => {
    try {
        if (!overwrite && fs.existsSync(file)) {
            console.error('File ' + file + ' already exists!');
            return;
        }
        fs.writeFileSync(file, JSON.stringify(obj));
    } catch (error) {
        console.error(error);
    }
};

const tryMakeDir = (dir) => {
    try {
        fs.mkdirSync(dir);
    } catch (error) {}
};

module.exports = {
    delay,
    tryExportJson,
    tryMakeDir
};
