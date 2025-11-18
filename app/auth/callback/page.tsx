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
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          let errorMsg = errorDescription || error;
          if (error === 'server_error' || errorDescription?.includes('Unable to exchange external code')) {
            errorMsg = 'OAuth configuration error. Please verify Client ID and Secret in Supabase Dashboard.';
          }
          // Check if we have a department portal redirect
          const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
          const redirectPath = deptPortalRedirect || '/login';
          if (deptPortalRedirect) {
            sessionStorage.removeItem('dept_portal_redirect');
          }
          router.push(`${redirectPath}?error=${encodeURIComponent(errorMsg)}`);
          return;
        }

        // If we have code, exchange it for session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            let errorMessage = 'oauth_error';
            if (exchangeError.message?.includes('Unable to exchange external code') || exchangeError.message?.includes('server_error')) {
              errorMessage = 'OAuth configuration error. Please verify Client ID and Secret in Supabase Dashboard.';
            } else if (exchangeError.message?.includes('invalid_grant') || exchangeError.message?.includes('code expired')) {
              errorMessage = 'OAuth code expired. Please try signing in again.';
            } else {
              errorMessage = exchangeError.message || 'oauth_error';
            }
            
            // Check if we have a department portal redirect
            const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
            const redirectPath = deptPortalRedirect || '/login';
            if (deptPortalRedirect) {
              sessionStorage.removeItem('dept_portal_redirect');
            }
            router.push(`${redirectPath}?error=${encodeURIComponent(errorMessage)}`);
            return;
          }

          if (data?.session) {
            // Session is set, wait for auth context to update
            // The auth context will check session and redirect appropriately
            // Force a small delay to ensure session is fully established
            await new Promise(resolve => setTimeout(resolve, 500));
            return;
          }
        }

        // Check if we have an existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, wait a bit for auth context to process
          await new Promise(resolve => setTimeout(resolve, 500));
          return;
        }

        // No session and no code, redirect to login
        const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
        const redirectPath = deptPortalRedirect || '/login';
        if (deptPortalRedirect) {
          sessionStorage.removeItem('dept_portal_redirect');
        }
        router.push(`${redirectPath}?error=no_session`);
      } catch (error) {
        console.error('Callback error:', error);
        const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
        const redirectPath = deptPortalRedirect || '/login';
        if (deptPortalRedirect) {
          sessionStorage.removeItem('dept_portal_redirect');
        }
        router.push(`${redirectPath}?error=callback_error`);
      }
    };

    // Only run once when component mounts
    if (searchParams) {
      handleCallback();
    }
  }, [router]); // Remove searchParams from dependencies to prevent re-runs

  // Once user is loaded, redirect based on role
  useEffect(() => {
    if (!loading) {
      // Check if we have a session but no user (profile doesn't exist)
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && !user) {
          // We have a Supabase session but no local user profile
          // Get user info from Supabase
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          
          if (supabaseUser) {
            // Redirect to register to create profile
            const registerUrl = new URL('/register', window.location.origin);
            registerUrl.searchParams.set('supabase_user_id', supabaseUser.id);
            if (supabaseUser.email) {
              registerUrl.searchParams.set('email', supabaseUser.email);
            }
            router.push(registerUrl.pathname + registerUrl.search);
            return;
          }
        }
        
        if (user) {
          // Check if we have a department portal redirect stored
          const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
          if (deptPortalRedirect) {
            sessionStorage.removeItem('dept_portal_redirect');
            // Redirect back to department portal
            router.push(deptPortalRedirect);
            return;
          }

          // User profile exists, redirect based on role
          let redirectPath = '/user/dashboard';
          
          if (user.role === 'admin') {
            redirectPath = '/admin/dashboard';
          } else if (user.role === 'department' || user.role === 'department_admin') {
            redirectPath = '/department/dashboard';
          }

          router.push(redirectPath);
        } else if (!session) {
          // No session, redirect to login
          router.push('/login');
        }
      };

      checkSession();
    }
  }, [user, loading, router]);

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

