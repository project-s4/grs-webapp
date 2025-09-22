# Department User Management System

This document describes the department user functionality added to the Grievance Redressal System, allowing admins to assign complaints to department users who can then manage their assigned complaints through a dedicated dashboard.

## Overview

The system now supports three types of users:
1. **Citizens** - Can file complaints and track their status
2. **Admins** - Can view all complaints, assign them to department users, and manage the system
3. **Department Users** - Can view and update complaints assigned to them by admins

## Features

### Admin Features
- **View all complaints** in the admin dashboard
- **Assign complaints** to department users from the same or relevant departments
- **Update complaint status** and add replies
- **Manage assignments** through a dedicated assignment modal
- **View assignment status** - see which complaints are assigned and to whom

### Department User Features  
- **Dedicated login** at `/department/login`
- **Department dashboard** showing only assigned complaints
- **Update complaint status** (pending → in progress → resolved)
- **Add department replies** to complaints
- **Filter and search** assigned complaints
- **Real-time sync** - changes reflect immediately in admin dashboard

## Database Schema Changes

### New Fields in `complaints` table:
- `assigned_to` - References users.id (department user assigned to handle the complaint)
- `admin_reply` - Text field for official responses

### User Roles:
- `citizen` - Regular users filing complaints
- `admin` - System administrators
- `department` - Department users who can handle assigned complaints  
- `department_admin` - Department administrators (same permissions as department)

## API Endpoints

### New Endpoints:
- `GET /api/users/department-users` - Fetch all department users (admin only)
- `PATCH /api/complaints/[id]/assign` - Assign complaint to department user (admin only)

### Updated Endpoints:
- `GET /api/complaints` - Now supports `assigned_to` parameter for filtering
- `PATCH /api/complaints/[id]` - Now supports `assigned_to` field for updates

## Setup Instructions

### 1. Database Migration
If you have an existing database, run the migration script:
```sql
-- Run scripts/add-assignment-migration.sql
```

### 2. Create Department Users
Use the provided script to create sample department users:
```bash
npx ts-node scripts/createDepartmentUser.ts
```

### 3. Environment Variables
Ensure your PostgreSQL connection is configured:
```env
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=grs_db
POSTGRES_PASSWORD=password
POSTGRES_PORT=5432
JWT_SECRET=your-secret-key
```

## Usage Workflow

### 1. Admin Assigns Complaints
1. Admin logs in at `/admin/login`
2. Views complaints in the admin dashboard
3. Clicks "Assign" button on any complaint
4. Selects a department user from the filtered list (showing only users from the relevant department)
5. Confirms assignment

### 2. Department User Manages Complaints
1. Department user logs in at `/department/login`
2. Views assigned complaints in department dashboard
3. Clicks "Update" on any complaint
4. Changes status and adds reply
5. Saves changes

### 3. Real-time Updates
- Status changes by department users are immediately visible in admin dashboard
- Admins can reassign complaints at any time
- Email notifications (if configured) are sent for status updates

## Testing Credentials

After running the setup script, you can test with these credentials:

### Department Users:
- **Public Works**: john.publicworks@dept.gov / dept123
- **Health Dept**: sarah.health@dept.gov / dept123  
- **Education**: mike.education@dept.gov / dept123
- **Transport**: lisa.transport@dept.gov / dept123

### Admin:
- Use your existing admin credentials

## Security Features

- **Role-based access control** - Department users can only see assigned complaints
- **JWT token authentication** - Secure API access
- **Department filtering** - Assignment modal shows only relevant department users
- **Authorization checks** - API endpoints validate user permissions

## UI/UX Features

- **Dedicated dashboards** for each user type
- **Intuitive assignment modal** with complaint details and filtered user selection
- **Status badges** with color coding for easy complaint status identification
- **Responsive design** - Works on desktop and mobile devices
- **Toast notifications** for user feedback on actions

## Benefits

1. **Improved Efficiency** - Direct assignment eliminates manual complaint routing
2. **Better Accountability** - Clear ownership of each complaint
3. **Enhanced Tracking** - Real-time visibility into complaint assignments and progress
4. **User Experience** - Dedicated interfaces optimized for each user role
5. **Scalability** - Easy to add more departments and users

## Future Enhancements

Potential areas for expansion:
- **Bulk assignment** of multiple complaints
- **Department-wise analytics** and reporting
- **Escalation workflows** for overdue complaints
- **Mobile app** for department users
- **Push notifications** for new assignments
- **Performance metrics** and KPIs for department users
