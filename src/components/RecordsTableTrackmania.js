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
import WarningIcon from '@material-ui/icons/Warning';
import { stableSort } from '../utils/stableSort';
import { useLocalStorage } from '../Hooks';
import { formatScore, getDateDifferenceColor, getDateTimeDifferenceColor } from '../utils/tools';

const rowsOfficial = [
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'zone', sortable: true, label: 'Zone', align: 'left' },
    { id: 'date', sortable: true, label: 'Date', align: 'left' },
    { id: 'duration', sortable: true, label: 'Duration', align: 'left' },
];

const rowsTOTD = [
    { id: 'track.monthDay', sortable: true, label: 'Day', align: 'left' },
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'zone', sortable: true, label: 'Zone', align: 'left' },
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

const linkToTrackmaniaIoLeaderboard = (track) => {
    return `https://trackmania.io/#/leaderboard/${encodeURIComponent(track.id)}`;
};

const linkToTrackmaniaIoProfile = (user) => {
    return `https://trackmania.io/#/player/${encodeURIComponent(user.id)}`;
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
                    <Tooltip title={<Moment format="HH:mm">{wr.date}</Moment>} placement="bottom-end" enterDelay={300}>
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
            <MinTableCell align="left">
                {score}
                {wr.note && (
                    <Tooltip title={wr.note} placement="bottom-end" enterDelay={300}>
                        <span>
                            <IconButton size="small" disabled>
                                <WarningIcon fontSize="inherit" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
            </MinTableCell>
            <MinTableCell align="left">{delta ? '-' + delta : ''}</MinTableCell>
            <MinTableCell align="left">
                <Link color="inherit" href={linkToTrackmaniaIoProfile(wr.user)} rel="noreferrer" target="_blank">
                    {wr.user.name}
                </Link>
            </MinTableCell>
            <MinTableCell align="left">
                <Tooltip title={wr.user.zone.map((zone) => zone.name).join(' | ')} placement="bottom" enterDelay={300}>
                    <span>{(wr.user.zone[2] ? wr.user.zone[2] : wr.user.zone[0]).name}</span>
                </Tooltip>
            </MinTableCell>
            <MinTableCell align="left">
                <Tooltip title="Download Ghost" placement="bottom" enterDelay={300}>
                    <IconButton
                        size="small"
                        style={noWrap}
                        color="inherit"
                        href={wr.replayUrl}
                        rel="noreferrer"
                        target="_blank"
                        disabled={!wr.replay}
                    >
                        <SaveAltIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                {/* {wr.internal_note && (
                    <Tooltip
                        title={wr.internal_note}
                        placement="bottom-end"
                        enterDelay={300}
                    >
                        <span>
                            <IconButton size="small" disabled>
                                <WarningIcon fontSize="inherit" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )} */}
            </MinTableCell>
        </TableRow>
    );
};

const RecordsRow = ({ wr, official, orderBy, useLiveDuration, history, onClickHistory }) => {
    const score = formatScore(wr.score, 'tm2');
    const delta = wr.delta !== 0 ? formatScore(wr.delta, 'tm2') : null;

    const classes = useRowStyles();

    const open = history === wr.track.id;
    const defaultSort = orderBy === 'track.monthDay' || orderBy === 'track.name';

    return (
        <>
            <TableRow tabIndex={-1}>
                {!official && (wr.track.isFirst || !defaultSort) && (
                    <MinTableCell align="left" rowSpan={defaultSort ? wr.track.records : 1}>
                        {wr.track.monthDay}
                    </MinTableCell>
                )}
                {(wr.track.isFirst || !defaultSort) && (
                    <MinTableCell style={noWrap} rowSpan={defaultSort ? wr.track.records : 1} align="left">
                        <Link
                            color="inherit"
                            href={linkToTrackmaniaIoLeaderboard(wr.track)}
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
                            <span>{score}</span>
                        </Tooltip>
                    )}
                    {official && !delta && <span>{score}</span>}
                    {!official && delta && (
                        <Tooltip title={<span>-{delta} to former record</span>} placement="bottom" enterDelay={300}>
                            <span>{score}</span>
                        </Tooltip>
                    )}
                    {!official && !delta && <span>{score}</span>}
                </MinTableCell>
                <MinTableCell style={noWrap} align="left">
                    <Link color="inherit" href={linkToTrackmaniaIoProfile(wr.user)} rel="noreferrer" target="_blank">
                        {wr.user.name}
                    </Link>
                </MinTableCell>
                <MinTableCell style={noWrap} align="left">
                    <Tooltip
                        title={wr.user.zone.map((zone) => zone.name).join(' | ')}
                        placement="bottom"
                        enterDelay={300}
                    >
                        <span>{(wr.user.zone[2] ? wr.user.zone[2] : wr.user.zone[0]).name}</span>
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
                <MinTableCell style={noWrap} align="left">
                    <Tooltip title="Download Ghost" placement="bottom" enterDelay={300}>
                        <IconButton
                            size="small"
                            style={noWrap}
                            color="inherit"
                            href={wr.replayUrl}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <SaveAltIcon fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                    {wr.track.isLast && wr.track.history && (
                        <IconButton
                            color="inherit"
                            size="small"
                            style={noWrap}
                            onClick={() => onClickHistory(wr.track.id)}
                        >
                            <HistoryIcon fontSize="inherit" />
                        </IconButton>
                    )}
                </MinTableCell>
            </TableRow>
            {wr.track.isLast && wr.track.history && (
                <TableRow className={classes.root}>
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
                                            return <RecordsHistoryRow wr={historyWr} official={official} key={idx} />;
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
    const [storage, setStorage] = useLocalStorage('tm2020', {
        official: { order: 'asc', orderBy: 'track.name' },
        totd: { order: 'asc', orderBy: 'track.monthDay' },
    });

    const [{ order, rowsPerPage, page, ...state }, setState] = React.useState(defaultState);
    const [history, setHistory] = React.useState(null);

    let { orderBy } = state;
    orderBy = official ? storage.official.orderBy : storage.totd.orderBy;
    orderBy = official && orderBy === 'track.monthDay' ? 'track.name' : orderBy;

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

    const onClickHistory = React.useCallback(
        (id) => {
            if (history !== id) {
                setHistory(id);
            } else {
                setHistory(null);
            }
        },
        [history, setHistory],
    );

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
                                    history={history}
                                    onClickHistory={onClickHistory}
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
