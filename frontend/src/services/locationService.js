import api from './api';

const normalizeLocationOptions = (payload) => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (!item) return null;

        if (typeof item === 'string') {
          return { code: item, name: item };
        }

        const code = item.code ?? item.id ?? item.value ?? item.kode ?? '';
        const name = item.name ?? item.label ?? item.text ?? item.nama ?? '';

        if (!code && !name) return null;

        return {
          code: String(code || name),
          name: String(name || code),
        };
      })
      .filter(Boolean);
  }

  if (typeof payload === 'object') {
    return Object.entries(payload).map(([code, name]) => ({
      code: String(code),
      name: String(name),
    }));
  }

  return [];
};

const locationService = {
  getProvinces: async (thn = '2025') => {
    const response = await api.get('/province', { params: { thn } });
    response.data.data = normalizeLocationOptions(response.data?.data);
    return response;
  },
  getCities: async (pro, thn = '2025', lvl = '11') => {
    const response = await api.get('/city', { params: { pro, thn, lvl } });
    response.data.data = normalizeLocationOptions(response.data?.data);
    return response;
  },
  getDistricts: async (pro, kab, thn = '2025', lvl = '12') => {
    const response = await api.get('/district', { params: { pro, kab, thn, lvl } });
    response.data.data = normalizeLocationOptions(response.data?.data);
    return response;
  },
};

export default locationService;
