import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';

const LoginDialog = (props) => {
    const { onClose, open } = props;

    const handleClose = () => {
        onClose();
    };

    const handleListItemClick = (value) => {
        onClose(value);
    };

    return (
        <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open} maxWidth="sm" fullWidth>
            <DialogTitle id="simple-dialog-title">Login with</DialogTitle>
            <List>
                <ListItem autoFocus button onClick={() => handleListItemClick('trackmania')}>
                    <ListItemText primary="Trackmania (Ubisoft Connect)" />
                </ListItem>
                <ListItem autoFocus button onClick={() => handleListItemClick('maniaplanet')}>
                    <ListItemText primary="Trackmania² (Maniaplanet)" />
                </ListItem>
            </List>
            <DialogActions>
                <Button autoFocus onClick={handleClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoginDialog;
