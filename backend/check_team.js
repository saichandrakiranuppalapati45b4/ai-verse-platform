import db from './src/config/database.js';

async function checkTeam() {
    try {
        const members = db.prepare('SELECT * FROM team_members').all();
        console.log('Total members:', members.length);
        console.log(JSON.stringify(members, null, 2));
    } catch (err) {
        console.error(err);
    }
}

checkTeam();
