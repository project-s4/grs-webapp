# OAuth Fix Guide - Resolving Current Issues

## Current Issues Identified

Based on Supabase Auth logs, the following OAuth issues need to be fixed:

1. **GitHub OAuth**: `"incorrect_client_credentials"` - Client Secret is incorrect
2. **Google OAuth**: `"invalid_client"` - Client Secret is incorrect  
3. **OAuth State Parameter Missing**: Callback is being accessed directly (not an issue, but handled)

## Fix Steps

### Step 1: Fix GitHub OAuth Credentials

1. **Go to GitHub OAuth App:**
   - Visit: https://github.com/settings/developers
   - Click on your OAuth App

2. **Get Fresh Client Secret:**
   - If you don't see the Client Secret, click **"Regenerate client secret"**
   - **IMPORTANT:** Copy the Client Secret immediately (it's shown only once!)

3. **Update in Supabase:**
   - Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
   - Click on **GitHub** provider
   - Paste the **Client Secret** you just copied from GitHub
   - Verify the **Client ID** matches your GitHub OAuth App
   - Click **Save**

4. **Verify Callback URL:**
   - Make sure GitHub OAuth App callback URL is: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
   - No trailing slash, exact match

### Step 2: Fix Google OAuth Credentials

1. **Go to Google OAuth App:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Click on your OAuth 2.0 Client ID

2. **Get Client Secret:**
   - If you don't see the Client Secret, you may need to:
     - Click **"Reset secret"** (if available)
     - OR create a new Client ID and Secret

3. **Update in Supabase:**
   - Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
   - Click on **Google** provider
   - Paste the **Client Secret** from Google
   - Verify the **Client ID** matches your Google OAuth App
   - Click **Save**

4. **Verify Redirect URIs:**
   - Make sure Google OAuth App has these **Authorized redirect URIs**:
     - `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` (REQUIRED)
     - `http://localhost:3000/auth/callback` (optional, for local dev)

### Step 3: Verify Supabase Redirect URLs

1. **Go to Supabase URL Configuration:**
   - Visit: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/url-configuration

2. **Verify Redirect URLs are set:**
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://grievancego.vercel.app/auth/callback` (for production)

3. **If missing, add them:**
   - Click **"Add URL"**
   - Add each URL one at a time
   - Click **Save**

### Step 4: Test OAuth

1. **Wait 1-2 minutes** after updating credentials (for propagation)

2. **Test GitHub OAuth:**
   - Go to: https://grievancego.vercel.app/login
   - Click **"Sign in with GitHub"**
   - Should redirect to GitHub, then back to app

3. **Test Google OAuth:**
   - Go to: https://grievancego.vercel.app/login
   - Click **"Sign in with Google"**
   - Should redirect to Google, then back to app

## Quick Checklist

- [ ] Regenerated GitHub Client Secret
- [ ] Updated GitHub Client Secret in Supabase
- [ ] Verified GitHub Client ID matches in Supabase
- [ ] Updated Google Client Secret in Supabase  
- [ ] Verified Google Client ID matches in Supabase
- [ ] Verified Supabase redirect URLs include production URL
- [ ] Tested GitHub OAuth login
- [ ] Tested Google OAuth login

## Common Mistakes to Avoid

❌ **Don't copy Client Secret with extra spaces or newlines**
❌ **Don't mix up Client ID and Client Secret**  
❌ **Don't forget to click "Save" in Supabase after updating**
❌ **Don't test immediately** - wait 1-2 minutes for propagation
❌ **Don't use old/invalid Client Secrets**

✅ **Copy Client Secret exactly as shown**
✅ **Verify Client ID matches in both places**
✅ **Always click "Save" after updating**
✅ **Wait 1-2 minutes before testing**
✅ **Use fresh Client Secrets (regenerate if unsure)**

## After Fixing

Once credentials are updated:
- OAuth should work within 1-2 minutes
- Users should be able to sign in with GitHub/Google
- Errors should disappear from logs

If issues persist after following these steps:
1. Double-check Client IDs match exactly
2. Regenerate Client Secrets and try again
3. Verify callback URLs are exactly correct
4. Check Supabase logs for any new errors

