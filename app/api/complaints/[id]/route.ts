import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// GET - Fetch single complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const response = await fetch(`${BACKEND_URL}/api/complaints/${id}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying complaint fetch:', error);
    return NextResponse.json(
      { error: 'FETCH_ERROR', message: 'Failed to fetch complaint' },
      { status: 500 }
    );
  }
}

// PATCH - Update complaint
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/complaints/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to update complaint';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      return NextResponse.json(
        { error: 'UPDATE_ERROR', message: errorMessage },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying complaint update:', error);
    return NextResponse.json(
      { error: 'UPDATE_ERROR', message: error.message || 'Failed to update complaint' },
      { status: 500 }
    );
  }
}

// DELETE - Delete complaint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const response = await fetch(`${BACKEND_URL}/api/complaints/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying complaint delete:', error);
    return NextResponse.json(
      { error: 'DELETE_ERROR', message: 'Failed to delete complaint' },
      { status: 500 }
    );
  }
}
