import React from 'react';
import Moment from 'react-moment';
import moment from 'moment';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { stableSort } from '../utils/stableSort';
import srcom from '../utils/srcom';
import { formatScore, getDateDifferenceColor } from '../utils/tools';

const rows = [
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'date', sortable: true, label: 'Date', align: 'left' },
    { id: 'duration', sortable: true, label: 'Duration', align: 'left' },
    { id: 'replay', sortable: false, label: 'Video', align: 'left' },
];

const RecordsTableSrcomHead = ({ order, orderBy, onRequestSort }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

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
    orderBy: 'track.name',
    page: 0,
    rowsPerPage: 250,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const RecordsTableSrcom = ({ data, game, stats, useLiveDuration, category }) => {
    const [{ order, orderBy, rowsPerPage, page }, setState] = React.useState(defaultState);

    const handleRequestSort = (_, property) => {
        const newOrderBy = property;
        setState((s) => ({
            ...s,
            order: s.orderBy === newOrderBy && s.order === 'desc' ? 'asc' : 'desc',
            orderBy: newOrderBy,
        }));
    };

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <RecordsTableSrcomHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                <TableBody>
                    {stableSort(data, order, orderBy)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((wr) => (
                            <TableRow tabIndex={-1} key={`${wr.track.name}-${wr.user.id}`}>
                                {(wr.track.isFirst || orderBy !== 'track.name') && (
                                    <MinTableCell
                                        style={noWrap}
                                        rowSpan={orderBy !== 'track.name' ? 1 : wr.track.records}
                                        align="left"
                                    >
                                        <Link
                                            color="inherit"
                                            href={srcom.trackUrl(wr.track.name, category)}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            {wr.track.name}
                                        </Link>
                                    </MinTableCell>
                                )}
                                <MinTableCell align="left">
                                    <Link
                                        style={noWrap}
                                        color="inherit"
                                        href={srcom.runUrl(wr.id)}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {formatScore(wr.score, game)}
                                    </Link>
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Link
                                        style={noWrap}
                                        color="inherit"
                                        href={srcom.userUrl(wr.user.name)}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {wr.user.name}
                                    </Link>
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Tooltip
                                        title={<Moment fromNow>{wr.date}</Moment>}
                                        placement="bottom-end"
                                        enterDelay={300}
                                    >
                                        <Moment
                                            style={{ color: getDateDifferenceColor(wr.date), ...noWrap }}
                                            format="YYYY-MM-DD"
                                        >
                                            {wr.date}
                                        </Moment>
                                    </Tooltip>
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Tooltip title="in days" placement="bottom-end" enterDelay={300}>
                                        {useLiveDuration ? (
                                            <Moment style={noWrap} diff={wr.date} unit="days"></Moment>
                                        ) : (
                                            <span>{wr.duration}</span>
                                        )}
                                    </Tooltip>
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Tooltip title="Watch Run" placement="bottom-end" enterDelay={300}>
                                        <IconButton size="small" href={wr.media} target="_blank">
                                            <PlayArrowIcon fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                </MinTableCell>
                            </TableRow>
                        ))}
                </TableBody>
                <TableBody>
                    {stats.totalTime > 0 && (
                        <TableRow>
                            <MinTableCell align="right">Total Time</MinTableCell>
                            <MinTableCell>
                                <Tooltip
                                    title={moment.duration(stats.totalTime, 'ms').humanize()}
                                    placement="bottom-end"
                                    enterDelay={300}
                                >
                                    <span>{formatScore(stats.totalTime, game)}</span>
                                </Tooltip>
                            </MinTableCell>
                            <MinTableCell colSpan={4}></MinTableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTableSrcom;
