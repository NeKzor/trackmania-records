import React from 'react';
import Paper from '@material-ui/core/Paper';
import ViewContent from './ViewContent';
import { api2 } from '../Api';
import AppState from '../AppState';

const LoginView = () => {
    const {
        state: { users },
        dispatch,
    } = React.useContext(AppState);

    React.useEffect(() => {
        api2.getUsers()
            .then(({ data }) => dispatch({ action: 'setUsers', data }))
            .catch(console.error);
    }, []);

    return (
        <ViewContent>
            <Paper>
                {users.map((user) => {
                    return (
                        <div key={user._id}>{user.nickname} | {user.permissions} | {user.status} | {user.source} | {user.login_id}</div>
                    );
                })}
            </Paper>
        </ViewContent>
    );
};

export default LoginView;
