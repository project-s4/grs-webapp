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

  // Handle OAuth errors from Supabase
  if (error) {
    console.error('OAuth error from Supabase:', error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin));
  }

  if (code) {
    try {
      // Exchange code for session - Supabase handles this automatically
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        // Provide more specific error messages
        let errorMessage = 'oauth_error';
        if (error.message?.includes('Unable to exchange external code') || error.message?.includes('server_error')) {
          errorMessage = 'OAuth configuration error. Please verify Client ID and Secret in Supabase Dashboard > Authentication > Providers.';
        } else if (error.message?.includes('invalid_grant') || error.message?.includes('code expired')) {
          errorMessage = 'OAuth code expired. Please try signing in again.';
        } else {
          errorMessage = error.message || 'oauth_error';
        }
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin));
      }

      if (data?.session) {
        // Check if user profile exists in backend
        const verifyResponse = await fetch(`${requestUrl.origin}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: data.session.access_token }),
        });

        if (verifyResponse.status === 404) {
          // User profile doesn't exist - redirect to profile creation
          return NextResponse.redirect(
            new URL(`/register?supabase_user_id=${data.session.user.id}&email=${encodeURIComponent(data.session.user.email || '')}`, requestUrl.origin)
          );
        } else if (verifyResponse.ok) {
          // User profile exists - get role and redirect
          const userData = await verifyResponse.json();
          let redirectPath = '/user/dashboard';
          
          if (userData.role === 'admin') {
            redirectPath = '/admin/dashboard';
          } else if (userData.role === 'department' || userData.role === 'department_admin') {
            redirectPath = '/department/dashboard';
          }

          return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
        } else {
          console.error('Error verifying user:', await verifyResponse.text());
          return NextResponse.redirect(new URL('/login?error=verification_failed', requestUrl.origin));
        }
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(new URL('/login?error=callback_error', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

