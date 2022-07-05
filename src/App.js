import React from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import { red, orange } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';
import AppBar from './components/AppBar';
import AboutView from './views/AboutView';
import GameView from './views/GameView';
import NotFoundView from './views/NotFoundView';
import ReplayView from './views/ReplayView';
import AppState, { AppReducer } from './AppState';
import TrackmaniaView from './views/TrackmaniaView';
import TrackmaniaHistoryView from './views/TrackmaniaHistoryView';
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';
import UsersView from './views/UsersView';

const useStyles = makeStyles((theme) => ({
    views: {
        marginTop: theme.spacing(5),
    },
}));

const App = () => {
    const [state, dispatch] = React.useReducer(...AppReducer);

    const theme = React.useMemo(() => {
        return createMuiTheme({
            palette: {
                primary: {
                    light: red[300],
                    main: red[500],
                    dark: red[700],
                },
                secondary: {
                    light: orange[300],
                    main: orange[500],
                    dark: orange[700],
                },
                error: {
                    main: red.A400,
                },
                type: state.darkMode.enabled ? 'dark' : 'light',
            },
        });
    }, [state.darkMode.enabled]);

    const classes = useStyles();
    const context = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppState.Provider value={context}>
                <BrowserRouter>
                    <AppBar />
                    <div className={classes.views}>
                        <Switch>
                            <Redirect exact from="/" to="/trackmania" />
                            <Redirect exact from="/tm" to="/trackmania" />
                            <Redirect exact from="/wii" to="/tmwii" />
                            <Redirect exact from="/tmo" to="/original" />
                            <Redirect exact from="/tmn" to="/nations" />
                            <Redirect exact from="/tms" to="/sunrise" />
                            <Redirect exact from="/tmnf" to="/tmnforever" />
                            <Route exact path="/trackmania" component={TrackmaniaView} />
                            <Route exact path="/tmnforever" component={TrackmaniaHistoryView} />
                            <Route exact path="/united" component={TrackmaniaHistoryView} />
                            <Route exact path="/nations" component={TrackmaniaHistoryView} />
                            <Route
                                exact
                                path="/(original|sunrise|tm2|tmwii)/:date?"
                                component={GameView}
                            />
                            <Route exact path="/replay" component={ReplayView} />
                            <Route exact path="/about" component={AboutView} />
                            <Route exact path="/login/:source(trackmania|maniaplanet)" component={LoginView} />
                            <Route exact path="/me" component={ProfileView} />
                            <Route exact path="/users" component={UsersView} />
                            <Route component={NotFoundView} />
                        </Switch>
                    </div>
                </BrowserRouter>
            </AppState.Provider>
        </ThemeProvider>
    );
};

export default App;
