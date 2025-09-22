const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'grievance_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
});

async function addTestComplaints() {
  try {
    console.log('Adding test complaints...');

    // First, let's see if there are any users
    const usersResult = await pool.query('SELECT id, email, name, role FROM users LIMIT 5');
    console.log('Users in database:', usersResult.rows);

    // Get departments
    const deptResult = await pool.query('SELECT id, name FROM departments LIMIT 5');
    console.log('Departments in database:', deptResult.rows);

    if (usersResult.rows.length === 0) {
      console.log('No users found, creating a test citizen user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUserResult = await pool.query(
        'INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name',
        ['Test Citizen', 'citizen@test.com', hashedPassword, 'citizen', new Date(), new Date()]
      );
      
      console.log('Created test user:', newUserResult.rows[0]);
      usersResult.rows.push(newUserResult.rows[0]);
    }

    // Add some test complaints
    const testComplaints = [
      {
        title: 'Street Light Not Working',
        description: 'The street light near my house has not been working for the past week. This is causing safety issues during nighttime.',
        category: 'Infrastructure',
        priority: 'Medium',
        department_id: deptResult.rows[0]?.id || 1,
        location: '123 Main Street',
        phone: '9876543210',
      },
      {
        title: 'Garbage Collection Delayed',
        description: 'Garbage collection in our area has been delayed by 3 days. The accumulating waste is creating hygiene problems.',
        category: 'Service',
        priority: 'High',
        department_id: deptResult.rows[1]?.id || 2,
        location: '456 Oak Avenue',
        phone: '9876543211',
      },
      {
        title: 'Water Supply Issue',
        description: 'There has been no water supply in our area for the past 2 days. Please resolve this urgent issue.',
        category: 'Infrastructure',
        priority: 'Critical',
        department_id: deptResult.rows[0]?.id || 1,
        location: '789 Pine Road',
        phone: '9876543212',
      }
    ];

    const citizenUser = usersResult.rows.find(u => u.role === 'citizen') || usersResult.rows[0];
    
    for (let i = 0; i < testComplaints.length; i++) {
      const complaint = testComplaints[i];
      
      // Generate tracking ID
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const trackingId = `GR${timestamp.slice(-6)}${random}`;
      
      const result = await pool.query(
        `INSERT INTO complaints (
          user_id, department_id, title, description, category, priority,
          location, phone, email, tracking_id, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, tracking_id, title, status`,
        [
          citizenUser.id,
          complaint.department_id,
          complaint.title,
          complaint.description,
          complaint.category,
          complaint.priority,
          complaint.location,
          complaint.phone,
          citizenUser.email, // Also set email for backward compatibility
          trackingId,
          'pending',
          new Date(),
          new Date()
        ]
      );
      
      console.log(`Created complaint ${i + 1}:`, result.rows[0]);
    }

    // Verify complaints were created
    const complaintsCheck = await pool.query(
      'SELECT c.id, c.tracking_id, c.title, c.status, c.email, c.user_id, u.email as user_email FROM complaints c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 10'
    );
    
    console.log('\nComplaints in database:');
    complaintsCheck.rows.forEach(complaint => {
      console.log(`- ID: ${complaint.id}, Tracking: ${complaint.tracking_id}, Title: ${complaint.title}, Status: ${complaint.status}`);
      console.log(`  User ID: ${complaint.user_id}, Email: ${complaint.email || complaint.user_email}`);
    });

    console.log('\nTest complaints added successfully!');
    console.log(`\nYou can now test the citizen dashboard with email: ${citizenUser.email}`);
    
  } catch (error) {
    console.error('Error adding test complaints:', error);
  } finally {
    await pool.end();
  }
}

addTestComplaints();
