// Wrapper for database to provide synchronous-like interface for routes
import { database } from './database.js';

// This wrapper makes the async database work with existing route code
const db = {
    prepare: (sql) => {
        return {
            run: async (...params) => {
                const result = await database.run(sql, params);
                return { lastInsertRowid: result.lastID, changes: result.changes };
            },
            get: async (...params) => {
                return await database.get(sql, params);
            },
            all: async (...params) => {
                return await database.all(sql, params);
            }
        };
    },
    // For backwards compatibility - make routes async-aware
    exec: async (sql) => {
        await database.run(sql, []);
    },
    pragma: async (pragma) => {
        await database.run(`PRAGMA ${pragma}`, []);
    }
};

export default db;
