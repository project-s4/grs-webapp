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
          
          // Handle different error response formats
          let errorMessage = 'Registration failed. Please try again.';
          
          if (Array.isArray(data)) {
            // Pydantic validation errors - array of errors
            errorMessage = data.map((err: any) => {
              const field = err.loc?.join('.') || 'field';
              return `${field}: ${err.msg || err.message || 'Validation error'}`;
            }).join(', ');
          } else if (Array.isArray(data.detail)) {
            // FastAPI validation errors - detail is an array
            errorMessage = data.detail.map((err: any) => {
              const field = err.loc?.join('.') || 'field';
              return `${field}: ${err.msg || err.message || 'Validation error'}`;
            }).join(', ');
          } else if (typeof data.detail === 'string') {
            // FastAPI error detail as string
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          }
          
          return NextResponse.json(
            { 
              error: 'REGISTER_ERROR', 
              message: errorMessage,
              details: data
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
        
        // Provide more helpful error messages based on common backend issues
        let errorMessage = 'Registration failed. Please try again.';
        if (responseText.includes('Internal Server Error')) {
          errorMessage = 'Backend service error. This may be due to a database connection issue. Please try again in a moment.';
        } else if (responseText.includes('connection') || responseText.includes('database')) {
          errorMessage = 'Database connection error. Please try again later.';
        } else if (responseText.length > 0) {
          // Try to extract meaningful error from HTML/text response
          const textPreview = responseText.substring(0, 200).replace(/<[^>]*>/g, '').trim();
          if (textPreview.length > 0) {
            errorMessage = textPreview;
          }
        }
        
        return NextResponse.json(
          { 
            error: 'REGISTER_ERROR', 
            message: errorMessage,
            details: response.status === 500 ? 'Backend returned 500 error. Check backend logs for details.' : undefined
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
    
    // Handle network errors, parsing errors, backend unavailable, etc.
    let errorMessage = 'Failed to register user';
    
    if (error.message) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to backend server. Please check if the backend is running.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server returned an invalid response. Please try again.';
      } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Backend server is not responding. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }
    
    const errorResponse = NextResponse.json(
      { 
        error: 'REGISTER_ERROR', 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
