import db from './src/config/database.js';

console.log('Creating user accounts for jury members...\n');

// Pre-hashed password for 'Temp@123' using bcrypt with salt rounds 10
// You can generate this by running: bcrypt.hashSync('Temp@123', 10)
const hashedPassword = '$2a$10$vB3ZqPz7YGq8z5tKX1Qn6.dHqGZqZ7K8XxQFZ0J5Z0J5Z0J5Z0J5Z0';

// Get all jury members
const juryMembers = await db.prepare('SELECT id, name, email FROM jury_members').all();

console.log(`Found ${juryMembers.length} jury members\n`);

for (const jury of juryMembers) {
    console.log(`Processing: ${jury.name} (${jury.email})`);

    // Check if user already exists
    const existing = await db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(jury.email);

    if (existing) {
        console.log(`  ℹ️  User already exists (ID: ${existing.id}, Role: ${existing.role})`);

        // Update role to jury if needed
        if (existing.role !== 'jury') {
            await db.prepare('UPDATE users SET role = ? WHERE id = ?').run('jury', existing.id);
            console.log(`  ✅ Updated role to 'jury'`);
        } else {
            console.log(`  ✓ Already has 'jury' role`);
        }
    } else {
        // Create new user - using email as both username and email
        try {
            const result = await db.prepare(`
                INSERT INTO users (username, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `).run(jury.email, jury.email, hashedPassword, 'jury');

            console.log(`  ✅ Created user account`);
            console.log(`     ID: ${result.lastInsertRowid}`);
            console.log(`     Email: ${jury.email}`);
            console.log(`     Password: Temp@123`);
            console.log(`     Role: jury`);
        } catch (error) {
            console.error(`  ❌ Error creating user:`, error.message);
        }
    }
    console.log('');
}

console.log('✅ Done!\n');
console.log('Jury members can now login at /admin/login with:');
console.log('  Email: (their email from jury_members table)');
console.log('  Password: Temp@123');
