import api from './api';

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/api/auth/login', { username, password });
        return response.data;
    },

    logout: async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser: async () => {
        const response = await api.get('/api/auth/me');
        return response.data.user;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await api.post('/api/auth/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    }
};

export default authService;
