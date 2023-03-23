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
import CampaignTab from '../components/trackmania/CampaignTab';
import CompetitionsTab from '../components/trackmania/CompetitionsTab';
import RankingsTab from '../components/trackmania/RankingsTab';
import { getInitialValue } from '../components/trackmania/CampaignMenus';
import { getInitialCompetitionValue } from '../components/trackmania/CompetitionsMenus';

const TrackmaniaView = ({ match }) => {
    const [tab, setTab] = React.useState(0);
    const [campaign, setCampaign] = React.useState(getInitialValue(tab === 0));
    const [year, setYear] = React.useState(moment().year());
    const [competition, setCompetition] = React.useState('cotd');
    const [competitionYear, setCompetitionYear] = React.useState(moment().year());
    const [competitionMonth, setCompetitionMonth] = React.useState(moment().month() + 1);
    const [competitionTimeslot, setCompetitionTimeslot] = React.useState(1);

    const page = match.path;

    React.useEffect(() => {
        setTab(0);
    }, [page]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
        setCampaign(getInitialValue(newValue === 0, year));
    };

    const onChangeYear = React.useCallback(
        (event) => {
            setYear(event.target.value);
            setCampaign(getInitialValue(false, event.target.value));
        },
        [setYear, setCampaign],
    );

    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
        },
        [setCampaign],
    );

    const onChangeCompetition = React.useCallback(
        (event) => {
            setCompetition(event.target.value);
        },
        [setCompetition],
    );

    const onChangeCompetitionYear = React.useCallback(
        (event) => {
            setCompetitionYear(event.target.value);
            setCompetitionMonth(getInitialCompetitionValue(event.target.value, competition));
        },
        [setCompetitionYear, competition],
    );

    const onChangeCompetitionMonth = React.useCallback(
        (event) => {
            setCompetitionMonth(event.target.value);
        },
        [setCompetitionMonth],
    );

    const onChangeCompetitionTimeslot = React.useCallback(
        (event) => {
            setCompetitionTimeslot(event.target.value);
        },
        [setCompetitionTimeslot],
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
                    <Tab label="Competitions" />
                </Tabs>
                <Typography component="div" role="tabpanel">
                    <Box p={3}>
                        {(tab === 0 || tab === 1) && (
                            <CampaignTab
                                campaign={campaign}
                                onChangeCampaign={onChangeCampaign}
                                onChangeYear={onChangeYear}
                                isOfficial={tab === 0}
                                year={year}
                            />
                        )}
                        {tab === 2 && <RankingsTab />}
                        {tab === 3 && (
                            <CompetitionsTab
                                competition={competition}
                                onChangeCompetition={onChangeCompetition}
                                onChangeYear={onChangeCompetitionYear}
                                onChangeMonth={onChangeCompetitionMonth}
                                onChangeTimeslot={onChangeCompetitionTimeslot}
                                year={competitionYear}
                                month={competitionMonth}
                                timeslot={competitionTimeslot}
                            />
                        )}
                    </Box>
                </Typography>
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(TrackmaniaView);
