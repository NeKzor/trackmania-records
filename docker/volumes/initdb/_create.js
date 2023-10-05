db.createUser({
    user: "tmr",
    pwd: 'tmr',
    roles: [
        {
            role: "readWrite",
            db: "tmr",
        },
    ],
});
