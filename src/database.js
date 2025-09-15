
const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        publicKey TEXT NOT NULL,
        secretKey TEXT NOT NULL,
        password TEXT NOT NULL
    )`);
});

module.exports = db;
