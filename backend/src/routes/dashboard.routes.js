import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, (req, res) => {
    try {
        // Count total events
        const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;

        // Count upcoming events
        const upcomingEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'upcoming'").get().count;

        // Count live events
        const liveEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'live'").get().count;

        // Count gallery items
        const galleryItems = db.prepare('SELECT COUNT(*) as count FROM gallery WHERE is_approved = 1').get().count;

        // Count team members
        const teamMembers = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE is_visible = 1').get().count;

        // Count admins (for super admin)
        let adminCount = 0;
        if (req.user.role === 'super_admin') {
            adminCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        }

        // Get recent events
        const recentEvents = db.prepare(`
      SELECT id, title, event_date, event_time, status
      FROM events
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

        res.json({
            stats: {
                totalEvents,
                upcomingEvents,
                liveEvents,
                galleryItems,
                teamMembers,
                adminCount
            },
            recentEvents
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

export default router;
