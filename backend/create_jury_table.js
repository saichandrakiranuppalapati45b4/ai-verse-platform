
import db from './src/config/database.js';

console.log('Creating jury_members table...');

try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS jury_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            designation TEXT,
            organization TEXT,
            bio TEXT,
            photo_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    console.log('Successfully created jury_members table.');
} catch (error) {
    console.error('Failed to create table:', error);
}
