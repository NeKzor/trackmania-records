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
import { api2 } from '../../Api';
import { useIsMounted, useRenders } from '../../Hooks';

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
    const [type, setType] = React.useState('longestLasting');
    const [trackType, setTrackType] = React.useState('Race');

    const onChangeType = React.useCallback(
        (event) => {
            setType(event.target.value);
        },
        [setType],
    );
    const onChangeTrackType = React.useCallback(
        (event) => {
            setTrackType(event.target.value);
        },
        [setTrackType],
    );
    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
            setTrackType(
                game ? game.find((campaign) => campaign.name === event.target.value)[type][0].track.type : 'Race',
            );
        },
        [game, setCampaign, setTrackType],
    );

    React.useEffect(() => {
        setGame(undefined);

        api2.getGameStats(gameName)
            .then((game) => {
                if (isMounted.current) {
                    setGame(game);
                    setCampaign(game[0].name);
                    setTrackType(game[0][type][0].track.type);
                }
            })
            .catch((error) => {
                console.error(error);
                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [setGame, setCampaign, setTrackType, isMounted]);

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
            {campaignName && game && game.length > 1 && (
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
            {currentCampaign && new Set(currentCampaign[type].map(({ track }) => track.type)).size > 1 && (
                <FormControl className={classes.formControl}>
                    <InputLabel>Track Type</InputLabel>
                    <Select value={trackType} onChange={onChangeTrackType}>
                        <MenuItem value={'Race'}>Race</MenuItem>
                        <MenuItem value={'Stunts'}>Stunts</MenuItem>
                    </Select>
                </FormControl>
            )}
            {currentCampaign === null && <SimpleTitle data="No data." />}
            {currentCampaign === undefined && <LinearProgress />}
            {currentCampaign !== null && currentCampaign !== undefined && (
                <Grid container direction="column" justifyContent="center">
                    <Grid item xs={12}>
                        <Grid container direction="row" justifyContent="center" alignContent="center">
                            <Grid item xs={12}>
                                {currentCampaign && currentCampaign[type] && (
                                    <StatsComponent
                                        game={gameName}
                                        data={currentCampaign[type].filter(({ track }) => track.type === trackType)}
                                        trackType={trackType}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            )}
        </>
    );
};

export default StatisticsTab;
