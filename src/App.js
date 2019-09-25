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
import ReplayView from './views/ReplayView';
import NotFoundView from './views/NotFoundView';
import AppState, { AppReducer } from './AppState';

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
                <BrowserRouter basename={process.env.NODE_ENV === 'production' ? '/tmx-records' : '/'}>
                    <AppBar />
                    <div className={classes.views}>
                        <Switch>
                            <Redirect exact from="/" to="/tm2" />
                            <Redirect exact from="/tmo" to="/original" />
                            <Redirect exact from="/tmn" to="/nations" />
                            <Redirect exact from="/tms" to="/sunrise" />
                            <Redirect exact from="/tmnf" to="/tmnforever" />
                            <Route exact path="/(nations|original|sunrise|tm2|tmnforever|united)/:date?" component={GameView} />
                            <Route exact path="/about" component={AboutView} />
                            <Route exact path="/replay" component={ReplayView} />
                            <Route component={NotFoundView} />
                        </Switch>
                    </div>
                </BrowserRouter>
            </AppState.Provider>
        </ThemeProvider>
    );
};

export default App;
