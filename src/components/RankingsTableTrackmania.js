import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import { stableSort, stableSortSort } from '../utils/stableSort';

const rowsOficial = [
    { id: 'user.name', sortable: false, label: 'Player', align: 'left' },
    { id: 'wrs', id2: 'user.name', sortable: true, label: 'World Records', align: 'left' },
];

const rowsTotd = [
    { id: 'user.name', sortable: false, label: 'Player', align: 'left' },
    { id: 'wrs', sortable: true, label: 'World Records', align: 'left' },
];

const rowsCompetition = [
    { id: 'user.displayName', sortable: false, label: 'Player', align: 'left' },
    { id: 'wins.matches', sortable: true, label: 'Wins', align: 'left', tooltip: 'Amount of match wins.' },
    { id: 'wins.qualifiers', sortable: true, label: 'Qualifiers', align: 'left', tooltip: 'Amount of qualifier wins.' },
];

const rowsCotd = [
    { id: 'user.displayName', sortable: false, label: 'Player', align: 'left' },
    { id: 'wins.matches', sortable: true, label: 'Wins', align: 'left', tooltip: 'Amount of match wins.' },
    { id: 'wins.qualifiers', sortable: true, label: 'Qualifiers', align: 'left', tooltip: 'Amount of qualifier wins.' },
    {
        id: 'wins.hattricks',
        sortable: true,
        label: 'Hat-Tricks',
        align: 'left',
        tooltip: 'A hat-trick can be achieved by winning the qualifier, the match and Track of the Day.',
    },
];

const RankingsTableHead = ({ order, orderBy, onRequestSort, isOfficial, cotd, hattricks }) => {
    const createSortHandler = (prop1, prop2) => (event) => {
        onRequestSort(event, prop1, prop2);
    };

    const rows = isOfficial ? rowsOficial : cotd ? (hattricks ? rowsCotd : rowsCompetition) : rowsTotd;

    return (
        <TableHead>
            <TableRow>
                {rows.map((row) => (
                    <TableCell
                        key={row.id}
                        align={row.align}
                        padding="normal"
                        sortDirection={orderBy === row.id ? order : false}
                    >
                        {row.sortable === true && (
                            <Tooltip
                                title={row.tooltip ?? 'Sort by ' + row.label}
                                placement="bottom-start"
                                enterDelay={300}
                            >
                                <TableSortLabel
                                    active={orderBy === row.id}
                                    direction={order}
                                    onClick={createSortHandler(row.id, row.id2)}
                                >
                                    {row.label}
                                </TableSortLabel>
                            </Tooltip>
                        )}
                        {row.sortable === false && row.label}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

const useStyles = makeStyles((_) => ({
    root: {
        overflowX: 'auto',
    },
}));

const defaultState = {
    order: 'desc',
    orderBy: 'wrs',
    thenBy: 'user.name',
    page: 0,
    rowsPerPage: 50,
};

const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const linkToTrackmaniaIoProfile = (user) => {
    return `https://trackmania.io/#/player/${encodeURIComponent(user.id ?? user.accountId)}`;
};

const RecordsTable = ({ data, isOfficial, cotd, hattricks }) => {
    const [{ order, orderBy, thenBy }, setState] = React.useState({
        ...defaultState,
        orderBy: cotd ? 'wins.matches' : 'wrs',
    });

    const handleRequestSort = (_, prop1, prop2) => {
        const newOrderBy = prop1;
        const newThenBy = prop2;
        setState((s) => ({
            ...s,
            order: s.orderBy === newOrderBy && s.order === 'desc' ? 'asc' : 'desc',
            orderBy: newOrderBy,
            thenBy: newThenBy,
        }));
    };

    React.useEffect(() => {
        setState((s) => ({ ...s, orderBy: cotd ? 'wins.matches' : 'wrs', thenBy: cotd ? 'wins.matches' : 'wrs' }));
    }, [data, isOfficial]);

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <RankingsTableHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    isOfficial={isOfficial}
                    cotd={cotd}
                    hattricks={hattricks}
                />
                <TableBody>
                    {(isOfficial ? stableSortSort : stableSort)(data, order, orderBy, thenBy).map((row) => (
                        <TableRow tabIndex={-1} key={row.user.id ?? row.user.accountId}>
                            {!cotd && (
                                <MinTableCell align="left">
                                    <Link
                                        color="inherit"
                                        href={linkToTrackmaniaIoProfile(row.user)}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {row.user.name}
                                    </Link>
                                </MinTableCell>
                            )}
                            {!cotd && <MinTableCell align="left">{row.wrs}</MinTableCell>}
                            {cotd && (
                                <MinTableCell align="left">
                                    <Link
                                        color="inherit"
                                        href={linkToTrackmaniaIoProfile(row.user)}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {row.user.displayName}
                                    </Link>
                                </MinTableCell>
                            )}
                            {cotd && (
                                <>
                                    <MinTableCell align="left">{row.wins.matches}</MinTableCell>
                                    <MinTableCell align="left">{row.wins.qualifiers}</MinTableCell>
                                    {hattricks && <MinTableCell align="left">{row.wins.hattricks}</MinTableCell>}
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
