import api from './api';

const locationService = {
  getProvinces: (thn = '2025') => api.get('/province', { params: { thn } }),
  getCities: (pro, thn = '2025', lvl = '11') => api.get('/city', { params: { pro, thn, lvl } }),
  getDistricts: (pro, kab, thn = '2025', lvl = '12') => api.get('/district', { params: { pro, kab, thn, lvl } }),
};

export default locationService;
