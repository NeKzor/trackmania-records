import React from 'react';
import moment from 'moment';
import MenuItem from '@material-ui/core/MenuItem';

let yearMenu = [];
const totdMenu = [];

const now = moment();
const firstCotdDate = moment('2020-11-02');
const currentMonth = firstCotdDate.clone();

while (currentMonth.diff(now) < 0) {
    const year = currentMonth.format('YYYY');

    if (yearMenu.indexOf(year) === -1) {
        yearMenu.push(year);
    }

    currentMonth.add(3, 'months');
}

totdMenu.reverse();
yearMenu.reverse();

yearMenu = yearMenu.map((year) => {
    return (
        <MenuItem value={year} key={year}>
            {year}
        </MenuItem>
    );
});

const getCotdMenu = (year) => {
    const menu = [];

    const isFirstYear = year.toString() === firstCotdDate.year().toString();

    const month = isFirstYear ? firstCotdDate.clone() : moment(`${year}-01-01`);
    const lastMonth = isFirstYear ? 11 : now.month();

    for (let i = month.month(); i <= lastMonth; ++i) {
        const monthName = month.format('MMMM');

        menu.push(
            <MenuItem value={monthName.toLowerCase()} key={menu.length}>
                {monthName}
            </MenuItem>,
        );

        month.add(1, 'month');
    }

    return menu;
};

const getInitialCompetitionValue = (year) => {
    const isFirstYear = year && year.toString() === firstCotdDate.year().toString();
    const month = (isFirstYear ? firstCotdDate : now).clone();
    return month.format('MMMM').toLowerCase();
};

const competitionMenu = [
    <MenuItem value="competitions/cotd" key={0}>
        Cup of the Day
    </MenuItem>,
    <MenuItem value="competitions/a08forever" key={1}>
        A08 Forever
    </MenuItem>
];

export { competitionMenu, yearMenu, getCotdMenu, getInitialCompetitionValue };
