import React from 'react';
import moment from 'moment';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ViewContent from './ViewContent';
import AppState from '../AppState';
import { useIsMounted } from '../Hooks';

const useStyles = makeStyles((theme) => ({
    aboutBox: {
        padding: theme.spacing(3),
    },
}));

const branches = [
    { repo: 'NeKzor/trackmania-records', branch: 'master' },
    { repo: 'NeKzBot/tmx-records', branch: 'api' },
    { repo: 'NeKzor/trackmania-records', branch: 'gh-pages' },
];

const noWrap = { whiteSpace: 'nowrap' };
const MinTableCell = (props) => <TableCell size="small" {...props} />;
const Padding = () => <div style={{ paddingTop: '50px' }} />;
const SmallPadding = () => <div style={{ paddingTop: '25px' }} />;

const AboutView = () => {
    const isMounted = useIsMounted();

    const {
        state: { darkMode },
        dispatch,
    } = React.useContext(AppState);

    const [gitHub, setGitHub] = React.useState([]);

    const toggleDarkMode = () => {
        dispatch({ action: 'toggleDarkMode' });
    };

    React.useEffect(() => {
        const anyErrors = (err) => {
            console.error(err);
            if (isMounted.current) {
                setGitHub(undefined);
            }
        };

        Promise.all(branches.map(({ repo, branch }) => fetch(`https://api.github.com/repos/${repo}/commits/${branch}`)))
            .then((results) => {
                Promise.all(results.map((res) => res.json()))
                    .then((branches) => {
                        if (isMounted.current) {
                            setGitHub(
                                branches.map((branch) => ({
                                    sha: branch.sha,
                                    author: branch.author ? branch.author : branch.commit.author,
                                    message: branch.commit.message,
                                    date: branch.commit.author.date,
                                })),
                            );
                        }
                    })
                    .catch(anyErrors);
            })
            .catch(anyErrors);
    }, [isMounted]);

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper className={classes.aboutBox}>
                <Typography component="h2" variant="h5">
                    Trackmania Campaign Records & Statistics
                </Typography>
                <SmallPadding />
                <Typography variant="body1">
                    The largest mirror for campaign world records of many Trackmania games.
                </Typography>
                <Typography variant="body1">We list, rank and compare players who set the fastest runs.</Typography>
                <Padding />
                <Typography variant="h5">News</Typography>
                <SmallPadding />
                <Typography variant="body1">Jul. 2022</Typography>
                <div>
                    <ul>
                        <li>
                            Removed duration statistics from Trackmania player rankings.
                        </li>
                        <li>
                            Enabled Nations ESWC updates, history and statistics.
                        </li>
                    </ul>
                </div>
                <Typography variant="body1">Feb. 2022</Typography>
                <div>
                    <ul>
                        <li>
                            Added support for new tmx-exchange.com website! Updates for Nations ESWC are still paused
                            at the moment.
                        </li>
                    </ul>
                </div>
                <Typography variant="body1">Nov. 2021</Typography>
                <div>
                    <ul>
                        <li>
                            User Authentication via Ubisoft/Maniaplanet!!
                            Right now it's probably useless for you since there are almost no benefits when logged in.
                        </li>
                        <li>
                            Download button to public replays has been removed for older records because they might
                            not be available anymore. Instead we provide backups from our servers. This service requires
                            permission from us!
                        </li>
                    </ul>
                </div>
                <Padding />
                <Typography variant="h5">Changelog</Typography>
                <SmallPadding />
                {gitHub === undefined ? (
                    <Typography variant="body1">Unable to fetch status from GitHub.</Typography>
                ) : gitHub.length === 0 ? (
                    <CircularProgress className={classes.progress} />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="default">
                                        <Typography variant="body1">Branch</Typography>
                                    </TableCell>
                                    <TableCell padding="default">
                                        <Typography variant="body1">Date</Typography>
                                    </TableCell>
                                    <TableCell padding="default">
                                        <Typography variant="body1">Author</Typography>
                                    </TableCell>
                                    <TableCell padding="default">
                                        <Typography variant="body1">Commit</Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {gitHub.map((commit, idx) => {
                                    const { repo, branch } = branches[idx];
                                    return (
                                        <TableRow tabIndex={-1} key={idx} style={noWrap}>
                                            <MinTableCell align="left">
                                                <Link
                                                    color="inherit"
                                                    rel="noopener"
                                                    href={`https://github.com/${repo}/tree/${branch}`}
                                                >
                                                    {branch}
                                                </Link>
                                            </MinTableCell>
                                            <MinTableCell align="left" style={noWrap}>
                                                <Tooltip title={moment(commit.date).toString()}>
                                                    <span>{moment(commit.date).from()}</span>
                                                </Tooltip>
                                            </MinTableCell>
                                            <MinTableCell align="left">
                                                {commit.author.html_url ? (
                                                    <Link color="inherit" rel="noopener" href={commit.author.html_url}>
                                                        {commit.author.login}
                                                    </Link>
                                                ) : (
                                                    commit.author.name || 'n/a'
                                                )}
                                            </MinTableCell>
                                            <MinTableCell align="left" style={noWrap}>
                                                <Tooltip title={commit.message}>
                                                    <Link
                                                        color="inherit"
                                                        rel="noopener"
                                                        href={`https://github.com/${repo}/commit/${commit.sha}`}
                                                    >
                                                        {commit.sha}
                                                    </Link>
                                                </Tooltip>
                                            </MinTableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
                <Padding />
                <Typography variant="h5">Theme Settings</Typography>
                <SmallPadding />
                <FormGroup row>
                    <FormControlLabel
                        control={<Switch checked={darkMode.enabled} onChange={toggleDarkMode} color="primary" />}
                        label="Dark Mode"
                    />
                </FormGroup>
                <Padding />
                <Typography variant="h5">Sources</Typography>
                <SmallPadding />
                <div>
                    prod.trackmania.core.nadeo.online
                </div>
                <div>
                    live-services.trackmania.nadeo.live
                </div>
                <div>
                    competition.trackmania.nadeo.club
                </div>
                <div>
                    <Link rel="noopener" href="https://www.tm-exchange.com">
                        tm-exchange.com
                    </Link>
                </div>
                <div>
                    <Link rel="noopener" href="https://tm.mania-exchange.com">
                        tm.mania-exchange.com
                    </Link>
                </div>
                <div>
                    <Link rel="noopener" href="https://www.speedrun.com/tmwii">
                        speedrun.com/tmwii
                    </Link>
                </div>
            </Paper>
        </ViewContent>
    );
};

export default AboutView;
