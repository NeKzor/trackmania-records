const fs = require('fs');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/* const formatTime = (time) => {
    let csec = time % 100;
    let tsec = Math.floor(time / 100);
    let sec = tsec % 60;
    let min = Math.floor(tsec / 60);
    return `${min}:${sec < 10 ? `0${sec}` : `${sec}`}.${csec < 10 ? `0${csec}` : `${csec}`}`;
};
const formatTime2 = (time) => {
    let msec = time % 1000;
    let tsec = Math.floor(time / 1000);
    let sec = tsec % 60;
    let min = Math.floor(tsec / 60);
    return `${min}:${sec < 10 ? `0${sec}` : `${sec}`}.${msec < 100 ? msec < 10 ? `00${msec}` : `0${msec}` : `${msec}`}`;
}; */

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
