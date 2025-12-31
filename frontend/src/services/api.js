import axios from 'axios'

const API_BASE_URL = window.ENV_CONFIG?.API_URL || import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't automatically redirect on 401
    // Let the component/context handle it
    if (error.response?.status === 401) {
      console.warn('Unauthorized request detected:', error.config?.url);
    }
    return Promise.reject(error)
  }
)

export default api