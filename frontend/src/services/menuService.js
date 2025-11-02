import api from './api';

const menuService = {
  getAll: (params = {}) => api.get('/menus', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  getActiveMenus: () => api.get('/menus/active'),
  getUserMenus: () => {
    console.log('Calling getUserMenus API...');
    console.log('Token:', localStorage.getItem('token'));
    return api.get('/menus/me');
  },
};

export default menuService;
