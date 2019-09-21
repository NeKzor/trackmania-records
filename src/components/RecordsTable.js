import React from 'react';
import Moment from 'react-moment';
import moment from 'moment';
/* import IconButton from '@material-ui/core/IconButton'; */
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
/* import SaveAltIcon from '@material-ui/icons/SaveAlt';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import WarningIcon from '@material-ui/icons/Warning'; */
import { stableSort } from '../utils/stableSort';
import tmx from '../utils/tmx';
import { formatTime, getDateDifferenceColor } from '../utils/tools';
import { withTheme } from '@material-ui/styles';

const rows = [
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'time', sortable: true, label: 'Time', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'date', sortable: true, label: 'Date', align: 'left' },
    { id: 'duration', sortable: true, label: 'Duration', align: 'left' },
    /* { id: 'replay', sortable: false, label: 'Replay/Video', align: 'left' }, */
];

const RecordsTableHead = ({ order, orderBy, onRequestSort }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                {rows.map((row) => (
                    <TableCell key={row.id} align={row.align} padding="default" sortDirection={orderBy === row.id ? order : false}>
                        {row.sortable === true && (
                            <Tooltip title={'Sort by ' + row.label} placement="bottom-start" enterDelay={300}>
                                <TableSortLabel active={orderBy === row.id} direction={order} onClick={createSortHandler(row.id)}>
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

const RecordsTable = ({ data, game, total, isLatest, theme }) => {
    const isDarkTheme = theme.palette.type === 'dark';

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
                <RecordsTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                <TableBody>
                    {stableSort(data, order, orderBy)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((wr) => (
                            <TableRow tabIndex={-1} key={`${wr.track.id}-${wr.user.id}`}>
                                {(wr.track.isFirst || orderBy !== 'track.name') && (
                                    <MinTableCell rowSpan={orderBy !== 'track.name' ? 1 : wr.track.records} align="left">
                                        <Link color="inherit" href={tmx(game).trackUrl(wr.track.id)} rel="noreferrer" target="_blank">
                                            {wr.track.name}
                                        </Link>
                                    </MinTableCell>
                                )}
                                <MinTableCell align="left" dir="rtl">
                                    {formatTime(wr.time, game)}
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Link color="inherit" href={tmx(game).userUrl(wr.user.id)} rel="noreferrer" target="_blank">
                                        {wr.user.name}
                                    </Link>
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Tooltip
                                        title={
                                            <Moment style={noWrap} fromNow>
                                                {wr.date}
                                            </Moment>
                                        }
                                        placement="bottom-end"
                                        enterDelay={300}
                                    >
                                        <Moment style={{ color: getDateDifferenceColor(wr.date), ...noWrap }} format="YYYY-MM-DD">
                                            {wr.date}
                                        </Moment>
                                    </Tooltip>
                                </MinTableCell>
                                <MinTableCell align="left">
                                    <Tooltip title="in days" placement="bottom-end" enterDelay={300}>
                                        {isLatest ? <Moment style={noWrap} diff={wr.date} unit="days"></Moment> : wr.duration}
                                    </Tooltip>
                                </MinTableCell>
                                {/* <MinTableCell align="left">
                                    <Tooltip title="Download Replay" placement="bottom-end" enterDelay={300}>
                                        <IconButton size="small" href={tmx(game).replayUrl(wr.replay)} target="_blank">
                                            <SaveAltIcon fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Search Record on YouTube" placement="bottom-end" enterDelay={300}>
                                        <IconButton
                                            size="small"
                                            href={`https://www.youtube.com/results?search_query=${[
                                                game,
                                                wr.track.name,
                                                'in',
                                                formatTime(wr.time, game),
                                                'by',
                                                wr.user.name,
                                            ].join('+')}`}
                                            target="_blank"
                                        >
                                            <PlayArrowIcon fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                    {game === 'tm2' && moment(wr.date).isBefore('2017-05-09') && (
                                        <Tooltip
                                            title="This run was done on an older game version."
                                            placement="bottom-end"
                                            enterDelay={300}
                                        >
                                            <span>
                                                <IconButton size="small" disabled>
                                                    <WarningIcon fontSize="inherit" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    )}
                                </MinTableCell> */}
                            </TableRow>
                        ))}
                </TableBody>
                <TableBody>
                    <TableRow>
                        <MinTableCell align="right">Total</MinTableCell>
                        <MinTableCell>
                            <Tooltip title={moment.duration(total, 'ms').humanize()} placement="bottom-end" enterDelay={300}>
                                <span>{formatTime(total, game)}</span>
                            </Tooltip>
                        </MinTableCell>
                        <MinTableCell colSpan={2}></MinTableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};

export default withTheme(RecordsTable);
