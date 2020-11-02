import React from 'react';
import { withRouter } from 'react-router';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import FloatingActionButton from '../components/FloatingActionButton';
import ViewContent from './ViewContent';
import CampaignTab from '../components/trackmania/CampaignTab';
import RankingsTab from '../components/trackmania/RankingsTab';
import { seasonMenu, totdMenu } from '../components/trackmania/CampaignMenus';

const TrackmaniaView = ({ match }) => {
    const [tab, setTab] = React.useState(0);
    const [campaign, setCampaign] = React.useState((tab === 0 ? seasonMenu : totdMenu)[0].props.value);

    const page = match.params[0];

    React.useEffect(() => {
        setTab(0);
    }, [page]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
        setCampaign((newValue === 0 ? seasonMenu : totdMenu)[0].props.value);
    };

    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
        },
        [setCampaign],
    );

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
                    <Tab label="Track of the Day" />
                    <Tab label="Rankings" />
                </Tabs>
                <Typography component="div" role="tabpanel">
                    <Box p={3}>
                        {(tab === 0 || tab === 1) && (
                            <CampaignTab
                                campaign={campaign}
                                onChangeCampaign={onChangeCampaign}
                                isOfficial={tab === 0}
                            />
                        )}
                        {tab === 2 && <RankingsTab />}
                    </Box>
                </Typography>
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(TrackmaniaView);
