import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://grs-backend-l961.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/create-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Profile creation failed. Please try again.';

      if (contentType.includes('application/json')) {
        try {
          const data = JSON.parse(responseText);
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err: any) => {
              const field = err.loc?.join('.') || 'field';
              return `${field}: ${err.msg || err.message || 'Validation error'}`;
            }).join(', ');
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
      }

      return NextResponse.json(
        { error: 'CREATE_PROFILE_ERROR', message: errorMessage },
        { status: response.status }
      );
    }

    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        const nextResponse = NextResponse.json(data, { status: response.status });
        nextResponse.headers.set('Access-Control-Allow-Origin', '*');
        nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
        return nextResponse;
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError);
        return NextResponse.json(
          { error: 'PARSE_ERROR', message: 'Invalid response from server' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'PARSE_ERROR', message: 'Invalid response format from server' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Create profile error:', error);
    const errorResponse = NextResponse.json(
      { error: 'CREATE_PROFILE_ERROR', message: error.message || 'Failed to create profile' },
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

