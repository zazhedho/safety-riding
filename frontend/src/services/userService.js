import api from './api';

const userService = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/user/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updatePassword: (data) => api.put('/user/password', data),
};

export default userService;
