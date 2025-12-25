import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get current live event (public)
router.get('/', (req, res) => {
    try {
        const liveEvent = db.prepare(`
      SELECT le.*, e.title, e.description, e.poster_url
      FROM live_events le
      JOIN events e ON le.event_id = e.id
      WHERE le.is_live = 1
      LIMIT 1
    `).get();

        if (!liveEvent) {
            return res.json({ liveEvent: null });
        }

        res.json({
            liveEvent: {
                ...liveEvent,
                is_live: Boolean(liveEvent.is_live)
            }
        });
    } catch (error) {
        console.error('Get live event error:', error);
        res.status(500).json({ error: 'Failed to fetch live event' });
    }
});

// Start live event
router.post('/start',
    authenticate,
    requirePermission('live_events'),
    body('event_id').isInt().withMessage('Valid event ID is required'),
    body('stream_url').isURL().withMessage('Valid stream URL is required'),
    body('countdown_end_time').optional().isISO8601(),
    body('live_notices').optional().trim(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { event_id, stream_url, countdown_end_time, live_notices } = req.body;

            // Check if event exists
            const event = db.prepare('SELECT id FROM events WHERE id = ?').get(event_id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Stop any currently live events
            db.prepare('UPDATE live_events SET is_live = 0, ended_at = CURRENT_TIMESTAMP WHERE is_live = 1').run();

            // Update event status to live
            db.prepare('UPDATE events SET status = ? WHERE id = ?').run('live', event_id);

            // Check if live event entry exists for this event
            const existingLive = db.prepare('SELECT id FROM live_events WHERE event_id = ?').get(event_id);

            if (existingLive) {
                // Update existing
                db.prepare(`
          UPDATE live_events
          SET is_live = 1, stream_url = ?, countdown_end_time = ?, live_notices = ?, started_at = CURRENT_TIMESTAMP, ended_at = NULL
          WHERE event_id = ?
        `).run(stream_url, countdown_end_time || null, live_notices || null, event_id);
            } else {
                // Create new
                db.prepare(`
          INSERT INTO live_events (event_id, is_live, stream_url, countdown_end_time, live_notices, started_at)
          VALUES (?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(event_id, stream_url, countdown_end_time || null, live_notices || null);
            }

            res.json({ message: 'Live event started successfully' });
        } catch (error) {
            console.error('Start live event error:', error);
            res.status(500).json({ error: 'Failed to start live event' });
        }
    }
);

// Stop live event
router.post('/stop',
    authenticate,
    requirePermission('live_events'),
    (req, res) => {
        try {
            // Get currently live event
            const liveEvent = db.prepare('SELECT event_id FROM live_events WHERE is_live = 1').get();

            if (!liveEvent) {
                return res.status(404).json({ error: 'No live event found' });
            }

            // Stop live event
            db.prepare('UPDATE live_events SET is_live = 0, ended_at = CURRENT_TIMESTAMP WHERE is_live = 1').run();

            // Update event status to completed
            db.prepare('UPDATE events SET status = ? WHERE id = ?').run('completed', liveEvent.event_id);

            res.json({ message: 'Live event stopped successfully' });
        } catch (error) {
            console.error('Stop live event error:', error);
            res.status(500).json({ error: 'Failed to stop live event' });
        }
    }
);

// Update live event details
router.put('/:id',
    authenticate,
    requirePermission('live_events'),
    body('stream_url').optional().isURL(),
    body('live_notices').optional().trim(),
    body('countdown_end_time').optional().isISO8601(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { stream_url, live_notices, countdown_end_time } = req.body;

            const updates = [];
            const values = [];

            if (stream_url !== undefined) {
                updates.push('stream_url = ?');
                values.push(stream_url);
            }

            if (live_notices !== undefined) {
                updates.push('live_notices = ?');
                values.push(live_notices);
            }

            if (countdown_end_time !== undefined) {
                updates.push('countdown_end_time = ?');
                values.push(countdown_end_time);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            values.push(id);

            db.prepare(`UPDATE live_events SET ${updates.join(', ')} WHERE id = ?`).run(...values);

            res.json({ message: 'Live event updated successfully' });
        } catch (error) {
            console.error('Update live event error:', error);
            res.status(500).json({ error: 'Failed to update live event' });
        }
    }
);

export default router;
