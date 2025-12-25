import db from './src/config/database.js';
import bcrypt from 'bcrypt';

console.log('Updating jury user password...\n');

const password = 'Temp@123';

// Generate proper password hash
console.log(`Hashing password "${password}"...`);
const hashedPassword = await bcrypt.hash(password, 10);
console.log('Generated hash:', hashedPassword.substring(0, 30) + '...');

// Update the jury user
const result = await db.prepare(`
    UPDATE users 
    SET password_hash = ? 
    WHERE role = 'jury'
`).run(hashedPassword);

console.log('\n✅ Updated password for jury user');
console.log(`   Rows affected: ${result.changes}`);

// Verify
const user = await db.prepare('SELECT id, username, email, role FROM users WHERE role = ?').get('jury');
console.log('\nVerified user:');
console.log('  ID:', user.id);
console.log('  Email:', user.email);
console.log('  Username:', user.username);
console.log('  Role:', user.role);

console.log('\n✅ Jury can now login with:');
console.log(`   Email: ${user.email}`);
console.log(`   Password: ${password}`);
