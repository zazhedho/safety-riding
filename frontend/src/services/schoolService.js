import api from './api';

const schoolService = {
  getAll: (params = {}) => api.get('/schools', { params }),
  getById: (id) => api.get(`/school/${id}`),
  create: (data) => api.post('/school', data),
  update: (id, data) => api.put(`/school/${id}`, data),
  delete: (id) => api.delete(`/school/${id}`),
  getEducationStats: (params = {}) => api.get('/schools/education-stats', { params }),
};

export default schoolService;
