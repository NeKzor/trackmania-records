import React from 'react';
import Paper from '@material-ui/core/Paper';
import SimpleTitle from '../components/SimpleTitle';
import ViewContent from './ViewContent';

const NotFoundView = () => {
    return (
        <ViewContent>
            <Paper>
                <SimpleTitle data="Page not found :(" />
            </Paper>
        </ViewContent>
    );
};

export default NotFoundView;
