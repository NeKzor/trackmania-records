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

// NOTE: The order will be reversed.
const addOtherCampaigns = () => {
    seasonMenu.push({
        value: 'campaign/snow-discovery',
        key: seasonMenu.length,
        title: 'Snow discovery',
    });
    seasonMenu.push({
        value: 'campaign/rally-discovery',
        key: seasonMenu.length,
        title: 'Rally discovery',
    });
    seasonMenu.push({
        value: 'campaign/desert-discovery',
        key: seasonMenu.length,
        title: 'Desert discovery',
    });
    seasonMenu.push({
        value: 'campaign/training',
        key: seasonMenu.length,
        title: 'Training',
    });
};

while (currentMonth.diff(now) < 0) {
    const season = seasons[Math.floor(currentMonth.month() / 3)];
    const year = currentMonth.format('YYYY');

    if (yearMenu.indexOf(year) === -1) {
        yearMenu.push(year);
    }

    currentMonth.add(3, 'months');

    if (currentMonth.diff(now) >= 0) {
        addOtherCampaigns();
    }

    seasonMenu.push({
        value: `campaign/${season}-${year}`.toLowerCase(),
        key: seasonMenu.length,
        title: `${season} ${year}`,
    });
}

seasonMenu.reverse();
totdMenu.reverse();
yearMenu.reverse();

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
            <MenuItem value={`totd/${monthName}-${year}`.toLowerCase()} key={menu.length}>
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

    return (official
        ? `campaign/${seasons[Math.floor(now.month() / 3)]}-${now.year()}`
        : `totd/${month.format('MMMM')}-${year ? year : now.year()}`
    ).toLowerCase();
};

export { seasonMenu, yearMenu, getTotdMenu, getInitialValue };
