import React from 'react';
import { withRouter } from 'react-router';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
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

const GameView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [tab, setTab] = React.useState(0);

    React.useEffect(() => {
        (async () => {
            console.log('call');
            let game = await Api.request(match.params[0], match.params.date);
            if (!isMounted.current) return;
            setGame(game);
        })();
    }, [isMounted, match.params]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
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
                                <RecordsTable data={campaign.tracks} game={match.params[0]} total={campaign.stats.totalTime} />
                            </TabPanel>
                        ))}
                    </>
                )}
            </Paper>
        </ViewContent>
    );
};

export default withRouter(GameView);
