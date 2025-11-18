import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hwlngdpexkgbtrzatfox.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bG5nZHBleGtnYnRyemF0Zm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODMzOTMsImV4cCI6MjA3NzU1OTM5M30.L6ltCRG5qPfxdPF3vzO4JO9Xsm0UtQtiQfF3WnJZH-Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    // Get Supabase session token from Authorization header
    const authHeader = request.headers.get('Authorization') || '';
    
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.getUser(token);
    
    if (supabaseError || !supabaseUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Forward to backend with Supabase token
    const response = await fetch(`${BACKEND_URL}/api/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    // Add CORS headers
    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return nextResponse;
  } catch (error: any) {
    console.error('Error proxying /me:', error);
    const errorResponse = NextResponse.json(
      { error: 'FETCH_ERROR', message: 'Failed to fetch user data' },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
