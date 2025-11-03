import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    
    // Read response body as text first (can only read once)
    const responseText = await response.text();
    
    if (!response.ok) {
      // Handle error responses
      if (contentType.includes('application/json')) {
        try {
          const data = JSON.parse(responseText);
          return NextResponse.json(
            { 
              error: data?.detail || data?.error || 'REGISTER_ERROR', 
              message: data?.detail || data?.message || data?.error || 'Registration failed' 
            },
            { status: response.status }
          );
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          console.error('Response text:', responseText.substring(0, 200));
          return NextResponse.json(
            { error: 'REGISTER_ERROR', message: responseText || 'Registration failed' },
            { status: response.status }
          );
        }
      } else {
        // Non-JSON error response (likely HTML or plain text)
        console.error('Backend returned non-JSON error:', responseText.substring(0, 200));
        return NextResponse.json(
          { 
            error: 'REGISTER_ERROR', 
            message: responseText.includes('Internal Server Error') 
              ? 'Internal server error. Please try again later.' 
              : responseText.substring(0, 200) || 'Registration failed' 
          },
          { status: response.status }
        );
      }
    }

    // Success response - try to parse as JSON
    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        
        // Add CORS headers
        const nextResponse = NextResponse.json(data, { status: response.status });
        nextResponse.headers.set('Access-Control-Allow-Origin', '*');
        nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
        
        return nextResponse;
      } catch (parseError) {
        console.error('Failed to parse success response as JSON:', parseError);
        console.error('Response text:', responseText.substring(0, 200));
        return NextResponse.json(
          { error: 'PARSE_ERROR', message: 'Invalid response from server' },
          { status: 500 }
        );
      }
    } else {
      // Unexpected non-JSON success response
      console.error('Backend returned non-JSON response:', responseText.substring(0, 200));
      return NextResponse.json(
        { error: 'PARSE_ERROR', message: 'Invalid response format from server' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Register error:', error);
    
    // Handle network errors, parsing errors, etc.
    const errorMessage = error.message || 'Failed to register user';
    const errorResponse = NextResponse.json(
      { 
        error: 'REGISTER_ERROR', 
        message: errorMessage.includes('JSON') 
          ? 'Server returned an invalid response. Please try again.' 
          : errorMessage
      },
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
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
