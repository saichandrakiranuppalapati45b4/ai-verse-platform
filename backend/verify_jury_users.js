import db from './src/config/database.js';

console.log('Verifying jury user accounts...\n');

const juryUsers = await db.prepare('SELECT id, username, email, role FROM users WHERE role = ?').all('jury');
console.log(`Found ${juryUsers.length} jury user(s):\n`);

juryUsers.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log('---');
});

console.log('\n✅ These users can now login at /admin/login');
console.log('Default password: Temp@123');
