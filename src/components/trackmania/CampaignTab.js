import React from 'react';
import moment from 'moment';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import RankingsTable from '../RankingsTableTrackmania';
import RecordsTable from '../RecordsTableTrackmania';
import RecordsChart from '../RecordsChart';
import SimpleTitle from '../SimpleTitle';
import UniqueRecordsChart from '../UniqueRecordsChart';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Api from '../../Api';
import { useIsMounted } from '../../Hooks';
import { seasonMenu, totdMenu } from './CampaignMenus';

const s = (value) => (value === 1 ? '' : 's');

const calculateSetAfter = (releasedAt, wrDate) => {
    const diffSeconds = wrDate.diff(releasedAt, 'seconds');
    const setAfterHours = wrDate.diff(releasedAt, 'hours');
    if (diffSeconds > 0) {
        const setAfterMinutes = wrDate.diff(releasedAt, 'minutes') - setAfterHours * 60;
        return `set after ${setAfterHours} hour${s(setAfterHours)} and ${setAfterMinutes} minute${s(setAfterMinutes)}`;
    } else {
        const setBeforeHours = -setAfterHours;
        const setBeforeMinutes = -wrDate.diff(releasedAt, 'minutes') - setBeforeHours * 60;
        return `set before ${setBeforeHours} hour${s(setBeforeHours)} and ${setBeforeMinutes} minute${s(
            setBeforeMinutes,
        )}`;
    }
};

const useStyles = makeStyles((theme) => ({
    padTop: {
        paddingTop: '70px',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const CampaignTab = ({ campaign, onChangeCampaign, useLiveDuration, isOfficial }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [rankingsType, setRankingsType] = React.useState('leaderboard');

    const onChangeRankingsType = React.useCallback(
        (event) => {
            setRankingsType(event.target.value);
        },
        [setRankingsType],
    );

    React.useEffect(() => {
        setGame(undefined);

        Api.request('trackmania', campaign)
            .then((campaign) => {
                if (campaign.stats.totalPoints === undefined) {
                    campaign.stats.totalTime = campaign.tracks.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);
                }

                const rows = [];
                for (const track of campaign.tracks) {
                    for (const wr of track.wrs) {
                        const wrDate = moment(wr.date);
                        const duration = useLiveDuration ? moment().diff(wrDate, 'd') : wr.duration;
                        const releasedAt = !campaign.isOfficial
                            ? moment([campaign.year, campaign.month]).utc().set({
                                  date: track.monthDay,
                                  hour: 17,
                                  minute: 0,
                                  second: 0,
                              })
                            : undefined;

                        const setAfter = !campaign.isOfficial ? calculateSetAfter(releasedAt, wrDate) : undefined;

                        const isLast = wr === track.wrs[track.wrs.length - 1];
                        const history = isLast && (track.history || []).length > 1 ? track.history : undefined;

                        if (history && !campaign.isOfficial) {
                            history.forEach((historyWr) => {
                                const historyWrDate = moment(historyWr.date);
                                historyWr.setAfter = calculateSetAfter(releasedAt, historyWrDate);
                                historyWr.pastMinutes = historyWrDate.diff(releasedAt, 'minutes');
                            });
                        }

                        rows.push({
                            track: {
                                id: track.id,
                                name: track.name.replace(/(\$[0-9a-fA-F]{3}|\$[WNOITSGZBEMwnoitsgzbem]{1})/g, ''),
                                monthDay: track.monthDay,
                                isFirst: wr === track.wrs[0],
                                isLast,
                                records: track.wrs.length,
                                history,
                            },
                            ...wr,
                            duration,
                            setAfter,
                        });
                    }
                }

                campaign.tracks = rows;

                if (useLiveDuration) {
                    campaign.leaderboard.forEach((entry, idx) => {
                        campaign.leaderboard[idx].duration = campaign.tracks
                            .filter((r) => r.user.id === entry.user.id)
                            .map((r) => r.duration)
                            .reduce((a, b) => a + b, 0);
                    });
                }

                if (isMounted.current) {
                    setGame(campaign);
                }
            })
            .catch((error) => {
                console.log(error);

                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [isMounted, useLiveDuration, campaign]);

    const rankingsCountryType = rankingsType
        .replace('Leaderboard', 'CountryLeaderboard')
        .replace('leaderboard', 'countryLeaderboard');

    const classes = useStyles();

    return (
        <>
            <FormControl className={classes.formControl}>
                <InputLabel>Campaign</InputLabel>
                <Select value={campaign} onChange={onChangeCampaign}>
                    {isOfficial ? seasonMenu : totdMenu}
                </Select>
            </FormControl>
            {game === null && <SimpleTitle data="No data." />}
            {game === undefined && <LinearProgress />}
            <Grid container direction="column" justify="center">
                {game !== undefined && game !== null && (
                    <>
                        <Grid item xs={12}>
                            <RecordsTable
                                data={game.tracks}
                                stats={game.stats}
                                official={game.isOfficial}
                                useLiveDuration={useLiveDuration}
                            />
                        </Grid>
                        <Grid item xs={12} className={classes.padTop}>
                            <FormControl className={classes.formControl}>
                                <InputLabel>Rankings Type</InputLabel>
                                <Select value={rankingsType} onChange={onChangeRankingsType}>
                                    <MenuItem value={'leaderboard'}>Live</MenuItem>
                                    <MenuItem value={'uniqueLeaderboard'}>Unique</MenuItem>
                                    <MenuItem value={'historyLeaderboard'}>Total</MenuItem>
                                </Select>
                            </FormControl>
                            <Grid container direction="row" justify="center" alignContent="center">
                                <Grid item xs={12} md={6}>
                                    <RankingsTable
                                        data={game[rankingsType]}
                                        hasDuration={game.isOfficial && rankingsType !== 'uniqueLeaderboard'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} className={classes.padTop}>
                                    <Grid container direction="column" justify="center">
                                        <Grid item xs={12}>
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
                                                        .map((row) => (row.zone[2] ? row.zone[2] : row.zone[0]).name)
                                                        .slice(0, 20)}
                                                    series={[
                                                        {
                                                            name: 'Unique WRs by Zone',
                                                            data: game[rankingsCountryType]
                                                                .slice(0, 20)
                                                                .map((row) => row.wrs),
                                                        },
                                                    ]}
                                                />
                                            ) : (
                                                <RecordsChart
                                                    title="WRs by Zone"
                                                    labels={game[rankingsCountryType].map(
                                                        (row) => (row.zone[2] ? row.zone[2] : row.zone[0]).name,
                                                    )}
                                                    series={game[rankingsCountryType].map((row) => row.wrs)}
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
