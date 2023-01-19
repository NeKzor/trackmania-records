import React from 'react';
import moment from 'moment';
import MenuItem from '@material-ui/core/MenuItem';

const seasonMenu = [];
let yearMenu = [];
const totdMenu = [];

const now = moment();
const releaseDate = moment('2020-07-01')
    .tz('Europe/Paris')
    .set({
        hour: 17,
        minute: 0,
        second: 0,
    });
const currentMonth = releaseDate.clone();

const seasons = {
    0: 'Winter',
    1: 'Spring',
    2: 'Summer',
    3: 'Fall',
};

while (currentMonth.diff(now) < 0) {
    const season = seasons[Math.floor(currentMonth.month() / 3)];
    const year = currentMonth.format('YYYY');

    if (yearMenu.indexOf(year) === -1) {
        yearMenu.push(year);
    }

    seasonMenu.push(
        <MenuItem value={`${season} ${year}`} key={seasonMenu.length}>
            {season} {year}
        </MenuItem>,
    );

    currentMonth.add(3, 'months');
}

seasonMenu.reverse();
totdMenu.reverse();
yearMenu.reverse();

seasonMenu.push(
    <MenuItem value="Training" key={seasonMenu.length}>
        Training
    </MenuItem>,
);

yearMenu = yearMenu.map((year) => {
    return (
        <MenuItem value={year} key={year}>
            {year}
        </MenuItem>
    );
});

const getTotdMenu = (year) => {
    const menu = [];

    const isFirstYear = year.toString() === releaseDate.year().toString();

    const month = isFirstYear ? releaseDate.clone() : moment(`${year}-01-01`);
    const lastMonth = year.toString() === now.year().toString() ? now.month() : 11;

    for (let i = month.month(); i <= lastMonth; ++i) {
        const monthName = month.format('MMMM');

        menu.push(
            <MenuItem value={`${year}/${month.format('MM')}`} key={menu.length}>
                {monthName}
            </MenuItem>,
        );

        month.add(1, 'month');
    }

    return menu;
};

const getInitialValue = (official, year = undefined) => {
    const isFirstYear = year && year.toString() === releaseDate.year().toString();
    const month = (isFirstYear ? releaseDate : now).clone();

    return official
        ? `${seasons[Math.floor(now.month() / 3)]} ${now.year()}`
        : `${year ? year : now.year()}/${month.format('MM')}`;
};

export { seasonMenu, yearMenu, getTotdMenu, getInitialValue };
