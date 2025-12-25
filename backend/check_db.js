
import sqlite3Pkg from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3Pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to database
const dbPath = path.join(__dirname, 'database', 'aiverse.db');
console.log('Checking DB at:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='registrations'", (err, rows) => {
        if (err) {
            console.error('Query error:', err);
        } else {
            console.log('Tables found:', rows);
            if (rows.length > 0) {
                console.log('✅ Registrations table exists.');
                // Optional: Check columns
                db.all("PRAGMA table_info(registrations)", (err, cols) => {
                    if (err) console.error(err);
                    else console.log('Columns:', cols.map(c => c.name));
                });
            } else {
                console.log('❌ Registrations table MISSING.');
            }
        }
    });
});

// Close later to allow async queries to finish
setTimeout(() => db.close(), 1000);
