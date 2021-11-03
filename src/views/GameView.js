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
import RankingsTable from '../components/RankingsTable';
import RecordsTable from '../components/RecordsTable';
import RecordsTableSrcom from '../components/RecordsTableSrcom';
import SimpleTitle from '../components/SimpleTitle';
import RecordsChart from '../components/RecordsChart';
import { makeStyles } from '@material-ui/core';
import FloatingActionButton from '../components/FloatingActionButton';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';

const useStyles = makeStyles((_) => ({
    padTop: {
        paddingTop: '70px',
    },
}));

const GameView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [gameName, setGameName] = React.useState('tm2');
    const [tab, setTab] = React.useState(0);

    const page = match.params[0];
    const date = match.params.date;
    const useLiveDuration = date === undefined || date === 'latest';

    React.useEffect(() => {
        setTab(0);
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        Api.request(page, date)
            .then((game) => {
                if (game[0] && game[0].tracks[0].wrs) {
                    for (const campaign of game) {
                        if (campaign.stats.totalPoints === undefined) {
                            campaign.stats.totalTime = campaign.tracks
                                .filter((t) => t.type !== 'Stunts')
                                .map((t) => t.wrs[0].score)
                                .reduce((a, b) => a + b, 0);
                            campaign.stats.totalPoints = campaign.tracks
                                .filter((t) => t.type === 'Stunts')
                                .map((t) => t.wrs[0].score)
                                .reduce((a, b) => a + b, 0);
                        }
    
                        const rows = [];
                        for (const track of campaign.tracks) {
                            for (const wr of track.wrs) {
                                const duration = useLiveDuration ? moment().diff(moment(wr.date), 'd') : wr.duration;
                                rows.push({
                                    track: {
                                        id: track.id,
                                        name: track.name,
                                        type: track.type,
                                        isFirst: wr === track.wrs[0],
                                        records: track.wrs.length,
                                    },
                                    ...wr,
                                    duration,
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
                setGameName(page);
                setGame(game);
            })
            .catch(console.error);
    }, [isMounted, page, date, useLiveDuration]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
    };

    const Table = gameName === 'tmwii' ? RecordsTableSrcom : RecordsTable;

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
                                        <Table
                                            data={game[tab].tracks}
                                            game={gameName}
                                            stats={game[tab].stats}
                                            useLiveDuration={useLiveDuration}
                                            category={game[tab].name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} className={classes.padTop}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12} md={6}>
                                                <RankingsTable
                                                    data={game[tab].leaderboard}
                                                    game={page}
                                                    hasDuration={true}
                                                />
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
                                                            title="Duration"
                                                            labels={game[tab].leaderboard.map((row) => row.user.name)}
                                                            series={game[tab].leaderboard.map((row) => row.duration)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
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
