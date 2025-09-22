import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Checking complaints in database...');

    // Get all complaints with user info
    const complaintsResult = await query(`
      SELECT 
        c.id, c.tracking_id, c.title, c.status, c.email as complaint_email, 
        c.user_id, c.department_id, c.created_at,
        u.email as user_email, u.name as user_name,
        d.name as department_name
      FROM complaints c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.created_at DESC 
      LIMIT 20
    `);

    // Get all users
    const usersResult = await query(`
      SELECT id, name, email, role 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Get all departments
    const departmentsResult = await query(`
      SELECT id, name, code 
      FROM departments 
      ORDER BY id
    `);

    console.log(`DEBUG: Found ${complaintsResult.rows.length} complaints`);
    console.log(`DEBUG: Found ${usersResult.rows.length} users`);
    console.log(`DEBUG: Found ${departmentsResult.rows.length} departments`);

    return NextResponse.json({
      success: true,
      debug: {
        complaints: complaintsResult.rows,
        users: usersResult.rows,
        departments: departmentsResult.rows,
        counts: {
          complaints: complaintsResult.rows.length,
          users: usersResult.rows.length,
          departments: departmentsResult.rows.length,
        }
      }
    });

  } catch (error: any) {
    console.error('DEBUG: Error checking database:', error);
    return NextResponse.json(
      { error: 'Failed to check database', details: error.message },
      { status: 500 }
    );
  }
}
