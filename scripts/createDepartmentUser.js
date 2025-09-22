/**
 * Script to create sample department users for testing the grievance redressal system
 * Run with: node scripts/createDepartmentUser.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'grievance_portal',
  password: 'password',
  port: 5433,
});

async function createDepartmentUsers() {
  try {
    console.log('Creating sample department users...');

    // Sample department users
    const departmentUsers = [
      {
        name: 'John Public Works',
        email: 'john.publicworks@dept.gov',
        phone: '+1-555-0101',
        password: 'dept123', 
        role: 'department',
        department_id: 1 // Public Works
      },
      {
        name: 'Sarah Health Dept',
        email: 'sarah.health@dept.gov',
        phone: '+1-555-0102',
        password: 'dept123',
        role: 'department',
        department_id: 2 // Health Department
      },
      {
        name: 'Mike Education',
        email: 'mike.education@dept.gov',
        phone: '+1-555-0103',
        password: 'dept123',
        role: 'department_admin',
        department_id: 3 // Education Department
      },
      {
        name: 'Lisa Transport',
        email: 'lisa.transport@dept.gov',
        phone: '+1-555-0104',
        password: 'dept123',
        role: 'department',
        department_id: 4 // Transport Department
      }
    ];

    for (const user of departmentUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, password, role, department_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, name, email, role, department_id`,
        [user.name, user.email, user.phone, hashedPassword, user.role, user.department_id]
      );

      console.log(`✓ Created department user: ${result.rows[0].name} (${result.rows[0].email})`);
      console.log(`  Role: ${result.rows[0].role}, Department ID: ${result.rows[0].department_id}`);
    }

    console.log('\n🎉 Department users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: john.publicworks@dept.gov | Password: dept123');
    console.log('Email: sarah.health@dept.gov | Password: dept123');
    console.log('Email: mike.education@dept.gov | Password: dept123');
    console.log('Email: lisa.transport@dept.gov | Password: dept123');
    console.log('\nUse these credentials to test department login at /department/login');

  } catch (error) {
    console.error('Error creating department users:', error);
  } finally {
    await pool.end();
  }
}

createDepartmentUsers();
