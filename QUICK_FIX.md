# Quick Fix for SQLite Installation Issue

## The Problem
`better-sqlite3` requires native compilation which failed during `npm install`.

## Solutions (Choose One)

### Option 1: Install Build Tools (Windows)

Open PowerShell as Administrator and run:

```powershell
npm install --global windows-build-tools
npm install --global node-gyp
```

Then in backend directory:
```bash
cd "d:\AI VERSE\backend"
rm -rf node_modules package-lock.json
npm install
npm start
```

### Option 2: Use sqlite3 Instead

1. Edit `d:\AI VERSE\backend\package.json`, replace:
   ```json
   "better-sqlite3": "^9.2.2"
   ```
   with:
   ```json
   "sqlite3": "^5.1.7"
   ```

2. Edit `d:\AI VERSE\backend\src\config\database.js`:
   - Change `import Database from 'better-sqlite3';` to `import sqlite3 from 'sqlite3';`
   - Update database initialization to use callback-based sqlite3 API

3. Run:
   ```bash
   cd "d:\AI VERSE\backend"
   npm install
   npm start
   ```

### Option 3: Use In-Memory Array (Development Only)

For quick testing without database:

1. Create `d:\AI VERSE\backend\src\config\mock-db.js`:
   ```javascript
   export const mockDB = {
     users: [{ id: 1, username: 'admin', password_hash: '$2b$10$...', role: 'super_admin' }],
     events: [],
     gallery: [],
     // ... etc
   };
   ```

2. Update routes to use mock data instead of database queries

## Recommended: Option 1 + PostgreSQL for Production

For a production-ready setup:

1. Install PostgreSQL locally or use a hosted service (ElephantSQL, Supabase, Railway)

2. Update dependencies:
   ```bash
   npm install pg
   npm uninstall better-sqlite3
   ```

3. Create `d:\AI VERSE\backend\src\config\postgres.js`:
   ```javascript
   import pg from 'pg';
   const { Pool } = pg;

   export const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   });
   ```

4. Update `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/aiverse
   ```

5. Update all database queries to use PostgreSQL syntax

## Quick Test

Once dependencies are installed, test with:

```bash
# Backend
cd "d:\AI VERSE\backend"
npm start

# Should see:
# 🚀 AI Verse Backend Server Started
# 📍 Server running on: http://localhost:5000
# ✅ Database tables initialized successfully

# Frontend (new terminal)
cd "d:\AI VERSE\frontend"
npm run dev

# Should see:
# ➜  Local:   http://localhost:5173/
```

Then visit http://localhost:5173/admin/login

## Need Help?

If still having issues:
1. Check Node.js version: `node -v` (should be v16+)
2. Check npm version: `npm -v`
3. Clear npm cache: `npm cache clean --force`
4. Delete node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
