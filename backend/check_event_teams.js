import db from './src/config/database.js';

console.log('Checking registrations for event ID 4...');

try {
    const registrations = await db.prepare('SELECT * FROM registrations WHERE event_id = 4').all();
    console.log('Registrations found:', registrations.length);
    console.log('Data:', JSON.stringify(registrations, null, 2));

    // Also check all registrations
    const allRegs = await db.prepare('SELECT id, event_id, team_name FROM registrations').all();
    console.log('\nAll registrations:', allRegs);

    // Check events
    const event = await db.prepare('SELECT id, title FROM events WHERE id = 4').get();
    console.log('\nEvent 4:', event);
} catch (e) {
    console.error(e);
}
