import axios from 'axios';
import { supabase } from '@/src/lib/supabase';

// API client - proxies to Next.js API routes, which then proxy to backend
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor for auth token
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting Supabase session:', error);
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
      // Sign out from Supabase and redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        await supabase.auth.signOut();
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
