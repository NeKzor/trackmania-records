import React from 'react';
import Paper from '@material-ui/core/Paper';
import SimpleTitle from '../components/SimpleTitle';
import Typography from '@material-ui/core/Typography';
import ViewContent from './ViewContent';
import AppState from '../AppState';
import { Permissions, Status } from '../models/Permissions';

const LoginView = () => {
    const {
        state: { user },
    } = React.useContext(AppState);

    const statusToText = (profile) => {
        const status = [
            { value: Status.ACTIVE, text: 'active' },
            { value: Status.INACTIVE, text: 'inactive' },
            { value: Status.BANNED, text: 'banned' },
        ].find(({ value }) => profile.status === value);
        return status ? status.text : 'unknown';
    };

    const permissionToText = (profile) => {
        return [
            { value: Permissions.api_MANAGE_DATA, text: 'api_MANAGE_DATA' },
            { value: Permissions.api_MANAGE_USERS, text: 'api_MANAGE_USERS' },
            { value: Permissions.trackmania_DOWNLOAD_FILES, text: 'trackmania_DOWNLOAD_FILES' },
            { value: Permissions.trackmania_MANAGE_MEDIA, text: 'trackmania_MANAGE_MEDIA' },
            { value: Permissions.trackmania_MANAGE_DATA, text: 'trackmania_MANAGE_DATA' },
            { value: Permissions.maniaplanet_DOWNLOAD_FILES, text: 'maniaplanet_DOWNLOAD_FILES' },
            { value: Permissions.maniaplanet_MANAGE_MEDIA, text: 'maniaplanet_MANAGE_MEDIA' },
            { value: Permissions.maniaplanet_MANAGE_DATA, text: 'maniaplanet_MANAGE_DATA' },
        ]
            .filter(({ value }) => profile.permissions & value)
            .map((permission) => permission.text)
            .join(' | ');
    };

    return (
        <ViewContent>
            <Paper>
                {!user.isLoggedIn() && (
                    <SimpleTitle data="Not logged in :(" />
                )}
                {user.isLoggedIn() && (
                    <>
                        <Typography variant="h5" gutterBottom style={{ padding: '50px 50px 0px 50px' }}>
                            {user.profile.nickname}
                        </Typography>
                        <Typography variant="body1" gutterBottom style={{ padding: '0px 50px 0px 50px' }}>
                            Permissions: {permissionToText(user.profile) || 'none'}
                        </Typography>
                        <Typography variant="body1" gutterBottom style={{ padding: '0px 50px 0px 50px' }}>
                            Status: {statusToText(user.profile)}
                        </Typography>
                        <Typography variant="body1" gutterBottom style={{ padding: '0px 50px 0px 50px' }}>
                            Source: {user.profile.source}
                        </Typography>
                        <Typography variant="body1" gutterBottom style={{ padding: '0px 50px 50px 50px' }}>
                            Login ID: {user.profile.login_id}
                        </Typography>
                    </>
                )}
            </Paper>
        </ViewContent>
    );
};

export default LoginView;
