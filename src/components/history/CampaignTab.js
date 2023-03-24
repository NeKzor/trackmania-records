import React from 'react';
import moment from 'moment-timezone';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import RankingsTable from '../RankingsTable';
import RecordsTable from '../RecordsTableHistory';
import RecordsChart from '../RecordsChart';
import SimpleTitle from '../SimpleTitle';
import UniqueRecordsChart from '../UniqueRecordsChart';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import { api2 } from '../../Api';
import { useIsMounted } from '../../Hooks';
import { campaignMenu, getInitialCampaignValue } from './CampaignMenu';

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
    const [campaignName, setCampaign] = React.useState(getInitialCampaignValue(gameName));
    const [rankingsType] = React.useState('leaderboard');

    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
        },
        [setCampaign],
    );

    React.useEffect(() => {
        setGame(undefined);

        api2.getGameCampaign(gameName, campaignName)
            .then((campaign) => {
                const game = [];
                const rows = [];

                for (const track of campaign.tracks) {
                    for (const wr of track.wrs) {
                        const isLast = wr === track.wrs[track.wrs.length - 1];
                        const history = isLast && (track.history || []).length > 1 ? track.history : undefined;

                        rows.push({
                            track: {
                                id: track.id,
                                name: track.name.replace(/(\$[0-9a-fA-F]{3}|\$[WNOITSGZBEMwnoitsgzbem]{1})/g, ''),
                                isFirst: wr === track.wrs.at(0),
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

                if (isMounted.current) {
                    setGame(game);
                    setCampaign(game.at(0)?.name);
                }
            })
            .catch((error) => {
                console.log(error);

                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [isMounted, gameName, campaignName, setCampaign, setGame]);

    const classes = useStyles();

    const currentCampaign = game ? game.find((campaign) => campaign.name === campaignName) : undefined;

    return (
        <>
            {(campaignName && campaignMenu[campaignName] && campaignMenu[campaignName].length > 1) && (
                <FormControl className={classes.formControl}>
                    <InputLabel>Campaign</InputLabel>
                    <Select value={campaignName} onChange={onChangeCampaign}>
                        {campaignMenu[campaignName].map((campaign) => {
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
            <Grid container direction="column" justifyContent="center">
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
                            <Grid container direction="row" justifyContent="center" alignContent="center">
                                <Grid item xs={12} md={6}>
                                    <RankingsTable
                                        game={gameName}
                                        data={currentCampaign[rankingsType]}
                                        hasDuration={rankingsType !== 'uniqueLeaderboard'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} className={classes.padTop}>
                                    <Grid container direction="column" justifyContent="center">
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
