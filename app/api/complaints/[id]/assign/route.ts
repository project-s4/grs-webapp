import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'grievance_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: { rejectUnauthorized: false },
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const errorResponse = NextResponse.json(
        { 
          error: 'UNAUTHORIZED',
          message: 'Authorization token required.',
          details: 'Please log in to assign complaints.'
        },
        { status: 401 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Only admins can assign complaints
      if (decoded.role !== 'admin') {
        const errorResponse = NextResponse.json(
          { 
            error: 'FORBIDDEN',
            message: 'Access denied. Admin role required.',
            details: 'Only administrators can assign complaints to department users.'
          },
          { status: 403 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }
    } catch (jwtError) {
      const errorResponse = NextResponse.json(
        { 
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token.',
          details: 'Please log in again to continue.'
        },
        { status: 401 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    const { assigned_to } = await request.json();
    const complaintId = params.id;
    const assignedTo = assigned_to ? String(assigned_to).trim() : null;

    // Validate assigned_to is a valid department user if provided
    if (assignedTo) {
      const userCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1::uuid AND role IN ($2, $3)',
        [assignedTo, 'department', 'department_admin']
      );
      
      if (userCheck.rows.length === 0) {
        const errorResponse = NextResponse.json(
          { 
            error: 'INVALID_USER',
            message: 'Invalid department user selected.',
            details: 'The selected user does not exist or is not a department user. Please select a valid department user.'
          },
          { status: 400 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }
    }

    const isTrackingId = complaintId.startsWith('COMP-');
    let updateQuery: string;
    let queryParams: any[];

    if (isTrackingId) {
      updateQuery = `
        UPDATE complaints
        SET assigned_to = $1::uuid, updated_at = NOW()
        WHERE tracking_id = $2
        RETURNING *
      `;
      queryParams = [assignedTo, complaintId];
    } else {
      updateQuery = `
        UPDATE complaints
        SET assigned_to = $1::uuid, updated_at = NOW()
        WHERE id = $2::uuid
        RETURNING *
      `;
      queryParams = [assignedTo, complaintId];
    }

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { 
          error: 'NOT_FOUND',
          message: 'Complaint not found.',
          details: 'The complaint you are trying to assign does not exist or may have been deleted.'
        },
        { status: 404 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    const response = NextResponse.json({
      message: 'Complaint assigned successfully',
      complaint: result.rows[0]
    });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;

  } catch (error: any) {
    console.error('Error assigning complaint:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'ASSIGNMENT_ERROR',
        message: 'Failed to assign complaint. Please try again later.',
        details: error.message || 'An unexpected error occurred while assigning the complaint.'
      },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return errorResponse;
  }
}
