'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/auth-context';
import toast from 'react-hot-toast';
import { Github, Mail } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, login, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect
    if (user && !loading) {
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

      router.push(redirectPath);
    }
  }, [user, loading, redirect, router]);

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    try {
      setIsSigningIn(true);
      await login(provider);
      // OAuth will redirect, so we don't need to do anything here
    } catch (error: any) {
      console.error('OAuth login error:', error);
      toast.error(error.message || 'Failed to sign in. Please try again.');
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
      <div className="space-y-4">
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

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          <p>By signing in, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    </LoginPageLayout>
  );
}
