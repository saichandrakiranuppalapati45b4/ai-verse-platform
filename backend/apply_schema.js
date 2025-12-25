
import { initializeDatabase } from './src/config/database.js';

console.log('Forcing database initialization...');
initializeDatabase().then(() => {
    console.log('✅ Database initialization completed.');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
});
