import api from './api';

const poldaService = {
  getAll: (params = {}) => api.get('/polda-accidents', { params }),
  getById: (id) => api.get(`/polda-accident/${id}`),
  create: (data) => api.post('/polda-accident', data),
  update: (id, data) => api.put(`/polda-accident/${id}`, data),
  delete: (id) => api.delete(`/polda-accident/${id}`)
};

export default poldaService;
