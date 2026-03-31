import api from './api';

const approvalRecordService = {
  getAll: (params = {}) => api.get('/approval-records', { params }),
  getById: (id) => api.get(`/approval-records/${id}`),
  sync: (force = false) => api.post(`/approval-records/sync${force ? '?force=true' : ''}`),
  getConfig: () => api.get('/approval-records/config'),
};

export default approvalRecordService;
