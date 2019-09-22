import React from 'react';
import { Link as RouterLink, withRouter } from 'react-router-dom';
import MaterialAppBar from '@material-ui/core/AppBar';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import { useTitle } from '../Hooks';

const useStyles = makeStyles((theme) => ({
    root: {
        paddingBottom: theme.spacing(8),
    },
    list: {
        width: theme.spacing(25),
        height: '100%',
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    drawer: {
        width: 240,
        flexShrink: 0,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    flex: {
        flex: 1,
    },
    active: {
        color: theme.palette.primary.main,
    },
}));

const pageLinks = [
    { title: '404 - Page Not Found', link: null, inDrawer: false },
    { title: 'tmx-records', link: '/', inDrawer: false },
    { title: 'TrackMania 2', link: '/tm2', inDrawer: true, default: true },
    { title: 'Nations Forever', link: '/tmnforever', inDrawer: true },
    { title: 'United', link: '/united', inDrawer: true },
    { title: 'Nations ESWC', link: '/nations', inDrawer: true },
    { title: 'Sunrise', link: '/sunrise', inDrawer: true },
    { title: 'Original', link: '/original', inDrawer: true },
    { title: 'Replay Inspection', link: '/replay', inDrawer: false },
    { title: 'About', link: '/about', inDrawer: false },
];

const AppBar = ({ location }) => {
    const [open, setOpen] = React.useState(false);

    const page = React.useMemo(
        () =>
            pageLinks.find((x) => x.link === location.pathname || (x.link !== null && location.pathname.startsWith(x.link + '/'))) ||
            pageLinks[0],
        [location],
    );

    useTitle(page.title);

    const showDrawer = (state) => () => {
        setOpen(state);
    };

    const classes = useStyles();

    const list = (
        <div className={classes.list}>
            <List>
                <ListItem button key={0} component={RouterLink} to={'/'}>
                    <ListItemText primary="TMX Records" />
                </ListItem>
            </List>
            <Divider />
            <List style={{ height: '100%' }}>
                {pageLinks
                    .filter((x) => x.inDrawer)
                    .map((item, index) => (
                        <ListItem
                            button
                            key={index}
                            component={RouterLink}
                            to={item.link}
                            className={item.title === page.title ? classes.active : undefined}
                        >
                            <ListItemText primary={item.title} />
                        </ListItem>
                    ))}
                <Divider />
                <List>
                    <ListItem button key={0} component={RouterLink} to={'/about'}>
                        <ListItemText primary={'About'} />
                    </ListItem>
                </List>
            </List>
        </div>
    );

    return (
        <div className={classes.root}>
            <MaterialAppBar className={classes.appBar} position="fixed">
                <Toolbar>
                    <Hidden lgUp>
                        <IconButton className={classes.menuButton} onClick={showDrawer(true)} color="inherit">
                            <MenuIcon />
                        </IconButton>
                    </Hidden>
                    <Typography variant="h6" color="inherit">
                        <Link component={RouterLink} to="/" color="inherit" underline="none">
                            TMX Records
                        </Link>
                    </Typography>
                </Toolbar>
            </MaterialAppBar>
            <Hidden lgUp implementation="css">
                <SwipeableDrawer open={open} onClose={showDrawer(false)} onOpen={showDrawer(true)} variant="temporary">
                    <div tabIndex={0} role="button" onClick={showDrawer(false)} onKeyDown={showDrawer(false)}>
                        {list}
                    </div>
                </SwipeableDrawer>
            </Hidden>
            <Hidden mdDown implementation="css">
                <Drawer variant="permanent">
                    <div tabIndex={0} role="button">
                        {list}
                    </div>
                </Drawer>
            </Hidden>
        </div>
    );
};

export default withRouter(AppBar);
