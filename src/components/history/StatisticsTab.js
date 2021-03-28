import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import RecordsChart from '../RecordsChart';
import UniqueRecordsChart from '../UniqueRecordsChart';
import LongestDomination from '../LongestDomination';
import LongestLasting from '../LongestLasting';
import LargestImprovement from '../LargestImprovement';
import RankingsTable from '../RankingsTableTrackmania';
import SimpleTitle from '../SimpleTitle';
import Api from '../../Api';
import { useIsMounted } from '../../Hooks';

const useStyles = makeStyles((theme) => ({
    padTop: {
        paddingTop: '70px',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const StatisticsTab = ({ gameName }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [campaignName, setCampaign] = React.useState(undefined);
    const [rankingsType, setRankingsType] = React.useState('leaderboard');
    const [type, setType] = React.useState('longestLasting');

    const onChangeType = React.useCallback(
        (event) => {
            setType(event.target.value);
        },
        [setType],
    );
    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
        },
        [setCampaign],
    );
    const onChangeRankingsType = React.useCallback(
        (event) => {
            setRankingsType(event.target.value);
        },
        [setRankingsType],
    );

    React.useEffect(() => {
        setGame(undefined);

        Api.request(gameName, 'stats')
            .then((game) => {
                if (isMounted.current) {
                    setGame(game);
                    setCampaign(game[0].name);
                }
            })
            .catch((error) => {
                console.error(error);
                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [setGame, isMounted]);

    const StatsComponent = (() => {
        switch (type) {
            case 'longestDomination':
                return LongestDomination;
            case 'longestLasting':
                return LongestLasting;
            case 'largestImprovement':
                return LargestImprovement;
            default:
                return null;
        }
    })();

    const classes = useStyles();

    const currentCampaign = game ? game.find((campaign) => campaign.name === campaignName) : undefined;

    return (
        <>
            {(campaignName && game && game.length > 1) && (
                <FormControl className={classes.formControl}>
                    <InputLabel>Campaign</InputLabel>
                    <Select value={campaignName} onChange={onChangeCampaign}>
                        {game.map((campaign) => {
                            return (
                                <MenuItem value={campaign.name} key={campaign.name}>
                                    {campaign.name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            )}
            <FormControl className={classes.formControl}>
                <InputLabel>Stats Type</InputLabel>
                <Select value={type} onChange={onChangeType}>
                    <MenuItem value={'longestLasting'}>Longest Lasting</MenuItem>
                    <MenuItem value={'longestDomination'}>Longest Domination</MenuItem>
                    <MenuItem value={'largestImprovement'}>Largest Improvement</MenuItem>
                </Select>
            </FormControl>
            <Grid container direction="column" justify="center">
                <Grid item xs={12}>
                    <Grid container direction="row" justify="center" alignContent="center">
                        <Grid item xs={12}>
                            {currentCampaign && currentCampaign[type] && (
                                <StatsComponent game={gameName} data={currentCampaign[type]} />
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};

export default StatisticsTab;
