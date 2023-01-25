import React from 'react';
import Moment from 'react-moment';
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
import GitHubIcon from '@material-ui/icons/GitHub';
import ViewContent from './ViewContent';
import AppState from '../AppState';
import { useIsMounted } from '../Hooks';
import { api2 } from '../Api';

const useStyles = makeStyles((theme) => ({
    aboutBox: {
        padding: theme.spacing(3),
    },
}));

const noWrap = { whiteSpace: 'nowrap' };
const MinTableCell = (props) => <TableCell size="small" {...props} />;
const Padding = () => <div style={{ paddingTop: '50px' }} />;
const SmallPadding = () => <div style={{ paddingTop: '25px' }} />;

const AboutView = () => {
    const {
        state: { darkMode },
        dispatch,
    } = React.useContext(AppState);

    const [updates, setUpdates] = React.useState([]);

    const toggleDarkMode = () => {
        dispatch({ action: 'toggleDarkMode' });
    };

    React.useEffect(() => {
        api2.getUpdates()
            .then(({ data }) => setUpdates(data))
            .catch(console.error);
    }, []);

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
                {updates.map((update) => {
                    return (
                        <>
                            <Typography variant="body1">
                                <Moment
                                    format="YYYY-MM-DD"
                                >
                                    {update.date}
                                </Moment>        
                            </Typography>
                            <div>
                                <ul>
                                    <li>
                                        {update.text.split('- ').filter(x => x).map((line) => <li>{line}</li>)}
                                    </li>
                                </ul>
                            </div>
                        </>
                    );
                })}
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
                <Typography variant="h5">Source Code</Typography>
                <SmallPadding />
                <div>
                    <Link rel="noopener" href="https://github.com/NeKzor/trackmania-records">
                        <GitHubIcon style={{ color: 'black' }} fontSize="large" />
                    </Link>
                </div>
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
