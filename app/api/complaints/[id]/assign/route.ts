import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'grievance_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Only admins can assign complaints
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin role required.' },
          { status: 403 }
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { assigned_to } = await request.json();
    const complaintId = params.id;

    // Validate assigned_to is a valid department user if provided
    if (assigned_to) {
      const userCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND role IN ($2, $3)',
        [assigned_to, 'department', 'department_admin']
      );
      
      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid department user' },
          { status: 400 }
        );
      }
    }

    // Update the complaint assignment
    // Try to parse as integer first, if that fails, treat as tracking_id
    const numericId = parseInt(complaintId);
    let updateQuery, queryParams;
    
    if (!isNaN(numericId)) {
      // It's a numeric ID
      updateQuery = `
        UPDATE complaints 
        SET assigned_to = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      queryParams = [assigned_to || null, numericId];
    } else {
      // It's a tracking_id
      updateQuery = `
        UPDATE complaints 
        SET assigned_to = $1, updated_at = NOW()
        WHERE tracking_id = $2
        RETURNING *
      `;
      queryParams = [assigned_to || null, complaintId];
    }
    
    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Complaint assigned successfully',
      complaint: result.rows[0]
    });

  } catch (error) {
    console.error('Error assigning complaint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
