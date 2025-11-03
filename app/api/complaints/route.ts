import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Proxy all complaints requests to backend
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const backendParams = new URLSearchParams(searchParams);
    
    const response = await fetch(`${BACKEND_URL}/api/complaints?${backendParams}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Backend returned non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'BACKEND_ERROR', message: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying complaints:', error);
    return NextResponse.json(
      { error: 'FETCH_ERROR', message: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received complaint data:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${BACKEND_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('Backend error:', response.status, errorData);
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: errorData.detail || 'Failed to create complaint' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Complaint created successfully:', data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying complaint creation:', error);
    return NextResponse.json(
      { error: 'CREATION_ERROR', message: error.message || 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

