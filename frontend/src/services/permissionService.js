import api from './api';

const permissionService = {
  getAll: (params = {}) => api.get('/permissions', { params }),
  getById: (id) => api.get(`/permission/${id}`),
  create: (data) => api.post('/permission', data),
  update: (id, data) => api.put(`/permission/${id}`, data),
  delete: (id) => api.delete(`/permission/${id}`),
  getUserPermissions: () => api.get('/permissions/me'),
};

export default permissionService;
