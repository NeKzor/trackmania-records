import React from 'react';

class User {
    profile = null;

    constructor() {
        this.profile = null;
    }
    hasLoaded() {
        return this.profile;
    }
    isLoggedIn() {
        return this.profile && !this.profile.error;
    }
    setProfile(profile) {
        this.profile = profile;
        return this;
    }
    hasPermission(permission) {
        return (this.profile?.permissions & permission) > 0;
    }
}

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

const initialState = {
    user: new User(),
    darkMode: new DarkMode(),
    users: [],
};

export const AppReducer = [
    (state, { action, data }) => {
        switch (action) {
            case 'setProfile':
                return {
                    ...state,
                    user: state.user.setProfile(data),
                };
            case 'setUsers':
                return {
                    ...state,
                    users: data || [],
                };
            case 'toggleDarkMode':
                return {
                    ...state,
                    darkMode: state.darkMode.toggle(),
                };
            default:
                throw new Error('Unknown action type.');
        }
    },
    initialState,
];

export default React.createContext(initialState);
