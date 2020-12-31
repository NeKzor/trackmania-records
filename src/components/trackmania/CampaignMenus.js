import React from 'react';
import moment from 'moment';
import MenuItem from '@material-ui/core/MenuItem';

const seasonMenu = [];
const totdMenu = [];

const now = moment();
const currentMonth = moment('2020-07-01');

const seasons = {
    7: 'Summer',
    10: 'Fall',
    1: 'Winter',
    4: 'Spring',
};

while (currentMonth.diff(now) < 0) {
    const season = seasons[currentMonth.month() + 1];
    const year = currentMonth.format('YYYY');

    seasonMenu.push(
        <MenuItem value={`campaign/${season}-${year}`.toLowerCase()} key={seasonMenu.length}>
            {season} {year}
        </MenuItem>,
    );

    const month = currentMonth.clone();
    for (let i = 0; i < 3 && month.month() <= now.month(); ++i) {
        const monthName = month.format('MMMM');

        totdMenu.push(
            <MenuItem value={`totd/${monthName}-${year}`.toLowerCase()} key={totdMenu.length}>
                {monthName} {year}
            </MenuItem>,
        );

        month.add(1, 'month');
    }

    currentMonth.add(3, 'months');
}

seasonMenu.reverse();
totdMenu.reverse();

seasonMenu.push(
    <MenuItem value="campaign/training" key={seasonMenu.length}>
        Training
    </MenuItem>,
);

export { seasonMenu, totdMenu };
