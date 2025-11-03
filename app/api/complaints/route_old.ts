import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/src/lib/postgres';
import { NLPService } from '@/lib/nlp-service';
import { EmailService } from '@/lib/email-service';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

function generateTrackingId(): string {
  const prefix = 'GRS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from JWT token
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        userId = decoded.id;
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
    
    const body = await request.json();
    const { title, description, category, priority, department_id, location, phone, email } = body;

    // Validation
    if (!title || !description) {
      const errorResponse = NextResponse.json(
        { 
          error: 'VALIDATION_ERROR',
          message: 'Title and description are required to submit a complaint.',
          details: 'Please provide both a title and description for your complaint.'
        },
        { status: 400 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      return errorResponse;
    }

    // If no user ID from token and no email provided, require email
    if (!userId && !email) {
      const errorResponse = NextResponse.json(
        { 
          error: 'MISSING_EMAIL',
          message: 'Email is required for anonymous complaints.',
          details: 'Please provide your email address so we can contact you regarding your complaint.'
        },
        { status: 400 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      return errorResponse;
    }

    // NLP Analysis
    const nlpAnalysis = NLPService.getInstance().analyzeComplaint(title + ' ' + description);
    
    // Generate tracking ID
    const trackingId = generateTrackingId();
    
    // Create complaint in PostgreSQL
    const result = await query(
      `INSERT INTO complaints (
        user_id, department_id, title, description, category, priority, 
        location, phone, email, tracking_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, tracking_id, title, status, priority, created_at`,
      [
        userId || null,
        department_id ? parseInt(department_id) : null,
        title,
        description,
        category || nlpAnalysis.suggestedDepartment || 'General',
        priority || nlpAnalysis.priority,
        location,
        phone,
        email,
        trackingId,
        'pending',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    const complaint = result.rows[0];

    // Send email confirmation
    try {
      if (email) {
        await EmailService.getInstance().sendComplaintConfirmation({
          trackingId: complaint.tracking_id,
          status: complaint.status,
          department: complaint.department_id || 'Unassigned',
          category: complaint.category || 'General',
          complainantName: 'User', // We don't have user name for anonymous complaints
          complainantEmail: email,
          description: complaint.title,
        });
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    const response = NextResponse.json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: complaint.id,
        tracking_id: complaint.tracking_id,
        title: complaint.title,
        status: complaint.status,
        priority: complaint.priority,
        created_at: complaint.created_at,
      },
      nlpAnalysis: {
        suggestedDepartment: nlpAnalysis.suggestedDepartment,
        priority: nlpAnalysis.priority,
        sentiment: nlpAnalysis.sentiment,
        urgency: nlpAnalysis.urgency,
      },
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'COMPLAINT_CREATION_ERROR',
        message: 'Failed to create complaint. Please try again later.',
        details: error.message || 'An unexpected error occurred while processing your complaint.'
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return errorResponse;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    let department_id = searchParams.get('department_id');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const user_id = searchParams.get('user_id'); // For user-specific complaints
    const assigned_to = searchParams.get('assigned_to'); // For department user assigned complaints
    const tracking_id = searchParams.get('tracking_id'); // For tracking specific complaint
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Check if user is admin and get their department
    let adminDepartmentId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // If user is admin, filter by their department
        if (decoded.role === 'admin' && decoded.department_id) {
          adminDepartmentId = decoded.department_id;
          department_id = decoded.department_id.toString(); // Override any department_id parameter
        }
        // If user is department user, show only assigned complaints
        else if ((decoded.role === 'department' || decoded.role === 'department_admin') && !assigned_to) {
          // For department users without explicit assigned_to filter, show only their assigned complaints
          // This is handled below in the query building
        }
      } catch (error) {
        console.error('Invalid token:', error);
        // Continue without authentication - allow public access
      }
    }

    let complaints;
    let total = 0;

    if (tracking_id) {
      // Get specific complaint by tracking ID
      const result = await query(
        `SELECT c.*, d.name as department_name, u.name as user_name 
         FROM complaints c 
         LEFT JOIN departments d ON c.department_id = d.id
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.tracking_id = $1`,
        [tracking_id]
      );
      complaints = result.rows;
      total = complaints.length;
    } else if (user_id) {
      // Get complaints for specific user
      const result = await query(
        `SELECT c.*, d.name as department_name 
         FROM complaints c 
         LEFT JOIN departments d ON c.department_id = d.id
         WHERE c.user_id = $1 
         ORDER BY c.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [parseInt(user_id), limit, offset]
      );
      complaints = result.rows;
      
      // Get total count for this user
      const countResult = await query(
        'SELECT COUNT(*) FROM complaints WHERE user_id = $1',
        [parseInt(user_id)]
      );
      total = parseInt(countResult.rows[0].count);
    } else {
      // Get all complaints with filtering
      let queryText = `SELECT c.*, d.name as department_name, u.name as user_name, u.email as user_email
                       FROM complaints c 
                       LEFT JOIN departments d ON c.department_id = d.id
                       LEFT JOIN users u ON c.user_id = u.id
                       WHERE 1=1`;
      const queryParams = [];
      let paramIndex = 1;
      
      if (status) {
        queryText += ` AND status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }
      
      if (department_id) {
        queryText += ` AND department_id = $${paramIndex}`;
        queryParams.push(parseInt(department_id));
        paramIndex++;
      }
      
      if (category) {
        queryText += ` AND category = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }
      
      if (priority) {
        queryText += ` AND priority = $${paramIndex}`;
        queryParams.push(priority);
        paramIndex++;
      }
      
      if (assigned_to) {
        queryText += ` AND assigned_to = $${paramIndex}`;
        queryParams.push(parseInt(assigned_to));
        paramIndex++;
      }
      
      queryText += ' ORDER BY c.created_at DESC';
      queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      const result = await query(queryText, queryParams);
      complaints = result.rows;
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM complaints WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      
      if (status) {
        countQuery += ` AND status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }
      
      if (department_id) {
        countQuery += ` AND department_id = $${countParamIndex}`;
        countParams.push(parseInt(department_id));
        countParamIndex++;
      }
      
      if (category) {
        countQuery += ` AND category = $${countParamIndex}`;
        countParams.push(category);
        countParamIndex++;
      }
      
      if (priority) {
        countQuery += ` AND priority = $${countParamIndex}`;
        countParams.push(priority);
        countParamIndex++;
      }
      
      if (assigned_to) {
        countQuery += ` AND assigned_to = $${countParamIndex}`;
        countParams.push(parseInt(assigned_to));
      }
      
      const countResult = await query(countQuery, countParams);
      total = parseInt(countResult.rows[0].count);
    }

    const response = NextResponse.json({
      success: true,
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'FETCH_ERROR',
        message: 'Failed to fetch complaints. Please try again later.',
        details: error.message || 'An unexpected error occurred while retrieving complaints.'
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return errorResponse;
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}



