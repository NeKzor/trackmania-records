import React from 'react';
import Moment from 'react-moment';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import HistoryIcon from '@material-ui/icons/History';
import { stableSort } from '../utils/stableSort';
import { formatScore, getDateDifferenceColor, getDateTimeDifferenceColor } from '../utils/tools';

const rowsOfficial = [
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'user.zone', sortable: true, label: 'Zone', align: 'left' },
    { id: 'date', sortable: true, label: 'Date', align: 'left' },
    { id: 'duration', sortable: true, label: 'Duration', align: 'left' },
];

const rowsTOTD = [
    { id: 'track.monthDay', sortable: true, label: 'Day', align: 'left' },
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'user.zone', sortable: true, label: 'Zone', align: 'left' },
];

const RecordsTableHead = ({ order, orderBy, onRequestSort, official }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    const rows = official ? rowsOfficial : rowsTOTD;

    return (
        <TableHead>
            <TableRow>
                {rows.map((row, idx) => (
                    <TableCell
                        key={idx}
                        align={row.align}
                        padding="default"
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
    orderBy: 'track.name',
    page: 0,
    rowsPerPage: 250,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const linkToExchange = (track, isOfficial) => {
    const ubisoftNadeo = isOfficial ? '&authorId=21' : '';
    return `https://trackmania.exchange/mapsearch2?trackname=${encodeURIComponent(track.name)}${ubisoftNadeo}`;
};

const linkToLeaderboard = (trackName) => {
    const [season, track] = trackName.name.split(' - ');
    return `https://nekz.me/trackmania/#/${season.replace(' ', '').toLowerCase()}/${parseInt(track, 10)}`;
};

const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

const RecordsHistoryRow = ({ wr, official }) => {
    const score = formatScore(wr.score, 'tm2');
    const delta = wr.delta !== 0 ? formatScore(wr.delta, 'tm2') : null;

    return (
        <TableRow tabIndex={-1}>
            {official && (
                <MinTableCell align="left">
                    <Tooltip title={<Moment fromNow>{wr.date}</Moment>} placement="bottom-end" enterDelay={300}>
                        <Moment style={{ color: getDateDifferenceColor(wr.date), ...noWrap }} format="YYYY-MM-DD">
                            {wr.date}
                        </Moment>
                    </Tooltip>
                </MinTableCell>
            )}
            {!official && (
                <MinTableCell align="left">
                    <Tooltip title={wr.setAfter} placement="bottom-end" enterDelay={300}>
                        <Moment style={{ color: getDateTimeDifferenceColor(wr.pastMinutes), ...noWrap }} format="HH:mm">
                            {wr.date}
                        </Moment>
                    </Tooltip>
                </MinTableCell>
            )}
            <MinTableCell align="left">{score}</MinTableCell>
            <MinTableCell align="left">{delta ? '-' + delta : ''}</MinTableCell>
            <MinTableCell align="left">{wr.user.name}</MinTableCell>
            <MinTableCell align="left">
                <Tooltip title={wr.user.zone.map((zone) => zone.name).join(' | ')} placement="bottom" enterDelay={300}>
                    <span>{wr.user.zone[2].name}</span>
                </Tooltip>
            </MinTableCell>
            <MinTableCell align="left">
                <Tooltip title="Download Ghost" placement="bottom" enterDelay={300}>
                    <IconButton
                        size="small"
                        style={noWrap}
                        color="inherit"
                        href={'https://prod.trackmania.core.nadeo.online/storageObjects/' + wr.replay}
                        rel="noreferrer"
                        target="_blank"
                    >
                        <SaveAltIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
            </MinTableCell>
        </TableRow>
    );
};

const RecordsRow = ({ wr, official, orderBy, useLiveDuration }) => {
    const score = formatScore(wr.score, 'tm2');
    const delta = wr.delta !== 0 ? formatScore(wr.delta, 'tm2') : null;
    const [open, setOpen] = React.useState(false);

    const classes = useRowStyles();

    return (
        <>
            <TableRow className={wr.track.history || !open ? classes.root : undefined} tabIndex={-1}>
                {!official && (wr.track.isFirst || orderBy !== 'track.monthDay') && (
                    <MinTableCell align="left" rowSpan={orderBy !== 'track.monthDay' ? 1 : wr.track.records}>
                        {wr.track.monthDay}
                    </MinTableCell>
                )}
                {(wr.track.isFirst || orderBy !== 'track.monthDay') && (
                    <MinTableCell
                        style={noWrap}
                        rowSpan={orderBy !== 'track.monthDay' ? 1 : wr.track.records}
                        align="left"
                    >
                        <Link
                            color="inherit"
                            href={linkToExchange(wr.track, official)}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {wr.track.name}
                        </Link>
                    </MinTableCell>
                )}
                <MinTableCell align="left">
                    {official && delta && (
                        <Tooltip title={<span>-{delta} to former record</span>} placement="bottom" enterDelay={300}>
                            <Link
                                color="inherit"
                                href={linkToLeaderboard(wr.track, official)}
                                rel="noreferrer"
                                target="_blank"
                            >
                                <span>{score}</span>
                            </Link>
                        </Tooltip>
                    )}
                    {official && !delta && (
                        <Link
                            color="inherit"
                            href={linkToLeaderboard(wr.track, official)}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <span>{score}</span>
                        </Link>
                    )}
                    {!official && delta && (
                        <Tooltip title={<span>-{delta} to former record</span>} placement="bottom" enterDelay={300}>
                            <span>{score}</span>
                        </Tooltip>
                    )}
                    {!official && !delta && <span>{score}</span>}
                </MinTableCell>
                <MinTableCell align="left">{wr.user.name}</MinTableCell>
                <MinTableCell align="left">
                    <Tooltip
                        title={wr.user.zone.map((zone) => zone.name).join(' | ')}
                        placement="bottom"
                        enterDelay={300}
                    >
                        <span>{wr.user.zone[2].name}</span>
                    </Tooltip>
                </MinTableCell>
                {official && (
                    <>
                        <MinTableCell align="left">
                            <Tooltip title={<Moment fromNow>{wr.date}</Moment>} placement="bottom-end" enterDelay={300}>
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
                    </>
                )}
                <MinTableCell align="left">
                    <Tooltip title="Download Ghost" placement="bottom" enterDelay={300}>
                        <IconButton
                            size="small"
                            style={noWrap}
                            color="inherit"
                            href={'https://prod.trackmania.core.nadeo.online/storageObjects/' + wr.replay}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <SaveAltIcon fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                    {wr.track.isLast && wr.track.history && (
                        <IconButton color="inherit" size="small" style={noWrap} onClick={() => setOpen(!open)}>
                            <HistoryIcon fontSize="inherit" />
                        </IconButton>
                    )}
                </MinTableCell>
            </TableRow>
            {wr.track.isLast && wr.track.history && (
                <TableRow>
                    <MinTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                                <Typography variant="h6" gutterBottom component="div">
                                    History
                                </Typography>
                                <Table size="small" aria-label="purchases">
                                    <TableHead>
                                        <TableRow>
                                            <MinTableCell>{official ? 'Date' : 'Time'}</MinTableCell>
                                            <MinTableCell>Record</MinTableCell>
                                            <MinTableCell>Timesave</MinTableCell>
                                            <MinTableCell>Player</MinTableCell>
                                            <MinTableCell colSpan={2}>Zone</MinTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {wr.track.history.map((historyWr, idx) => {
                                            return (
                                                <RecordsHistoryRow
                                                    wr={historyWr}
                                                    official={official}
                                                    key={idx}
                                                />
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </MinTableCell>
                </TableRow>
            )}
        </>
    );
};

const RecordsTable = ({ data, stats, official, useLiveDuration }) => {
    const [{ order, rowsPerPage, page, ...state }, setState] = React.useState(defaultState);

    let { orderBy } = state;
    orderBy = official && orderBy === 'track.monthDay' ? 'track.name' : orderBy;

    const handleRequestSort = (_, property) => {
        const newOrderBy = property;
        setState((s) => ({
            ...s,
            order: s.orderBy === newOrderBy && s.order === 'desc' ? 'asc' : 'desc',
            orderBy: newOrderBy,
        }));
    };

    React.useEffect(() => {
        setState((s) => ({ ...s, orderBy: official ? 'track.name' : 'track.monthDay' }));
    }, [data, official]);

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <RecordsTableHead
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
                <TableBody>
                    {stats.totalTime > 0 && (
                        <TableRow>
                            <MinTableCell align="right" colSpan={official ? 1 : 2}>
                                Total Time
                            </MinTableCell>
                            <MinTableCell>
                                <Tooltip
                                    title={moment.duration(stats.totalTime, 'ms').humanize()}
                                    placement="bottom-end"
                                    enterDelay={300}
                                >
                                    <span>{formatScore(stats.totalTime, 'tm2')}</span>
                                </Tooltip>
                            </MinTableCell>
                            <MinTableCell colSpan={official ? 5 : 3}></MinTableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
