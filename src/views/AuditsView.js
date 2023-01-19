import React from 'react';
import Paper from '@material-ui/core/Paper';
import ViewContent from './ViewContent';
import { api2 } from '../Api';
import AppState from '../AppState';

const AuditsView = () => {
    const {
        state: { audits },
        dispatch,
    } = React.useContext(AppState);

    React.useEffect(() => {
        api2.getAudits()
            .then(({ data }) => dispatch({ action: 'setAudits', data }))
            .catch(console.error);
    }, []);

    return (
        <ViewContent>
            <Paper>
                {audits.map((audit) => {
                    return (
                        <div key={audit._id}>{audit.auditType} | {audit.moderator} | {audit.moderatorNote} | {audit.serverNote} | {audit.affected.users.length} | {audit.affected.records.length}</div>
                    );
                })}
            </Paper>
        </ViewContent>
    );
};

export default AuditsView;
