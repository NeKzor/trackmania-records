import React from 'react';
import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ViewContent from './ViewContent';

const useStyles = makeStyles((theme) => ({
    aboutBox: {
        padding: theme.spacing(3),
    },
}));

const AboutView = () => {
    const description = [
        'This web app mirrors TrackMania Exchange nadeo records.',
        'Additionally it ranks players based on how many world records they hold and how long their records have been lasting.',
    ].map((text, idx) => (
        <ListItem key={idx}>
            <Typography variant="body1">{text}</Typography>
        </ListItem>
    ));

    const openSourceLink = (
        <Link rel="noopener" href="https://github.com/NeKzor/tmx-records">
            GitHub
        </Link>
    );

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper className={classes.aboutBox}>
                <List dense>
                    <ListItem>
                        <Typography component="h2" variant="h5">
                            TrackMania Exchange Records & Statistics
                        </Typography>
                    </ListItem>
                    {description}
                    <ListItem></ListItem>
                    <ListItem>
                        <Typography variant="subtitle1">
                            Credits:{' '}
                            <Link rel="noopener" href="http://www.tm-exchange.com">
                                tm-exchange.com
                            </Link>
                            ,&nbsp;
                            <Link rel="noopener" href="https://tm.mania-exchange.com">
                                tm.mania-exchange.com
                            </Link>
                        </Typography>
                    </ListItem>
                    <ListItem></ListItem>
                    <ListItem>
                        <Typography variant="subtitle1">Project is open source at {openSourceLink}.</Typography>
                    </ListItem>
                </List>
            </Paper>
        </ViewContent>
    );
};

export default AboutView;
