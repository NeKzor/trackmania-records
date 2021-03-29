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
import { useLocalStorage, useRenders } from '../Hooks';
import tmx from '../utils/tmx';
import { formatScore, getDateDifferenceColor, getDateTimeDifferenceColor } from '../utils/tools';

const rows = [
    { id: 'track.name', sortable: true, label: 'Track', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'date', sortable: true, label: 'Date', align: 'left' },
    { id: 'duration', sortable: true, label: 'Duration', align: 'left' },
];

const RecordsTableHead = ({ order, orderBy, onRequestSort }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

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

const linkToExchange = (trac) => {
    return '';
};

const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

const RecordsHistoryRow = ({ game, wr, trackType }) => {
    const score = formatScore(wr.score, game, trackType);
    const delta = wr.delta !== 0 ? formatScore(wr.delta, game, trackType) : null;
    const deltaSign = trackType === 'Stunts' ? '+' : '-';

    const tmxGame = tmx(game);

    return (
        <TableRow tabIndex={-1}>
            <MinTableCell align="left">
                <Tooltip title={<Moment format="HH:mm">{wr.date}</Moment>} placement="bottom-end" enterDelay={300}>
                    <Moment style={{ color: getDateDifferenceColor(wr.date), ...noWrap }} format="YYYY-MM-DD">
                        {wr.date}
                    </Moment>
                </Tooltip>
            </MinTableCell>
            <MinTableCell align="left">
                {score}
            </MinTableCell>
            <MinTableCell align="left">{delta ? deltaSign + delta : ''}</MinTableCell>
            <MinTableCell align="left">
                <Link
                    style={noWrap}
                    color="inherit"
                    href={tmxGame.userUrl(wr.user.id)}
                    rel="noreferrer"
                    target="_blank"
                >
                    {wr.user.name}
                </Link>
            </MinTableCell>
            <MinTableCell align="left">
                <Tooltip title="Download Replay" placement="bottom" enterDelay={300}>
                    <IconButton
                        size="small"
                        style={noWrap}
                        color="inherit"
                        href={tmxGame.replayUrl(wr.replay)}
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

const RecordsRow = ({ game, wr, orderBy, useLiveDuration, history, onClickHistory }) => {
    const score = formatScore(wr.score, game, wr.track.type);
    const delta = wr.delta !== 0 ? formatScore(wr.delta, game, wr.track.type) : null;
    const deltaSign = wr.track.type === 'Stunts' ? '+' : '-';

    const classes = useRowStyles();

    const open = history === wr.track.id;
    const defaultSort = orderBy === 'track.name';
    const tmxGame = tmx(game);

    return (
        <>
            <TableRow tabIndex={-1}>
                {(wr.track.isFirst || !defaultSort) && (
                    <MinTableCell style={noWrap} rowSpan={defaultSort ? wr.track.records : 1} align="left">
                        <Link
                            color="inherit"
                            href={tmxGame.trackUrl(wr.track.id)}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {wr.track.name}
                        </Link>
                    </MinTableCell>
                )}
                <MinTableCell align="left">
                    {delta && (
                        <Tooltip title={<span>{deltaSign}{delta} to former record</span>} placement="bottom" enterDelay={300}>
                            <span>{score}</span>
                        </Tooltip>
                    )}
                    {!delta && <span>{score}</span>}
                </MinTableCell>
                <MinTableCell style={noWrap} align="left">
                    <Link
                        color="inherit"
                        href={tmxGame.userUrl(wr.user.id)}
                        rel="noreferrer"
                        target="_blank"
                    >
                        {wr.user.name}
                    </Link>
                </MinTableCell>
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
                <MinTableCell style={noWrap} align="left">
                    <Tooltip title="Download Replay" placement="bottom" enterDelay={300}>
                        <IconButton
                            size="small"
                            style={noWrap}
                            color="inherit"
                            href={tmxGame.replayUrl(wr.replay)}
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
                                            <MinTableCell>Date</MinTableCell>
                                            <MinTableCell>Record</MinTableCell>
                                            <MinTableCell>
                                                {wr.track.type === 'Stunts' ? 'Improvement' : 'Timesave'}
                                            </MinTableCell>
                                            <MinTableCell colSpan={2}>Player</MinTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {wr.track.history.map((historyWr, idx) => {
                                            return <RecordsHistoryRow
                                                game={game}
                                                wr={historyWr}
                                                trackType={wr.track.type}
                                                key={idx}
                                            />;
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

const RecordsTable = ({ game, data, stats, useLiveDuration }) => {
    const [storage, setStorage] = useLocalStorage(game, {
        order: 'asc', orderBy: 'track.name',
    });

    const [{ order, rowsPerPage, page, orderBy }, setState] = React.useState(defaultState);
    const [history, setHistory] = React.useState(null);

    const handleRequestSort = (_, property) => {
        const orderBy = property;
        setState((state) => {
            const order = state.orderBy === orderBy && state.order === 'desc' ? 'asc' : 'desc';
            setStorage({ ...storage, order, orderBy });

            return {
                ...state,
                order,
                orderBy,
            };
        });
    };

    React.useEffect(() => {
        setState((state) => ({ ...state, order: storage.order, orderBy: storage.orderBy }));
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
                />
                <TableBody>
                    {stableSort(data, order, orderBy)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((wr, idx) => {
                            return (
                                <RecordsRow
                                    game={game}
                                    wr={wr}
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
                            <MinTableCell align="right">
                                Total Time
                            </MinTableCell>
                            <MinTableCell>
                                <Tooltip
                                    title={moment.duration(stats.totalTime, 'ms').humanize()}
                                    placement="bottom-end"
                                    enterDelay={300}
                                >
                                    <span>{formatScore(stats.totalTime)}</span>
                                </Tooltip>
                            </MinTableCell>
                            <MinTableCell colSpan={5}></MinTableCell>
                        </TableRow>
                    )}
                    {stats.totalPoints > 0 && (
                        <TableRow>
                            <MinTableCell align="right">Total Points</MinTableCell>
                            <MinTableCell>
                                <span>{formatScore(stats.totalPoints, game, 'Stunts')}</span>
                            </MinTableCell>
                            <MinTableCell colSpan={3}></MinTableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
