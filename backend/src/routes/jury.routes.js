import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get all jury members
// Get all jury members with their assignments
router.get('/', authenticate, async (req, res) => {
    try {
        const jury = await db.prepare('SELECT * FROM jury_members ORDER BY name ASC').all();

        // Fetch assignments for each member
        // In a larger app, we would use a JOIN or separate aggegration query, but loop is fine for small scale
        for (const member of jury) {
            const assignments = await db.prepare(`
                SELECT e.id, e.title, e.event_date 
                FROM jury_assignments ja
                JOIN events e ON ja.event_id = e.id
                WHERE ja.jury_id = ?
            `).all(member.id);
            member.assignments = assignments;
        }
        console.log('Sending jury with assignments:', JSON.stringify(jury, null, 2));

        res.json({ jury });
    } catch (error) {
        console.error('Get jury error:', error);
        res.status(500).json({ error: 'Failed to fetch jury members' });
    }
});

// Create jury member
router.post('/',
    authenticate,
    // upload.single('photo'), // Removed upload for creation as per request to simplify
    body('name').trim().notEmpty(),
    body('email').trim().isEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password } = req.body;

            // Check if email already exists
            const existing = await db.prepare('SELECT id FROM jury_members WHERE email = ?').get(email);
            if (existing) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            // Create jury member
            const result = await db.prepare(`
                INSERT INTO jury_members (name, email, password_hash)
                VALUES (?, ?, ?)
            `).run(name, email, passwordHash);

            // Also create user account for login
            try {
                await db.prepare(`
                    INSERT INTO users (username, email, password_hash, role, is_active)
                    VALUES (?, ?, ?, 'jury', 1)
                `).run(email, email, passwordHash);
            } catch (userError) {
                console.error('Failed to create user account for jury:', userError);
                // Don't fail the whole request if user creation fails
                // The jury member record is still created
            }

            res.status(201).json({
                message: 'Jury member added successfully',
                id: result.lastInsertRowid,
                loginEmail: email
            });
        } catch (error) {
            console.error('Create jury error:', error);
            res.status(500).json({ error: 'Failed to add jury member' });
        }
    }
);

// Update jury member
router.put('/:id',
    authenticate,
    body('name').trim().notEmpty(),
    body('email').trim().isEmail(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { name, email, phone, designation, organization, bio } = req.body;

            await db.prepare(`
                UPDATE jury_members 
                SET name = ?, email = ?, phone = ?, designation = ?, organization = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(name, email, phone, designation, organization, bio, id);

            res.json({ message: 'Jury member updated successfully' });
        } catch (error) {
            console.error('Update jury error:', error);
            res.status(500).json({ error: 'Failed to update jury member' });
        }
    }
);

// Upload/Update photo separate route (optional, but good for consistency)
router.post('/:id/upload-photo',
    authenticate,
    upload.single('photo'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

            const photoUrl = `/uploads/${req.file.filename}`;
            await db.prepare('UPDATE jury_members SET photo_url = ? WHERE id = ?').run(photoUrl, req.params.id);

            res.json({ message: 'Photo uploaded successfully', photoUrl });
        } catch (error) {
            console.error('Upload photo error:', error);
            res.status(500).json({ error: 'Failed to upload photo' });
        }
    }
);

// Delete jury member
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Get jury member email first
        const juryMember = await db.prepare('SELECT email FROM jury_members WHERE id = ?').get(id);

        // Delete jury member
        await db.prepare('DELETE FROM jury_members WHERE id = ?').run(id);

        // Also delete associated user account if exists
        if (juryMember) {
            try {
                await db.prepare('DELETE FROM users WHERE email = ? AND role = ?').run(juryMember.email, 'jury');
            } catch (userError) {
                console.error('Failed to delete user account:', userError);
                // Continue even if user deletion fails
            }
        }

        res.json({ message: 'Jury member deleted successfully' });
    } catch (error) {
        console.error('Delete jury error:', error);
        res.status(500).json({ error: 'Failed to delete jury member' });
    }
});

// Assign jury member to an event
router.post('/assign', authenticate, async (req, res) => {
    try {
        const { juryId, eventId } = req.body;

        if (!juryId || !eventId) {
            return res.status(400).json({ error: 'Jury ID and Event ID are required' });
        }

        await db.prepare('INSERT OR IGNORE INTO jury_assignments (jury_id, event_id) VALUES (?, ?)').run(juryId, eventId);
        res.json({ message: 'Jury member assigned to event successfully' });
    } catch (error) {
        console.error('Assign jury error:', error);
        res.status(500).json({ error: 'Failed to assign jury member' });
    }
});

// Get assignments for a jury member
router.get('/:id/assignments', authenticate, async (req, res) => {
    try {
        const assignments = await db.prepare(`
            SELECT ja.*, e.title as event_title, e.event_date 
            FROM jury_assignments ja
            JOIN events e ON ja.event_id = e.id
            WHERE ja.jury_id = ?
        `).all(req.params.id);
        res.json({ assignments });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Unassign jury member from an event
router.post('/unassign', authenticate, async (req, res) => {
    try {
        const { juryId, eventId } = req.body;
        await db.prepare('DELETE FROM jury_assignments WHERE jury_id = ? AND event_id = ?').run(juryId, eventId);
        res.json({ message: 'Jury member unassigned successfully' });
    } catch (error) {
        console.error('Unassign jury error:', error);
        res.status(500).json({ error: 'Failed to unassign jury member' });
    }
});

export default router;
