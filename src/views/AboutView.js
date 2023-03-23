import React from 'react';
import Moment from 'react-moment';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import GitHubIcon from '@material-ui/icons/GitHub';
import ViewContent from './ViewContent';
import { api2 } from '../Api';

const useStyles = makeStyles((theme) => ({
    aboutBox: {
        padding: theme.spacing(3),
    },
}));

const Padding = () => <div style={{ paddingTop: '50px' }} />;
const SmallPadding = () => <div style={{ paddingTop: '25px' }} />;

const AboutView = () => {
    const [updates, setUpdates] = React.useState([]);

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
                <Typography variant="h5">Source Code</Typography>
                <SmallPadding />
                <div>
                    <Link rel="noopener" href="https://github.com/NeKzor/trackmania-records">
                        <GitHubIcon style={{ color: darkMode.enabled ? 'white' : 'black' }} fontSize="large" />
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
