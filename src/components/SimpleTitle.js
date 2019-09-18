import React from 'react';
import Typography from '@material-ui/core/Typography';

export default ({ data, props }) => (
    <Typography variant="h5" gutterBottom style={{ padding: '50px 0px 50px 50px' }} {...props}>
        {data}
    </Typography>
);
