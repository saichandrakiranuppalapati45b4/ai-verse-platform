import db from './src/config/database.js';

console.log('All users:');
const users = await db.prepare('SELECT id, username, email, role FROM users').all();
console.log(users);

console.log('\nJury members:');
const jury = await db.prepare('SELECT id, name, email FROM jury_members').all();
console.log(jury);
