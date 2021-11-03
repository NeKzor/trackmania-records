import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { makeStyles } from '@material-ui/core/styles';
import { PopoverOrigin } from '@material-ui/core/Popover';
import { api2 } from '../Api';
import { blue } from '@material-ui/core/colors';

const useStyles = makeStyles((theme) => ({
    root: {
        paddingRight: '10px',
    },
    avatar: {
        width: '35px',
        height: '35px',
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.primary.contrastText,
    },
}));

const anchorOrigin = {
    vertical: 'bottom',
    horizontal: 'center',
};
const transformOrigin = {
    vertical: 'top',
    horizontal: 'center',
};

const ProfileButton = ({ user, onClickLogin, onClickLogout }) => {
    const [anchor, setAnchor] = React.useState(null);

    const handleOpen = (event) => {
        if (!user.isLoggedIn()) {
            onClickLogin(event);
        } else {
            setAnchor(event.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchor(null);
    };

    const handleLogout = () => {
        onClickLogout();
        handleClose();
    };

    const classes = useStyles();
    const open = Boolean(anchor);

    return (
        <div className={classes.root}>
            <Tooltip
                placement="bottom"
                title={user.isLoggedIn() ? 'Logged in as ' + user.profile.nickname : 'Log in'}
                disableFocusListener
            >
                <IconButton color="inherit" size="small" onClick={handleOpen}>
                    {user.isLoggedIn() ? (
                        <Avatar className={classes.avatar} alt="avatar_image" color="secondary">
                            {user.profile.nickname.slice(0, 3).toUpperCase()}
                        </Avatar>
                    ) : (
                        <AccountCircle />
                    )}
                </IconButton>
            </Tooltip>
            <Menu
                id="menu-appbar"
                elevation={0}
                getContentAnchorEl={null}
                anchorEl={anchor}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={handleClose} component={RouterLink} to="me">
                    Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </div>
    );
};

export default ProfileButton;
