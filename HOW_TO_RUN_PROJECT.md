# 🚀 How to Run Grievance Redressal System

## 📋 **Prerequisites**

Before running the project, make sure you have:
- ✅ **Node.js** installed (version 16 or higher)
- ✅ **Docker Desktop** installed and running
- ✅ **Git** (if cloning from repository)

---

## 🗂️ **Project Structure**

Your project is a **Next.js full-stack application** with:
- **Frontend**: React/Next.js (runs in browser)
- **Backend**: Next.js API routes (runs with same server)
- **Database**: PostgreSQL (runs in Docker container)
- **Database Admin**: Adminer (runs in Docker container)

---

## 🛠️ **Step-by-Step Setup**

### **Step 1: Navigate to Project Directory**
```bash
cd C:\Users\sathw\Desktop\project\grs-webapp
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Start Database (PostgreSQL + Adminer)**
```bash
docker-compose up -d
```

**What this does:**
- Starts PostgreSQL database on port 5433
- Starts Adminer (database admin) on port 8080
- Creates database tables automatically
- Runs in background (`-d` flag)

**Verify database is running:**
```bash
docker ps
```
You should see both `grievance_postgres` and `grievance_adminer` containers running.

### **Step 4: Start Next.js Application (Frontend + Backend)**
```bash
npm run dev
```

**What this does:**
- Starts Next.js development server
- Runs on http://localhost:3000
- Includes both frontend and backend API routes
- Automatically connects to database
- Hot reloads on code changes

---

## 🌐 **Access Your Application**

### **Main Application**
- **URL**: http://localhost:3000
- **Description**: Main web application

### **Database Admin Panel** 
- **URL**: http://localhost:8080
- **Server**: `grievance_postgres`
- **Username**: `postgres`
- **Password**: `password`
- **Database**: `grievance_portal`

---

## 🎯 **Testing the Application**

### **1. Create Test Data (Optional)**
```bash
node scripts/add-test-complaints.js
```
This creates sample users and complaints for testing.

### **2. Register a New User**
1. Go to http://localhost:3000
2. Click "Sign up" or go to `/register`
3. Create a citizen account
4. Login with your new credentials

### **3. Test Login with Existing Users**
From the database, you can login with:
- Email: `test@example.com` (if test data was created)
- Email: `sathwiksathwikbn321@gmail.com` (existing user)

### **4. File a Complaint**
1. Login as citizen
2. Go to "File New Complaint" 
3. Fill out the form
4. Submit and get tracking ID

### **5. Test Admin Dashboard**
1. Go to http://localhost:3000/admin/login
2. Login with admin credentials
3. View and manage complaints

---

## 🏃‍♂️ **Quick Start Commands**

### **Start Everything:**
```bash
# Terminal 1: Start database
docker-compose up -d

# Terminal 2: Start application  
npm run dev
```

### **Stop Everything:**
```bash
# Stop application: Ctrl+C in terminal

# Stop database
docker-compose down
```

### **Restart Database:**
```bash
docker-compose restart
```

### **View Database:**
```bash
# Check container status
docker ps

# View database logs
docker logs grievance_postgres
```

---

## 🔧 **Troubleshooting**

### **Problem: Database Connection Failed**
```bash
# Check if Docker is running
docker --version

# Restart database containers
docker-compose down
docker-compose up -d

# Wait 10 seconds for database to initialize
# Then restart Next.js: Ctrl+C and npm run dev
```

### **Problem: Port Already in Use**
```bash
# Check what's using port 3000
netstat -an | findstr ":3000"

# Kill Node.js processes
taskkill /f /im node.exe

# Try running again
npm run dev
```

### **Problem: Login Not Working**
```bash
# Add test data
node scripts/add-test-complaints.js

# Check database contents
curl http://localhost:3000/api/debug/complaints

# Or use Adminer: http://localhost:8080
```

### **Problem: Complaints Not Showing**
1. Make sure you're logged in as the correct user
2. Check browser console (F12) for errors
3. Verify complaints exist in database via Adminer
4. Check API logs in terminal

---

## 📁 **Important Files & Folders**

```
grs-webapp/
├── app/                    # Next.js App Router (Frontend pages)
│   ├── api/               # Backend API routes
│   ├── login/             # Login pages
│   ├── admin/             # Admin dashboard
│   ├── user/              # User dashboard
│   └── department/        # Department dashboard
├── src/
│   └── lib/              # Utility functions
├── docker-compose.yml     # Database configuration
├── package.json          # Dependencies
├── .env.local            # Environment variables
└── scripts/              # Utility scripts
```

---

## 🎪 **Application Features**

### **For Citizens:**
- Register/Login
- File complaints
- Track complaint status
- View complaint history

### **For Admins:**
- Login to admin dashboard
- View department complaints  
- Assign complaints to department staff
- Update complaint status

### **For Department Staff:**
- Login to department dashboard
- View assigned complaints
- Update complaint status
- Add resolution notes

---

## 🚨 **Important Notes**

1. **Always start database FIRST** with `docker-compose up -d`
2. **Then start the application** with `npm run dev`  
3. **Database must be running** for login/registration to work
4. **Use Ctrl+C** to stop the Next.js server
5. **Use `docker-compose down`** to stop database containers

---

## 📞 **Common URLs**

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:3000 | Web application |
| **Database Admin** | http://localhost:8080 | View/edit database |
| **API Debug** | http://localhost:3000/api/debug/complaints | Check data |

---

## ✅ **Success Indicators**

**Database Running Successfully:**
```
✔ Container grievance_postgres  Running
✔ Container grievance_adminer   Running
```

**Application Running Successfully:**
```
✓ Ready in 2.7s
- Local: http://localhost:3000
Connected to PostgreSQL database
Database initialized successfully
```

**Ready to Use When You See:**
- ✅ Database containers running
- ✅ Next.js compiled successfully  
- ✅ "Connected to PostgreSQL database" message
- ✅ Application accessible at http://localhost:3000
