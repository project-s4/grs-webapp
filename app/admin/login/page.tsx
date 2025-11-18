'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/auth-context';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // If user is already logged in and is admin, redirect
    if (user && !loading) {
      if (user.role === 'admin') {
        router.push(redirect || '/admin/dashboard');
      } else {
        toast.error('Access denied. Admin credentials required.');
        router.push('/login');
      }
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
      
      // Check if user is admin after login
      if (user && user.role === 'admin') {
        router.push(redirect || '/admin/dashboard');
      } else {
        toast.error('Access denied. Admin credentials required.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <LoginPageLayout
      title="Admin Sign In"
      subtitle="Sign in with your admin account"
      type="admin"
      footerLinks={[]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Any username and password will work. Admin role is assigned in the database.
          </p>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
      </form>
    </LoginPageLayout>
  );
}
