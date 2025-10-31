import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/user/login', { username, password });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/user/register', userData);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/user/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  hasRole: (roles) => {
    const user = authService.getCurrentUser();
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  },
};

export default authService;
