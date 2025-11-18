'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/auth-context';
import toast from 'react-hot-toast';
import { Github, Mail, AlertCircle } from 'lucide-react';
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

  // Check for error in URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = error;
      if (error.includes('Unable to exchange external code') || error.includes('server_error')) {
        errorMessage = 'OAuth configuration error. Please verify Client ID and Secret in Supabase Dashboard.';
      } else if (error.includes('provider is not enabled')) {
        errorMessage = 'OAuth provider is not enabled. Please enable it in Supabase Dashboard.';
      } else if (error.includes('redirect_uri_mismatch')) {
        errorMessage = 'Redirect URI mismatch. Please check callback URL configuration.';
      }
      toast.error(errorMessage, { duration: 8000 });
    }
  }, [searchParams]);

  return (
    <LoginPageLayout
      title="Sign In"
      subtitle="Sign in to access your account"
      type="citizen"
      footerLinks={footerLinks}
    >
      <div className="space-y-4">
        {searchParams.get('error') && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">OAuth Configuration Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  Unable to exchange OAuth code. This usually means the Client Secret in Supabase doesn't match your OAuth app.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Fix:</strong> Go to{' '}
                  <a 
                    href="https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    Supabase Dashboard → Authentication → Providers
                  </a>{' '}
                  and verify/re-enter the Client Secret for your OAuth provider.
                </p>
              </div>
            </div>
          </div>
        )}
        
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
