import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/postgres';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, role, department_id } = await request.json();
    console.log('Registration attempt for email:', email);

    if (!name || !email || !password) {
      console.log('Missing required fields');
      const errorResponse = NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return errorResponse;
    }

    // Validate admin role requirements
    if (role === 'admin' && !department_id) {
      console.log('Admin registration requires department selection');
      const errorResponse = NextResponse.json(
        { message: 'Admin users must select a department' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return errorResponse;
    }

    // Check if user already exists
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUserResult.rows.length > 0) {
      console.log('User already exists with email:', email);
      const errorResponse = NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return errorResponse;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUserResult = await query(
      `INSERT INTO users (name, email, phone, password, role, department_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, name, email, role`,
      [
        name,
        email,
        phone || '',
        hashedPassword,
        role || 'citizen',
        department_id || null,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    const newUser = newUserResult.rows[0];
    
    console.log('New user registered:', email);

    const response = NextResponse.json(
      { 
        message: 'Registration successful',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }
      },
      { status: 201 }
    );

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    const errorResponse = NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return errorResponse;
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
