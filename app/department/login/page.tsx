'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/auth-context';
import toast from 'react-hot-toast';
import { Github, Mail } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

export default function DepartmentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, login, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // If user is already logged in and is department user, redirect
    if (user && !loading) {
      if (user.role === 'department' || user.role === 'department_admin') {
        router.push(redirect || '/department/dashboard');
      } else {
        toast.error('Access denied. Department credentials required.');
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
      title="Department Sign In"
      subtitle="Sign in with your department account"
      type="department"
      footerLinks={[]}
    >
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> After signing in, your account will be verified for department access.
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
