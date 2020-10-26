import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
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
    { id: 'wrs', id2: 'duration', sortable: true, label: 'World Records', align: 'left' },
    { id: 'duration', id2: 'wrs', sortable: true, label: 'Total Duration', align: 'left' },
];

const rowsTOTD = [
    { id: 'user.name', sortable: false, label: 'Player', align: 'left' },
    { id: 'wrs', sortable: true, label: 'World Records', align: 'left' },
];

const RankingsTableHead = ({ order, orderBy, onRequestSort, hasDuration }) => {
    const createSortHandler = (prop1, prop2) => (event) => {
        onRequestSort(event, prop1, prop2);
    };

    const rows = hasDuration ? rowsOficial : rowsTOTD;

    return (
        <TableHead>
            <TableRow>
                {rows.map((row) => (
                    <TableCell
                        key={row.id}
                        align={row.align}
                        padding="default"
                        sortDirection={orderBy === row.id ? order : false}
                    >
                        {row.sortable === true && (
                            <Tooltip title={'Sort by ' + row.label} placement="bottom-start" enterDelay={300}>
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
    thenBy: 'duration',
    page: 0,
    rowsPerPage: 50,
};

const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const RecordsTable = ({ data, hasDuration }) => {
    const [{ order, orderBy, thenBy }, setState] = React.useState(defaultState);

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

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <RankingsTableHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    hasDuration={hasDuration}
                />
                <TableBody>
                    {(hasDuration ? stableSortSort : stableSort)(data, order, orderBy, thenBy)
                        .map((row) => (
                            <TableRow tabIndex={-1} key={row.user.name}>
                                <MinTableCell align="left">{row.user.name}</MinTableCell>
                                <MinTableCell align="left">{row.wrs}</MinTableCell>
                                {hasDuration && (
                                    <MinTableCell align="left">{row.duration}</MinTableCell>
                                )}
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
