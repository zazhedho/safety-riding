import api from './api';

const publicService = {
  getAll: (params = {}) => api.get('/publics', { params }),
  getById: (id) => api.get(`/public/${id}`),
  create: (data) => api.post('/public', data),
  update: (id, data) => api.put(`/public/${id}`, data),
  delete: (id) => api.delete(`/public/${id}`),
  getEducationStats: (params = {}) => api.get('/publics/education-stats', { params }),
};

export default publicService;
