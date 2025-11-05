import api from './api';

const marketShareService = {
  // Get all market shares with filters
  getAll: async (params = {}) => {
    return api.get('/marketshares', { params });
  },

  // Get single market share by ID
  getById: async (id) => {
    return api.get(`/marketshare/${id}`);
  },

  // Create new market share
  create: async (data) => {
    return api.post('/marketshare', data);
  },

  // Update market share
  update: async (id, data) => {
    return api.put(`/marketshare/${id}`, data);
  },

  // Delete market share
  delete: async (id) => {
    return api.delete(`/marketshare/${id}`);
  },

  // Get top districts for dashboard
  getTopDistricts: async (year, month, limit = 5) => {
    return api.get('/marketshare/top-districts', {
      params: { year, month, limit }
    });
  },

  // Get aggregated summary by level
  getSummary: async (params = {}) => {
    return api.get('/marketshare/summary', { params });
  },

  // Get dashboard suggestions (top cities & districts)
  getDashboardSuggestions: async (params = {}) => {
    return api.get('/marketshare/dashboard-suggestions', { params });
  }
};

export default marketShareService;
