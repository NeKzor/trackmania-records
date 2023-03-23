import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import RankingsTable from '../RankingsTableTrackmania';
import CompetitionsTable from '../CompetitionsTableTrackmania';
import RecordsChart from '../RecordsChart';
import SimpleTitle from '../SimpleTitle';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { trackmaniaApi } from '../../Api';
import { useIsMounted } from '../../Hooks';
import {
    getYearMenu,
    competitionMenu,
    getCotdMenu,
    getCotdTimeslotMenu,
    getSuperRoyalMenu,
    getSuperRoyalTimeslotMenu,
} from './CompetitionsMenus';

const useStyles = makeStyles((theme) => ({
    padTop: {
        paddingTop: '70px',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const CompetitionsTab = ({
    competition,
    onChangeCompetition,
    onChangeYear,
    onChangeMonth,
    onChangeTimeslot,
    year,
    month,
    timeslot,
}) => {
    const isMounted = useIsMounted();
    const isCotd = competition === 'cotd';
    const isA08Forever = competition === 'a08forever';
    const isSuperRoyal = competition === 'superroyal';

    const [game, setGame] = React.useState(undefined);
    const [stats, setStats] = React.useState(undefined);

    React.useEffect(() => {
        setGame(undefined);

        trackmaniaApi
            .getCompetition(
                competition,
                isCotd || isSuperRoyal ? `${year}/${month}${timeslot ? '/' + timeslot : ''}` : year,
            )
            .then((rows) => {
                if (isMounted.current) {
                    setGame(rows);
                }
            })
            .catch((error) => {
                console.log(error);

                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [isMounted, competition, year, month, timeslot]);

    React.useEffect(() => {
        setStats(undefined);

        trackmaniaApi
            .getCompetitionRankings(competition, isCotd || isSuperRoyal ? timeslot : undefined)
            .then((rows) => {
                if (isMounted.current) {
                    setStats(rows);
                }
            })
            .catch((error) => {
                console.log(error);

                if (isMounted.current) {
                    setStats(null);
                }
            });
    }, [isMounted, competition, timeslot]);

    const classes = useStyles();

    return (
        <>
            <>
                <FormControl className={classes.formControl}>
                    <InputLabel>Competition</InputLabel>
                    <Select value={competition} onChange={onChangeCompetition}>
                        {competitionMenu}
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <InputLabel>Year</InputLabel>
                    <Select value={year} onChange={onChangeYear}>
                        {getYearMenu(competition)}
                    </Select>
                </FormControl>
                {isCotd && (
                    <>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Month</InputLabel>
                            <Select value={month} onChange={onChangeMonth}>
                                {getCotdMenu(year)}
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Timeslot</InputLabel>
                            <Select value={timeslot} onChange={onChangeTimeslot}>
                                {getCotdTimeslotMenu()}
                            </Select>
                        </FormControl>
                    </>
                )}
                {isSuperRoyal && (
                    <>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Month</InputLabel>
                            <Select value={month} onChange={onChangeMonth}>
                                {getSuperRoyalMenu(year)}
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Timeslot</InputLabel>
                            <Select value={timeslot} onChange={onChangeTimeslot}>
                                {getSuperRoyalTimeslotMenu()}
                            </Select>
                        </FormControl>
                    </>
                )}
            </>
            {game === null && <SimpleTitle data="No data." />}
            {game === undefined && <LinearProgress />}
            <Grid container direction="column" justifyContent="center">
                {game !== undefined && game !== null && (
                    <>
                        <Grid item xs={12}>
                            <CompetitionsTable
                                data={game}
                                stats={game.stats}
                                isCotd={isCotd}
                                isSuperRoyal={isSuperRoyal}
                            />
                        </Grid>
                    </>
                )}
                <Grid item xs={12} className={classes.padTop}>
                    <Typography variant="h5">Overall Statistics</Typography>
                    <br />
                    {stats === null && <SimpleTitle data="No data." />}
                    {stats === undefined && <LinearProgress />}
                    {stats !== undefined && stats !== null && (
                        <Grid container direction="row" justifyContent="center" alignContent="center">
                            <Grid item xs={12} md={6}>
                                <RankingsTable
                                    data={stats.leaderboard}
                                    hasDuration={false}
                                    isCompetition={true}
                                    showQualifiers={isCotd || isA08Forever}
                                    showQualifierAndMatchWin={isCotd}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} className={classes.padTop}>
                                <Grid container direction="column" justifyContent="center">
                                    <Grid item xs={12}>
                                        <RecordsChart
                                            title="Wins"
                                            labels={stats.leaderboard.map((row) => row.user.displayName)}
                                            series={stats.leaderboard.map((row) => row.wins.matches)}
                                        />
                                    </Grid>
                                    {!isSuperRoyal && (
                                        <Grid item xs={12} className={classes.padTop}>
                                            <RecordsChart
                                                title="Wins by Zone"
                                                labels={stats.countryLeaderboard.map(
                                                    (row) => (row.zone[2] ? row.zone[2] : row.zone[0]).name,
                                                )}
                                                series={stats.countryLeaderboard.map((row) => row.wins.matches)}
                                            />
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </>
    );
};

export default CompetitionsTab;
