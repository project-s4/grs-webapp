# 💻 Grievance Redressal System - Complete Coding Documentation

## 📋 Table of Contents

1. [Database Layer](#database-layer)
2. [Authentication System](#authentication-system)
3. [API Routes & Endpoints](#api-routes--endpoints)
4. [React Components](#react-components)
5. [Services Layer](#services-layer)
6. [Utility Functions](#utility-functions)
7. [Code Examples & Patterns](#code-examples--patterns)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## 🗄️ Database Layer

### **File: `src/lib/postgres.ts`**

This file handles all PostgreSQL database operations including connection management, table creation, and query execution.

#### **Connection Pool Setup**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\lib\postgres.ts start=4
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'grievance_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

**Function Purpose**: Creates a PostgreSQL connection pool using the `pg` library  
**Parameters**: Configuration object with database connection details  
**Return Value**: Pool instance for managing database connections  
**Environment Variables Used**:
- `POSTGRES_USER`: Database username (default: 'postgres')
- `POSTGRES_HOST`: Database host (default: 'localhost')
- `POSTGRES_DB`: Database name (default: 'grievance_portal')
- `POSTGRES_PASSWORD`: Database password (default: 'password')
- `POSTGRES_PORT`: Database port (default: '5433')

**Key Features**:
- Connection pooling for better performance
- Environment-based configuration
- SSL support for production environments
- Fallback defaults for development

---

#### **Database Initialization Function**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\lib\postgres.ts start=14
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
```

**Function Purpose**: Initializes the database by creating all necessary tables and inserting default data  
**Parameters**: None  
**Return Value**: Promise<void>  
**Error Handling**: Catches and logs database errors, throws them for handling by caller

**Table Creation Process**:
1. **Users Table**: Stores user information with roles and department associations
2. **Departments Table**: Stores government department information
3. **Complaints Table**: Stores complaint/grievance data with relationships
4. **Foreign Key Constraints**: Establishes relationships between tables

**Key Features**:
- Uses `CREATE TABLE IF NOT EXISTS` for safe table creation
- Establishes foreign key relationships
- Inserts sample departments if table is empty
- Comprehensive error handling with try-catch blocks

---

#### **Database Query Functions**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\lib\postgres.ts start=107
export async function getClient() {
  return await pool.connect();
}

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

**`getClient()` Function**:
- **Purpose**: Provides direct access to a database client from the pool
- **Parameters**: None
- **Return Value**: Promise<PoolClient>
- **Usage**: For operations requiring multiple queries in a transaction

**`query()` Function**:
- **Purpose**: Executes parameterized SQL queries safely
- **Parameters**: 
  - `text`: SQL query string
  - `params`: Optional array of parameters for the query
- **Return Value**: Promise<QueryResult>
- **Features**: Automatic connection management, parameter binding for SQL injection prevention

**Usage Example**:
```typescript path=null start=null
// Fetch user by email
const result = await query('SELECT * FROM users WHERE email = $1', [email]);

// Insert new complaint
const newComplaint = await query(
  'INSERT INTO complaints (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
  [title, description, userId]
);
```

---

## 🔐 Authentication System

### **File: `contexts/auth-context.tsx`**

React Context for managing authentication state and operations across the application.

#### **Authentication Context Definition**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\contexts\auth-context.tsx start=6
type AuthContextType = {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: any }>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

**Context Structure**:
- **login**: Function to authenticate user credentials
- **register**: Function to create new user accounts
- **logout**: Function to clear authentication state
- **Type Safety**: Uses TypeScript for strict typing

---

#### **Login Function Implementation**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\contexts\auth-context.tsx start=15
const login = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    return { success: true, user: data.user };
  } catch (error) {
    throw error;
  }
};
```

**Function Purpose**: Authenticates user credentials and stores JWT token  
**Parameters**:
- `email`: User's email address
- `password`: User's password

**Process Flow**:
1. Sends POST request to `/api/auth/login` endpoint
2. Validates response status and extracts data
3. Stores JWT token in localStorage on success
4. Returns success status and user information
5. Throws error if authentication fails

**Error Handling**: Propagates errors to calling components for user feedback

---

#### **Register Function Implementation**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\contexts\auth-context.tsx start=35
const register = async (userData: any) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
};
```

**Function Purpose**: Registers new user accounts  
**Parameters**: `userData` object containing user registration information  
**Return Value**: Promise resolving to registration response data  
**Error Handling**: Throws descriptive errors for failed registration attempts

---

#### **Logout Function**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\contexts\auth-context.tsx start=49
const logout = () => {
  localStorage.removeItem('token');
};
```

**Function Purpose**: Clears authentication state by removing stored token  
**Parameters**: None  
**Side Effects**: Removes JWT token from localStorage  
**Usage**: Called when user explicitly logs out or session expires

---

#### **useAuth Hook**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\contexts\auth-context.tsx start=60
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Hook Purpose**: Provides type-safe access to authentication context  
**Error Prevention**: Ensures hook is used within AuthProvider  
**Return Value**: AuthContextType object with login, register, and logout functions

---

### **File: `src/services/auth.ts`**

Service layer for authentication operations with additional utility functions.

#### **Authentication Service Object**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\services\auth.ts start=17
export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response.data;
  },
```

**Service Structure**: Object containing all authentication-related functions  
**Benefits**: Centralized authentication logic, reusable across components  
**API Integration**: Uses centralized API service for HTTP requests

#### **Token Management Functions**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\services\auth.ts start=46
getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
},

isAuthenticated() {
  return !!this.getToken();
},
```

**`getToken()` Function**:
- **Purpose**: Safely retrieves JWT token from localStorage
- **SSR Safety**: Checks for window object before accessing localStorage
- **Return Value**: Token string or null

**`isAuthenticated()` Function**:
- **Purpose**: Checks if user is currently authenticated
- **Logic**: Returns boolean based on token presence
- **Usage**: Route protection and conditional rendering

---

## 🛣️ API Routes & Endpoints

### **File: `app/api/auth/register/route.ts`**

Next.js API route handler for user registration.

#### **POST Handler Function**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\auth\register\route.ts start=5
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
```

**Function Purpose**: Handles user registration requests  
**HTTP Method**: POST  
**Parameters**: Extracts user data from request body  
**Validation**: Checks for required fields (name, email, password)

**Request Body Structure**:
```typescript path=null start=null
{
  name: string;        // User's full name
  email: string;       // User's email address
  phone?: string;      // Optional phone number
  password: string;    // User's password
  role?: string;       // Optional role (default: 'citizen')
  department_id?: number; // Required for admin roles
}
```

#### **Validation Logic**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\auth\register\route.ts start=26
// Validate admin role requirements
if (role === 'admin' && !department_id) {
  console.log('Admin registration requires department selection');
  const errorResponse = NextResponse.json(
    { message: 'Admin users must select a department' },
    { status: 400 }
  );
```

**Admin Validation**: Ensures admin users have department association  
**Error Response**: Returns 400 status with descriptive message  
**Security**: Prevents incomplete admin account creation

#### **User Existence Check**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\auth\register\route.ts start=43
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
```

**Purpose**: Prevents duplicate user registration  
**Query**: Checks database for existing email address  
**Error Code**: Returns 409 (Conflict) for duplicate emails  
**Security**: Prevents account enumeration by providing specific error message

#### **Password Hashing and User Creation**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\auth\register\route.ts start=65
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
```

**Password Security**: Uses bcrypt with salt rounds of 10  
**Database Insert**: Parameterized query prevents SQL injection  
**Default Values**: Provides fallbacks for optional fields  
**Return Data**: Only returns safe user information (excludes password)

#### **CORS Headers Implementation**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\auth\register\route.ts start=102
// Add CORS headers
response.headers.set('Access-Control-Allow-Origin', '*');
response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
response.headers.set('Access-Control-Allow-Credentials', 'true');
```

**CORS Support**: Enables cross-origin requests  
**Methods**: Allows POST and OPTIONS methods  
**Headers**: Permits Content-Type and Authorization headers  
**Credentials**: Supports cookie/credential passing

---

### **File: `app/api/complaints/[id]/assign/route.ts`**

API route for assigning complaints to department users.

#### **Authorization Middleware**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\complaints\[id]\assign\route.ts start=18
// Get token from Authorization header
const authHeader = request.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json(
    { error: 'Authorization token required' },
    { status: 401 }
  );
}

const token = authHeader.split(' ')[1];

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  
  // Only admins can assign complaints
  if (decoded.role !== 'admin') {
    return NextResponse.json(
      { error: 'Access denied. Admin role required.' },
      { status: 403 }
    );
  }
} catch (jwtError) {
  return NextResponse.json(
    { error: 'Invalid token' },
    { status: 401 }
  );
}
```

**Authentication Process**:
1. Extracts Bearer token from Authorization header
2. Verifies JWT token using secret key
3. Validates user role for admin permissions
4. Returns appropriate error codes for failures

**Security Features**:
- Role-based access control
- JWT token validation
- Proper HTTP status codes (401, 403)
- Error message standardization

#### **User Validation Logic**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\complaints\[id]\assign\route.ts start=49
// Validate assigned_to is a valid department user if provided
if (assigned_to) {
  const userCheck = await pool.query(
    'SELECT id, role FROM users WHERE id = $1 AND role IN ($2, $3)',
    [assigned_to, 'department', 'department_admin']
  );
  
  if (userCheck.rows.length === 0) {
    return NextResponse.json(
      { error: 'Invalid department user' },
      { status: 400 }
    );
  }
}
```

**Validation Purpose**: Ensures assigned user is a valid department staff member  
**Role Check**: Only allows assignment to 'department' or 'department_admin' roles  
**Error Handling**: Returns 400 status for invalid assignments

#### **Flexible ID Handling**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\complaints\[id]\assign\route.ts start=64
// Update the complaint assignment
// Try to parse as integer first, if that fails, treat as tracking_id
const numericId = parseInt(complaintId);
let updateQuery, queryParams;

if (!isNaN(numericId)) {
  // It's a numeric ID
  updateQuery = `
    UPDATE complaints 
    SET assigned_to = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  queryParams = [assigned_to || null, numericId];
} else {
  // It's a tracking_id
  updateQuery = `
    UPDATE complaints 
    SET assigned_to = $1, updated_at = NOW()
    WHERE tracking_id = $2
    RETURNING *
  `;
  queryParams = [assigned_to || null, complaintId];
}
```

**Flexible Design**: Supports both numeric IDs and tracking IDs  
**Dynamic Query**: Builds appropriate SQL query based on ID type  
**Timestamp Update**: Automatically updates the `updated_at` field  
**Return Data**: Returns complete updated complaint record

---

### **File: `app/api/departments/route.ts`**

API route for department management operations.

#### **GET Handler - Fetch Departments**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\departments\route.ts start=4
export async function GET(request: NextRequest) {
  try {
    // Fetch departments from PostgreSQL
    const result = await query('SELECT * FROM departments ORDER BY name ASC');
    const departments = result.rows;

    // Add CORS headers
    const response = NextResponse.json(departments);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
```

**Function Purpose**: Retrieves all departments from database  
**Sorting**: Orders departments alphabetically by name  
**Error Handling**: Returns 500 status with error message on failure  
**CORS Headers**: Enables cross-origin access for frontend

#### **POST Handler - Create Department**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\api\departments\route.ts start=26
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Insert into PostgreSQL
    const result = await query(
      'INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) RETURNING *',
      [name, code, description || '']
    );

    const newDepartment = result.rows[0];

    const response = NextResponse.json(newDepartment, { status: 201 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
```

**Validation**: Requires name and code fields  
**Database Operation**: Inserts new department record  
**Response**: Returns created department with 201 status  
**Error Handling**: Comprehensive error logging and user feedback

---

## ⚛️ React Components

### **File: `app/admin/login/page.tsx`**

Admin login page component with form handling and validation.

#### **Component Structure and Imports**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\admin\login\page.tsx start=1
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import LoginPageLayout from '@/components/LoginPageLayout';
```

**Client Component**: Uses 'use client' directive for browser-side rendering  
**Form Handling**: React Hook Form for form state management  
**Validation**: Zod schema for type-safe form validation  
**Navigation**: Next.js router for programmatic navigation  
**Notifications**: React Hot Toast for user feedback

#### **Form Schema Definition**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\admin\login\page.tsx start=11
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

**Schema Validation**:
- Email field must be valid email format
- Password field cannot be empty
- Type inference creates TypeScript type from schema

#### **Authentication Check Effect**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\admin\login\page.tsx start=31
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'admin') {
        window.location.href = redirect || '/admin/dashboard';
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
  }
}, [redirect]);
```

**Purpose**: Redirects already-authenticated admin users  
**JWT Decoding**: Manually decodes JWT payload to check role  
**Error Handling**: Removes invalid tokens  
**Redirect Support**: Honors redirect parameter for post-login navigation

#### **Form Submission Handler**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\app\admin\login\page.tsx start=45
const onSubmit = async (data: LoginFormData) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    // Check if user is actually an admin
    if (result.user.role === 'admin') {
      localStorage.setItem('token', result.token);
      toast.success('Login successful!');
      window.location.href = redirect || '/admin/dashboard';
    } else {
      toast.error('Access denied. Admin credentials required.');
    }
  } catch (error) {
    console.error('Login failed:', error);
    toast.error('Login failed. Please check your credentials.');
  }
};
```

**Authentication Flow**:
1. Sends credentials to login API endpoint
2. Validates response and extracts user data
3. Verifies user has admin role
4. Stores JWT token on successful authentication
5. Redirects to admin dashboard
6. Shows appropriate success/error messages

**Security Features**:
- Role validation before token storage
- Error message sanitization
- Proper error handling and user feedback

---

### **File: `src/components/LoginPageLayout.tsx`**

Reusable layout component for all login pages.

#### **Component Props Interface**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\components\LoginPageLayout.tsx start=6
interface LoginPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerLinks?: Array<{
    label: string;
    href: string;
    color?: string;
  }>;
}
```

**Props Structure**:
- `title`: Main heading text
- `subtitle`: Descriptive text below title
- `children`: Form content (React nodes)
- `footerLinks`: Optional navigation links with styling

#### **Layout Structure**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\components\LoginPageLayout.tsx start=17
export default function LoginPageLayout({ 
  title, 
  subtitle, 
  children, 
  footerLinks = [] 
}: LoginPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-primary-600 hover:text-primary-700 mb-8 inline-block">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}
          </p>
        </div>
```

**Layout Features**:
- Responsive design with Tailwind CSS
- Gradient background for visual appeal
- Back-to-home navigation link
- Centered content with proper spacing
- Dynamic title and subtitle rendering

#### **Footer Links Rendering**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\components\LoginPageLayout.tsx start=44
<div className="text-center space-y-2">
  {footerLinks.map((link, index) => (
    <p key={index} className="text-sm text-gray-600">
      {link.label}{' '}
      <Link
        href={link.href}
        className={`font-medium hover:opacity-80 ${
          link.color === 'blue' ? 'text-blue-600 hover:text-blue-500' :
          link.color === 'red' ? 'text-red-600 hover:text-red-500' :
          'text-primary-600 hover:text-primary-500'
        }`}
      >
        {link.href === '/department/login' ? 'Department Login' :
         link.href === '/admin/login' ? 'Admin Login' :
         link.href === '/login' ? 'Citizen Login' :
         link.href === '/register' ? 'Sign up' :
         link.href === '/' ? '← Back to Home' : 'Link'}
      </Link>
    </p>
  ))}
</div>
```

**Dynamic Link Generation**:
- Maps through provided footer links
- Applies conditional styling based on color prop
- Generates appropriate link text based on href
- Supports different color schemes for different user types

---

## 🔧 Services Layer

### **File: `src/services/api.ts`**

Centralized API service with interceptors and error handling.

#### **Axios Instance Configuration**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\services\api.ts start=3
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
```

**Configuration Features**:
- Base URL from environment variable with fallback
- Default JSON content type header
- Credential support for authentication
- Centralized configuration management

#### **Request Interceptor**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\services\api.ts start=11
// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

**Interceptor Purpose**: Automatically adds authentication token to requests  
**Browser Check**: Only accesses localStorage in browser environment  
**Header Injection**: Adds Bearer token to Authorization header  
**SSR Safe**: Checks for window object before localStorage access

#### **Response Interceptor**

```typescript path=C:\Users\sathw\Desktop\project\grs-webapp\src\services\api.ts start=22
// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Extract error message from response
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'An error occurred';
    
    // Create a standardized error object
    const standardError = {
      message,
      status: error.response?.status,
      data: error.response?.data,
      original: error
    };
    
    return Promise.reject(standardError);
  }
);
```

**Error Handling Features**:
- Automatic logout on 401 (Unauthorized) responses
- Token cleanup on authentication failure
- Standardized error object format
- Message extraction from various error sources
- Original error preservation for debugging

**Error Object Structure**:
```typescript path=null start=null
{
  message: string;     // User-friendly error message
  status: number;      // HTTP status code
  data: any;          // Response data
  original: Error;    // Original axios error
}
```

---

## 🛠️ Utility Functions

### **File: `src/lib/utils.ts`**

Common utility functions used throughout the application.

```typescript path=null start=null
// Example utility functions (typical content)
export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function generateTrackingId() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return `GRS${timestamp}${randomNum}`;
}
```

**Common Utilities**:
- `classNames`: Conditionally joins CSS classes
- `formatDate`: Formats dates for display
- `generateTrackingId`: Creates unique tracking IDs for complaints

---

## 📝 Code Examples & Patterns

### **Authentication Pattern**

```typescript path=null start=null
// Protected component pattern
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return <PageContent />;
}
```

### **API Call Pattern**

```typescript path=null start=null
// Standardized API call with error handling
import api from '@/services/api';
import toast from 'react-hot-toast';

async function fetchComplaints() {
  try {
    const response = await api.get('/complaints');
    return response.data;
  } catch (error) {
    toast.error(error.message || 'Failed to fetch complaints');
    throw error;
  }
}
```

### **Form Handling Pattern**

```typescript path=null start=null
// React Hook Form with Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function ComplaintForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/complaints', data);
      toast.success('Complaint submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit complaint');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      
      <textarea {...register('description')} />
      {errors.description && <span>{errors.description.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

---

## 🚨 Error Handling

### **API Error Handling Strategy**

```typescript path=null start=null
// Centralized error handling
class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error boundary component
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="error-boundary">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Usage in app
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo);
  }}
