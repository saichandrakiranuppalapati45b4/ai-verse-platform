import db from './src/config/database.js';

console.log('Checking database...');

try {
    const assignments = await db.prepare('SELECT * FROM jury_assignments').all();
    console.log('Assignments:', assignments);

    const jury = await db.prepare('SELECT * FROM jury_members').all();
    console.log('Jury:', jury.map(j => ({ id: j.id, name: j.name })));

    const events = await db.prepare('SELECT * FROM events').all();
    console.log('Events:', events.map(e => ({ id: e.id, title: e.title })));

    const joined = await db.prepare(`
        SELECT ja.*, e.title as event_title, j.name as jury_name
        FROM jury_assignments ja
        JOIN events e ON ja.event_id = e.id
        JOIN jury_members j ON ja.jury_id = j.id
    `).all();
    console.log('Joined Data:', joined);
} catch (e) {
    console.error(e);
}
