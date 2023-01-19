import React from 'react';
import Paper from '@material-ui/core/Paper';
import ViewContent from './ViewContent';
import { api2 } from '../Api';
import AppState from '../AppState';
import { DataGrid } from '@mui/x-data-grid';

const columns = [
    {
        field: 'name',
        headerName: 'Name',
        editable: true,
        type: 'singleSelect',
        valueOptions: ['Banned', 'Unbanned'],
        width: 200,
    },
    {
        field: 'user_id',
        headerName: 'User ID',
        editable: true,
        width: 300,
    },
];

const TagsView = () => {
    const {
        state: { tags },
        dispatch,
    } = React.useContext(AppState);

    React.useEffect(() => {
        api2.getTags()
            .then(({ data }) => dispatch({ action: 'setTags', data }))
            .catch(console.error);
    }, []);

    return (
        <ViewContent>
            <Paper style={{ height: 500 }}>
                <DataGrid rows={tags} columns={columns} getRowId={(row) => row._id} />
            </Paper>
        </ViewContent>
    );
};

export default TagsView;
