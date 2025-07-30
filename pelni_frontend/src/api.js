import axios from 'axios';

const apiUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${apiUrl}/api`,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      // Jika token ada, sisipkan ke header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Lanjutkan permintaan
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
