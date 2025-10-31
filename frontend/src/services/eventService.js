import api from './api';

const eventService = {
  getAll: (params = {}) => api.get('/events', { params }),
  getById: (id) => api.get(`/event/${id}`),
  create: (data) => api.post('/event', data),
  update: (id, data) => api.put(`/event/${id}`, data),
  delete: (id) => api.delete(`/event/${id}`),

  // Photo endpoints
  addPhotos: (eventId, photos) => api.post(`/event/${eventId}/photos`, { photos }),
  deletePhoto: (photoId) => api.delete(`/event/photo/${photoId}`),
};

export default eventService;
