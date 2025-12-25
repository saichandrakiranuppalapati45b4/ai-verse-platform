import db from './src/config/database.js';

console.log('Checking jury user account...\n');

const juryUser = await db.prepare('SELECT * FROM users WHERE role = ?').get('jury');

if (juryUser) {
    console.log('Found jury user:');
    console.log('  ID:', juryUser.id);
    console.log('  Username:', juryUser.username);
    console.log('  Email:', juryUser.email);
    console.log('  Role:', juryUser.role);
    console.log('  Password Hash:', juryUser.password_hash.substring(0, 30) + '...');
    console.log('  Is Active:', juryUser.is_active);
} else {
    console.log('No jury user found!');
}

// Also check jury_members
console.log('\nJury member from jury_members table:');
const juryMember = await db.prepare('SELECT * FROM jury_members WHERE id = 5').get();
if (juryMember) {
    console.log('  ID:', juryMember.id);
    console.log('  Name:', juryMember.name);
    console.log('  Email:', juryMember.email);
}
