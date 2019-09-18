import React from 'react';
import Moment from 'react-moment';
import moment from 'moment';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import { makeStyles, emphasize } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import WarningIcon from '@material-ui/icons/Warning';
import { stableSort } from '../utils/stableSort';
import tmx from '../utils/tmx';

const rows = [
    { id: 'name', numeric: false, sortable: true, label: 'Track', align: 'left' },
    { id: 'time', numeric: false, sortable: false, label: 'Time', align: 'left' },
    { id: 'player', numeric: false, sortable: false, label: 'Player', align: 'left' },
    { id: 'date', numeric: true, sortable: false, label: 'Date', align: 'left' },
];

const RecordsTableHead = ({ order, orderBy, onRequestSort, isTm2 }) => {
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

const useStyles = makeStyles((theme) => ({
    root: {
        overflowX: 'auto',
    },
    clickLink: {
        cursor: 'pointer',
    },
    table: {
        '&:hover': {
            backgroundColor: emphasize(
                theme.palette.type === 'dark' ? theme.palette.background.paper : theme.palette.background.default,
                0.15,
            ),
        },
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

const formatTime = (csec) =>
    csec
        ? (time) => {
              let csec = time % 100;
              let tsec = Math.floor(time / 100);
              let sec = tsec % 60;
              let min = Math.floor(tsec / 60);
              return `${min}:${sec < 10 ? `0${sec}` : `${sec}`}.${csec < 10 ? `0${csec}` : `${csec}`}`;
          }
        : (time) => {
              let msec = time % 1000;
              let tsec = Math.floor(time / 1000);
              let sec = tsec % 60;
              let min = Math.floor(tsec / 60);
              return `${min}:${sec < 10 ? `0${sec}` : `${sec}`}.${msec < 100 ? (msec < 10 ? `00${msec}` : `0${msec}`) : `${msec}`}`;
          };

const RecordsTable = ({ data, game, total }) => {
    const [{ order, orderBy, rowsPerPage, page }, setState] = React.useState(defaultState);

    const handleRequestSort = (_, property) => {
        const newOrderBy = property;
        setState((s) => ({
            ...s,
            order: s.orderBy === newOrderBy && s.order === 'desc' ? 'asc' : 'desc',
            orderBy: newOrderBy,
        }));
    };

    const handleChangePage = (_, page) => {
        setState((s) => ({ ...s, page }));
    };

    const handleChangeRowsPerPage = (ev) => {
        setState((s) => ({ ...s, rowsPerPage: ev.target.value }));
    };

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table>
                <RecordsTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} isTm2={game === 'tm2'} />
                {stableSort(data, order, orderBy)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((track) => (
                        <TableBody className={classes.table} key={track.id}>
                            {track.wrs.map((wr, idx) => (
                                <TableRow tabIndex={-1} key={track.id + wr.user.id}>
                                    {idx === 0 && (
                                        <MinTableCell rowSpan={track.wrs.length} align="left">
                                            <Link color="inherit" href={tmx(game).trackUrl(track.id)} rel="noreferrer" target="_blank">
                                                {track.name}
                                            </Link>
                                        </MinTableCell>
                                    )}
                                    <MinTableCell align="left">
                                        {formatTime(game !== 'tm2')(wr.time)}
                                        &nbsp;&nbsp;&nbsp;
                                        <Tooltip title="Download Replay" placement="bottom-end" enterDelay={300}>
                                            <IconButton size="small" href={tmx(game).replayUrl(wr.replay)} target="_blank">
                                                <SaveAltIcon fontSize="inherit" />
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
                                            <Moment style={noWrap} format="YYYY-MM-DD">
                                                {wr.date}
                                            </Moment>
                                        </Tooltip>
                                    </MinTableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    ))}
                <TableBody>
                    <TableRow hover>
                        <MinTableCell align="right">Total</MinTableCell>
                        <MinTableCell>{formatTime(game !== 'tm2')(total)}</MinTableCell>
                        <MinTableCell colSpan={2}></MinTableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                labelDisplayedRows={() => ''}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
            />
        </div>
    );
};

export default RecordsTable;
