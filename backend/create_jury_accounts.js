import db from './src/config/database.js';
import bcrypt from 'bcryptjs';

console.log('Creating user accounts for jury members...\n');

// Get all jury members
const juryMembers = await db.prepare('SELECT * FROM jury_members').all();
const defaultPassword = 'Temp@123';
const hashedPassword = await bcrypt.hash(defaultPassword, 10);

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
        // Create new user
        const result = await db.prepare(`
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `).run(jury.email, jury.email, hashedPassword, 'jury');

        console.log(`  ✅ Created user account (ID: ${result.lastInsertRowid})`);
        console.log(`  → Email: ${jury.email}`);
        console.log(`  → Password: ${defaultPassword}`);
        console.log(`  → Role: jury`);
    }
    console.log('');
}

console.log('✅ Done! All jury members now have user accounts.');
console.log(`\nJury members can now login with:
  Email: their email from jury_members table
  Password: ${defaultPassword}
`);
