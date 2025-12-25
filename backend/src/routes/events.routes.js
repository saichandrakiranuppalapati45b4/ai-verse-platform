import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get all events (public - with filters)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT * FROM events';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY event_date DESC, event_time DESC';

        const events = await db.prepare(query).all(...params);

        res.json({ events });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
    try {
        const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ event });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Register for event (public)
router.post('/:id/register',
    body('team_name').trim().notEmpty(),
    body('team_size').isInt({ min: 1 }),
    body('team_lead_name').trim().notEmpty(),
    body('team_lead_email').isEmail(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const {
                team_name,
                team_size,
                team_lead_name,
                team_lead_email,
                team_lead_phone,
                members
            } = req.body;

            // Check if event exists
            const event = await db.prepare('SELECT id FROM events WHERE id = ?').get(id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Insert registration
            await db.prepare(`
                INSERT INTO registrations (
                    event_id, team_name, team_size, team_lead_name, 
                    team_lead_email, team_lead_phone, members
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                id, team_name, team_size, team_lead_name,
                team_lead_email, team_lead_phone || null, JSON.stringify(members || [])
            );

            res.status(201).json({ message: 'Registration successful' });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Failed to register' });
        }
    }
);

// Get registrations for event (admin)
router.get('/:id/registrations',
    authenticate,
    requirePermission('events'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const registrations = await db.prepare('SELECT * FROM registrations WHERE event_id = ? ORDER BY created_at DESC').all(id);
            res.json({ registrations });
        } catch (error) {
            console.error('Get registrations error:', error);
            res.status(500).json({ error: 'Failed to fetch registrations' });
        }
    }
);

// Get teams for event (for jury marking)
router.get('/:id/teams',
    authenticate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const registrations = await db.prepare(`
                SELECT 
                    id,
                    team_name,
                    team_size as member_count,
                    team_lead_name as leader_name,
                    team_lead_email,
                    team_lead_phone,
                    jury_marks as marks,
                    created_at
                FROM registrations 
                WHERE event_id = ? 
                ORDER BY created_at DESC
            `).all(id);

            res.json({ teams: registrations });
        } catch (error) {
            console.error('Get teams error:', error);
            res.status(500).json({ error: 'Failed to fetch teams' });
        }
    }
);

// Create event
router.post('/',
    authenticate,
    requirePermission('events'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('event_date').isISO8601().withMessage('Valid date is required'),
    body('event_time').trim().notEmpty().withMessage('Time is required'),
    body('venue').trim().notEmpty().withMessage('Venue is required'),
    body('registration_link').optional({ checkFalsy: true }).isURL().withMessage('Valid URL required'),
    body('status').optional().isIn(['upcoming', 'live', 'completed']).withMessage('Invalid status'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                title,
                description,
                event_date,
                event_time,
                venue,
                registration_link,
                status = 'upcoming'
            } = req.body;

            const result = await db.prepare(`
        INSERT INTO events(title, description, event_date, event_time, venue, registration_link, status, created_by)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, description, event_date, event_time, venue, registration_link || null, status, req.user.id);

            res.status(201).json({
                message: 'Event created successfully',
                event: {
                    id: result.lastInsertRowid,
                    title,
                    description,
                    event_date,
                    event_time,
                    venue,
                    registration_link,
                    status
                }
            });
        } catch (error) {
            console.error('Create event error:', error);
            res.status(500).json({ error: 'Failed to create event' });
        }
    }
);

// Update event
router.put('/:id',
    authenticate,
    requirePermission('events'),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('event_date').optional().isISO8601(),
    body('event_time').optional().trim().notEmpty(),
    body('venue').optional().trim().notEmpty(),
    body('registration_link').optional({ checkFalsy: true }).isURL(),
    body('status').optional().isIn(['upcoming', 'live', 'completed']),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const {
                title,
                description,
                event_date,
                event_time,
                venue,
                registration_link,
                status
            } = req.body;

            // Check if event exists
            const event = await db.prepare('SELECT id FROM events WHERE id = ?').get(id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const updates = [];
            const values = [];

            if (title !== undefined) {
                updates.push('title = ?');
                values.push(title);
            }

            if (description !== undefined) {
                updates.push('description = ?');
                values.push(description);
            }

            if (event_date !== undefined) {
                updates.push('event_date = ?');
                values.push(event_date);
            }

            if (event_time !== undefined) {
                updates.push('event_time = ?');
                values.push(event_time);
            }

            if (venue !== undefined) {
                updates.push('venue = ?');
                values.push(venue);
            }

            if (registration_link !== undefined) {
                updates.push('registration_link = ?');
                values.push(registration_link);
            }

            if (status !== undefined) {
                updates.push('status = ?');
                values.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            await db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ? `).run(...values);

            res.json({ message: 'Event updated successfully' });
        } catch (error) {
            console.error('Update event error:', error);
            res.status(500).json({ error: 'Failed to update event' });
        }
    }
);

// Upload event poster
router.post('/:id/upload-poster',
    authenticate,
    requirePermission('events'),
    upload.single('poster'),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Check if event exists
            const event = await db.prepare('SELECT id FROM events WHERE id = ?').get(id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const posterUrl = `/ uploads / ${req.file.filename} `;

            await db.prepare('UPDATE events SET poster_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(posterUrl, id);

            res.json({
                message: 'Poster uploaded successfully',
                posterUrl
            });
        } catch (error) {
            console.error('Upload poster error:', error);
            res.status(500).json({ error: 'Failed to upload poster' });
        }
    }
);

// Delete event
router.delete('/:id', authenticate, requirePermission('events'), async (req, res) => {
    try {
        const { id } = req.params;

        const event = await db.prepare('SELECT id FROM events WHERE id = ?').get(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await db.prepare('DELETE FROM events WHERE id = ?').run(id);

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Update registration marks (Jury)
router.put('/:id/registrations/:regId/marks',
    authenticate,
    body('marks').trim(),
    async (req, res) => {
        try {
            const { id, regId } = req.params;
            const { marks } = req.body;

            // Verify registration belongs to event
            const registration = await db.prepare('SELECT id FROM registrations WHERE id = ? AND event_id = ?').get(regId, id);

            if (!registration) {
                return res.status(404).json({ error: 'Registration not found for this event' });
            }

            await db.prepare('UPDATE registrations SET jury_marks = ? WHERE id = ?').run(marks, regId);

            res.json({ message: 'Marks updated successfully' });
        } catch (error) {
            console.error('Update marks error:', error);
            res.status(500).json({ error: 'Failed to update marks' });
        }
    }
);

// Bulk update marks (for Jury Full Screen Interface)
router.post('/:id/marks',
    authenticate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { marks } = req.body;

            if (!marks) {
                return res.status(400).json({ error: 'Marks data is required' });
            }

            const updates = Object.entries(marks).map(async ([teamId, teamMarks]) => {
                const reg = await db.prepare('SELECT id FROM registrations WHERE id = ? AND event_id = ?').get(teamId, id);
                if (reg) {
                    await db.prepare('UPDATE registrations SET jury_marks = ? WHERE id = ?')
                        .run(JSON.stringify(teamMarks), teamId);
                }
            });

            await Promise.all(updates);

            res.json({ message: 'Marks saved successfully' });
        } catch (error) {
            console.error('Bulk save marks error:', error);
            res.status(500).json({ error: 'Failed to save marks' });
        }
    }
);

export default router;
