'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department_id?: number;
} | null;

type AuthContextType = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Fix hydration issues by ensuring client-side only operations
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // Decode JWT token to get user info
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.id.toString(),
            name: payload.name,
            email: payload.email,
            phone: payload.phone || '',
            role: payload.role,
            department_id: payload.department_id
          });
        } catch (decodeError) {
          console.error('Failed to decode token:', decodeError);
          authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login({ email, password });
      // Use user data from login response instead of making additional API call
      if (data.user) {
        setUser({
          id: data.user.id.toString(),
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '',
          role: data.user.role,
          department_id: data.user.department_id
        });
      }
      // Route users based on their role with navigation guard
      setTimeout(() => {
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'department' || data.user.role === 'department_admin') {
          router.push('/department/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      }, 100); // Small delay to prevent navigation throttling
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      // Registration successful, but don't auto-login
      // Let user manually login after registration
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = () => {
    return !!user && !!authService.getToken();
  };

  // Prevent hydration mismatch by only rendering children after mounting
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, login, register, logout, loading: true, isAuthenticated: () => false }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
