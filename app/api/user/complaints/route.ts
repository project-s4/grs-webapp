import { NextRequest, NextResponse } from 'next/server';

// Use production backend URL if available, fallback to localhost
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://grs-backend-l961.onrender.com';

export const dynamic = 'force-dynamic';

// GET - Get user's complaints
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('Fetching complaints for:', { email, status, category, search, page, limit });

    if (!email) {
      return NextResponse.json(
        { 
          error: 'MISSING_EMAIL',
          message: 'Email address is required to fetch your complaints.',
          details: 'Please provide your email address to view your complaint history.'
        },
        { status: 400 }
      );
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    // Get user_id from token if available
    let userId = null;
    if (token) {
      try {
        // Decode JWT token to get user_id
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
      } catch (err) {
        console.log('Could not decode token:', err);
      }
    }

    // Build query params for backend
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (userId) {
      params.append('user_id', userId);
    } else if (email) {
      // If no user_id, try to find by email via backend /api/auth/verify or /me endpoint
      // For now, we'll fetch all complaints and filter client-side, or use a backend endpoint
      // Actually, let's just proxy to backend and let it handle filtering
    }
    
    if (status) {
      params.append('status', status);
    }
    
    if (category) {
      params.append('category', category);
    }

    // Call backend API
    const backendHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      backendHeaders['Authorization'] = `Bearer ${token}`;
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/complaints?${params}`, {
      headers: backendHeaders,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'FETCH_ERROR',
          message: errorData.detail || errorData.message || 'Failed to fetch complaints from backend',
          details: errorData.detail || errorData.message || 'Backend request failed'
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    
    // Backend returns complaints array directly or in a wrapper
    let complaintsList = Array.isArray(backendData) ? backendData : (backendData.complaints || []);
    
    // Filter by email if user_id wasn't available
    if (email && !userId) {
      complaintsList = complaintsList.filter((c: any) => {
        const complaintEmail = c.user_email || (c.complaint_metadata?.email) || '';
        return complaintEmail.toLowerCase() === email.toLowerCase();
      });
    }

    // Format complaints to match frontend expectations
    const complaints = complaintsList.map((complaint: any) => {
      let metadata: any = complaint.complaint_metadata || {};
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = {};
        }
      }

      // Map status from backend enum to frontend display format
      const statusMap: { [key: string]: string } = {
        'new': 'Pending',
        'pending': 'Pending',
        'triaged': 'Pending',
        'in_progress': 'In Progress',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'escalated': 'Pending',
        'closed': 'Resolved'
      };

      return {
        _id: complaint.id,
        tracking_id: complaint.tracking_id || complaint.reference_no,      
        name: complaint.title,
        email: complaint.user_email || metadata.email || null,
        phone: complaint.user_phone || metadata.phone || null,
        department: complaint.department_name || 'Unknown Department',
        category: complaint.category || 'General',
        subCategory: complaint.subcategory || complaint.sub_category,
        description: complaint.description,
        status: statusMap[complaint.status?.toLowerCase()] || complaint.status || 'Pending',
        priority: complaint.priority || metadata.priority || 'Medium',
        dateFiled: complaint.created_at,
        updatedAt: complaint.updated_at || complaint.created_at,
        viewCount: 0,
        adminReply: complaint.admin_reply || metadata.adminReply || metadata.reply || null,
        reply: complaint.admin_reply || metadata.reply || null,
      };
    });

    console.log(`Returning ${complaints.length} complaints for user ${email}`);

    return NextResponse.json({
      success: true,
      complaints,
      pagination: {
        page,
        limit,
        total: complaints.length, // Backend should return total, but use length for now
        pages: Math.ceil(complaints.length / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user complaints:', error);
    return NextResponse.json(
      { 
        error: 'FETCH_ERROR',
        message: 'Failed to fetch your complaints. Please try again later.',
        details: error.message || 'An unexpected error occurred while retrieving your complaints.'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

