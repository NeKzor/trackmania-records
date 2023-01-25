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

    currentMonth.add(1, 'months');
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
    const lastMonth = year.toString() === now.year().toString() ? now.month() : 11;

    for (let i = month.month(); i <= lastMonth; ++i) {
        menu.push(
            <MenuItem value={month.month() + 1} key={menu.length}>
                {month.format('MMMM')}
            </MenuItem>,
        );

        month.add(1, 'month');
    }

    return menu;
};

const getCotdTimeslotMenu = () => {
    const menu = [
        <MenuItem value={1} key={0}>
            First
        </MenuItem>,
        <MenuItem value={2} key={1}>
            Second
        </MenuItem>,
        <MenuItem value={3} key={2}>
            Third
        </MenuItem>,
        <MenuItem value={0} key={3}>
            Any
        </MenuItem>,
    ];
    return menu;
};

const getInitialCompetitionValue = (year) => {
    const isFirstYear = year && year.toString() === firstCotdDate.year().toString();
    const month = (isFirstYear ? firstCotdDate : now).clone();
    return month.month() + 1;
};

const competitionMenu = [
    <MenuItem value="cotd" key={0}>
        Cup of the Day
    </MenuItem>,
    <MenuItem value="a08forever" key={1}>
        A08 Forever
    </MenuItem>,
    <MenuItem value="superroyal" key={2}>
        Super Royal
    </MenuItem>,
];

export { competitionMenu, yearMenu, getCotdMenu, getCotdTimeslotMenu, getInitialCompetitionValue };
