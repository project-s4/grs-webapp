# OAuth Callback URLs Configuration

## Production URL
**App URL:** https://grievancego.vercel.app/

## Required Callback URLs

### 1. In Supabase Dashboard (Required!)
**Location:** https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/url-configuration

Add these redirect URLs:
- `http://localhost:3000/auth/callback` (for local development)
- `https://grievancego.vercel.app/auth/callback` (for production)

### 2. In GitHub OAuth App
**Location:** https://github.com/settings/developers

**Authorization callback URL (MUST MATCH EXACTLY):**
- `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`

⚠️ **CRITICAL:** This must match EXACTLY. Common mistakes:
- Missing `https://`
- Missing `/auth/v1/callback` at the end
- Extra trailing slash
- Wrong project reference

### 3. In Google OAuth App  
**Location:** https://console.cloud.google.com/apis/credentials

**Authorized redirect URIs (add both):**
- `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` (REQUIRED - this is what Supabase sends)
- `http://localhost:3000/auth/callback` (optional, for local testing only)

⚠️ **CRITICAL:** The Supabase callback URL (`https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`) MUST be in the list. This is the redirect_uri that Supabase sends to Google/GitHub.

## Important Notes

- The GitHub/Google OAuth apps redirect to **Supabase's callback URL** (`https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`)
- Supabase then redirects to **your app's callback URL** (`https://grievancego.vercel.app/auth/callback` or `http://localhost:3000/auth/callback`)
- Your app's callback route is at: `/app/auth/callback/route.ts`
- The callback route automatically detects the origin, so it works for both local and production

## Quick Setup Checklist

- [ ] Enabled GitHub OAuth provider in Supabase
- [ ] Enabled Google OAuth provider in Supabase
- [ ] Added `http://localhost:3000/auth/callback` to Supabase redirect URLs
- [ ] Added `https://grievancego.vercel.app/auth/callback` to Supabase redirect URLs
- [ ] Created GitHub OAuth App with **exact** callback: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- [ ] Created Google OAuth App with **exact** callback: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- [ ] Added GitHub Client ID and Secret to Supabase
- [ ] Added Google Client ID and Secret to Supabase

## Troubleshooting: redirect_uri_mismatch Error

If you see **"Error 400: redirect_uri_mismatch"**, it means the redirect URI in your OAuth app doesn't match what Supabase is sending.

### Fix Steps:

1. **Check GitHub OAuth App:**
   - Go to: https://github.com/settings/developers
   - Click on your OAuth App
   - Verify "Authorization callback URL" is EXACTLY: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
   - No trailing slash, no typos
   - Click "Update application"

2. **Check Google OAuth App:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", make sure you have: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
   - Click "Save"

3. **Verify in Supabase:**
   - Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
   - Check that GitHub/Google providers are enabled
   - Verify Client ID and Secret are correct

### Common Mistakes:
- ❌ `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback/` (trailing slash)
- ❌ `http://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` (http instead of https)
- ❌ `https://hwlngdpexkgbtrzatfox.supabase.co/auth/callback` (missing /v1)
- ✅ `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` (CORRECT)

