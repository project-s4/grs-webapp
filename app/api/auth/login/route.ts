import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert Next.js format to FastAPI OAuth2 format
    const formData = new URLSearchParams();
    formData.append('username', body.email || body.username);
    formData.append('password', body.password);
    
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      
      // Read response body as text first (can only read once)
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      // Try to parse as JSON if possible
      let errorMessage = 'Login failed. Please check your credentials.';
      let errorData: any = null;
      
      if (contentType.includes('application/json')) {
        try {
          errorData = JSON.parse(errorText);
          // Handle different error response formats
          if (Array.isArray(errorData)) {
            // Pydantic validation errors
            errorMessage = errorData.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else if (errorData.detail) {
            // FastAPI error detail
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Not JSON, use text as-is
          errorMessage = errorText || 'Login failed. Please check your credentials.';
        }
      } else {
        // Not JSON, use text as-is
        errorMessage = errorText || 'Login failed. Please check your credentials.';
      }
      
      return NextResponse.json(
        { 
          error: 'LOGIN_FAILED', 
          message: errorMessage,
          details: errorData || errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Add CORS headers
    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return nextResponse;
  } catch (error: any) {
    console.error('Login error:', error);
    const errorResponse = NextResponse.json(
      { error: 'LOGIN_ERROR', message: 'Failed to login' },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
