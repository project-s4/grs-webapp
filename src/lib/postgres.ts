import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// Supabase PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'db.hwlngdpexkgbtrzatfox.supabase.co',
  database: process.env.POSTGRES_DB || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: { rejectUnauthorized: false }
});

// Test connection and create tables if they don't exist
export async function initDatabase() {
  // Skip database initialization during build time
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && process.env.NEXT_RUNTIME === undefined) {
    console.log('Skipping database initialization during build');
    return;
  }
  
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');

    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'citizen',
        department_id UUID,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create departments table first (needed for foreign key)
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add foreign key constraint if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_department 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      `);
    } catch (error) {
      // Constraint probably already exists, ignore
    }

    // Add reset token columns if they don't exist (for password reset)
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
      `);
      
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
      `);
      
      console.log('Reset token columns verified');
    } catch (error) {
      // Columns might already exist, ignore
      console.log('Reset token columns check skipped');
    }


    // Create complaints table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        tracking_id VARCHAR(50) UNIQUE NOT NULL,
        location TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        attachments TEXT,
        notes TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample departments if table is empty
    const deptCount = await client.query('SELECT COUNT(*) FROM departments');
    if (parseInt(deptCount.rows[0].count) === 0) {
      const departments = [
        { id: randomUUID(), name: 'Public Works', code: 'PW', description: 'Roads, water supply, sewerage, and municipal infrastructure' },
        { id: randomUUID(), name: 'Health Department', code: 'HD', description: 'Public health, sanitation, and medical services' },
        { id: randomUUID(), name: 'Education Department', code: 'ED', description: 'Schools, educational facilities, and programs' },
        { id: randomUUID(), name: 'Transport Department', code: 'TD', description: 'Public transportation, traffic management, and vehicle registration' },
        { id: randomUUID(), name: 'Revenue Department', code: 'RD', description: 'Tax collection, property registration, and revenue services' },
        { id: randomUUID(), name: 'Police Department', code: 'PD', description: 'Law enforcement, crime prevention, and public safety' },
        { id: randomUUID(), name: 'Fire Department', code: 'FD', description: 'Fire safety, emergency response, and rescue operations' },
        { id: randomUUID(), name: 'Environment Department', code: 'ENV', description: 'Environmental protection, pollution control, and waste management' }
      ];
      
      for (const dept of departments) {
        await client.query(
          'INSERT INTO departments (id, name, code, description) VALUES ($1, $2, $3, $4)',
          [dept.id, dept.name, dept.code, dept.description]
        );
      }
      console.log('Sample departments inserted');
    }

    client.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Get a database client
export async function getClient() {
  return await pool.connect();
}

// Execute a query
export async function query(text: string, params?: any[]) {
  // Skip database queries during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Database queries are not available during build time');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Initialize database on module load
// Only initialize database at runtime, not during build
// Check if we're in a build phase
if (typeof process !== 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // Initialize database asynchronously, don't block
  initDatabase().catch((err) => {
    // Only log errors if not in build phase
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.error('Database initialization error:', err);
    }
  });
}

export default pool;
