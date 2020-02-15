import React from 'react';

class DarkMode {
    constructor() {
        this.enabled = localStorage.getItem('dark_mode') === 'true';
    }
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('dark_mode', this.enabled.toString());
        return this;
    }
}

const inititalState = {
    darkMode: new DarkMode(),
};

export const AppReducer = [
    (state, { action }) => {
        switch (action) {
            case 'toggleDarkMode':
                return {
                    ...state,
                    darkMode: state.darkMode.toggle(),
                };
            default:
                throw new Error('Unknown action type.');
        }
    },
    inititalState,
];

export default React.createContext(inititalState);
