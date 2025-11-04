import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle async params in Next.js 14
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const response = await fetch(`${BACKEND_URL}/api/departments/${id}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      console.error(`Backend error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch department' }));
      return NextResponse.json(
        { error: 'BACKEND_ERROR', message: errorData.message || 'Failed to fetch department' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'FETCH_ERROR', message: error.message || 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

