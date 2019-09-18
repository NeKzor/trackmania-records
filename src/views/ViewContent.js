import React from 'react';
import Grid from '@material-ui/core/Grid';

const ViewContent = ({ children }) => (
    <Grid container>
        <Grid item xs={false} md={1} lg={2} />
        <Grid item xs={12} md={10} lg={9}>
            {children}
        </Grid>
    </Grid>
);

export default ViewContent;
