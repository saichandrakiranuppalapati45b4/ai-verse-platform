
import db from './src/config/database.js';

console.log('Force adding password column to jury_members table...');

try {
    // Just try to add it, ignore if it exists (it will throw but we catch it)
    try {
        db.prepare("ALTER TABLE jury_members ADD COLUMN password_hash TEXT").run();
        console.log('Successfully added password_hash column.');
    } catch (e) {
        if (e.code !== 'SQLITE_ERROR') {
            console.log('Error adding column (might already exist):', e.message);
        } else {
            console.log('Column likely already exists or other SQL error:', e.message);
        }
    }

    // Verify
    const info = db.prepare("PRAGMA table_info(jury_members)").all();
    console.log('Current Columns:', info.map(c => c.name));

} catch (error) {
    console.error('Fatal script error:', error);
}
