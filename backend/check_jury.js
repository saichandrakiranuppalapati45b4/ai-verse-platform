import db from './src/config/database.js';

console.log('Checking jury users...');
const juryUsers = await db.prepare('SELECT id, username, email, role FROM users WHERE role = ?').all('jury');
console.log('Jury users:', juryUsers);

console.log('\nChecking teams for event 4...');
const teams = await db.prepare('SELECT id, team_name, team_lead_name, team_size FROM registrations WHERE event_id = 4').all();
console.log('Teams:', teams);
