import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get about content (public)
router.get('/', (req, res) => {
    try {
        const content = db.prepare('SELECT * FROM about_content WHERE id = 1').get();

        if (!content) {
            return res.status(404).json({ error: 'About content not found' });
        }

        res.json({
            ...content,
            faculty_coordinators: content.faculty_coordinators ? JSON.parse(content.faculty_coordinators) : []
        });
    } catch (error) {
        console.error('Get about content error:', error);
        res.status(500).json({ error: 'Failed to fetch about content' });
    }
});

// Update about content
router.put('/',
    authenticate,
    requirePermission('about'),
    body('description').optional().trim().notEmpty(),
    body('vision').optional().trim().notEmpty(),
    body('mission').optional().trim().notEmpty(),
    body('department_info').optional().trim().notEmpty(),
    body('faculty_coordinators').optional().isArray(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                description,
                vision,
                mission,
                department_info,
                faculty_coordinators
            } = req.body;

            const updates = [];
            const values = [];

            if (description !== undefined) {
                updates.push('description = ?');
                values.push(description);
            }

            if (vision !== undefined) {
                updates.push('vision = ?');
                values.push(vision);
            }

            if (mission !== undefined) {
                updates.push('mission = ?');
                values.push(mission);
            }

            if (department_info !== undefined) {
                updates.push('department_info = ?');
                values.push(department_info);
            }

            if (faculty_coordinators !== undefined) {
                updates.push('faculty_coordinators = ?');
                values.push(JSON.stringify(faculty_coordinators));
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            updates.push('updated_by = ?');
            values.push(req.user.id);

            db.prepare(`UPDATE about_content SET ${updates.join(', ')} WHERE id = 1`).run(...values);

            res.json({ message: 'About content updated successfully' });
        } catch (error) {
            console.error('Update about content error:', error);
            res.status(500).json({ error: 'Failed to update about content' });
        }
    }
);

export default router;
