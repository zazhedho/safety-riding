import api from './api';

const publicAuthService = {
  getRegisterStatus: () => api.get('/user/register/status'),
};

export default publicAuthService;
