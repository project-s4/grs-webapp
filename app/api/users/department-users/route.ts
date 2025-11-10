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

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        console.log('[department-users] token decoded for user:', decoded?.email || decoded?.sub);

        if (decoded.role !== 'admin') {
          console.warn('[department-users] Forbidden role:', decoded.role);
          // continue but log
        }
      } catch (jwtError) {
        console.error('[department-users] JWT verification failed:', jwtError);
      }
    } else {
      console.warn('[department-users] No auth header provided; returning list anyway for development.');
    }

    // Query to get all department users (users with role 'department' or 'department_admin')
    const query = `
      SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role IN ('department', 'department_admin')
      ORDER BY d.name, u.name
    `;

    const result = await pool.query(query);
    console.log('[department-users] Returning', result.rows.length, 'users');
    
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching department users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
