export const asTime = (score) => {
    if (score < 0) {
        return 'invalid';
    }

    // Source: https://github.com/iVerb1/Portal2Boards/blob/master/public/js/score.js
    let time = Math.abs(score);
    time = Math.round(time);
    var hundreds = time % 100;
    var totalSeconds = Math.floor(time / 100);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    if (seconds < 10 && minutes > 0) seconds = '0' + seconds.toString();
    if (hundreds < 10) hundreds = '0' + hundreds.toString();

    if (minutes > 0) return minutes + ':' + seconds + '.' + hundreds;
    else return seconds + '.' + hundreds;
};

export const asPortals = (score) => score + 'p';
export const asJumps = (score) => score + 'j';
export const asSteps = (score) => score + 's';
export const asDistance = (score) => score + 'u';
