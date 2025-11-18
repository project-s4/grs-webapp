'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/auth-context';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const codeExchangedRef = useRef(false);
  const redirectAttemptedRef = useRef(false);
  const [waitingForUser, setWaitingForUser] = useState(false);

  // Step 1: Exchange code for session
  useEffect(() => {
    if (codeExchangedRef.current) return;
    
    const exchangeCode = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          codeExchangedRef.current = true;
          let errorMsg = errorDescription || error;
          if (error === 'server_error' || errorDescription?.includes('Unable to exchange external code')) {
            errorMsg = 'OAuth configuration error. Please verify Client ID and Secret in Supabase Dashboard.';
          }
          const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
          const redirectPath = deptPortalRedirect || '/login';
          if (deptPortalRedirect) {
            sessionStorage.removeItem('dept_portal_redirect');
          }
          router.replace(`${redirectPath}?error=${encodeURIComponent(errorMsg)}`);
          return;
        }

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            codeExchangedRef.current = true;
            console.error('Error exchanging code:', exchangeError);
            let errorMessage = 'oauth_error';
            if (exchangeError.message?.includes('Unable to exchange external code') || exchangeError.message?.includes('server_error')) {
              errorMessage = 'OAuth configuration error. Please verify Client ID and Secret in Supabase Dashboard.';
            } else if (exchangeError.message?.includes('invalid_grant') || exchangeError.message?.includes('code expired')) {
              errorMessage = 'OAuth code expired. Please try signing in again.';
            } else {
              errorMessage = exchangeError.message || 'oauth_error';
            }
            
            const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
            const redirectPath = deptPortalRedirect || '/login';
            if (deptPortalRedirect) {
              sessionStorage.removeItem('dept_portal_redirect');
            }
            router.replace(`${redirectPath}?error=${encodeURIComponent(errorMessage)}`);
            return;
          }

          if (data?.session) {
            codeExchangedRef.current = true;
            setWaitingForUser(true);
            // Session is established, now wait for auth context to load user profile
            return;
          }
        }

        // No code and no existing session - check if session exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          codeExchangedRef.current = true;
          setWaitingForUser(true);
        } else {
          codeExchangedRef.current = true;
          const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
          const redirectPath = deptPortalRedirect || '/login';
          if (deptPortalRedirect) {
            sessionStorage.removeItem('dept_portal_redirect');
          }
          router.replace(`${redirectPath}?error=no_session`);
        }
      } catch (error) {
        codeExchangedRef.current = true;
        console.error('Callback error:', error);
        const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
        const redirectPath = deptPortalRedirect || '/login';
        if (deptPortalRedirect) {
          sessionStorage.removeItem('dept_portal_redirect');
        }
        router.replace(`${redirectPath}?error=callback_error`);
      }
    };

    exchangeCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Wait for auth context to finish loading, then redirect
  useEffect(() => {
    if (!waitingForUser || loading || redirectAttemptedRef.current) return;

    const attemptRedirect = async () => {
      // Wait a bit more to ensure user state is fully updated
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        redirectAttemptedRef.current = true;
        const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
        const redirectPath = deptPortalRedirect || '/login';
        if (deptPortalRedirect) {
          sessionStorage.removeItem('dept_portal_redirect');
        }
        router.replace(`${redirectPath}?error=session_expired`);
        return;
      }

      // Check if user profile exists
      if (user) {
        redirectAttemptedRef.current = true;
        const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
        
        if (deptPortalRedirect) {
          sessionStorage.removeItem('dept_portal_redirect');
          router.replace(deptPortalRedirect);
          return;
        }

        // User profile exists, redirect based on role
        let redirectPath = '/user/dashboard';
        if (user.role === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (user.role === 'department' || user.role === 'department_admin') {
          redirectPath = '/department/dashboard';
        }
        router.replace(redirectPath);
        return;
      }

      // Session exists but user profile not loaded - check if profile exists
      // Wait a bit longer for the auth context to fetch user profile
      const checkForUser = async () => {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts && !user) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          
          // Re-check user state from auth context
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            redirectAttemptedRef.current = true;
            const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
            const redirectPath = deptPortalRedirect || '/login';
            if (deptPortalRedirect) {
              sessionStorage.removeItem('dept_portal_redirect');
            }
            router.replace(`${redirectPath}?error=session_expired`);
            return;
          }
        }

        // If we still don't have user after waiting, check if profile needs to be created
        if (!user) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            redirectAttemptedRef.current = true;
            const registerUrl = new URL('/register', window.location.origin);
            registerUrl.searchParams.set('supabase_user_id', supabaseUser.id);
            if (supabaseUser.email) {
              registerUrl.searchParams.set('email', supabaseUser.email);
            }
            router.replace(registerUrl.pathname + registerUrl.search);
            return;
          }
        }

        // Final attempt - redirect based on current state
        if (user) {
          redirectAttemptedRef.current = true;
          const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
          if (deptPortalRedirect) {
            sessionStorage.removeItem('dept_portal_redirect');
            router.replace(deptPortalRedirect);
          } else {
            let redirectPath = '/user/dashboard';
            if (user.role === 'admin') {
              redirectPath = '/admin/dashboard';
            } else if (user.role === 'department' || user.role === 'department_admin') {
              redirectPath = '/department/dashboard';
            }
            router.replace(redirectPath);
          }
        } else {
          // Give up and redirect to login
          redirectAttemptedRef.current = true;
          const deptPortalRedirect = sessionStorage.getItem('dept_portal_redirect');
          const redirectPath = deptPortalRedirect || '/login';
          if (deptPortalRedirect) {
            sessionStorage.removeItem('dept_portal_redirect');
          }
          router.replace(`${redirectPath}?error=profile_not_found`);
        }
      };

      checkForUser();
    };

    attemptRedirect();
  }, [waitingForUser, loading, user, router]);

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

