import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { upload, deleteFile } from '../middleware/upload.js';

const router = express.Router();

// Get visible team members (public)
router.get('/', async (req, res) => {
    try {
        const members = await db.prepare(`
      SELECT * FROM team_members
      WHERE is_visible = 1
      ORDER BY display_order ASC, created_at ASC
    `).all();

        res.json({
            team: members.map(member => ({
                ...member,
                is_visible: Boolean(member.is_visible)
            }))
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Get all team members including hidden (admin only)
router.get('/all', authenticate, requirePermission('team'), async (req, res) => {
    try {
        const members = await db.prepare(`
      SELECT * FROM team_members
      ORDER BY display_order ASC, created_at ASC
    `).all();

        res.json({
            team: members.map(member => ({
                ...member,
                is_visible: Boolean(member.is_visible)
            }))
        });
    } catch (error) {
        console.error('Get all team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Add team member
router.post('/',
    authenticate,
    requirePermission('team'),
    upload.single('image'), // Handle file upload first to populate req.body
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('bio').optional().trim(),
    body('linkedin_url').optional({ checkFalsy: true }).isURL().withMessage('Invalid LinkedIn URL'),
    body('github_url').optional({ checkFalsy: true }).isURL().withMessage('Invalid GitHub URL'),
    body('display_order').optional().isInt(),
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // If validation fails, delete the uploaded file if it exists
                if (req.file) {
                    deleteFile(req.file.path);
                }
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                name,
                role,
                department,
                bio,
                linkedin_url,
                github_url,
                display_order = 0
            } = req.body;

            // Get image URL if file was uploaded
            const profile_image_url = req.file ? `/uploads/${req.file.filename}` : null;

            const result = await db.prepare(`
        INSERT INTO team_members (name, role, department, bio, linkedin_url, github_url, display_order, profile_image_url, added_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                name,
                role,
                department || null,
                bio || null,
                linkedin_url || null,
                github_url || null,
                display_order || 0,
                profile_image_url,
                req.user.id
            );

            res.status(201).json({
                message: 'Team member added successfully',
                member: {
                    id: result.lastInsertRowid,
                    name,
                    role,
                    bio,
                    linkedin_url,
                    github_url,
                    display_order,
                    profile_image_url
                }
            });
        } catch (error) {
            console.error('Add team member error:', error);
            // Cleanup on error
            if (req.file) {
                deleteFile(req.file.path);
            }
            res.status(500).json({ error: 'Failed to add team member' });
        }
    }
);

// Update team member
router.put('/:id',
    authenticate,
    requirePermission('team'),
    body('name').optional().trim().notEmpty(),
    body('role').optional().trim().notEmpty(),
    body('department').optional().trim().notEmpty(),
    body('bio').optional().trim(),
    body('linkedin_url').optional({ checkFalsy: true }).isURL(),
    body('github_url').optional({ checkFalsy: true }).isURL(),
    body('is_visible').optional().isBoolean(),
    body('display_order').optional().isInt(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const {
                name,
                role,
                department,
                bio,
                linkedin_url,
                github_url,
                is_visible,
                display_order
            } = req.body;

            const member = await db.prepare('SELECT id FROM team_members WHERE id = ?').get(id);
            if (!member) {
                return res.status(404).json({ error: 'Team member not found' });
            }

            const updates = [];
            const values = [];

            if (name !== undefined) {
                updates.push('name = ?');
                values.push(name);
            }

            if (role !== undefined) {
                updates.push('role = ?');
                values.push(role);
            }

            if (department !== undefined) {
                updates.push('department = ?');
                values.push(department);
            }

            if (bio !== undefined) {
                updates.push('bio = ?');
                values.push(bio);
            }

            if (linkedin_url !== undefined) {
                updates.push('linkedin_url = ?');
                values.push(linkedin_url);
            }

            if (github_url !== undefined) {
                updates.push('github_url = ?');
                values.push(github_url);
            }

            if (is_visible !== undefined) {
                updates.push('is_visible = ?');
                values.push(String(is_visible) === 'true' || is_visible === true ? 1 : 0);
            }

            if (display_order !== undefined) {
                updates.push('display_order = ?');
                values.push(display_order);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            values.push(id);

            await db.prepare(`UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`).run(...values);

            res.json({ message: 'Team member updated successfully' });
        } catch (error) {
            console.error('Update team member error:', error);
            res.status(500).json({ error: 'Failed to update team member' });
        }
    }
);

// Upload profile image
router.post('/:id/upload-image',
    authenticate,
    requirePermission('team'),
    upload.single('image'),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const member = await db.prepare('SELECT id FROM team_members WHERE id = ?').get(id);
            if (!member) {
                return res.status(404).json({ error: 'Team member not found' });
            }

            const imageUrl = `/uploads/${req.file.filename}`;

            await db.prepare('UPDATE team_members SET profile_image_url = ? WHERE id = ?').run(imageUrl, id);

            res.json({
                message: 'Profile image uploaded successfully',
                imageUrl
            });
        } catch (error) {
            console.error('Upload profile image error:', error);
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }
);

// Delete team member
router.delete('/:id', authenticate, requirePermission('team'), async (req, res) => {
    try {
        const { id } = req.params;

        const member = await db.prepare('SELECT profile_image_url FROM team_members WHERE id = ?').get(id);
        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        // Delete profile image if exists
        if (member.profile_image_url) {
            deleteFile(member.profile_image_url);
        }

        await db.prepare('DELETE FROM team_members WHERE id = ?').run(id);

        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        console.error('Delete team member error:', error);
        res.status(500).json({ error: 'Failed to delete team member' });
    }
});

export default router;
