/**
 * Script to run database migration for department user functionality
 * Run with: node scripts/runMigration.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'grievance_portal',
  password: 'password',
  port: 5433,
});

async function runMigration() {
  try {
    console.log('Running database migration for department user functionality...');

    // Add assigned_to column if it doesn't exist
    const addAssignedToQuery = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'complaints' 
              AND column_name = 'assigned_to'
          ) THEN
              ALTER TABLE complaints 
              ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
              
              -- Add index for performance
              CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
              
              RAISE NOTICE 'Added assigned_to column and index to complaints table';
          ELSE
              RAISE NOTICE 'assigned_to column already exists in complaints table';
          END IF;
      END $$;
    `;

    await pool.query(addAssignedToQuery);

    // Add admin_reply column if it doesn't exist
    const addAdminReplyQuery = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'complaints' 
              AND column_name = 'admin_reply'
          ) THEN
              ALTER TABLE complaints 
              ADD COLUMN admin_reply TEXT;
              
              RAISE NOTICE 'Added admin_reply column to complaints table';
          ELSE
              RAISE NOTICE 'admin_reply column already exists in complaints table';
          END IF;
      END $$;
    `;

    await pool.query(addAdminReplyQuery);

    // Update status values to be consistent (lowercase)
    const updateStatusQuery = `
      UPDATE complaints 
      SET status = LOWER(status) 
      WHERE status IN ('Pending', 'In Progress', 'Resolved', 'Closed');
    `;

    const result = await pool.query(updateStatusQuery);
    console.log(`Updated ${result.rowCount} complaint status values to lowercase`);

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
