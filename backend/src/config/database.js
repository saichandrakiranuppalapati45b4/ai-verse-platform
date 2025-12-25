import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'aiverse.db');

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('📦 Connected to SQLite database');
  }
});

// Promisify database methods for easier use
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Export promisified methods
export const database = {
  run: dbRun,
  get: dbGet,
  all: dbAll,
  prepare: (sql) => ({
    run: (...params) => dbRun(sql, params),
    get: (...params) => dbGet(sql, params),
    all: (...params) => dbAll(sql, params)
  })
};

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');

    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('super_admin', 'team_admin')),
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Home content table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS home_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hero_title TEXT NOT NULL,
        hero_subtitle TEXT NOT NULL,
        hero_image_url TEXT,
        announcement_text TEXT,
        announcement_enabled INTEGER DEFAULT 0,
        sections_config TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);

    // About content table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS about_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        vision TEXT NOT NULL,
        mission TEXT NOT NULL,
        department_info TEXT NOT NULL,
        faculty_coordinators TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);

    // Events table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        poster_url TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT NOT NULL,
        venue TEXT NOT NULL,
        registration_link TEXT,
        status TEXT NOT NULL CHECK(status IN ('upcoming', 'live', 'completed')),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Live events table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS live_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        is_live INTEGER DEFAULT 0,
        stream_url TEXT,
        countdown_end_time DATETIME,
        live_notices TEXT,
        started_at DATETIME,
        ended_at DATETIME,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    // Gallery table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL CHECK(file_type IN ('image', 'video')),
        event_id INTEGER,
        caption TEXT,
        is_approved INTEGER DEFAULT 0,
        uploaded_by INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Team members table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        profile_image_url TEXT,
        bio TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        is_visible INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        added_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by) REFERENCES users(id)
      )
    `);

    // Registrations table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        team_size INTEGER NOT NULL,
        team_lead_name TEXT NOT NULL,
        team_lead_email TEXT NOT NULL,
        team_lead_phone TEXT,
        members TEXT, -- JSON string of member names
        status TEXT DEFAULT 'pending', -- pending, approved, rejected
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    // Schema update: Add department column if it doesn't exist (for existing databases)
    try {
      await dbRun(`ALTER TABLE team_members ADD COLUMN department TEXT`);
      console.log('✅ Added department column to team_members table');
    } catch (error) {
      // Ignore error if column already exists
      if (!error.message.includes('duplicate column name')) {
        console.warn('Note: Could not add department column (might already exist):', error.message);
      }
    }

    // Schema update: Add jury_marks column to registrations if it doesn't exist
    try {
      await dbRun(`ALTER TABLE registrations ADD COLUMN jury_marks TEXT`);
      console.log('✅ Added jury_marks column to registrations table');
    } catch (error) {
      // Ignore error if column already exists
      if (!error.message.includes('duplicate column name')) {
        console.warn('Note: Could not add jury_marks column (might already exist):', error.message);
      }
    }


    console.log('✅ Database tables initialized successfully');

    // Seed default data
    await seedDefaultData();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Seed default super admin and initial content
async function seedDefaultData() {
  try {
    // Check if super admin exists
    const adminExists = await dbGet('SELECT id FROM users WHERE role = ?', ['super_admin']);

    if (!adminExists) {
      const passwordHash = await bcrypt.hash('Sai_kiran@4845', 10);
      await dbRun(
        `INSERT INTO users (username, email, password_hash, role, permissions)
         VALUES (?, ?, ?, ?, ?)`,
        ['24pa1a45b4@vishnu.edu.in', '24pa1a45b4@vishnu.edu.in', passwordHash, 'super_admin', null]
      );
      console.log('✅ Default super admin created (username: 24pa1a45b4@vishnu.edu.in, password: Sai_kiran@4845)');
    }

    // Check if home content exists
    const homeExists = await dbGet('SELECT id FROM home_content');
    if (!homeExists) {
      await dbRun(
        `INSERT INTO home_content (hero_title, hero_subtitle, hero_image_url, announcement_text, announcement_enabled, sections_config)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Welcome to AI Verse',
          'Empowering Innovation Through Artificial Intelligence & Data Science',
          null,
          'Join us for our upcoming Hackathon 2024!',
          1,
          JSON.stringify({ events: true, gallery: true, team: true })
        ]
      );
      console.log('✅ Default home content created');
    }

    // Check if about content exists
    const aboutExists = await dbGet('SELECT id FROM about_content');
    if (!aboutExists) {
      await dbRun(
        `INSERT INTO about_content (description, vision, mission, department_info, faculty_coordinators)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'AI Verse is the premier CSE club focused on Artificial Intelligence and Data Science. We organize hackathons, workshops, and tech events to foster innovation and learning.',
          'To be the leading platform for AI and Data Science enthusiasts to learn, collaborate, and innovate.',
          'Empowering students with cutting-edge AI knowledge through hands-on workshops, hackathons, and real-world projects.',
          'Department of Computer Science & Engineering - Artificial Intelligence & Data Science',
          JSON.stringify([
            { name: 'Dr. Faculty Name', designation: 'Faculty Coordinator', email: 'faculty@college.edu' }
          ])
        ]
      );
      console.log('✅ Default about content created');
    }
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
}

export default database;
