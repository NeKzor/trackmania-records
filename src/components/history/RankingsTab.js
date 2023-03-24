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
import RankingsTable from '../RankingsTable';
import SimpleTitle from '../SimpleTitle';
import { api2 } from '../../Api';
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

const RankingsTab = ({ gameName }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [campaignName, setCampaign] = React.useState(undefined);
    const [rankingsType, setRankingsType] = React.useState('leaderboard');

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

        api2.getGameRanks(gameName)
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
                <InputLabel>Rankings Type</InputLabel>
                <Select value={rankingsType} onChange={onChangeRankingsType}>
                    <MenuItem value={'leaderboard'}>Live</MenuItem>
                    <MenuItem value={'uniqueLeaderboard'}>Unique</MenuItem>
                    <MenuItem value={'historyLeaderboard'}>Total</MenuItem>
                </Select>
            </FormControl>
            {currentCampaign === null && <SimpleTitle data="No data." />}
            {currentCampaign === undefined && <LinearProgress />}
            {currentCampaign !== null && currentCampaign !== undefined && (
                <Grid container direction="row" justifyContent="center" alignContent="center">
                    <Grid item xs={12} md={6}>
                        <RankingsTable
                            game={gameName}
                            data={currentCampaign[rankingsType]}
                            hasDuration={rankingsType !== 'uniqueLeaderboard'}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Grid container direction="column" justifyContent="center">
                            <Grid item xs={12} className={classes.padTop}>
                                {rankingsType === 'uniqueLeaderboard' ? (
                                    <UniqueRecordsChart
                                        title="WRs"
                                        labels={currentCampaign[rankingsType].map((row) => row.user.name).slice(0, 20)}
                                        series={[
                                            {
                                                name: 'Unique WRs',
                                                data: currentCampaign[rankingsType].slice(0, 20).map((row) => row.wrs),
                                            },
                                        ]}
                                    />
                                ) : (
                                    <RecordsChart
                                        title="WRs"
                                        labels={currentCampaign[rankingsType].map((row) => row.user.name)}
                                        series={currentCampaign[rankingsType].map((row) => row.wrs)}
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

export default RankingsTab;
