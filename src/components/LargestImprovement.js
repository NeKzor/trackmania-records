import React from 'react';
import Moment from 'react-moment';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import { stableSortSort } from '../utils/stableSort';
import { getDateDifferenceColor, formatScore } from '../utils/tools';
import tmx from '../utils/tmx';

const rows = [
    { id: 'track.name', sortable: false, label: 'Map', align: 'left' },
    { id: 'score', sortable: false, label: 'Time', label2: 'Score', align: 'left' },
    { id: 'user.name', sortable: false, label: 'Player', align: 'left' },
    { id: 'delta', sortable: false, label: 'Improvement', align: 'left' },
    { id: 'date', sortable: false, label: 'Date', align: 'left' },
];

const LargestImprovementHead = ({ order, orderBy, onRequestSort, scoreType }) => {
    const createSortHandler = (prop1, prop2) => (event) => {
        onRequestSort(event, prop1, prop2);
    };

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
                            <Tooltip title={'Sort by ' + row.label} placement="bottom-start" enterDelay={300}>
                                <TableSortLabel
                                    active={orderBy === row.id}
                                    direction={order}
                                    onClick={createSortHandler(row.id, row.id2)}
                                >
                                    {scoreType === 'Stunts' && row.label2 ? rowl.label2 : row.label}
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
    orderBy: 'delta',
    thenBy: 'date',
    page: 0,
    rowsPerPage: 50,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const RecordsTable = ({ game, data, scoreType }) => {
    const [{ order, orderBy, thenBy }, setState] = React.useState({ ...defaultState });

    const handleRequestSort = (_, prop1, prop2) => {
        const newOrderBy = prop1;
        const newThenBy = prop2;

        setState((state) => ({
            ...state,
            order: state.orderBy === newOrderBy && state.order === 'desc' ? 'asc' : 'desc',
            orderBy: newOrderBy,
            thenBy: newThenBy,
        }));
    };

    const classes = useStyles();

    const tmxGame = tmx(game);

    return (
        <div className={classes.root}>
            <Table size="small">
                <LargestImprovementHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    scoreType={scoreType}
                />
                <TableBody>
                    {stableSortSort(data, order, orderBy, thenBy).map((row) => (
                        <TableRow tabIndex={-1} key={row.replay}>
                            <MinTableCell style={noWrap} align="left">
                                <Link
                                    color="inherit"
                                    href={tmxGame.trackUrl(row.track.id)}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    {row.track.name}
                                </Link>
                            </MinTableCell>
                            <MinTableCell align="left">{formatScore(row.score, game, row.track.type)}</MinTableCell>
                            <MinTableCell style={noWrap} align="left">
                                <Link
                                    color="inherit"
                                    href={tmxGame.userUrl(row.user.id)}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    {row.user.name}
                                </Link>
                            </MinTableCell>
                            <MinTableCell align="left">
                                <span>
                                    {row.track.type === 'Stunts' ? '+' : '-'}
                                    {formatScore(row.delta, game, row.track.type)}
                                </span>
                            </MinTableCell>
                            <MinTableCell align="left">
                                <Tooltip
                                    title={<Moment fromNow>{row.date}</Moment>}
                                    placement="bottom-end"
                                    enterDelay={300}
                                >
                                    <Moment
                                        style={{ color: getDateDifferenceColor(row.date), ...noWrap }}
                                        format="YYYY-MM-DD"
                                    >
                                        {row.date}
                                    </Moment>
                                </Tooltip>
                            </MinTableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
