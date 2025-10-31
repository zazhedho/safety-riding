import api from './api';

const schoolService = {
  getAll: (params = {}) => api.get('/schools', { params }),
  getById: (id) => api.get(`/school/${id}`),
  create: (data) => api.post('/school', data),
  update: (id, data) => api.put(`/school/${id}`, data),
  delete: (id) => api.delete(`/school/${id}`),
};

export default schoolService;
