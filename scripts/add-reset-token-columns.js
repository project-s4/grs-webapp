/**
 * Script to add reset token columns to the users table
 * Run with: node scripts/add-reset-token-columns.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'grievance_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
});

async function addResetTokenColumns() {
  try {
    console.log('Adding reset token columns to users table...');
    
    const client = await pool.connect();
    
    // Add reset_token column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
    `);
    console.log('✓ Added reset_token column');
    
    // Add reset_token_expiry column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    console.log('✓ Added reset_token_expiry column');
    
    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('reset_token', 'reset_token_expiry')
    `);
    
    console.log('\n✓ Migration completed successfully!');
    console.log('Columns added:', result.rows);
    
    client.release();
  } catch (error) {
    console.error('Error adding reset token columns:', error);
  } finally {
    await pool.end();
  }
}

addResetTokenColumns();

