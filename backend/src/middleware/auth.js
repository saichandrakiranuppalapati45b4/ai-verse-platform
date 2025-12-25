import { verifyToken } from '../config/jwt.js';
import db from '../config/database.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        let user;

        if (decoded.role === 'jury') {
            // Jury users are now in the users table with role='jury'
            const juryUser = await db.prepare('SELECT id, username, email, role, is_active FROM users WHERE id = ? AND role = ?').get(decoded.userId, 'jury');

            if (juryUser) {
                if (!juryUser.is_active) {
                    return res.status(401).json({ error: 'Account is deactivated' });
                }

                // Also look up jury_members data by email for additional info
                const juryMember = await db.prepare('SELECT id as jury_member_id, name, designation, organization FROM jury_members WHERE email = ?').get(juryUser.email);

                req.user = {
                    id: juryUser.id,
                    username: juryUser.username,
                    name: juryMember?.name || juryUser.username,
                    email: juryUser.email,
                    role: 'jury',
                    permissions: ['events'],
                    jury_member_id: juryMember?.jury_member_id,
                    designation: juryMember?.designation,
                    organization: juryMember?.organization
                };
                user = req.user;
            }
        } else {
            // Check in USERS table
            user = await db.prepare('SELECT id, username, email, role, permissions, is_active FROM users WHERE id = ?').get(decoded.userId);

            if (user) {
                if (!user.is_active) {
                    return res.status(401).json({ error: 'Account is deactivated' });
                }

                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions ? JSON.parse(user.permissions) : []
                };
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (decoded) {
            const user = await db.prepare('SELECT id, username, email, role, permissions, is_active FROM users WHERE id = ?').get(decoded.userId);
            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions ? JSON.parse(user.permissions) : []
                };
            }
        }

        next();
    } catch (error) {
        next();
    }
};
