import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/postgres';

export const dynamic = 'force-dynamic';

// GET - Get user's complaints
export async function GET(request: NextRequest) {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };
    
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    console.log('Fetching complaints for:', { email, status, category, search, page, limit });

    if (!email) {
      const errorResponse = NextResponse.json(
        { 
          error: 'MISSING_EMAIL',
          message: 'Email address is required to fetch your complaints.',
          details: 'Please provide your email address to view your complaint history.'
        },
        { status: 400 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      return errorResponse;
    }

    // First try to get user_id from email if possible
    let userId = null;
    try {
      const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        console.log(`Found user_id ${userId} for email ${email}`);
      }
    } catch (err) {
      console.log('Could not find user_id for email:', email);
    }

    // Build query with filters - join with departments table for department name
    // Search by both user_id (for authenticated complaints) and email (for anonymous complaints)
    let queryText = `
      SELECT c.*, d.name as department_name, d.code as department_code
      FROM complaints c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE (c.email = $1 ${userId ? `OR c.user_id = $2` : ''})
    `;
    const queryParams: any[] = [email];
    if (userId) {
      queryParams.push(userId);
    }
    let paramIndex = userId ? 3 : 2;

    if (status) {
      queryText += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (category) {
      queryText += ` AND c.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex} OR c.tracking_id ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY c.created_at DESC';
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM complaints c WHERE (c.email = $1 ${userId ? `OR c.user_id = $2` : ''})`;
    const countParams: any[] = [email];
    if (userId) {
      countParams.push(userId);
    }
    let countParamIndex = userId ? 3 : 2;

    if (status) {
      countQuery += ` AND c.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND c.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (c.title ILIKE $${countParamIndex} OR c.description ILIKE $${countParamIndex} OR c.tracking_id ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    console.log(`Found ${result.rows.length} complaints out of ${total} total`);

    // Format complaints to match frontend expectations
    const complaints = result.rows.map(complaint => ({
      _id: complaint.id,
      tracking_id: complaint.tracking_id, // Match dashboard expectation
      name: complaint.title,
      email: complaint.email,
      phone: complaint.phone,
      department: complaint.department_name || 'Unknown Department',
      category: complaint.category || 'General',
      subCategory: complaint.sub_category,
      description: complaint.description,
      status: complaint.status || 'Pending',
      priority: complaint.priority || 'Medium',
      dateFiled: complaint.created_at,
      updatedAt: complaint.updated_at,
      viewCount: 0, // Default values for compatibility
      adminReply: complaint.notes,
      reply: complaint.notes, // Alternative field name
    }));

    console.log('Returning complaints:', complaints.map(c => ({ id: c._id, tracking_id: c.tracking_id, status: c.status })));

    return NextResponse.json({
      success: true,
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, { headers });
  } catch (error: any) {
    console.error('Error fetching user complaints:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'FETCH_ERROR',
        message: 'Failed to fetch your complaints. Please try again later.',
        details: error.message || 'An unexpected error occurred while retrieving your complaints.'
      },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    return errorResponse;
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

