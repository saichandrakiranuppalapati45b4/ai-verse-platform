
import db from './src/config/database.js';

console.log('Creating jury_assignments table...');

const createTable = `
CREATE TABLE IF NOT EXISTS jury_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jury_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jury_id) REFERENCES jury_members (id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    UNIQUE(jury_id, event_id)
)
`;

try {
    db.prepare(createTable).run();
    console.log('jury_assignments table created successfully.');
} catch (error) {
    console.error('Error creating table:', error);
}
