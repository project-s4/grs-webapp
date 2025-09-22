import api from './api';

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'citizen' | 'admin' | 'department_admin';
  department_id?: string;
};

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response.data;
  },

  async register(userData: RegisterData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
