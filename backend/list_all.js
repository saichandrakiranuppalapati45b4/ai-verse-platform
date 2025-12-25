import db from './src/config/database.js';

console.log('=== All Users ===');
const users = await db.prepare('SELECT * FROM users').all();
users.forEach(u => {
    console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
});

console.log('\n=== All Jury Members ===');
const jury = await db.prepare('SELECT * FROM jury_members').all();
jury.forEach(j => {
    console.log(`ID: ${j.id}, Name: ${j.name}, Email: ${j.email}`);
});
