import React from 'react';
import { withRouter } from 'react-router';
import moment from 'moment';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import RankingsTable from '../components/RankingsTableTrackmania';
import RecordsTable from '../components/RecordsTableTrackmania';
import RecordsChart from '../components/RecordsChart';
import { makeStyles } from '@material-ui/core';
import FloatingActionButton from '../components/FloatingActionButton';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';
import SimpleTitle from '../components/SimpleTitle';
//import OverallTable from '../components/OverallTableTrackmania';

const useStyles = makeStyles((_) => ({
    padTop: {
        paddingTop: '70px',
    },
}));

const GameView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [tab, setTab] = React.useState(0);

    const page = match.params[0];
    const date = match.params.date;
    const useLiveDuration = date === undefined || date === 'latest';

    React.useEffect(() => {
        setTab(0);
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        (async () => {
            const game = await Api.request('trackmania', date);

            if (game[0] && game[0].tracks[0].wrs) {
                for (let campaign of game) {
                    if (campaign.stats.totalPoints === undefined) {
                        campaign.stats.totalTime = campaign.tracks
                            .map((t) => t.wrs[0].score)
                            .reduce((a, b) => a + b, 0);
                    }

                    const rows = [];
                    for (let track of campaign.tracks) {
                        for (let wr of track.wrs) {
                            const wrDate = moment(wr.date);
                            const duration = useLiveDuration ? moment().diff(wrDate, 'd') : wr.duration;

                            let setAfter = undefined;
                            if (!campaign.isOfficial) {
                                const releasedAt = moment([campaign.year, campaign.month]).utc().set({
                                    date: track.monthDay,
                                    hour: 17,
                                    minute: 0,
                                    second: 0,
                                });

                                const setAfterHours = wrDate.diff(releasedAt, 'hours');
                                const setAfterMinutes = wrDate.diff(releasedAt, 'minutes') - setAfterHours * 60;
                                setAfter = `set after ${setAfterHours} hours and ${setAfterMinutes} minutes`;
                            }

                            rows.push({
                                track: {
                                    id: track.id,
                                    name: track.name.replace(/(\$[0-9a-fA-F]{3}|\$[wnoitsgzb]{1})/g, ''),
                                    monthDay: track.monthDay,
                                    isFirst: wr === track.wrs[0],
                                    records: track.wrs.length,
                                },
                                ...wr,
                                duration,
                                setAfter,
                            });
                        }
                    }

                    campaign.tracks = rows;

                    if (useLiveDuration) {
                        campaign.leaderboard.forEach((entry, idx) => {
                            campaign.leaderboard[idx].duration = campaign.tracks
                                .filter((r) => r.user.id === entry.user.id)
                                .map((r) => r.duration)
                                .reduce((a, b) => a + b, 0);
                        });
                    }
                }
            }

            if (!isMounted.current) return;
            setGame(game);
        })();
    }, [isMounted, page, date, useLiveDuration]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
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
                        <Typography component="div" role="tabpanel">
                            <Box p={3}>
                                <Grid container direction="column" justify="center">
                                    <Grid item xs={12}>
                                        <RecordsTable
                                            data={game[tab].tracks}
                                            stats={game[tab].stats}
                                            official={game[tab].isOfficial}
                                            useLiveDuration={useLiveDuration}
                                        />
                                    </Grid>
                                    <Grid item xs={12} className={classes.padTop}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12} md={6}>
                                                <RankingsTable data={game[tab].leaderboard} official={game[tab].isOfficial} />
                                            </Grid>
                                            <Grid item xs={12} md={6} className={classes.padTop}>
                                                <Grid container direction="column" justify="center">
                                                    <Grid item xs={12}>
                                                        <RecordsChart
                                                            title="WRs"
                                                            labels={game[tab].leaderboard.map((row) => row.user.name)}
                                                            series={game[tab].leaderboard.map((row) => row.wrs)}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} className={classes.padTop}>
                                                        <RecordsChart
                                                            title="WRs by Zone"
                                                            labels={game[tab].countryLeaderboard.map(
                                                                (row) => row.zone[2].name,
                                                            )}
                                                            series={game[tab].countryLeaderboard.map((row) => row.wrs)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            {/* <Grid item xs={12} md={6} className={classes.padTop}>
                                                <Typography variant="subtitle1" component="h2" gutterBottom>
                                                    Overall Rankings
                                                </Typography>
                                                <br></br>
                                                <OverallTable data={[]} />
                                            </Grid>
                                            <Grid item xs={12} md={6}></Grid> */}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Typography>
                    </>
                )}
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(GameView);
