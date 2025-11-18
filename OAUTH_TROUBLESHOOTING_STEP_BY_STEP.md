# OAuth Configuration Error - Step-by-Step Fix

## Error Message
"Unable to exchange OAuth code. This usually means the Client Secret in Supabase doesn't match your OAuth app."

## Root Cause
The Client Secret stored in Supabase Dashboard doesn't match the Client Secret in your GitHub/Google OAuth app. They must be EXACTLY the same.

## Fix Process (Do This For BOTH GitHub AND Google)

### PART A: Fix GitHub OAuth (Follow All Steps)

#### Step 1: Get Fresh GitHub Client Secret
1. **Go to:** https://github.com/settings/developers
2. **Click** on your OAuth App (or create new one if needed)
3. **Look for "Client secrets"** section
4. **If you see a secret:**
   - Copy it to a text file temporarily
   - Verify it's not cut off or has spaces
5. **If you DON'T see the secret or it's wrong:**
   - Click **"Regenerate client secret"** button
   - **IMPORTANT:** A new secret will appear - copy it IMMEDIATELY
   - Paste it somewhere safe (it's shown only once!)
6. **Also copy your Client ID** (it's visible at the top of the page)

#### Step 2: Verify GitHub Callback URL
Still on GitHub OAuth App page:
1. **Find "Authorization callback URL"** field
2. **It MUST be EXACTLY:**
   ```
   https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback
   ```
3. **Common mistakes:**
   - ❌ `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback/` (trailing slash)
   - ❌ `http://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` (http instead of https)
   - ❌ `https://hwlngdpexkgbtrzatfox.supabase.co/auth/callback` (missing /v1)
4. **If wrong, fix it and click "Update application"**

#### Step 3: Update in Supabase Dashboard
1. **Go to:** https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
2. **Click on "GitHub"** provider card
3. **In the form that opens:**
   - **Client ID (public):** Paste your GitHub Client ID
   - **Client secret (secret):** Paste your GitHub Client Secret
   - **IMPORTANT:** 
     - Make sure there are NO extra spaces
     - Make sure there are NO newlines
     - Copy/paste directly - don't retype
4. **Click "Save"** button
5. **Wait for confirmation** that it saved successfully

#### Step 4: Verify GitHub Provider is Enabled
1. Still on the providers page
2. Make sure **"GitHub"** toggle is **ON** (green/enabled)
3. If it's OFF, toggle it ON

---

### PART B: Fix Google OAuth (Follow All Steps)

#### Step 1: Get Fresh Google Client Secret
1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Select your project** (if you have multiple)
3. **Click** on your OAuth 2.0 Client ID
4. **In the popup/details:**
   - Find **"Client ID"** - copy this
   - Find **"Client secret"** - copy this
5. **If you DON'T see Client Secret or it's wrong:**
   - Click **"Reset secret"** or **"Create new secret"**
   - Copy the new secret immediately
   - Paste it somewhere safe

#### Step 2: Verify Google Redirect URIs
Still on Google OAuth Client page:
1. **Find "Authorized redirect URIs"** section
2. **You MUST have this EXACT URL:**
   ```
   https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback
   ```
3. **You can also have (optional for local dev):**
   ```
   http://localhost:3000/auth/callback
   ```
4. **If missing, click "Add URI"** and add: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
5. **Click "Save"**

#### Step 3: Update in Supabase Dashboard
1. **Go to:** https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
2. **Click on "Google"** provider card
3. **In the form that opens:**
   - **Client ID (public):** Paste your Google Client ID
   - **Client secret (secret):** Paste your Google Client Secret
   - **IMPORTANT:**
     - Make sure there are NO extra spaces
     - Make sure there are NO newlines
     - Copy/paste directly - don't retype
4. **Click "Save"** button
5. **Wait for confirmation** that it saved successfully

#### Step 4: Verify Google Provider is Enabled
1. Still on the providers page
2. Make sure **"Google"** toggle is **ON** (green/enabled)
3. If it's OFF, toggle it ON

---

### PART C: Verify Supabase Redirect URLs

1. **Go to:** https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/url-configuration
2. **Find "Redirect URLs"** section
3. **You MUST have these URLs:**
   - `http://localhost:3000/auth/callback`
   - `https://grievancego.vercel.app/auth/callback`
4. **If missing:**
   - Click **"Add URL"** or the **"+"** button
   - Add each URL one at a time
   - Click **"Save"**

---

### PART D: Wait and Test

1. **Wait 2-3 minutes** after saving (credentials need time to propagate)
2. **Clear your browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. **Test GitHub:**
   - Go to: https://grievancego.vercel.app/login
   - Click "Sign in with GitHub"
   - Should work now
4. **Test Google:**
   - Go to: https://grievancego.vercel.app/login
   - Click "Sign in with Google"
   - Should work now

---

## Common Mistakes (Double-Check These!)

### ❌ Wrong Client Secret Format
- **Problem:** Secret has extra spaces or newlines
- **Fix:** Copy the entire secret, paste directly without editing

### ❌ Wrong Client ID
- **Problem:** Client ID doesn't match between OAuth app and Supabase
- **Fix:** Copy Client ID from OAuth app and paste into Supabase

### ❌ Wrong Callback URL in OAuth App
- **Problem:** GitHub/Google OAuth app has wrong callback URL
- **Fix:** Must be EXACTLY: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`

### ❌ Provider Not Enabled
- **Problem:** Provider is disabled in Supabase
- **Fix:** Go to Providers page, toggle ON

### ❌ Missing Redirect URLs in Supabase
- **Problem:** Supabase doesn't know where to redirect after OAuth
- **Fix:** Add redirect URLs in URL Configuration page

### ❌ Testing Too Quickly
- **Problem:** Changes haven't propagated yet
- **Fix:** Wait 2-3 minutes after saving, then test

---

## Still Not Working?

If you've followed ALL steps above and it's still not working:

1. **Double-check Client Secrets:**
   - Go back to GitHub/Google
   - Regenerate secrets AGAIN
   - Copy them AGAIN
   - Paste into Supabase AGAIN
   - Make absolutely sure no spaces/newlines

2. **Verify Client IDs match:**
   - Compare Client ID in GitHub/Google OAuth app
   - Compare with Client ID in Supabase
   - They must be EXACTLY the same

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try OAuth login
   - Look for any error messages
   - Share those errors

4. **Check Supabase logs:**
   - Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/logs/edge-logs
   - Filter by "auth"
   - Look for recent OAuth errors
   - See what specific error is happening

---

## Quick Checklist

Do this for BOTH GitHub AND Google:

- [ ] Got fresh Client Secret from OAuth provider
- [ ] Copied Client Secret with NO spaces/newlines
- [ ] Verified Client ID matches in both places
- [ ] Updated Client Secret in Supabase Dashboard
- [ ] Clicked "Save" in Supabase
- [ ] Verified provider is ENABLED (toggle ON)
- [ ] Verified callback URL in OAuth app is correct
- [ ] Verified Supabase redirect URLs are set
- [ ] Waited 2-3 minutes after saving
- [ ] Cleared browser cache
- [ ] Tested OAuth login

---

## If All Else Fails

Create NEW OAuth apps:
1. **GitHub:** Create a completely new OAuth App
2. **Google:** Create a completely new OAuth 2.0 Client ID
3. Use the NEW Client IDs and Secrets
4. Update everything in Supabase
5. Test again

This ensures you're starting with fresh, correct credentials.

