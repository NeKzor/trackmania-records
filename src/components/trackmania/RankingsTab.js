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
import RankingsTable from '../RankingsTableTrackmania';
import SimpleTitle from '../SimpleTitle';
import Api, { trackmaniaApi } from '../../Api';
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

const getZoneName = (row) => {
    return (row.zone.at(2) ? row.zone.at(2) : row.zone.at(0)).name;
};

const RankingsTab = () => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [campaign, setCampaign] = React.useState('campaign');
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

        trackmaniaApi.getRankings(campaign)
            .then((game) => {
                if (isMounted.current) {
                    setGame(game);
                }
            })
            .catch((error) => {
                console.error(error);
                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [setGame, campaign, isMounted]);

    const rankingsCountryType = rankingsType
        .replace('Leaderboard', 'CountryLeaderboard')
        .replace('leaderboard', 'countryLeaderboard');

    const classes = useStyles();

    return (
        <>
            <FormControl className={classes.formControl}>
                <InputLabel>Campaign</InputLabel>
                <Select value={campaign} onChange={onChangeCampaign}>
                    <MenuItem value="campaign">Official</MenuItem>
                    <MenuItem value="totd">TOTD</MenuItem>
                    <MenuItem value="combined">Combined</MenuItem>
                </Select>
            </FormControl>
            <FormControl className={classes.formControl}>
                <InputLabel>Rankings Type</InputLabel>
                <Select value={rankingsType} onChange={onChangeRankingsType}>
                    <MenuItem value={'leaderboard'}>Live</MenuItem>
                    <MenuItem value={'uniqueLeaderboard'}>Unique</MenuItem>
                    <MenuItem value={'historyLeaderboard'}>Total</MenuItem>
                </Select>
            </FormControl>
            {game === null && <SimpleTitle data="No data." />}
            {game === undefined && <LinearProgress />}
            {game !== null && game !== undefined && (
                <Grid container direction="row" justifyContent="center" alignContent="center">
                    <Grid item xs={12} md={6}>
                        <RankingsTable
                            data={game[rankingsType]}
                            hasDuration={campaign === 'rankings/campaign' && rankingsType !== 'uniqueLeaderboard'}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Grid container direction="column" justifyContent="center">
                            <Grid item xs={12} className={classes.padTop}>
                                {rankingsType === 'uniqueLeaderboard' ? (
                                    <UniqueRecordsChart
                                        title="WRs"
                                        labels={game[rankingsType].map((row) => row.user.name).slice(0, 20)}
                                        series={[
                                            {
                                                name: 'Unique WRs',
                                                data: game[rankingsType].slice(0, 20).map((row) => row.wrs),
                                            },
                                        ]}
                                    />
                                ) : (
                                    <RecordsChart
                                        title="WRs"
                                        labels={game[rankingsType].map((row) => row.user.name)}
                                        series={game[rankingsType].map((row) => row.wrs)}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} className={classes.padTop}>
                                {rankingsType === 'uniqueLeaderboard' ? (
                                    <UniqueRecordsChart
                                        title="WRs"
                                        labels={game[rankingsCountryType]
                                            .map(getZoneName)
                                            .slice(0, 20)}
                                        series={[
                                            {
                                                name: 'Unique WRs by Zone',
                                                data: game[rankingsCountryType].slice(0, 20).map((row) => row.wrs),
                                            },
                                        ]}
                                    />
                                ) : (
                                    <RecordsChart
                                        title="WRs by Zone"
                                        labels={game[rankingsCountryType].map(
                                            getZoneName,
                                        )}
                                        series={game[rankingsCountryType].map((row) => row.wrs)}
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
