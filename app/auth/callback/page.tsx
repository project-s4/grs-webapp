'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/src/contexts/auth-context';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hwlngdpexkgbtrzatfox.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bG5nZHBleGtnYnRyemF0Zm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODMzOTMsImV4cCI6MjA3NzU1OTM5M30.L6ltCRG5qPfxdPF3vzO4JO9Xsm0UtQtiQfF3WnJZH-Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code from URL
        const code = searchParams.get('code');
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const error = searchParams.get('error');

        if (error) {
          router.push(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        // If we have token and refresh token, set the session directly
        if (token && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            router.push('/login?error=session_error');
            return;
          }

          // Session is set, wait for auth context to update
          // The auth context will check session and redirect appropriately
          return;
        }

        // If we have code, exchange it for session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            router.push(`/login?error=${encodeURIComponent(exchangeError.message || 'exchange_error')}`);
            return;
          }

          if (data?.session) {
            // Session is set, wait for auth context to update
            return;
          }
        }

        // Check if we have an existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, auth context will handle redirect
          return;
        }

        // No session and no code/token, redirect to login
        router.push('/login?error=no_session');
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  // Once user is loaded, redirect based on role
  useEffect(() => {
    if (!loading && user) {
      let redirectPath = '/user/dashboard';
      
      if (user.role === 'admin') {
        redirectPath = '/admin/dashboard';
      } else if (user.role === 'department' || user.role === 'department_admin') {
        redirectPath = '/department/dashboard';
      }

      router.push(redirectPath);
    } else if (!loading && !user) {
      // Check if we need to create profile
      const supabaseUserId = searchParams.get('supabase_user_id');
      const email = searchParams.get('email');
      
      if (supabaseUserId) {
        // Redirect to register page to create profile
        const registerUrl = new URL('/register', window.location.origin);
        registerUrl.searchParams.set('supabase_user_id', supabaseUserId);
        if (email) {
          registerUrl.searchParams.set('email', email);
        }
        router.push(registerUrl.pathname + registerUrl.search);
      } else {
        // No user and no profile creation needed, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router, searchParams]);

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}

