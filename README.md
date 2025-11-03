# Grievance Redressal System - Web Application

Next.js web application for citizens, departments, and administrators to manage grievances.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   BACKEND_URL=http://localhost:8001
   AI_SERVICE_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

Application runs on: `http://localhost:3000`

## Features

### For Citizens
- File complaints with AI-powered categorization
- Track complaint status
- View complaint history
- User dashboard

### For Departments
- Department login
- View assigned complaints
- Update complaint status
- Add responses

### For Administrators
- Admin dashboard with analytics
- Manage all complaints
- User management
- Department management
- Advanced filtering and search

## Project Structure

```
app/
├── api/              # API routes (proxies to backend)
├── admin/           # Admin pages
├── dashboard/        # User dashboard
├── department/       # Department pages
├── grievances/      # Complaint pages
└── login/           # Authentication pages

components/          # Reusable components
contexts/           # React contexts
lib/                # Utility functions
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Other Platforms
- Ensure `BACKEND_URL` and `AI_SERVICE_URL` are set correctly
- Build: `npm run build`
- Start: `npm start`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BACKEND_URL` | Backend API URL | Yes |
| `AI_SERVICE_URL` | AI Service URL | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | No |

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Context** - State management

## API Integration

The webapp proxies API requests to the backend service. See `app/api/` for proxy routes.
