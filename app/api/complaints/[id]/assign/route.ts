import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Proxy assignment request to backend API
// The backend PATCH /api/complaints/{id} endpoint handles assignment via assigned_to field
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`[assign] Assigning complaint ${id} to user:`, body.assigned_to);
    
    // Proxy to backend PATCH endpoint
    const response = await fetch(`${BACKEND_URL}/api/complaints/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        assigned_to: body.assigned_to || null
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to assign complaint';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        console.error(`[assign] Backend error:`, errorData);
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
        { error: 'ASSIGNMENT_ERROR', message: errorMessage },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    console.log(`[assign] Complaint assigned successfully:`, data);
    
    return NextResponse.json({
      message: 'Complaint assigned successfully',
      complaint: data.complaint || data
    }, { status: response.status });

  } catch (error: any) {
    console.error('[assign] Error assigning complaint:', error);
    return NextResponse.json(
      { 
        error: 'ASSIGNMENT_ERROR',
        message: error.message || 'Failed to assign complaint. Please try again later.',
        details: 'An unexpected error occurred while assigning the complaint.'
      },
      { status: 500 }
    );
  }
}
