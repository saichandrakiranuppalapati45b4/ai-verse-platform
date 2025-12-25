import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/rbac.js';

const router = express.Router();

// Get all admins (Super Admin only)
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const admins = await db.prepare(`
      SELECT id, username, email, role, permissions, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

        const adminsWithParsedPermissions = admins.map(admin => ({
            ...admin,
            permissions: admin.permissions ? JSON.parse(admin.permissions) : [],
            is_active: Boolean(admin.is_active)
        }));

        res.json({ admins: adminsWithParsedPermissions });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Create team admin (Super Admin only)
router.post('/',
    authenticate,
    requireSuperAdmin,
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email, password, permissions } = req.body;

            // Check if username or email already exists
            const existing = await db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
            if (existing) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert new admin
            const result = await db.prepare(`
        INSERT INTO users (username, email, password_hash, role, permissions)
        VALUES (?, ?, ?, 'team_admin', ?)
      `).run(username, email, passwordHash, JSON.stringify(permissions));

            res.status(201).json({
                message: 'Team admin created successfully',
                admin: {
                    id: result.lastInsertRowid,
                    username,
                    email,
                    role: 'team_admin',
                    permissions
                }
            });
        } catch (error) {
            console.error('Create admin error:', error);
            res.status(500).json({ error: 'Failed to create admin' });
        }
    }
);

// Update admin permissions (Super Admin only)
router.put('/:id',
    authenticate,
    requireSuperAdmin,
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
    body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { permissions, is_active } = req.body;

            // Check if admin exists and is not super admin
            const admin = await db.prepare('SELECT role FROM users WHERE id = ?').get(id);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            if (admin.role === 'super_admin') {
                return res.status(403).json({ error: 'Cannot modify super admin' });
            }

            // Update admin
            const updates = [];
            const values = [];

            if (permissions !== undefined) {
                updates.push('permissions = ?');
                values.push(JSON.stringify(permissions));
            }

            if (is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(is_active ? 1 : 0);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

            res.json({ message: 'Admin updated successfully' });
        } catch (error) {
            console.error('Update admin error:', error);
            res.status(500).json({ error: 'Failed to update admin' });
        }
    }
);

// Reset admin password (Super Admin only)
router.post('/:id/reset-password',
    authenticate,
    requireSuperAdmin,
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { newPassword } = req.body;

            // Check if admin exists
            const admin = await db.prepare('SELECT id FROM users WHERE id = ?').get(id);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(passwordHash, id);

            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    }
);

// Delete admin (Super Admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if admin exists and is not super admin
        const admin = await db.prepare('SELECT role FROM users WHERE id = ?').get(id);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (admin.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot delete super admin' });
        }

        // Handle Foreign Key Constraints Manually (set added_by/updated_by to NULL)
        await db.prepare('UPDATE home_content SET updated_by = NULL WHERE updated_by = ?').run(id);
        await db.prepare('UPDATE about_content SET updated_by = NULL WHERE updated_by = ?').run(id);
        await db.prepare('UPDATE events SET created_by = NULL WHERE created_by = ?').run(id);
        await db.prepare('UPDATE gallery SET uploaded_by = NULL WHERE uploaded_by = ?').run(id);
        await db.prepare('UPDATE team_members SET added_by = NULL WHERE added_by = ?').run(id);

        // Delete admin
        await db.prepare('DELETE FROM users WHERE id = ?').run(id);

        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ error: 'Failed to delete admin' });
    }
});

export default router;
