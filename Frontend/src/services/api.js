import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables sending and receiving HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token as fallback if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend reports token expired or unauthorized, clear local token
    if (error.response && error.response.status === 401) {
      if (error.response.data?.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
