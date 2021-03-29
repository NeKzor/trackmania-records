import React from 'react';
import moment from 'moment-timezone';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import RankingsTable from '../RankingsTableTrackmania';
import RecordsTable from '../RecordsTableHistory';
import RecordsChart from '../RecordsChart';
import SimpleTitle from '../SimpleTitle';
import UniqueRecordsChart from '../UniqueRecordsChart';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
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

const CampaignTab = ({ gameName }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [campaignName, setCampaign] = React.useState(undefined);
    const [rankingsType, setRankingsType] = React.useState('leaderboard');

    const onChangeRankingsType = React.useCallback(
        (event) => {
            setRankingsType(event.target.value);
        },
        [setRankingsType],
    );

    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
        },
        [setCampaign],
    );

    React.useEffect(() => {
        setGame(undefined);

        Api.request(gameName)
            .then((campaigns) => {
                const game = [];
                for (const campaign of campaigns) {
                    const rows = [];
                    for (const track of campaign.tracks) {
                        for (const wr of track.wrs) {
                            const isLast = wr === track.wrs[track.wrs.length - 1];
                            const history = isLast && (track.history || []).length > 1 ? track.history : undefined;

                            rows.push({
                                track: {
                                    id: track.id,
                                    name: track.name.replace(/(\$[0-9a-fA-F]{3}|\$[WNOITSGZBEMwnoitsgzbem]{1})/g, ''),
                                    isFirst: wr === track.wrs[0],
                                    isLast,
                                    records: track.wrs.length,
                                    history,
                                    type: track.type,
                                },
                                ...wr,
                            });
                        }
                    }
    
                    campaign.tracks = rows;
                    game.push(campaign);
                }

                if (isMounted.current) {
                    setGame(game);
                    setCampaign(game[0].name);
                }
            })
            .catch((error) => {
                console.log(error);

                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [isMounted, setCampaign, setGame]);

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
            {currentCampaign === null && <SimpleTitle data="No data." />}
            {currentCampaign === undefined && <LinearProgress />}
            <Grid container direction="column" justify="center">
                {currentCampaign !== undefined && currentCampaign !== null && (
                    <>
                        <Grid item xs={12}>
                            <RecordsTable
                                game={gameName}
                                data={currentCampaign.tracks}
                                stats={currentCampaign.stats}
                            />
                        </Grid>
                        <Grid item xs={12} className={classes.padTop}>
                            {/* <FormControl className={classes.formControl}>
                                <InputLabel>Rankings Type</InputLabel>
                                <Select value={rankingsType} onChange={onChangeRankingsType}>
                                    <MenuItem value={'leaderboard'}>Live</MenuItem>
                                    <MenuItem value={'uniqueLeaderboard'}>Unique</MenuItem>
                                    <MenuItem value={'historyLeaderboard'}>Total</MenuItem>
                                </Select>
                            </FormControl> */}
                            <Grid container direction="row" justify="center" alignContent="center">
                                <Grid item xs={12} md={6}>
                                    <RankingsTable
                                        data={currentCampaign[rankingsType]}
                                        hasDuration={rankingsType !== 'uniqueLeaderboard'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} className={classes.padTop}>
                                    <Grid container direction="column" justify="center">
                                        <Grid item xs={12}>
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
                        </Grid>
                    </>
                )}
            </Grid>
        </>
    );
};

export default CampaignTab;
