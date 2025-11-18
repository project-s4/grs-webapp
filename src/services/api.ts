import axios from 'axios';

// API client - proxies to Next.js API routes, which then proxy to backend
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const TOKEN_KEY = 'auth_token';

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Remove token and redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    
    // Extract error message from response
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'An error occurred';
    
    // Create a standardized error object
    const standardError = {
      message,
      status: error.response?.status,
      data: error.response?.data,
      original: error
    };
    
    return Promise.reject(standardError);
  }
);

export default api;
