const Status = {
    ACTIVE: 0,
    INACTIVE: 1,
    BANNED: 2,
};

const Permissions = {
    api_MANAGE_USERS: 1 << 0,
    api_MANAGE_DATA: 1 << 1,

    trackmania_DOWNLOAD_FILES: 1 << 5,
    trackmania_MANAGE_MEDIA: 1 << 6,
    trackmania_MANAGE_DATA: 1 << 7,

    maniaplanet_DOWNLOAD_FILES: 1 << 10,
    maniaplanet_MANAGE_MEDIA: 1 << 11,
    maniaplanet_MANAGE_DATA: 1 << 12,
};

module.exports = {
    Status,
    Permissions,
};