>
  <App />
</ErrorBoundary>
```

### **Database Error Handling**

```typescript path=null start=null
// Database operation with proper error handling
export async function createComplaint(data: ComplaintData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      'INSERT INTO complaints (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [data.title, data.description, data.userId]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error:', error);
    
    if (error.code === '23505') { // Unique violation
      throw new Error('Duplicate entry detected');
    }
    
    throw new Error('Failed to create complaint');
  } finally {
    client.release();
  }
}
```

---

## ✅ Best Practices

### **Security Best Practices**

1. **Password Hashing**
```typescript path=null start=null
import bcrypt from 'bcryptjs';

// Always hash passwords before storing
const hashedPassword = await bcrypt.hash(password, 10);

// Compare passwords securely
const isValid = await bcrypt.compare(password, hashedPassword);
```

2. **JWT Token Handling**
```typescript path=null start=null
// Verify tokens on protected routes
import jwt from 'jsonwebtoken';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Proceed with authorized request
} catch (error) {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
```

3. **Input Validation**
```typescript path=null start=null
// Use parameterized queries to prevent SQL injection
const result = await query(
  'SELECT * FROM users WHERE email = $1 AND id = $2',
  [email, id]
);
```

### **Performance Best Practices**

1. **Database Connection Pooling**
```typescript path=null start=null
// Use connection pool instead of creating new connections
const pool = new Pool({ /* config */ });

// Properly release connections
const client = await pool.connect();
try {
  // Database operations
} finally {
  client.release(); // Always release in finally block
}
```

2. **React Component Optimization**
```typescript path=null start=null
import { memo, useCallback, useMemo } from 'react';

// Memoize expensive components
const ExpensiveComponent = memo(({ data, onAction }) => {
  // Component logic
});

// Memoize callback functions
const handleClick = useCallback((id) => {
  // Handle click logic
}, [dependency]);

// Memoize computed values
const processedData = useMemo(() => {
  return data.map(item => processItem(item));
}, [data]);
```

### **Code Organization Best Practices**

1. **File Structure**
```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts
├── services/          # API services
├── lib/              # Utility functions
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

2. **Error Boundaries**
```typescript path=null start=null
// Wrap components with error boundaries
<ErrorBoundary>
  <UserDashboard />
</ErrorBoundary>
```

3. **Environment Variables**
```typescript path=null start=null
// Use environment variables for configuration
const config = {
  dbHost: process.env.POSTGRES_HOST || 'localhost',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
};
```

---

## 📊 Function Reference Summary

| Category | Function/Component | Purpose | File Location |
|----------|-------------------|---------|---------------|
| **Database** | `initDatabase()` | Initialize DB tables | `src/lib/postgres.ts` |
| | `query()` | Execute SQL queries | `src/lib/postgres.ts` |
| | `getClient()` | Get DB connection | `src/lib/postgres.ts` |
| **Auth Context** | `login()` | Authenticate user | `contexts/auth-context.tsx` |
| | `register()` | Register new user | `contexts/auth-context.tsx` |
| | `logout()` | Clear auth state | `contexts/auth-context.tsx` |
| **Auth Service** | `authService.login()` | API login call | `src/services/auth.ts` |
| | `authService.getToken()` | Retrieve JWT token | `src/services/auth.ts` |
| | `authService.isAuthenticated()` | Check auth status | `src/services/auth.ts` |
| **API Routes** | `POST /api/auth/register` | Handle registration | `app/api/auth/register/route.ts` |
| | `PATCH /api/complaints/[id]/assign` | Assign complaints | `app/api/complaints/[id]/assign/route.ts` |
| | `GET /api/departments` | Fetch departments | `app/api/departments/route.ts` |
| **Components** | `AdminLoginPage` | Admin login form | `app/admin/login/page.tsx` |
| | `LoginPageLayout` | Reusable login layout | `src/components/LoginPageLayout.tsx` |
| | `DashboardPage` | User dashboard | `app/dashboard/page.tsx` |
| **Services** | `api` | Axios instance | `src/services/api.ts` |
| | Request Interceptor | Add auth headers | `src/services/api.ts` |
| | Response Interceptor | Handle API errors | `src/services/api.ts` |

---

This comprehensive coding documentation provides detailed explanations of every major function, component, and pattern used in your Grievance Redressal System. Each section includes purpose, parameters, return values, usage examples, and best practices to help developers understand and maintain the codebase effectively.
