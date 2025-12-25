import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
    const { user, logout, hasPermission, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    console.log('Layout Render - User:', user);
    console.log('Layout Render - Roles:', { isSuperAdmin, role: user?.role });

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const allNavItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', permission: null },
        { path: '/admin/home', label: 'Home Page', icon: '🏠', permission: 'home' },
        { path: '/admin/about', label: 'About Page', icon: 'ℹ️', permission: 'about' },
        { path: '/admin/events', label: 'Events', icon: '📅', permission: 'events' },
        { path: '/admin/live-events', label: 'Live Events', icon: '🔴', permission: 'live_events' },
        { path: '/admin/gallery', label: 'Gallery', icon: '🖼️', permission: 'gallery' },
        { path: '/admin/team', label: 'Team', icon: '👥', permission: 'team' },
        { path: '/admin/jury', label: 'Jury', icon: '⚖️', permission: 'events' },
    ];

    // Select nav items based on role
    const navItems = user?.role === 'jury'
        ? [{ path: '/admin/dashboard', label: 'Dashboard', icon: '📊', permission: null }]
        : allNavItems;

    if (isSuperAdmin) {
        // Admin Management is handled separately in return
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2 className="gradient-text">AI Verse</h2>
                    <p className="text-muted">{user?.role === 'jury' ? 'Jury Panel' : 'Admin Panel'}</p>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => {
                        // Hide admin-only items from jury users
                        if (user?.role === 'jury' && item.path !== '/admin/dashboard') {
                            return null;
                        }

                        let allowed = true;
                        try {
                            if (item.permission && !hasPermission(item.permission)) allowed = false;
                        } catch (e) {
                            console.error('Permission check error for item:', item.label, e);
                            allowed = false;
                        }

                        if (!allowed) return null;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        );
                    })}

                    {isSuperAdmin && (
                        <NavLink
                            to="/admin/admins"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">🔐</span>
                            <span className="nav-label">Admin Management</span>
                        </NavLink>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {/* Safer avatar generation */}
                            {(() => {
                                try {
                                    const name = user?.username || user?.name || user?.email || '?';
                                    return name.charAt(0).toUpperCase();
                                } catch (e) {
                                    return '?';
                                }
                            })()}
                        </div>
                        <div>
                            <p className="user-name">{user?.username || user?.name || 'User'}</p>
                            <p className="user-role text-muted">
                                {(() => {
                                    if (user?.role === 'super_admin') return 'Super Admin';
                                    if (user?.role === 'jury') return 'Jury Member';
                                    return 'Team Admin';
                                })()}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
