import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hwlngdpexkgbtrzatfox.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bG5nZHBleGtnYnRyemF0Zm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODMzOTMsImV4cCI6MjA3NzU1OTM5M30.L6ltCRG5qPfxdPF3vzO4JO9Xsm0UtQtiQfF3WnJZH-Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const state = requestUrl.searchParams.get('state');

  // Handle OAuth errors from Supabase
  if (error) {
    console.error('OAuth error from Supabase:', error, errorDescription);
    let errorMsg = errorDescription || error;
    
    // Provide specific guidance for credential errors
    if (error === 'server_error' || errorDescription?.includes('Unable to exchange external code')) {
      if (errorDescription?.includes('incorrect_client_credentials') || errorDescription?.includes('GitHub')) {
        errorMsg = 'GitHub OAuth: Incorrect Client ID or Secret. Please update in Supabase Dashboard > Authentication > Providers > GitHub';
      } else if (errorDescription?.includes('invalid_client') || errorDescription?.includes('Google')) {
        errorMsg = 'Google OAuth: Incorrect Client ID or Secret. Please update in Supabase Dashboard > Authentication > Providers > Google';
      } else {
        errorMsg = 'OAuth configuration error: Incorrect Client ID or Secret. Please verify credentials in Supabase Dashboard > Authentication > Providers';
      }
    }
    
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, requestUrl.origin));
  }

  // If no code and no error, check if there's a hash fragment (Supabase might use hash)
  // Also check for other possible parameter formats
  if (!code && !error) {
    // Check if URL has hash fragment (some OAuth flows use hash)
    const hashMatch = requestUrl.hash.match(/code=([^&]+)/);
    const codeFromHash = hashMatch ? hashMatch[1] : null;
    
    if (codeFromHash) {
      // Use code from hash
      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeFromHash);
        
        if (exchangeError) {
          console.error('Error exchanging code from hash:', exchangeError);
          return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message || 'oauth_error')}`, requestUrl.origin));
        }
        
        if (data?.session) {
          return await handleSuccessfulAuth(data.session, requestUrl);
        }
      } catch (error: any) {
        console.error('OAuth callback error (hash):', error);
        return NextResponse.redirect(new URL('/login?error=callback_error', requestUrl.origin));
      }
    }
    
    // If still no code, log the full URL for debugging and redirect
    console.warn('Callback accessed without code parameter. Full URL:', requestUrl.href);
    console.warn('Search params:', Object.fromEntries(requestUrl.searchParams));
    return NextResponse.redirect(new URL('/login?error=invalid_callback', requestUrl.origin));
  }
  
  // Helper function to handle successful authentication
  async function handleSuccessfulAuth(session: any, requestUrl: URL) {
    try {
      // Store session in cookies so client can access it
      const response = NextResponse.redirect(new URL('/auth/callback', requestUrl.origin));
      
      // Set session in httpOnly cookie for security
      response.cookies.set('sb-access-token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      
      response.cookies.set('sb-refresh-token', session.refresh_token || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      // Check if user profile exists in backend
      const verifyResponse = await fetch(`${requestUrl.origin}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: session.access_token }),
      });

      if (verifyResponse.status === 404) {
        // User profile doesn't exist - redirect to profile creation with session data
        const registerUrl = new URL('/register', requestUrl.origin);
        registerUrl.searchParams.set('supabase_user_id', session.user.id);
        if (session.user.email) {
          registerUrl.searchParams.set('email', session.user.email);
        }
        registerUrl.searchParams.set('token', session.access_token); // Pass token for client-side
        return NextResponse.redirect(registerUrl);
      } else if (verifyResponse.ok) {
        // User profile exists - get role and redirect
        const userData = await verifyResponse.json();
        let redirectPath = '/user/dashboard';
        
        if (userData.role === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (userData.role === 'department' || userData.role === 'department_admin') {
          redirectPath = '/department/dashboard';
        }

        // Redirect with token in query for client-side to set session
        const dashboardUrl = new URL(redirectPath, requestUrl.origin);
        dashboardUrl.searchParams.set('token', session.access_token);
        dashboardUrl.searchParams.set('refresh', session.refresh_token || '');
        return NextResponse.redirect(dashboardUrl);
      } else {
        console.error('Error verifying user:', await verifyResponse.text());
        const loginUrl = new URL('/login', requestUrl.origin);
        loginUrl.searchParams.set('error', 'verification_failed');
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('Error handling successful auth:', error);
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'verification_failed');
      return NextResponse.redirect(loginUrl);
    }
  }

  // If we have a code, let the client-side page handle it
  // The client-side page will exchange the code and set the session
  if (code) {
    // Just redirect to the client-side callback page with the code
    // The client will handle session setup and redirection
    const callbackUrl = new URL('/auth/callback', requestUrl.origin);
    callbackUrl.searchParams.set('code', code);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
}

