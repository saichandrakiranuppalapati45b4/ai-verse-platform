import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { generateToken } from '../config/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login',
    body('username').trim().notEmpty().withMessage('Email/Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, password } = req.body;
            let user = null;
            let role = '';
            let isJury = false;

            // 1. Check in USERS table (Admins) - Check by username OR email
            user = await db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

            if (user) {
                // Found in users table
                if (!user.is_active) {
                    return res.status(401).json({ error: 'Account is deactivated' });
                }
                role = user.role;
            } else {
                // 2. Check in JURY_MEMBERS table
                user = await db.prepare('SELECT * FROM jury_members WHERE email = ?').get(username);
                if (user) {
                    isJury = true;
                    // Jury members don't have 'role' column usually, so we assign one
                    role = 'jury';
                }
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const passwordHash = user.password_hash;
            if (!passwordHash) {
                // Should not happen if data integrity is good, but just in case
                return res.status(401).json({ error: 'Invalid credentials (no password set)' });
            }

            const isValidPassword = await bcrypt.compare(password, passwordHash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = generateToken({ userId: user.id, role: role });

            // For jury users, get their jury_member_id
            let juryMemberId = null;
            if (role === 'jury') {
                const juryMember = await db.prepare('SELECT id FROM jury_members WHERE email = ?').get(user.email);
                juryMemberId = juryMember?.id;
            }

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username || user.name, // Jury has name, not username
                    email: user.email,
                    role: role,
                    permissions: !isJury && user.permissions ? JSON.parse(user.permissions) : [],
                    jury_member_id: juryMemberId // Include jury_member_id for jury users
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// Get current user
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

// Change password
router.post('/change-password',
    authenticate,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { currentPassword, newPassword } = req.body;

            // Get current user
            const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.password_hash);

            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(newPasswordHash, req.user.id);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }
);

// Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
    res.json({ message: 'Logout successful' });
});

export default router;
