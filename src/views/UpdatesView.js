import React from 'react';
import Paper from '@material-ui/core/Paper';
import ViewContent from './ViewContent';
import { api2 } from '../Api';
import AppState from '../AppState';

const UpdatesView = () => {
    const {
        state: { updates },
        dispatch,
    } = React.useContext(AppState);

    React.useEffect(() => {
        api2.getUpdates()
            .then(({ data }) => dispatch({ action: 'setUpdates', data }))
            .catch(console.error);
    }, []);

    return (
        <ViewContent>
            <Paper>
                {updates.map((update) => {
                    return (
                        <div key={update._id}>{update.date} | {update.title} | {update.text} | {update.publisher}</div>
                    );
                })}
            </Paper>
        </ViewContent>
    );
};

export default UpdatesView;
