import { Pool } from 'pg';

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'grievance_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection and create tables if they don't exist
export async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');

    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'citizen',
        department_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create departments table first (needed for foreign key)
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


    // Create complaints table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample departments if table is empty
    const deptCount = await client.query('SELECT COUNT(*) FROM departments');
    if (parseInt(deptCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO departments (name, code, description) VALUES
        ('Public Works', 'PW', 'Roads, water supply, sewerage, and municipal infrastructure'),
        ('Health Department', 'HD', 'Public health, sanitation, and medical services'),
        ('Education Department', 'ED', 'Schools, educational facilities, and programs'),
        ('Transport Department', 'TD', 'Public transportation, traffic management, and vehicle registration'),
        ('Revenue Department', 'RD', 'Tax collection, property registration, and revenue services'),
        ('Police Department', 'PD', 'Law enforcement, crime prevention, and public safety'),
        ('Fire Department', 'FD', 'Fire safety, emergency response, and rescue operations'),
        ('Environment Department', 'ENV', 'Environmental protection, pollution control, and waste management')
      `);
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
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Initialize database on module load
initDatabase().catch(console.error);

export default pool;
