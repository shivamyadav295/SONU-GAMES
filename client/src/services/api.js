import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rps_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  guestLogin: () => api.post('/auth/guest'),
  getMe: () => api.get('/auth/me'),
};

export const matchApi = {
  recordMatch: (data) => api.post('/matches/record', data),
  getHistory: (limit = 20) => api.get(`/matches/history?limit=${limit}`),
  getLeaderboard: (limit = 20) => api.get(`/leaderboard?limit=${limit}`),
};

export default api;
