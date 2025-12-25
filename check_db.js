
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'aiverse.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='registrations'", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Tables found:', rows);
        }
    });
});

db.close();
