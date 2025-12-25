// Role-Based Access Control middleware

export const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
    }

    next();
};

export const requirePermission = (module) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Super admin has all permissions
        if (req.user.role === 'super_admin') {
            return next();
        }

        // Team admin must have specific permission
        if (req.user.role === 'team_admin') {
            if (!req.user.permissions || !req.user.permissions.includes(module)) {
                return res.status(403).json({ error: `Access denied. Required permission: ${module}` });
            }
            return next();
        }

        res.status(403).json({ error: 'Access denied' });
    };
};

// Check if user can modify resource created by another user
export const canModifyResource = (resourceCreatorId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Super admin can modify anything
        if (req.user.role === 'super_admin') {
            return next();
        }

        // Team admin can only modify their own resources
        if (req.user.id !== resourceCreatorId) {
            return res.status(403).json({ error: 'You can only modify your own resources' });
        }

        next();
    };
};
