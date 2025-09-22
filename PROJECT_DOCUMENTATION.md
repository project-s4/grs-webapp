# 🏛️ Grievance Redressal System - Complete Project Documentation

## 📋 **Project Overview**

The Grievance Redressal System (GRS) is a comprehensive web application designed to streamline the process of filing, managing, and resolving citizen complaints across various government departments. It provides a digital platform for citizens to submit grievances and enables efficient management through role-based dashboards.

---

## 🎯 **Project Objectives**

1. **Digitize Complaint Process**: Replace manual paper-based complaint systems
2. **Improve Transparency**: Provide tracking mechanisms for complaint status
3. **Enable Efficient Management**: Role-based dashboards for different stakeholders
4. **Enhance Accountability**: Clear assignment and resolution tracking
5. **Provide Analytics**: Dashboard insights for administrative decision-making

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14 + React)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Citizen   │ │   Admin     │ │ Department  │               │
│  │  Dashboard  │ │  Dashboard  │ │  Dashboard  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                        │                                       │
│                        ▼                                       │
│  API Layer (Next.js API Routes)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │    Auth     │ │ Complaints  │ │    Users    │               │
│  │   Routes    │ │   Routes    │ │   Routes    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                        │                                       │
│                        ▼                                       │
│  Database Layer (PostgreSQL)                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │    Users    │ │ Complaints  │ │ Departments │               │
│  │    Table    │ │   Table     │ │    Table    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                        │                                       │
│                        ▼                                       │
│  Infrastructure (Docker)                                       │
│  ┌─────────────┐ ┌─────────────┐                               │
│  │ PostgreSQL  │ │   Adminer   │                               │
│  │ Container   │ │ Container   │                               │
│  └─────────────┘ └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 **User Roles & Permissions**

### **1. Citizen Users**
```
┌─────────────────────────────────┐
│           CITIZEN ROLE          │
├─────────────────────────────────┤
│ Permissions:                    │
│ • Register account              │
│ • File new complaints           │
│ • View own complaints           │
│ • Track complaint status        │
│ • View admin/dept replies       │
│                                 │
│ Dashboard Features:             │
│ • Complaint submission form     │
│ • Personal complaint history    │
│ • Status tracking               │
│ • Communication thread         │
└─────────────────────────────────┘
```

### **2. Admin Users**
```
┌─────────────────────────────────┐
│            ADMIN ROLE           │
├─────────────────────────────────┤
│ Permissions:                    │
│ • View dept-specific complaints │
│ • Assign complaints to dept     │
│ • Update complaint status       │
│ • Add administrative replies    │
│ • Generate reports              │
│                                 │
│ Dashboard Features:             │
│ • Department complaint overview │
│ • Assignment management         │
│ • Status update interface       │
│ • Analytics & statistics       │
└─────────────────────────────────┘
```

### **3. Department Users**
```
┌─────────────────────────────────┐
│        DEPARTMENT ROLE          │
├─────────────────────────────────┤
│ Permissions:                    │
│ • View assigned complaints      │
│ • Update complaint status       │
│ • Add resolution notes          │
│ • Communicate with citizens     │
│                                 │
│ Dashboard Features:             │
│ • Assigned complaint queue      │
│ • Resolution interface          │
│ • Progress tracking             │
│ • Communication tools           │
└─────────────────────────────────┘
```

---

## 🗄️ **Database Schema**

