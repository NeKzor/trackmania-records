const mongoose = require('mongoose');

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@localhost:${process.env.DB_PORT}/${process.env.DB_NAME}`;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', (err) => 'database connection error:' + err);
db.once('open', () => console.log('connected to database'));

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((eventType) => {
    process.on(eventType, (...args) => {
        console.log('[EVENT]', eventType, args);
        mongoose
            .disconnect()
            .finally(() => process.exit());
    });
});

module.exports = db;
