import React from 'react';
import { withRouter } from 'react-router';
import moment from 'moment';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import RankingsTable from '../components/RankingsTable';
import RecordsTable from '../components/RecordsTable';
import SimpleTitle from '../components/SimpleTitle';
import RecordsChart from '../components/RecordsChart';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';
import { makeStyles } from '@material-ui/core';

const TabPanel = ({ children, value, index, ...other }) => {
    return (
        value === index && (
            <Typography component="div" role="tabpanel" id={`scrollable-auto-tabpanel-${index}`} {...other}>
                <Box p={3}>{children}</Box>
            </Typography>
        )
    );
};

const useStyles = makeStyles((theme) => ({
    fab: {
        margin: 0,
        top: 'auto',
        right: 30,
        bottom: 30,
        left: 'auto',
        position: 'fixed',
    },
}));

const GameView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [tab, setTab] = React.useState(0);

    const page = match.params[0];

    React.useEffect(() => {
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        (async () => {
            let game = await Api.request(match.params[0], match.params.date);
            await new Promise((res) => setTimeout(res, 1000));
            if (!isMounted.current) return;
            if (game[0] && game[0].tracks[0].wrs) {
                for (let campaign of game) {
                    let rows = [];
                    for (let track of campaign.tracks) {
                        for (let wr of track.wrs) {
                            let duration = moment().diff(moment(wr.date), 'd');
                            let user = campaign.leaderboard.find((entry) => entry.user.id === wr.user.id);
                            user.duration = user.duration === undefined ? duration : user.duration + duration;
                            rows.push({
                                track: {
                                    id: track.id,
                                    name: track.name,
                                    isFirst: wr === track.wrs[0],
                                    records: track.wrs.length,
                                },
                                duration,
                                ...wr,
                            });
                        }
                    }

                    campaign.tracks = rows;
                }
            }

            setGame(game);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted, match.params[0], match.params.date]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
    };

    const jumpToTop = () => {
        const smoothScroll = () => {
            const y = document.documentElement.scrollTop;
            if (y > 0) {
                window.requestAnimationFrame(smoothScroll);
                window.scrollTo(0, y - y / 5);
            }
        };
        smoothScroll();
    };

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper>
                {game === undefined ? (
                    <LinearProgress />
                ) : game.length === 0 ? (
                    <SimpleTitle data="No data." />
                ) : (
                    <>
                        {game.length > 1 && (
                            <Tabs
                                value={tab}
                                onChange={handleTab}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                {game.map((campaign) => (
                                    <Tab label={campaign.name} key={campaign.name} />
                                ))}
                            </Tabs>
                        )}
                        {game.map((campaign, idx) => (
                            <TabPanel value={tab} index={idx} key={campaign.name}>
                                <Grid container direction="column" justify="center">
                                    <Grid item xs={12}>
                                        <RecordsTable
                                            data={campaign.tracks}
                                            game={match.params[0]}
                                            total={campaign.stats.totalTime}
                                            isLatest={match.params.date === undefined}
                                        />
                                    </Grid>
                                    <Grid item xs={12} style={{ paddingTop: '70px' }}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={6}>
                                                <RankingsTable data={campaign.leaderboard} game={match.params[0]} />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Grid container direction="column" justify="center">
                                                    <Grid item xs={6}>
                                                        <RecordsChart
                                                            title="WRs"
                                                            labels={campaign.leaderboard.map((row) => row.user.name)}
                                                            series={campaign.leaderboard.map((row) => row.wrs)}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={6} style={{ paddingTop: '70px' }}>
                                                        <RecordsChart
                                                            title="Duration"
                                                            labels={campaign.leaderboard.map((row) => row.user.name)}
                                                            series={campaign.leaderboard.map((row) => row.duration)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </TabPanel>
                        ))}
                    </>
                )}
            </Paper>
            <Zoom in={game !== undefined} timeout={1000}>
                <Fab title="Jump to top" color="primary" className={classes.fab} onClick={jumpToTop}>
                    <KeyboardArrowUpIcon />
                </Fab>
            </Zoom>
        </ViewContent>
    );
};

export default withRouter(GameView);
