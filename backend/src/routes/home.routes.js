import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get home content (public)
router.get('/', (req, res) => {
    try {
        const content = db.prepare('SELECT * FROM home_content WHERE id = 1').get();

        if (!content) {
            return res.status(404).json({ error: 'Home content not found' });
        }

        res.json({
            ...content,
            sections_config: content.sections_config ? JSON.parse(content.sections_config) : {},
            announcement_enabled: Boolean(content.announcement_enabled)
        });
    } catch (error) {
        console.error('Get home content error:', error);
        res.status(500).json({ error: 'Failed to fetch home content' });
    }
});

// Update home content
router.put('/',
    authenticate,
    requirePermission('home'),
    body('hero_title').optional().trim().notEmpty().withMessage('Hero title cannot be empty'),
    body('hero_subtitle').optional().trim().notEmpty().withMessage('Hero subtitle cannot be empty'),
    body('announcement_text').optional().trim(),
    body('announcement_enabled').optional().isBoolean(),
    body('sections_config').optional().isObject(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                hero_title,
                hero_subtitle,
                announcement_text,
                announcement_enabled,
                sections_config
            } = req.body;

            const updates = [];
            const values = [];

            if (hero_title !== undefined) {
                updates.push('hero_title = ?');
                values.push(hero_title);
            }

            if (hero_subtitle !== undefined) {
                updates.push('hero_subtitle = ?');
                values.push(hero_subtitle);
            }

            if (announcement_text !== undefined) {
                updates.push('announcement_text = ?');
                values.push(announcement_text);
            }

            if (announcement_enabled !== undefined) {
                updates.push('announcement_enabled = ?');
                values.push(announcement_enabled ? 1 : 0);
            }

            if (sections_config !== undefined) {
                updates.push('sections_config = ?');
                values.push(JSON.stringify(sections_config));
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            updates.push('updated_by = ?');
            values.push(req.user.id);

            db.prepare(`UPDATE home_content SET ${updates.join(', ')} WHERE id = 1`).run(...values);

            res.json({ message: 'Home content updated successfully' });
        } catch (error) {
            console.error('Update home content error:', error);
            res.status(500).json({ error: 'Failed to update home content' });
        }
    }
);

// Upload hero image
router.post('/upload-hero',
    authenticate,
    requirePermission('home'),
    upload.single('image'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const imageUrl = `/uploads/${req.file.filename}`;

            // Update home content with new image URL
            db.prepare('UPDATE home_content SET hero_image_url = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = 1')
                .run(imageUrl, req.user.id);

            res.json({
                message: 'Hero image uploaded successfully',
                imageUrl
            });
        } catch (error) {
            console.error('Upload hero image error:', error);
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }
);

export default router;
