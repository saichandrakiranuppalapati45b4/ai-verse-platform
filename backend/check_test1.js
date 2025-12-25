import db from './src/config/database.js';

const user = await db.prepare("SELECT id, username, email, role FROM users WHERE username = 'test1'").get();
console.log('Test1 user:', user);

if (!user) {
    console.log('\ntest1 does not exist in users table!');
    console.log('\nAll users with email containing test:');
    const testUsers = await db.prepare("SELECT id, username, email, role FROM users WHERE email LIKE '%test%' OR username LIKE '%test%'").all();
    console.log(testUsers);
}
