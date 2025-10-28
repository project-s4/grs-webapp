import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');

    if (!trackingId) {
      return NextResponse.json(
        { error: 'MISSING_TRACKING_ID', message: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    // Pass Authorization header to backend if present
    const authHeader = request.headers.get("Authorization");
    
    const response = await fetch(`${BACKEND_URL}/api/complaints/track/${trackingId}`, {
      headers: authHeader ? {
        'Authorization': authHeader
      } : {}
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to track complaint' }));
      return NextResponse.json(
        { error: 'TRACKING_ERROR', message: errorData.detail || 'Complaint not found' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return nextResponse;
  } catch (error: any) {
    console.error('Error tracking complaint:', error);
    return NextResponse.json(
      { error: 'TRACKING_ERROR', message: 'Failed to track complaint' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
