# Complaint Page Troubleshooting Guide

If the complaint page (`/complaint`) is not opening, follow these steps:

## Quick Checks

### 1. **Are you logged in?**

The complaint page requires authentication. If you're not logged in:
- You'll be automatically redirected to `/login?redirect=/complaint`
- After logging in, you'll be redirected back to the complaint page

**Solution:** Make sure you're logged in as a citizen user.

### 2. **Is the backend server running?**

The complaint page needs the backend API to:
- Load departments
- Submit complaints

**Check:** Open http://localhost:8000/health in your browser
- ✅ Should show: `{"status": "ok"}`
- ❌ If you get "Connection refused" → Backend is not running

**Solution:** Start the backend server:
```bash
cd grs-backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. **Check Browser Console**

Open your browser's Developer Tools (F12) and check:
- **Console tab:** Look for JavaScript errors
- **Network tab:** Check if API requests are failing

Common errors:
- `ERR_CONNECTION_REFUSED` → Backend not running
- `401 Unauthorized` → Not logged in or token expired
- `500 Internal Server Error` → Backend error

### 4. **Clear Browser Cache**

Sometimes cached data can cause issues:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Clear cached images and files
3. Refresh the page (`Ctrl+F5` or `Cmd+Shift+R`)

### 5. **Check Authentication Token**

Open browser console and run:
```javascript
localStorage.getItem('token')
```

- ✅ Should return a JWT token string
- ❌ If `null` → You're not logged in

**Solution:** Log in again at `/login`

## Step-by-Step Debugging

### Step 1: Try Direct Access

1. Make sure you're logged in
2. Navigate directly to: http://localhost:3000/complaint
3. Check what happens:
   - ✅ Page loads → Great!
   - ❌ Redirects to login → You need to log in
   - ❌ Blank page → Check console for errors
   - ❌ Loading spinner forever → Check backend connection

### Step 2: Check Network Requests

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Refresh the complaint page
4. Look for failed requests (red):
   - `/api/departments` → Backend not running or API error
   - `/api/auth/me` → Authentication issue

### Step 3: Verify Backend Connection

Test the backend API directly:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test departments endpoint (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/departments
```

## Common Issues and Solutions

### Issue: "Page keeps redirecting to login"

**Cause:** Authentication token is invalid or expired

**Solution:**
1. Clear localStorage: `localStorage.clear()` in browser console
2. Log in again
3. Try accessing `/complaint` again

### Issue: "No departments available" error

**Cause:** Backend API not responding or departments not in database

**Solution:**
1. Check if backend is running
2. Check if departments exist in database
3. The page will still work - you can file a complaint manually

### Issue: "Connection refused" error

**Cause:** Backend server is not running

**Solution:**
```bash
cd grs-backend
python -m uvicorn app.main:app --reload --port 8000
```

### Issue: Page loads but form doesn't work

**Cause:** JavaScript errors or missing dependencies

**Solution:**
1. Check browser console for errors
2. Make sure Next.js dev server is running:
   ```bash
   cd grs-webapp
   npm run dev
   ```

## Alternative: Use Grievances Route

If `/complaint` doesn't work, try the alternative route:
- http://localhost:3000/grievances/new

This is another complaint filing page that might work better.

## Still Not Working?

1. **Check all services are running:**
   - ✅ Next.js frontend (port 3000)
   - ✅ FastAPI backend (port 8000)
   - ✅ Database connection

2. **Check logs:**
   - Backend terminal for API errors
   - Browser console for frontend errors
   - Network tab for failed requests

3. **Try in incognito/private mode:**
   - This eliminates cache/cookie issues

4. **Check user role:**
   - Complaint page is for `citizen` role
   - If you're logged in as `admin` or `department`, you'll be redirected

## Getting Help

If none of these solutions work, provide:
1. Browser console errors (screenshot or copy)
2. Network tab errors (screenshot)
3. Backend server logs
4. Steps you took to reproduce the issue

