import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// Use pooler URL for Supabase (IPv4-compatible)
// Pooler requires username format: postgres.[PROJECT_REF]
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres.hwlngdpexkgbtrzatfox',
  host: process.env.POSTGRES_HOST || 'aws-1-ap-south-1.pooler.supabase.com',
  database: process.env.POSTGRES_DB || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'oe9erG8UJMNoAXr7',
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

    // First, let's check all users to debug
    const allUsersQuery = `SELECT id, name, email, role, department_id FROM users ORDER BY name`;
    const allUsersResult = await pool.query(allUsersQuery);
    console.log('[department-users] All users in database:', allUsersResult.rows.length);
    console.log('[department-users] All users:', allUsersResult.rows.map(u => ({ 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      dept_id: u.department_id 
    })));

    // Query to get all department users
    // Backend uses: 'department', 'department_officer'
    // Frontend also checks for: 'department_admin' (legacy)
    // Cast enum to text to handle PostgreSQL enum types properly
    const query = `
      SELECT u.id, u.name, u.email, u.role::text as role, u.department_id, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE LOWER(u.role::text) IN ('department', 'department_admin', 'department_officer')
      ORDER BY d.name NULLS LAST, u.name
    `;

    const result = await pool.query(query);
    console.log('[department-users] Found', result.rows.length, 'department users');
    console.log('[department-users] Department users:', result.rows.map(u => ({ 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      role: u.role,
      dept: u.department_name,
      dept_id: u.department_id 
    })));
    
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching department users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
