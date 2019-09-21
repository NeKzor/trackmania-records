import React from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import moment from 'moment';
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

const useStyles = makeStyles((theme) => ({
    views: {
        marginTop: theme.spacing(5),
    },
}));

const theme = createMuiTheme({
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
        type: moment().get('h') > 5 && moment().get('h') < 19 ? 'light' : 'dark',
    },
});

const App = () => {
    const classes = useStyles();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter basename="/">
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
        </ThemeProvider>
    );
};

export default App;
