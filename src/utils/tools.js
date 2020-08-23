import { scaleLinear } from 'd3-scale';
import moment from 'moment';

export function formatScore(score, game, type = undefined) {
    if (score === undefined || score === null) {
        return score;
    }

    if (type === 'Stunts') {
        return score + ' pts.';
    }

    if (game !== 'tm2') {
        score /= 10;

        let csec = score % 100;
        let tsec = Math.floor(score / 100);
        let sec = tsec % 60;
        let min = Math.floor(tsec / 60);

        return (
            (min > 0 ? min + ':' : '') + (sec < 10 && min > 0 ? '0' + sec : sec) + '.' + (csec < 10 ? '0' + csec : csec)
        );
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
}

// credits: https://github.com/iVerb1/Portal2Boards/blob/master/public/js/date.js#L21
const hourScale = scaleLinear()
    .domain([0, 24, 14 * 24, 2 * 30 * 24])
    .range(['#2eb82e', '#258e25', '#cca300', '#e67300']);

export function getDateDifferenceColor(date) {
    const passedHours = moment().diff(moment(date), 'hours');
    return passedHours <= 2 * 30 * 24 ? hourScale(passedHours) : undefined;
}

const minuteScale = scaleLinear()
    .domain([0, 8 * 60, 16 * 60, 24 * 60])
    .range(['#2eb82e', '#cca300', '#e67300', '#e63200']);

export function getDateTimeDifferenceColor(date) {
    const passedHours = moment().diff(moment(date), 'minutes');
    return passedHours <= 24 * 60 ? minuteScale(passedHours) : undefined;
}
