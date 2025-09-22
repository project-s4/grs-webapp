const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'grievance_portal',
  password: 'password',
  port: 5433,
});

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to database...\n');
    
    // Get all users
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
    console.log('👥 ALL USERS:');
    console.log('═'.repeat(80));
    usersResult.rows.forEach(user => {
      console.log(`ID: ${user.id} | Name: ${user.name} | Email: ${user.email}`);
      console.log(`Role: ${user.role} | Phone: ${user.phone || 'N/A'} | Dept: ${user.department_id || 'N/A'}`);
      console.log(`Created: ${user.created_at}`);
      console.log('─'.repeat(80));
    });
    
    // Get user counts by role
    const countResult = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('\n📊 USER STATISTICS:');
    console.log('═'.repeat(40));
    countResult.rows.forEach(stat => {
      console.log(`${stat.role.toUpperCase()}: ${stat.count} users`);
    });
    
    // Get department users with department names
    const deptUsersResult = await pool.query(`
      SELECT u.name, u.email, d.name as department_name 
      FROM users u 
      JOIN departments d ON u.department_id::integer = d.id 
      WHERE u.role = 'department'
    `);
    
    if (deptUsersResult.rows.length > 0) {
      console.log('\n🏢 DEPARTMENT USERS:');
      console.log('═'.repeat(60));
      deptUsersResult.rows.forEach(user => {
        console.log(`${user.name} (${user.email}) → ${user.department_name}`);
      });
    }
    
    // Get all departments
    const deptResult = await pool.query('SELECT * FROM departments ORDER BY name');
    console.log('\n🏛️ ALL DEPARTMENTS:');
    console.log('═'.repeat(60));
    deptResult.rows.forEach(dept => {
      console.log(`ID: ${dept.id} | ${dept.name} (${dept.code})`);
    });
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
