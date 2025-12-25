import db from './src/config/database.js';

console.log('Creating user accounts for jury members...\n');

// Get all jury members
const juryMembers = await db.prepare('SELECT * FROM jury_members').all();

for (const jury of juryMembers) {
    console.log(`Processing: ${jury.name} (${jury.email})`);

    // Check if user already exists
    const existing = await db.prepare('SELECT * FROM users WHERE email = ?').get(jury.email);

    if (existing) {
        console.log(`  ✓ User already exists (ID: ${existing.id})`);

        // Update role to jury if needed
        if (existing.role !== 'jury') {
            await db.prepare('UPDATE users SET role = ? WHERE id = ?').run('jury', existing.id);
            console.log(`  ✓ Updated role to 'jury'`);
        }
    } else {
        // Password is already hashed in jury_members table, use it directly
        const result = await db.prepare(`
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `).run(jury.email, jury.email, jury.password, 'jury');

        console.log(`  ✓ Created user account (ID: ${result.lastInsertRowid})`);
        console.log(`  → Login: ${jury.email}`);
        console.log(`  → Password: (same as jury member password)`);
    }
    console.log('');
}

console.log('Done! All jury members now have user accounts.');
