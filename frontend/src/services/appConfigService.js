import api from './api';

const appConfigService = {
  getAll: (params = {}) => api.get('/configs', { params }),
  update: (id, data) => api.put(`/config/${id}`, data),
};

export default appConfigService;
