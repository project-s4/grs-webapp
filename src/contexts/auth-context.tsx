'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'auth_token';
const LEGACY_TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const verifyingRef = useRef(false);
  const checkedRef = useRef(false);

  const clearStoredTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  };

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || checkedRef.current) return;
    checkSession();
  }, [mounted]);

  const checkSession = async () => {
    if (checkedRef.current || verifyingRef.current) return;
    checkedRef.current = true;

    try {
      const existingToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);

      if (existingToken && !localStorage.getItem(TOKEN_KEY)) {
        localStorage.setItem(TOKEN_KEY, existingToken);
      }

      if (existingToken) {
        await verifyToken(existingToken);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      clearStoredTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    try {
      // Don't verify if user is already set and matches token
      if (user) {
        verifyingRef.current = false;
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id.toString(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role,
          department_id: userData.department_id
        });
        } else {
          // Token invalid, remove it
          clearStoredTokens();
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        clearStoredTokens();
        setUser(null);
      } finally {
        verifyingRef.current = false;
      }
    };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      
        // Store token (keep legacy key for older pages still reading "token")
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(LEGACY_TOKEN_KEY, data.access_token);
      
      // Set user
      setUser({
        id: data.user.id.toString(),
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '',
        role: data.user.role,
        department_id: data.user.department_id
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
        clearStoredTokens();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, login, logout, loading: true, isAuthenticated: () => false }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
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
