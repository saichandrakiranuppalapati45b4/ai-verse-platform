import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { upload, deleteFile } from '../middleware/upload.js';

const router = express.Router();

// Get approved gallery items (public)
router.get('/', (req, res) => {
    try {
        const { event_id } = req.query;

        let query = 'SELECT * FROM gallery WHERE is_approved = 1';
        const params = [];

        if (event_id) {
            query += ' AND event_id = ?';
            params.push(event_id);
        }

        query += ' ORDER BY uploaded_at DESC';

        const items = db.prepare(query).all(...params);

        res.json({
            gallery: items.map(item => ({
                ...item,
                is_approved: Boolean(item.is_approved)
            }))
        });
    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Get all gallery items including unapproved (admin only)
router.get('/all', authenticate, requirePermission('gallery'), (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM gallery ORDER BY uploaded_at DESC').all();

        res.json({
            gallery: items.map(item => ({
                ...item,
                is_approved: Boolean(item.is_approved)
            }))
        });
    } catch (error) {
        console.error('Get all gallery error:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Upload gallery item
router.post('/upload',
    authenticate,
    requirePermission('gallery'),
    upload.single('file'),
    body('caption').optional().trim(),
    body('event_id').optional().isInt(),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { caption, event_id } = req.body;

            // Determine file type
            const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
            const fileUrl = `/uploads/${req.file.filename}`;

            const result = db.prepare(`
        INSERT INTO gallery (file_url, file_type, event_id, caption, is_approved, uploaded_by)
        VALUES (?, ?, ?, ?, 1, ?)
      `).run(fileUrl, fileType, event_id || null, caption || null, req.user.id);

            res.status(201).json({
                message: 'File uploaded successfully',
                item: {
                    id: result.lastInsertRowid,
                    file_url: fileUrl,
                    file_type: fileType,
                    event_id: event_id || null,
                    caption: caption || null
                }
            });
        } catch (error) {
            console.error('Upload gallery error:', error);
            res.status(500).json({ error: 'Failed to upload file' });
        }
    }
);

// Approve gallery item
router.put('/:id/approve', authenticate, requirePermission('gallery'), (req, res) => {
    try {
        const { id } = req.params;

        const item = db.prepare('SELECT id FROM gallery WHERE id = ?').get(id);
        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        db.prepare('UPDATE gallery SET is_approved = 1 WHERE id = ?').run(id);

        res.json({ message: 'Gallery item approved successfully' });
    } catch (error) {
        console.error('Approve gallery error:', error);
        res.status(500).json({ error: 'Failed to approve gallery item' });
    }
});

// Delete gallery item
router.delete('/:id', authenticate, requirePermission('gallery'), (req, res) => {
    try {
        const { id } = req.params;

        const item = db.prepare('SELECT file_url FROM gallery WHERE id = ?').get(id);
        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        // Delete file from filesystem
        deleteFile(item.file_url);

        // Delete from database
        db.prepare('DELETE FROM gallery WHERE id = ?').run(id);

        res.json({ message: 'Gallery item deleted successfully' });
    } catch (error) {
        console.error('Delete gallery error:', error);
        res.status(500).json({ error: 'Failed to delete gallery item' });
    }
});

export default router;
