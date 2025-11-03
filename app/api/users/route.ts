import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const backendParams = new URLSearchParams(searchParams);
    
    const response = await fetch(`${BACKEND_URL}/api/admin/users?${backendParams}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying users:', error);
    return NextResponse.json(
      { error: 'FETCH_ERROR', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

