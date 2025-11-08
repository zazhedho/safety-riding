import api from './api';

const accidentService = {
  getAll: (params = {}) => api.get('/accidents', { params }),
  getById: (id) => api.get(`/accident/${id}`),
  create: (data) => api.post('/accident', data),
  update: (id, data) => api.put(`/accident/${id}`, data),
  delete: (id) => api.delete(`/accident/${id}`),

  // Photo endpoints
  addPhotos: (accidentId, formData) => api.post(`/accident/${accidentId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deletePhoto: (photoId) => api.delete(`/accident/photo/${photoId}`),
};

export default accidentService;
