import React from 'react';
import MomentUtils from '@date-io/moment';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import { DatePicker } from '@material-ui/pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

const shrink = { shrink: true };

export const SelectField = ({ menuItems, ...props }) => (
    <TextField select margin="dense" {...props}>
        {menuItems.map((item, idx) => (
            <MenuItem key={idx} value={item.value}>
                {item.label}
            </MenuItem>
        ))}
    </TextField>
);

export const InputField = (props) => <TextField type="text" InputLabelProps={shrink} margin="dense" {...props} />;

export const NumberField = (props) => <TextField type="number" InputLabelProps={shrink} margin="dense" {...props} />;

export const DateField = (props) => (
    <MuiPickersUtilsProvider utils={MomentUtils}>
        <DatePicker
            placeholder="yyyy-mm-dd"
            format="YYYY-MM-DD"
            InputLabelProps={shrink}
            helperText={null}
            variant="inline"
            {...props}
        />
    </MuiPickersUtilsProvider>
);
