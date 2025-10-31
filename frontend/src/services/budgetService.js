import api from './api';

const budgetService = {
  getAll: (params = {}) => api.get('/budgets', { params }),
  getById: (id) => api.get(`/budget/${id}`),
  create: (data) => api.post('/budget', data),
  update: (id, data) => api.put(`/budget/${id}`, data),
  delete: (id) => api.delete(`/budget/${id}`),

  // Aggregation endpoints
  getByEvent: (eventId) => api.get(`/budgets/event/${eventId}`),
  getByMonthYear: (month, year) => api.get(`/budgets/month-year`, { params: { month, year } }),
  getMonthlySummary: (month, year) => api.get(`/budget/summary/monthly`, { params: { month, year } }),
  getYearlySummary: (year) => api.get(`/budget/summary/yearly`, { params: { year } }),
  getEventSummary: (eventId) => api.get(`/budget/summary/event/${eventId}`),
};

export default budgetService;
