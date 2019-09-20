import { scaleLinear } from 'd3-scale';
import moment from 'moment';

export function formatTime(time, game) {
    if (game !== 'tm2') {
        time /= 10;
        let csec = time % 100;
        let tsec = Math.floor(time / 100);
        let sec = tsec % 60;
        let min = Math.floor(tsec / 60);
        return (min > 0 ? min + ':' : '') + (sec < 10 && min > 0 ? '0' + sec : sec) + '.' + (csec < 10 ? '0' + csec : csec);
    }
    let msec = time % 1000;
    let tsec = Math.floor(time / 1000);
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
export function getDateDifferenceColor(date) {
    let passedHours = moment().diff(moment(date), 'hours');
    let hourScale = scaleLinear()
        .domain([0, 24, 14 * 24, 2 * 30 * 24])
        .range(['#2eb82e', '#258e25', '#cca300', '#e67300']);
    let color = 'white';
    if (passedHours <= 24 * 30 * 2) {
        color = hourScale(passedHours);
    }
    return color;
}
