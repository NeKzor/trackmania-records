import React from 'react';
import moment from 'moment';
import { withRouter } from 'react-router';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import FloatingActionButton from '../components/FloatingActionButton';
import ViewContent from './ViewContent';
import CampaignTab from '../components/history/CampaignTab';
import RankingsTab from '../components/history/RankingsTab';
import StatisticsTab from '../components/history/StatisticsTab';

const TrackmaniaHistoryView = ({ match }) => {
    const [tab, setTab] = React.useState(0);

    const page = match.params[0];

    React.useEffect(() => {
        setTab(0);
    }, [page]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
    };

    const gameName = match.path.slice(1);

    return (
        <ViewContent>
            <Paper>
                <Tabs
                    value={tab}
                    onChange={handleTab}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Campaign" />
                    <Tab label="Rankings" />
                    <Tab label="Statistics" />
                </Tabs>
                <Typography component="div" role="tabpanel">
                    <Box p={3}>
                        {tab === 0 && <CampaignTab gameName={gameName} />}
                        {tab === 1 && <RankingsTab gameName={gameName} />}
                        {tab === 2 && <StatisticsTab gameName={gameName} />}
                    </Box>
                </Typography>
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(TrackmaniaHistoryView);
