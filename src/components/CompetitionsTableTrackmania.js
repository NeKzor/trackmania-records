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
import { stableSort } from '../utils/stableSort';
import { useLocalStorage } from '../Hooks';
import { formatScore } from '../utils/tools';

const rowsOfficial = [
    { id: 'name', sortable: true, label: 'Name', align: 'left' },
    { id: 'nb_players', sortable: true, label: 'Players', align: 'left' },
    { id: 'round.match.winner.displayName', sortable: true, label: 'Winner', align: 'left' },
];

const rowsCotd = [
    { id: 'name', sortable: true, label: 'Name', align: 'left' },
    { id: 'nb_players', sortable: true, label: 'Players', align: 'left' },
    { id: 'round.qualifier.winner.displayName', sortable: true, label: 'Qualifier', align: 'left' },
    { id: 'round.match.winner.displayName', sortable: true, label: 'Winner', align: 'left' },
];

const CompetitionsTableHead = ({ order, orderBy, onRequestSort, official }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    const rows = official ? rowsOfficial : rowsCotd;

    return (
        <TableHead>
            <TableRow>
                {rows.map((row, idx) => (
                    <TableCell
                        key={idx}
                        align={row.align}
                        padding="normal"
                        sortDirection={orderBy === row.id ? order : false}
                        colSpan={idx === rows.length - 1 ? 2 : 1}
                    >
                        {row.sortable === true && (
                            <Tooltip title={'Sort by ' + row.label} placement="bottom-start" enterDelay={300}>
                                <TableSortLabel
                                    active={orderBy === row.id}
                                    direction={order}
                                    onClick={createSortHandler(row.id)}
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
    order: 'asc',
    orderBy: 'name',
    page: 0,
    rowsPerPage: 250,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const linkToTrackmaniaIoCompetition = (competition) => {
    return `https://trackmania.io/#/competitions/comp/${encodeURIComponent(competition.id)}`;
};

const linkToTrackmaniaIoProfile = (user) => {
    return `https://trackmania.io/#/player/${encodeURIComponent(user.accountId)}`;
};

const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

const RecordsRow = ({ wr, official, orderBy, useLiveDuration, history, onClickHistory }) => {
    const score = formatScore(wr.score, 'tm2');
    const delta = wr.delta !== 0 ? formatScore(wr.delta, 'tm2') : null;

    const classes = useRowStyles();

    const defaultSort = orderBy === 'name' || orderBy === 'name';

    const doubleWin =
        wr.round.qualifier?.winner?.accountId === wr.round.match?.winner?.accountId &&
        wr.round.qualifier?.winner?.accountId;

    return (
        <>
            <TableRow tabIndex={-1}>
                <MinTableCell align="left">
                    <Link color="inherit" href={linkToTrackmaniaIoCompetition(wr)} rel="noreferrer" target="_blank">
                        {wr.name}
                    </Link>
                </MinTableCell>
                <MinTableCell align="left">{wr.nb_players}</MinTableCell>
                <MinTableCell style={noWrap} align="left">
                    {wr.round.qualifier && (
                        <Tooltip
                            title={<span>{wr.round.qualifier.winner.zone}</span>}
                            placement="bottom"
                            enterDelay={300}
                        >
                            <Link
                                color={doubleWin ? 'secondary' : 'inherit'}
                                href={linkToTrackmaniaIoProfile(wr.round.qualifier.winner)}
                                rel="noreferrer"
                                target="_blank"
                            >
                                {wr.round.qualifier.winner.displayName}
                            </Link>
                        </Tooltip>
                    )}
                </MinTableCell>
                <MinTableCell style={noWrap} align="left">
                    {wr.round.match && (
                        <Tooltip title={<span>{wr.round.match.winner.zone}</span>} placement="bottom" enterDelay={300}>
                            <Link
                                color={doubleWin ? 'secondary' : 'inherit'}
                                href={linkToTrackmaniaIoProfile(wr.round.match.winner)}
                                rel="noreferrer"
                                target="_blank"
                            >
                                {wr.round.match.winner.displayName}
                            </Link>
                        </Tooltip>
                    )}
                </MinTableCell>
            </TableRow>
        </>
    );
};

const CompetitionsTable = ({ data, stats, official, useLiveDuration }) => {
    const [storage, setStorage] = useLocalStorage('tm2020-competitions', {
        official: { order: 'asc', orderBy: 'name' },
        totd: { order: 'asc', orderBy: 'name' },
    });

    const [{ order, rowsPerPage, page, ...state }, setState] = React.useState(defaultState);

    let { orderBy } = state;
    orderBy = official ? storage.official.orderBy : storage.totd.orderBy;
    orderBy = official && orderBy === 'name' ? 'name' : orderBy;

    const handleRequestSort = (_, property) => {
        const orderBy = property;
        setState((state) => {
            const order = state.orderBy === orderBy && state.order === 'desc' ? 'asc' : 'desc';
            setStorage({ ...storage, [official ? 'official' : 'totd']: { order, orderBy } });

            return {
                ...state,
                order,
                orderBy,
            };
        });
    };

    React.useEffect(() => {
        const savedState = storage[official ? 'official' : 'totd'];
        setState((state) => ({ ...state, order: savedState.order, orderBy: savedState.orderBy }));
    }, [data]);

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <CompetitionsTableHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    official={official}
                />
                <TableBody>
                    {stableSort(data, order, orderBy)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((wr, idx) => {
                            return (
                                <RecordsRow
                                    wr={wr}
                                    official={official}
                                    orderBy={orderBy}
                                    useLiveDuration={useLiveDuration}
                                    key={idx}
                                />
                            );
                        })}
                </TableBody>
            </Table>
        </div>
    );
};

export default CompetitionsTable;
