import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        const data = await authService.login(username, password);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await authService.logout();
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    const hasPermission = (module) => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        if (user.role === 'jury') {
            // Jury members NEVER have access to admin event manager
            // They only access the dedicated marking interface which doesn't check this permission
            return false;
        }
        if (user.role === 'team_admin') {
            return user.permissions && user.permissions.includes(module);
        }
        return false;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
