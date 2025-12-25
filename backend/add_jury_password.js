
import db from './src/config/database.js';

console.log('Adding password column to jury_members table...');

try {
    const info = db.prepare("PRAGMA table_info(jury_members)").all();
    const hasColumn = info.some(col => col.name === 'password_hash');

    if (!hasColumn) {
        db.prepare("ALTER TABLE jury_members ADD COLUMN password_hash TEXT").run();
        console.log('Successfully added password_hash column.');
    } else {
        console.log('password_hash column already exists.');
    }
} catch (error) {
    console.error('Failed to alter table:', error);
}
