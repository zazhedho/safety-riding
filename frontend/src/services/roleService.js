import api from './api';

const roleService = {
  getAll: (params = {}) => api.get('/roles', { params }),
  getById: (id) => api.get(`/role/${id}`),
  create: (data) => api.post('/role', data),
  update: (id, data) => api.put(`/role/${id}`, data),
  delete: (id) => api.delete(`/role/${id}`),
  assignPermissions: (id, data) => api.post(`/role/${id}/permissions`, data),
  assignMenus: (id, data) => api.post(`/role/${id}/menus`, data),
};

export default roleService;
