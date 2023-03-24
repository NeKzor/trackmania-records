import React from 'react';
import moment from 'moment-timezone';
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
import { api2, trackmaniaApi } from '../../Api';
import { useIsMounted } from '../../Hooks';
import AppState from '../../AppState';
import { Permissions } from '../../models/Permissions';
import { seasonMenu, yearMenu, getTotdMenu } from './CampaignMenus';

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

const CampaignTab = ({ campaign, onChangeCampaign, onChangeYear, isOfficial, year }) => {
    const {
        state: { user },
    } = React.useContext(AppState);

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

        trackmaniaApi
            .getCampaign(campaign)
            .then((campaign) => {
                const rows = [];
                for (const track of campaign.tracks) {
                    for (const wr of track.wrs) {
                        const wrDate = moment(wr.date);
                        const releasedAt = !campaign.isOfficial
                            ? moment()
                                  .tz('Europe/Paris')
                                  .set({
                                      year: campaign.year,
                                      month: campaign.month - 1,
                                      date: track.monthDay,
                                      hour: 19,
                                      minute: 0,
                                      second: 0,
                                  })
                                  .utc()
                            : undefined;

                        const setAfter = !campaign.isOfficial ? calculateSetAfter(releasedAt, wrDate) : undefined;

                        const isLast = wr === track.wrs.at(track.wrs.length - 1);
                        const history = isLast && (track.history || []).length > 1 ? track.history : undefined;

                        if (history && !campaign.isOfficial) {
                            history.forEach((historyWr) => {
                                const historyWrDate = moment(historyWr.date);
                                historyWr.setAfter = calculateSetAfter(releasedAt, historyWrDate);
                                historyWr.pastMinutes = historyWrDate.diff(releasedAt, 'minutes');
                                historyWr.replayUrl = api2.replayUrl(historyWr.replay);
                            });
                        } else if (history) {
                            history.forEach((historyWr) => {
                                historyWr.replayUrl = api2.replayUrl(historyWr.replay);
                            });
                        }

                        rows.push({
                            track: {
                                id: track.id,
                                uid: track.uid,
                                name: track.name.replace(/(\$[0-9a-fA-F]{1,3}|\$[WNOITSGZBEMwnoitsgzbem]{1})/g, ''),
                                monthDay: track.monthDay,
                                isFirst: wr === track.wrs.at(0),
                                isLast,
                                records: track.wrs.length,
                                history,
                            },
                            ...wr,
                            replayUrl: api2.replayUrl(wr.replay),
                            replayUrlPublic: `https://prod.trackmania.core.nadeo.online/storageObjects/${wr.replay}`,
                            zone: (wr.user.zone.at(2) ? wr.user.zone.at(2) : wr.user.zone.at(0)).name,
                            setAfter,
                        });
                    }
                }

                campaign.tracks = rows;

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
    }, [isMounted, campaign]);

    const showDownloadButton = React.useMemo(() => {
        return user.isLoggedIn() && user.hasPermission(Permissions.trackmania_DOWNLOAD_FILES);
    }, [user.profile]);

    const rankingsCountryType = rankingsType
        .replace('Leaderboard', 'CountryLeaderboard')
        .replace('leaderboard', 'countryLeaderboard');

    const classes = useStyles();

    return (
        <>
            {isOfficial ? (
                <FormControl className={classes.formControl}>
                    <InputLabel>Campaign</InputLabel>
                    <Select value={campaign} onChange={onChangeCampaign}>
                        {seasonMenu}
                    </Select>
                </FormControl>
            ) : (
                <>
                    <FormControl className={classes.formControl}>
                        <InputLabel>Year</InputLabel>
                        <Select value={year} onChange={onChangeYear}>
                            {yearMenu}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel>Month</InputLabel>
                        <Select value={campaign} onChange={onChangeCampaign}>
                            {getTotdMenu(year)}
                        </Select>
                    </FormControl>
                </>
            )}
            {game === null && <SimpleTitle data="No data." />}
            {game === undefined && <LinearProgress />}
            <Grid container direction="column" justifyContent="center">
                {game !== undefined && game !== null && (
                    <>
                        <Grid item xs={12}>
                            <RecordsTable
                                data={game.tracks}
                                stats={game.stats}
                                official={game.isOfficial}
                                showDownloadButton={showDownloadButton}
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
                            <Grid container direction="row" justifyContent="center" alignContent="center">
                                <Grid item xs={12} md={6}>
                                    <RankingsTable
                                        data={game[rankingsType]}
                                        hasDuration={game.isOfficial && rankingsType !== 'uniqueLeaderboard'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} className={classes.padTop}>
                                    <Grid container direction="column" justifyContent="center">
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
                                                        .map(
                                                            (row) =>
                                                                (row.zone.at(2) ? row.zone.at(2) : row.zone.at(0)).name,
                                                        )
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
                                                        (row) =>
                                                            (row.zone.at(2) ? row.zone.at(2) : row.zone.at(0)).name,
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
