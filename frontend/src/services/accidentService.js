import api from './api';

const accidentService = {
  getAll: (params = {}) => api.get('/accidents', { params }),
  getById: (id) => api.get(`/accident/${id}`),
  create: (data) => api.post('/accident', data),
  update: (id, data) => api.put(`/accident/${id}`, data),
  delete: (id) => api.delete(`/accident/${id}`),
};

export default accidentService;
