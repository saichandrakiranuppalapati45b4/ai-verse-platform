import db from './src/config/database.js';

console.log('Adding jury role support to users table...\n');

// SQLite doesn't allow ALTER TABLE to modify CHECK constraints
// We need to recreate the table with the new constraint

try {
    console.log('Step 1: Creating temporary users table with jury role...');
    await db.prepare(`
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('super_admin', 'team_admin', 'jury')),
            permissions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1
        )
    `).run();

    console.log('Step 2: Copying existing data...');
    await db.prepare(`
        INSERT INTO users_new (id, username, email, password_hash, role, permissions, created_at, updated_at, is_active)
        SELECT id, username, email, password_hash, role, permissions, created_at, updated_at, is_active
        FROM users
    `).run();

    console.log('Step 3: Dropping old table...');
    await db.prepare('DROP TABLE users').run();

    console.log('Step 4: Renaming new table...');
    await db.prepare('ALTER TABLE users_new RENAME TO users').run();

    console.log('\n✅ Successfully added jury role support!');
    console.log('\nYou can now create users with role = "jury"');
} catch (error) {
    console.error('❌ Error:', error);
}
