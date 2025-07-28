import axios from 'axios';

const apiUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${apiUrl}/api`,
  withCredentials: true,
});

export default api;
