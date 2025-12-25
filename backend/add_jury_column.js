
import db from './src/config/database.js';

console.log('Adding jury_marks column to registrations table...');

try {
    const info = db.prepare("PRAGMA table_info(registrations)").all();
    const hasColumn = info.some(col => col.name === 'jury_marks');

    if (!hasColumn) {
        db.prepare("ALTER TABLE registrations ADD COLUMN jury_marks TEXT").run();
        console.log('Successfully added jury_marks column.');
    } else {
        console.log('jury_marks column already exists.');
    }
} catch (error) {
    console.error('Failed to alter table:', error);
}
