import React from 'react';
import Paper from '@material-ui/core/Paper';
import SimpleTitle from '../components/SimpleTitle';
import ViewContent from './ViewContent';
import { useLocation, useParams, useHistory } from 'react-router-dom';
import { api2 } from '../Api';
import AppState from '../AppState';

const LoginView = () => {
    const {
        dispatch,
    } = React.useContext(AppState);

    const location = useLocation();
    const history = useHistory();
    const params = useParams();

    React.useEffect(() => {
        api2.login(params.source, location.search)
            .then((data) => {
                dispatch({ action: 'setProfile', data });
                history.push('/');
            })
            .catch(console.error);
    }, []);

    return (
        <ViewContent>
            <Paper>
                <SimpleTitle data="Logging in..." />
            </Paper>
        </ViewContent>
    );
};

export default LoginView;
