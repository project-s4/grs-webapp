# Grievance Redressal Portal

A full-stack grievance redressal portal built with Next.js, Tailwind CSS, and MongoDB, similar to CPGRAMS (Centralized Public Grievance Redress and Monitoring System).

## Features

### 🏠 Public Portal
- **Complaint Submission**: Easy-to-use form for citizens to submit grievances
- **Complaint Tracking**: Real-time status tracking using unique tracking IDs
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

### 🔐 Admin Dashboard
- **Secure Authentication**: JWT-based admin login system
- **Complaint Management**: View, filter, and manage all complaints
- **Status Updates**: Change complaint status (Pending/In Progress/Resolved)
- **Official Replies**: Add administrative responses to complaints
- **Advanced Filtering**: Filter by department, category, and status

### 🗄️ Backend Features
- **RESTful API**: Complete API endpoints for all operations
- **MongoDB Integration**: Scalable database with Mongoose ODM
- **Auto-generated IDs**: Unique tracking IDs for each complaint
- **Data Validation**: Comprehensive input validation and error handling

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Deployment**: Ready for Vercel/Netlify

## Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grievance-redressal-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Start MongoDB locally: `mongod`
   - Or use MongoDB Atlas (cloud service)
   - Create database: `cpgrams`

4. **Environment Variables** (optional)
   Create `.env.local` file:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/cpgrams
   JWT_SECRET=your-secret-key-here
   ```

5. **Set up admin user**
   ```bash
   node scripts/setup-admin.js
   ```
   This creates default admin credentials:
   - Username: `admin`
   - Password: `admin123`

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Citizens

1. **Submit a Complaint**
   - Visit the homepage
   - Click "File Complaint"
   - Fill out the form with your details
   - Submit and receive a tracking ID

2. **Track Your Complaint**
   - Use the tracking ID from your submission
   - Enter it on the homepage or tracking page
   - View current status and any official replies

### For Administrators

1. **Access Dashboard**
   - Go to `/admin` and login with credentials
   - View complaint statistics and manage grievances

2. **Manage Complaints**
   - Filter complaints by various criteria
   - Update status and add official replies
   - Monitor complaint resolution progress

## API Endpoints

### Complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - List complaints (with filters)
- `GET /api/complaints/:id` - Get specific complaint
- `PATCH /api/complaints/:id` - Update complaint status/reply

### Tracking
- `GET /api/complaints/track?trackingId=XXX` - Track complaint by ID

### Authentication
- `POST /api/auth/login` - Admin login

## Database Schema

### Complaint Model
```typescript
{
  trackingId: string,      // Auto-generated unique ID
  name: string,            // Complainant name
  email: string,           // Complainant email
  department: string,      // Department concerned
  category: string,        // Complaint category
  description: string,     // Detailed description
  status: string,          // Pending/In Progress/Resolved
  dateFiled: Date,         // Submission date
  adminReply?: string,     // Official response
  updatedAt: Date          // Last update timestamp
}
```

### Admin Model
```typescript
{
  username: string,        // Admin username
  password: string,        // Hashed password
  email: string,          // Admin email
  createdAt: Date         // Account creation date
}
```

## Project Structure

```
grievance-redressal-portal/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── complaint/         # Complaint form
│   ├── track/             # Tracking pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── lib/                   # Utility functions
│   ├── mongodb.ts         # Database connection
│   └── utils.ts           # Helper functions
├── models/                # Database models
│   ├── Complaint.ts       # Complaint schema
│   └── Admin.ts           # Admin schema
├── scripts/               # Setup scripts
│   └── setup-admin.js     # Admin user creation
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
└── README.md              # This file
```

## Customization

### Adding New Departments
Edit `lib/utils.ts`:
```typescript
export const departments = [
  'Education',
  'Healthcare',
  'Transportation',
  // Add your departments here
];
```

### Adding New Categories
Edit `lib/utils.ts`:
```typescript
export const categories = [
  'Infrastructure',
  'Service Delivery',
  // Add your categories here
];
```

### Styling
- Modify `tailwind.config.js` for theme customization
- Edit `app/globals.css` for custom CSS classes

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy automatically

### Other Platforms
- **Netlify**: Use `npm run build` and deploy `out` folder
- **Docker**: Create Dockerfile for containerized deployment
- **Self-hosted**: Use `npm run build` and `npm start`

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure admin sessions
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Built-in Next.js security
- **Environment Variables**: Secure configuration management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

## Roadmap

- [ ] Email notifications
- [ ] File attachments
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Multi-language support
- [ ] SMS notifications
- [ ] Escalation system

---

**Built with ❤️ using Next.js, Tailwind CSS, and MongoDB**