```sql
-- USERS TABLE
┌─────────────────────────────────────────────────────────────┐
│                        USERS TABLE                          │
├─────────────────────────────────────────────────────────────┤
│ id (SERIAL PRIMARY KEY)                                     │
│ name (VARCHAR(255) NOT NULL)                               │
│ email (VARCHAR(255) UNIQUE NOT NULL)                       │
│ phone (VARCHAR(20))                                        │
│ password (VARCHAR(255) NOT NULL)                           │
│ role (VARCHAR(50) DEFAULT 'citizen')                       │
│ department_id (INTEGER FK → departments.id)                │
│ created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)           │
│ updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)           │
└─────────────────────────────────────────────────────────────┘

-- DEPARTMENTS TABLE
┌─────────────────────────────────────────────────────────────┐
│                    DEPARTMENTS TABLE                         │
├─────────────────────────────────────────────────────────────┤
│ id (SERIAL PRIMARY KEY)                                     │
│ name (VARCHAR(255) NOT NULL)                               │
│ code (VARCHAR(10) UNIQUE NOT NULL)                         │
│ description (TEXT)                                          │
│ created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)           │
│ updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)           │
└─────────────────────────────────────────────────────────────┘

-- COMPLAINTS TABLE
┌─────────────────────────────────────────────────────────────┐
│                    COMPLAINTS TABLE                          │
├─────────────────────────────────────────────────────────────┤
│ id (SERIAL PRIMARY KEY)                                     │
│ user_id (INTEGER FK → users.id)                            │
│ department_id (INTEGER FK → departments.id)                │
│ assigned_to (INTEGER FK → users.id)                        │
│ title (VARCHAR(255) NOT NULL)                              │
│ description (TEXT NOT NULL)                                 │
│ category (VARCHAR(100))                                     │
│ status (VARCHAR(50) DEFAULT 'pending')                     │
│ priority (VARCHAR(20) DEFAULT 'medium')                    │
│ tracking_id (VARCHAR(50) UNIQUE NOT NULL)                  │
│ location (TEXT)                                             │
│ phone (VARCHAR(20))                                         │
│ email (VARCHAR(255))                                        │
│ admin_reply (TEXT)                                          │
│ attachments (TEXT)                                          │
│ notes (TEXT)                                                │
│ resolved_at (TIMESTAMP)                                     │
│ created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)           │
│ updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 **Authentication & Authorization Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Login                                                 │
│      │                                                     │
│      ▼                                                     │
│  Credentials Validation                                     │
│      │                                                     │
│      ▼                                                     │
│  JWT Token Generation                                       │
│      │                                                     │
│      ▼                                                     │
│  Role-based Routing                                         │
│      │                                                     │
│      ├─── Citizen ────► /user/dashboard                    │
│      ├─── Admin ──────► /admin/dashboard                   │
│      └─── Department ─► /department/dashboard              │
│                                                             │
│  Protected Route Access                                     │
│      │                                                     │
│      ▼                                                     │
│  Token Validation Middleware                                │
│      │                                                     │
│      ▼                                                     │
│  Role-specific Data Access                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Complaint Lifecycle**

```
┌─────────────────────────────────────────────────────────────┐
│                COMPLAINT LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. FILING                                                  │
│     Citizen submits complaint                               │
│     │                                                       │
│     ▼                                                       │
│  2. INITIAL STATUS: "Pending"                               │
│     Tracking ID generated (GRS########)                     │
│     │                                                       │
│     ▼                                                       │
│  3. ADMIN REVIEW                                            │
│     Admin views in department dashboard                     │
│     │                                                       │
│     ▼                                                       │
│  4. ASSIGNMENT                                              │
│     Admin assigns to department user                        │
│     Status: "Assigned"                                      │
│     │                                                       │
│     ▼                                                       │
│  5. PROCESSING                                              │
│     Department user reviews complaint                       │
│     Status: "In Progress"                                   │
│     │                                                       │
│     ▼                                                       │
│  6. RESOLUTION                                              │
│     Department user resolves issue                          │
│     Status: "Resolved"                                      │
│     │                                                       │
│     ▼                                                       │
│  7. CLOSURE                                                 │
│     Citizen can view resolution                             │
│     Status: "Closed"                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **Technology Stack**

### **Frontend Technologies**
```
┌─────────────────────────────────┐
│         FRONTEND STACK          │
├─────────────────────────────────┤
│ • Next.js 14 (React Framework) │
│ • React 18 (UI Library)        │
│ • TypeScript (Type Safety)     │
│ • Tailwind CSS (Styling)       │
│ • React Hook Form (Forms)      │
│ • Zod (Validation)             │
│ • React Hot Toast (Notifications) │
│ • Framer Motion (Animations)   │
└─────────────────────────────────┘
```

### **Backend Technologies**
```
┌─────────────────────────────────┐
│         BACKEND STACK           │
├─────────────────────────────────┤
│ • Next.js API Routes (REST API) │
│ • Node.js (Runtime)            │
│ • PostgreSQL (Database)        │
│ • bcryptjs (Password Hashing)  │
│ • jsonwebtoken (Authentication) │
│ • pg (PostgreSQL Driver)       │
└─────────────────────────────────┘
```

### **Infrastructure**
```
┌─────────────────────────────────┐
│       INFRASTRUCTURE            │
├─────────────────────────────────┤
│ • Docker (Containerization)    │
│ • PostgreSQL Container         │
│ • Adminer (Database Admin)     │
│ • Environment Variables        │
└─────────────────────────────────┘
```

---

## 📱 **Application Flow Diagrams**

### **Citizen User Flow**
```
┌─────────────────────────────────────────────────────────────┐
│                   CITIZEN USER FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Start                                                      │
│    │                                                       │
│    ▼                                                       │
│  Register/Login ──────► Authentication                     │
│    │                          │                           │
│    │                          ▼                           │
│    │                      JWT Token                       │
│    │                          │                           │
│    ▼                          ▼                           │
│  Citizen Dashboard ◄──────────┘                           │
│    │                                                       │
│    ├── View Complaints ──► Complaint List                 │
│    │                                                       │
│    ├── File New ──────────► Complaint Form                │
│    │        │                      │                     │
│    │        └──────────────────────▼                     │
│    │                          Save to DB                 │
│    │                              │                       │
│    │                              ▼                       │
│    └───── Track Status ◄─── Generate Tracking ID          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Admin User Flow**
```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN USER FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Admin Login                                                │
│    │                                                       │
│    ▼                                                       │
│  Admin Dashboard                                            │
│    │                                                       │
│    ├── View Complaints ──► Department Filtered List        │
│    │                                                       │
│    ├── Assign Complaints ─► Department User Selection      │
│    │        │                      │                     │
│    │        └──────────────────────▼                     │
│    │                          Update Assignment           │
│    │                                                       │
│    ├── Update Status ─────► Status Change Interface       │
│    │        │                      │                     │
│    │        └──────────────────────▼                     │
│    │                          Update Database             │
│    │                                                       │
│    └── Generate Reports ──► Analytics Dashboard           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Department User Flow**
```
┌─────────────────────────────────────────────────────────────┐
│                 DEPARTMENT USER FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Department Login                                           │
│    │                                                       │
│    ▼                                                       │
│  Department Dashboard                                       │
│    │                                                       │
│    ├── View Assigned ─────► Personal Complaint Queue       │
│    │                                                       │
│    ├── Process Complaints ─► Update Status Interface       │
│    │        │                      │                     │
│    │        └──────────────────────▼                     │
│    │                          Add Resolution Notes        │
│    │                              │                       │
│    └── Communicate ◄──────────────▼                       │
│                    Update Database                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ **File Structure**

```
grs-webapp/
├── app/                          # Next.js 14 App Directory
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts    # Login endpoint
│   │   │   └── register/route.ts # Registration endpoint
│   │   ├── complaints/
│   │   │   ├── route.ts          # CRUD operations
│   │   │   └── [id]/
│   │   │       ├── route.ts      # Individual complaint
│   │   │       └── assign/route.ts # Assignment endpoint
│   │   ├── departments/route.ts   # Department management
│   │   └── users/
│   │       └── department-users/route.ts
│   │
│   ├── admin/                    # Admin Pages
│   │   ├── dashboard/page.tsx    # Admin dashboard
│   │   └── login/page.tsx        # Admin login
│   │
│   ├── department/               # Department Pages
│   │   ├── dashboard/page.tsx    # Department dashboard
│   │   └── login/page.tsx        # Department login
│   │
│   ├── user/                     # Citizen Pages
│   │   └── dashboard/page.tsx    # Citizen dashboard
│   │
│   ├── complaint/page.tsx        # Complaint filing form
│   ├── login/page.tsx           # Citizen login
│   ├── register/page.tsx        # Citizen registration
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
│
├── src/                         # Source Code
│   └── lib/
│       ├── postgres.ts          # Database connection
│       └── utils.ts             # Utility functions
│
├── components/                  # React Components
│   ├── LoginPageLayout.tsx      # Shared login layout
│   └── error-boundary.tsx       # Error handling
│
├── contexts/                    # React Contexts
│   └── auth-context.tsx         # Authentication context
│
├── .env.local                   # Environment variables
├── package.json                 # Dependencies
├── tailwind.config.js           # Styling configuration
└── tsconfig.json               # TypeScript configuration
```

---

## 🔍 **API Endpoints**

### **Authentication Endpoints**
```
POST /api/auth/login
├── Body: { email, password }
├── Response: { token, user }
└── Purpose: User authentication

POST /api/auth/register  
├── Body: { name, email, phone, password }
├── Response: { message, user }
└── Purpose: User registration
```

### **Complaints Endpoints**
```
GET /api/complaints
├── Query: page, limit, status, department, assigned_to
├── Headers: Authorization Bearer Token
├── Response: { complaints[], pagination }
└── Purpose: Fetch complaints (role-filtered)

POST /api/complaints
├── Body: { title, description, department, category, ... }
├── Response: { complaint, tracking_id }
└── Purpose: Create new complaint

PATCH /api/complaints/[id]
├── Body: { status, admin_reply, assigned_to }
├── Response: { updated_complaint }
└── Purpose: Update complaint

PATCH /api/complaints/[id]/assign
├── Body: { assigned_to }
├── Headers: Authorization Bearer Token  
├── Response: { updated_complaint }
└── Purpose: Assign complaint to department user
```

### **User Management Endpoints**
```
GET /api/users/department-users
├── Headers: Authorization Bearer Token
├── Response: { users[] }
└── Purpose: Fetch department users for assignment

GET /api/departments
├── Response: { departments[] }
└── Purpose: Fetch all departments
```

---

## 🔒 **Security Features**

### **Authentication Security**
```
┌─────────────────────────────────┐
│        SECURITY MEASURES        │
├─────────────────────────────────┤
│ • JWT Token Authentication      │
│ • bcrypt Password Hashing       │
│ • Role-based Access Control     │
│ • Route Protection Middleware   │
│ • Environment Variable Secrets  │
│ • SQL Injection Prevention      │
│ • XSS Protection               │
└─────────────────────────────────┘
```

### **Data Protection**
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role Validation**: Server-side role checking
- **Input Sanitization**: Zod schema validation
- **Database Security**: Parameterized queries

---

## 📊 **Performance Optimization**

### **Frontend Optimizations**
- **Next.js 14 App Router**: Server-side rendering
- **Component Optimization**: Memoization for stability
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js built-in optimization

### **Backend Optimizations**
- **Connection Pooling**: PostgreSQL connection pool
- **Database Indexing**: Primary keys and foreign keys
- **API Response Caching**: Appropriate cache headers
- **Pagination**: Limit database query results

---

## 🧪 **Testing Strategy**

### **Manual Testing Scenarios**
1. **User Authentication Flow**
2. **Complaint CRUD Operations** 
3. **Role-based Access Control**
4. **Department Assignment Workflow**
5. **Data Persistence Verification**
6. **Cross-browser Compatibility**

### **Database Testing**
```sql
-- Test Data Integrity
SELECT COUNT(*) FROM complaints WHERE tracking_id IS NULL;

-- Test Role Assignment
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Test Department Relations
SELECT d.name, COUNT(c.id) as complaint_count 
FROM departments d 
LEFT JOIN complaints c ON d.id = c.department_id 
GROUP BY d.name;
```

---

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                 DEPLOYMENT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development Environment                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Docker Compose                                     │   │
│  │  ├── PostgreSQL Container (Port 5433)              │   │
│  │  ├── Adminer Container (Port 8080)                 │   │
│  │  └── Next.js Dev Server (Port 3000)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Production Environment (Recommended)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Load Balancer (Nginx/Apache)                      │   │
│  │  ├── Next.js Production Build                       │   │
│  │  ├── PostgreSQL Database Server                     │   │
│  │  ├── Redis Cache (Optional)                         │   │
│  │  └── File Storage (AWS S3/Azure Blob)               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 **Future Enhancements**

### **Phase 2 Features**
- [ ] **File Attachments**: Image/document upload for complaints
- [ ] **Real-time Notifications**: WebSocket-based updates
- [ ] **SMS/Email Notifications**: Automated status updates  
- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced Analytics**: Dashboard with charts and reports
- [ ] **Multi-language Support**: Internationalization
- [ ] **API Rate Limiting**: Prevent API abuse

### **Phase 3 Features**  
- [ ] **AI-powered Categorization**: Auto-categorize complaints
- [ ] **Chatbot Integration**: Automated first-line support
- [ ] **GIS Integration**: Location-based complaint mapping
- [ ] **Blockchain Audit Trail**: Immutable complaint history
- [ ] **Advanced Search**: Full-text search capabilities
- [ ] **Integration APIs**: Third-party system integrations

---

## 🏁 **Conclusion**

The Grievance Redressal System is a comprehensive, scalable solution for digital complaint management. It successfully implements:

✅ **Multi-role Architecture** with proper access control  
✅ **Secure Authentication** using JWT tokens  
✅ **Efficient Database Design** with normalized relations  
✅ **Modern Tech Stack** with Next.js 14 and PostgreSQL  
✅ **Docker-based Infrastructure** for easy deployment  
✅ **Role-based Dashboards** for all user types  
✅ **Complete Complaint Lifecycle** from filing to resolution

The system is production-ready with room for future enhancements and scalability improvements.

---

**📞 Support & Maintenance**
- Regular security updates
- Database backup strategies
- Performance monitoring
- User feedback integration
- Continuous feature development

