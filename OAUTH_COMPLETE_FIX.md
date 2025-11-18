# OAuth Complete Fix Guide

## Current Status

✅ **Google OAuth**: Creating users in Supabase Auth successfully
❌ **GitHub OAuth**: Failing with "incorrect_client_credentials"
⚠️ **Both OAuth**: Failing at user profile verification step

## Issues Identified

1. **GitHub OAuth Client Secret Incorrect** - Need to update in Supabase
2. **Token Verification Failing** - Backend can't verify tokens properly
3. **404 on `/api/auth/verify`** - Backend route might not be deployed correctly
4. **"Multiple accounts with same email"** - Duplicate accounts in Supabase
5. **Users created in Supabase but not in local DB** - Profile creation not happening

## Fix Steps

### Step 1: Fix GitHub OAuth Credentials

1. Go to: https://github.com/settings/developers
2. Click your OAuth App
3. Click **"Regenerate client secret"**
4. Copy the new secret immediately
5. Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
6. Click **GitHub** provider
7. Paste the Client Secret (no spaces/newlines)
8. Verify Client ID matches
9. Click **Save**

### Step 2: Clean Up Duplicate Accounts in Supabase

The error "Multiple accounts with the same email address" means there are duplicate accounts:

1. Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/auth/users
2. Look for duplicate accounts with the same email
3. Delete the duplicate accounts (keep only one per email)
4. Or enable "Account Linking" in Supabase settings to merge accounts automatically

**To enable Account Linking:**
- Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/policies
- Or check Authentication settings for account linking options

### Step 3: Verify Backend URL in Vercel

The frontend needs to know where the backend is:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `grs-webapp`
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - `BACKEND_URL` = `https://grs-backend-l961.onrender.com`
   - `NEXT_PUBLIC_BACKEND_URL` = `https://grs-backend-l961.onrender.com` (for client-side)
5. Save and redeploy

### Step 4: Verify Backend Deployment

1. Check backend is live: https://grs-backend-l961.onrender.com/health
2. Should return: `{"status": "ok"}`
3. Test verify endpoint: https://grs-backend-l961.onrender.com/api/auth/verify
   - Should return 422 (validation error, not 404)

### Step 5: Verify Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/url-configuration
2. Ensure these URLs are in the list:
   - `http://localhost:3000/auth/callback`
   - `https://grievancego.vercel.app/auth/callback`
3. If missing, add them and click **Save**

### Step 6: Test OAuth Flow

After all fixes:

1. **Wait 2-3 minutes** for all changes to propagate
2. **Clear browser cache**
3. **Test Google OAuth:**
   - Go to: https://grievancego.vercel.app/login
   - Click "Sign in with Google"
   - Should redirect to Google → Supabase → App → Backend verification → Profile creation or dashboard
4. **Test GitHub OAuth:**
   - Go to: https://grievancego.vercel.app/login
   - Click "Sign in with GitHub"
   - Should redirect to GitHub → Supabase → App → Backend verification → Profile creation or dashboard

## Expected Flow

1. User clicks "Sign in with Google/GitHub"
2. Redirects to provider (Google/GitHub)
3. User authorizes
4. Provider redirects to: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
5. Supabase creates/updates user in Supabase Auth
6. Supabase redirects to: `https://grievancego.vercel.app/auth/callback?code=...`
7. Frontend callback route exchanges code for session
8. Frontend calls `/api/auth/verify` (Next.js API route)
9. Next.js API route calls backend `/api/auth/verify`
10. Backend verifies token with Supabase
11. Backend checks if user profile exists in local DB:
    - **If exists:** Returns user data → Redirect to dashboard
    - **If not exists:** Returns 404 → Redirect to `/register` → User creates profile → Redirect to dashboard

## Common Issues

### Issue: "Multiple accounts with same email"
**Fix:** Delete duplicate accounts in Supabase Auth > Users

### Issue: 404 on `/api/auth/verify`
**Fix:** 
- Verify backend is deployed: https://grs-backend-l961.onrender.com/health
- Check BACKEND_URL is set in Vercel environment variables
- Verify route is registered: `/api/auth/verify` should map to backend

### Issue: Token verification fails
**Fix:**
- Check backend logs for token verification errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set in backend environment variables

### Issue: User profile not created
**Fix:**
- After OAuth, user should be redirected to `/register` to create profile
- If not redirected, check callback route logic
- Verify `/api/auth/create-profile` endpoint works

## Verification Checklist

- [ ] GitHub Client Secret updated in Supabase
- [ ] Google Client Secret verified in Supabase
- [ ] Duplicate accounts cleaned up in Supabase
- [ ] Supabase redirect URLs include production URL
- [ ] BACKEND_URL set in Vercel environment variables
- [ ] Backend is live and responding
- [ ] Token verification working in backend
- [ ] Profile creation flow working
- [ ] Tested Google OAuth end-to-end
- [ ] Tested GitHub OAuth end-to-end

## After Fixes

Once all fixes are applied:
1. OAuth should work for both Google and GitHub
2. Users will be created in Supabase Auth
3. Users will be prompted to create profile if it doesn't exist
4. Users will be redirected to appropriate dashboard after login

