'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/auth-context';
import toast from 'react-hot-toast';
import { Github, Mail } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, login, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // If user is already logged in and is admin, redirect
    if (user && !loading) {
      if (user.role === 'admin') {
        router.push(redirect || '/admin/dashboard');
      } else {
        toast.error('Access denied. Admin credentials required.');
        // Redirect to regular login
        router.push('/login');
      }
    }
  }, [user, loading, redirect, router]);

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    try {
      setIsSigningIn(true);
      await login(provider);
      // OAuth will redirect, role check happens in callback
    } catch (error: any) {
      console.error('OAuth login error:', error);
      toast.error(error.message || 'Failed to sign in. Please try again.');
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
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> After signing in, your account will be verified for admin access.
          </p>
        </div>

        <button
          onClick={() => handleOAuthLogin('google')}
          disabled={isSigningIn || loading}
          className="btn-primary btn-lg w-full flex items-center justify-center gap-3"
        >
          <Mail className="w-5 h-5" />
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <button
          onClick={() => handleOAuthLogin('github')}
          disabled={isSigningIn || loading}
          className="btn-secondary btn-lg w-full flex items-center justify-center gap-3"
        >
          <Github className="w-5 h-5" />
          {isSigningIn ? 'Signing in...' : 'Sign in with GitHub'}
        </button>
      </div>
    </LoginPageLayout>
  );
}
