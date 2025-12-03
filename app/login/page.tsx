'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/src/contexts/auth-context';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    // If user is already logged in, redirect
    if (user && !loading && !redirectingRef.current) {
      redirectingRef.current = true;
      
      let redirectPath = '/user/dashboard';
      
      if (redirect) {
        if (redirect === 'home' || redirect === '/home') {
          redirectPath = '/';
        } else if (redirect === 'dashboard' || redirect === '/dashboard') {
          if (user.role === 'admin') {
            redirectPath = '/admin/dashboard';
          } else if (user.role === 'department' || user.role === 'department_admin') {
            redirectPath = '/department/dashboard';
          } else {
            redirectPath = '/user/dashboard';
          }
        } else if (redirect.startsWith('/')) {
          redirectPath = redirect;
        }
      } else {
        // Default: Role-based redirect
        if (user.role === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (user.role === 'department' || user.role === 'department_admin') {
          redirectPath = '/department/dashboard';
        } else {
          redirectPath = '/user/dashboard';
        }
      }

      router.replace(redirectPath);
    }
  }, [user, loading, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      setIsSigningIn(true);
      await login(username, password);
      
      // Redirect after successful login
      let redirectPath = '/user/dashboard';
      if (redirect) {
        if (redirect === 'home' || redirect === '/home') {
          redirectPath = '/';
        } else if (redirect === 'dashboard' || redirect === '/dashboard') {
          redirectPath = '/user/dashboard';
        } else if (redirect.startsWith('/')) {
          redirectPath = redirect;
        }
      }
      
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const footerLinks = [
    { label: "Don't have an account?", href: '/register' },
  ];

  return (
    <LoginPageLayout
      title="Sign In"
      subtitle="Sign in to access your account"
      type="citizen"
      footerLinks={footerLinks}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input pl-12"
              placeholder="Enter username"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input pl-12"
              placeholder="Enter password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSigningIn || loading}
          className="btn-primary btn-lg w-full flex items-center justify-center gap-2"
        >
          {isSigningIn ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          <p>Any username and password will work for demo purposes.</p>
        </div>
      </form>
    </LoginPageLayout>
  );
}
