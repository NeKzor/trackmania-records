import React from 'react';
import { Pie } from 'react-chartjs-2';
import { withRouter } from 'react-router';
import moment from 'moment';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import RankingsTable from '../components/RankingsTable';
import RecordsTable from '../components/RecordsTable';
import SimpleTitle from '../components/SimpleTitle';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';

const TabPanel = ({ children, value, index, ...other }) => {
    return (
        <Typography component="div" role="tabpanel" hidden={value !== index} id={`scrollable-auto-tabpanel-${index}`} {...other}>
            <Box p={3}>{children}</Box>
        </Typography>
    );
};

const RecordsPlot = ({ data }) => {
    let backgroundColor = data.map(
        (row) =>
            '#' +
            Math.random()
                .toString(16)
                .slice(2, 8)
                .toUpperCase(),
    );
    return (
        <div>
            <Pie
                width={250}
                height={250}
                options={{ maintainAspectRatio: false }}
                data={{
                    labels: data.map((row) => row.user.name),
                    datasets: [
                        {
                            data: data.map((row) => row.wrs),
                            backgroundColor,
                        },
                    ],
                }}
            />
        </div>
    );
};

const GameView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [tab, setTab] = React.useState(0);

    React.useEffect(() => {
        (async () => {
            let game = await Api.request(match.params[0], match.params.date);
            if (!isMounted.current) return;
            setGame(game);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted, match.params[0], match.params.date]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
    };

    const calcDuration = (id, tracks) => {
        return tracks
            .map((track) => track.wrs)
            .reduce((acc, val) => acc.concat(val), [])
            .filter((wr) => wr.user.id === id)
            .map((wr) => moment().diff(moment(wr.date), 'd'))
            .reduce((a, b) => a + b, 0);
    };

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
                                        <RecordsTable data={campaign.tracks} game={match.params[0]} total={campaign.stats.totalTime} />
                                    </Grid>
                                    <Grid item xs={12} style={{ paddingTop: '70px' }}>
                                        <Grid container direction="row" justify="center">
                                            <Grid item xs={6}>
                                                <RankingsTable
                                                    data={campaign.leaderboard.map((row) => ({
                                                        ...row,
                                                        duration: calcDuration(row.user.id, campaign.tracks),
                                                    }))}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <RecordsPlot data={campaign.leaderboard} />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </TabPanel>
                        ))}
                    </>
                )}
            </Paper>
        </ViewContent>
    );
};

export default withRouter(GameView);
