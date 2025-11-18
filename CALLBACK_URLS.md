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

**Authorization callback URL:**
- `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`

### 3. In Google OAuth App  
**Location:** https://console.cloud.google.com/apis/credentials

**Authorized redirect URIs:**
- `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- `http://localhost:3000/auth/callback` (for local testing)

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
- [ ] Created GitHub OAuth App with callback: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- [ ] Created Google OAuth App with callback: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- [ ] Added GitHub Client ID and Secret to Supabase
- [ ] Added Google Client ID and Secret to Supabase

