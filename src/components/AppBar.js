import React from 'react';
import { Link as RouterLink, withRouter, useHistory } from 'react-router-dom';
import MaterialAppBar from '@material-ui/core/AppBar';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Fade from '@material-ui/core/Fade';
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
import ProfileButton from './ProfileButton';
import { useTitle } from '../Hooks';
import { api2 } from '../Api';
import AppState from '../AppState';
import LoginDialog from './LoginDialog';
import { Permissions } from '../models/Permissions';

const useStyles = makeStyles((theme) => ({
    root: {
        paddingBottom: theme.spacing(8),
    },
    list: {
        width: theme.spacing(25),
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
    { title: 'trackmania-records', link: '/', inDrawer: false },
    { title: 'Trackmania', link: '/trackmania', inDrawer: true, default: true },
    { title: 'Trackmania 2', link: '/tm2', inDrawer: true, default: true },
    { title: 'Trackmania Wii', link: '/tmwii', inDrawer: true, default: true },
    { title: 'Nations Forever', link: '/tmnforever', inDrawer: true },
    { title: 'United', link: '/united', inDrawer: true },
    { title: 'Nations ESWC', link: '/nations', inDrawer: true },
    /* { title: 'Sunrise', link: '/sunrise', inDrawer: true },
    { title: 'Original', link: '/original', inDrawer: true }, */
    { isDivider: true },
    { title: 'Audits', link: '/manage/audits', inDrawer: (user) => user.isLoggedIn() && user.hasPermission(Permissions.api_MANAGE_DATA) },
    { title: 'Tags', link: '/manage/tags', inDrawer: (user) => user.isLoggedIn() && user.hasPermission(Permissions.api_MANAGE_DATA) },
    { title: 'Updates', link: '/manage/updates', inDrawer: (user) => user.isLoggedIn() && user.hasPermission(Permissions.api_MANAGE_DATA) },
    { title: 'Users', link: '/manage/users', inDrawer: (user) => user.isLoggedIn() && user.hasPermission(Permissions.api_MANAGE_USERS) },
    { isDivider: true, inDrawer: (user) => user.isLoggedIn() && (user.hasPermission(Permissions.api_MANAGE_DATA) || user.hasPermission(Permissions.api_MANAGE_USERS)) },
    { title: 'Replay Inspection', link: '/replay', inDrawer: true },
    { title: 'About', link: '/about', inDrawer: true },
    { title: 'Login', link: '/login', inDrawer: false },
    { title: 'Profile', link: '/me', inDrawer: false },
];

const AppBar = ({ location }) => {
    const {
        state: { user },
        dispatch,
    } = React.useContext(AppState);

    const history = useHistory();

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [loginOpen, setLoginOpen] = React.useState(false);

    const login = () => {
        setLoginOpen(true);
    };

    const closeLogin = (source) => {
        if (source) {
            api2.loginStart(source);
        } else {
            setLoginOpen(false);
        }
    };

    const logout = () => {
        api2.logout()
            .then(() => {
                dispatch({ action: 'setProfile', data: null });
                history.replace('/');
            })
            .catch(console.error);

        setLoginOpen(false);
    };

    React.useEffect(() => {
        api2.getMe()
            .then((data) => dispatch({ action: 'setProfile', data }))
            .catch(console.error);
    }, []);

    const page = React.useMemo(
        () =>
            pageLinks.find(
                (x) => x.link === location.pathname || (x.link !== null && location.pathname.startsWith(x.link + '/')),
            ) || pageLinks[0],
        [location],
    );

    useTitle(page.title);

    const showDrawer = (state) => () => {
        setDrawerOpen(state);
    };

    const classes = useStyles();

    const list = (
        <div className={classes.list}>
            <List>
                <ListItem button key={0} component={RouterLink} to={'/'}>
                    <ListItemText primary="Trackmania Records" />
                </ListItem>
            </List>
            <Divider />
            <List>
                {pageLinks
                    .filter((item) => typeof item.inDrawer === 'function' ? item.inDrawer(user) : item.inDrawer || item.isDivider)
                    .map((item, index) => {
                        if (item.isDivider && (typeof item.inDrawer === 'function' ? item.inDrawer(user) : true)) {
                            return (
                                <Divider key={index} />
                            );
                        }

                        return (
                            <ListItem
                                button
                                key={index}
                                component={RouterLink}
                                to={item.link}
                                className={item.title === page.title ? classes.active : undefined}
                            >
                                <ListItemText primary={item.title} />
                            </ListItem>
                        );
                    })}
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
                            {page.title}
                        </Link>
                    </Typography>
                    <div className={classes.flex} />
                    <Fade in={true} timeout={1000}>
                        <ProfileButton user={user} onClickLogin={login} onClickLogout={logout} />
                    </Fade>
                </Toolbar>
            </MaterialAppBar>
            <Hidden lgUp implementation="css">
                <SwipeableDrawer open={drawerOpen} onClose={showDrawer(false)} onOpen={showDrawer(true)} variant="temporary">
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
            <LoginDialog onClose={closeLogin} open={loginOpen} />
        </div>
    );
};

export default withRouter(AppBar);
