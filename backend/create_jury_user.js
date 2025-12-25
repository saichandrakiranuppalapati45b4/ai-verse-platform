import db from './src/config/database.js';
import bcrypt from 'bcryptjs';

console.log('Creating user account for jury member...');

// Check jury_members table
const juryMember = await db.prepare("SELECT * FROM jury_members LIMIT 1").get();
console.log('First jury member:', juryMember);

if (juryMember) {
    // Check if this jury member already has a user account
    const existingUser = await db.prepare('SELECT * FROM users WHERE email = ?').get(juryMember.email);

    if (existingUser) {
        console.log('\nUser already exists:', existingUser);
        // Update to jury role if needed
        if (existingUser.role !== 'jury') {
            await db.prepare('UPDATE users SET role = ? WHERE id = ?').run('jury', existingUser.id);
            console.log('Updated role to jury');
        }
    } else {
        // Create user account for jury member
        const hashedPassword = await bcrypt.hash('Temp@123', 10);
        const result = await db.prepare(`
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `).run(juryMember.email, juryMember.email, hashedPassword, 'jury');

        console.log('\nCreated jury user account:');
        console.log('  ID:', result.lastInsertRowid);
        console.log('  Email:', juryMember.email);
        console.log('  Password: Temp@123');
        console.log('  Role: jury');
    }
}
