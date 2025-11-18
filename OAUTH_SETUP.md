# OAuth Provider Setup Guide

## Error: "Unsupported provider: provider is not enabled"

This error means the OAuth providers (GitHub and/or Google) need to be enabled in your Supabase Dashboard.

## Steps to Enable OAuth Providers

### 1. Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox

### 2. Navigate to Authentication Settings
- Click on **"Authentication"** in the left sidebar
- Click on **"Providers"** tab

### 3. Enable GitHub OAuth

1. Find **"GitHub"** in the providers list
2. Toggle it **ON**
3. You'll need to create a GitHub OAuth App:
   - Go to: https://github.com/settings/developers
   - Click **"New OAuth App"**
   - Fill in:
     - **Application name**: Grievance Redressal System (or any name)
     - **Homepage URL**: `https://hwlngdpexkgbtrzatfox.supabase.co`
     - **Authorization callback URL**: 
     - For Supabase: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
     - This is the Supabase callback URL that Supabase will handle, then redirect to your app
   - Click **"Register application"**
   - Copy the **Client ID** and **Client Secret**
   - Paste them into Supabase GitHub provider settings
4. Click **"Save"** in Supabase

### 4. Enable Google OAuth

1. Find **"Google"** in the providers list
2. Toggle it **ON**
3. You'll need to create a Google OAuth App:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click **"Create Credentials"** > **"OAuth client ID"**
   - If prompted, configure OAuth consent screen first
   - Application type: **"Web application"**
   - Name: Grievance Redressal System
   - Authorized redirect URIs: 
     - `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local development)
   - Click **"Create"**
   - Copy the **Client ID** and **Client Secret**
   - Paste them into Supabase Google provider settings
4. Click **"Save"** in Supabase

### 5. Configure Redirect URLs in Supabase (CRITICAL!)

You need to configure where Supabase redirects after OAuth callback:

1. Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/url-configuration
2. Under **"Redirect URLs"**, add:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback` (replace with your actual domain)

**Important Notes:**
- The GitHub/Google OAuth app callback should be: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` (Supabase handles this)
- Your app callback (what we configure above) is: `http://localhost:3000/auth/callback` or your production domain
- Supabase will redirect from `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback` → your app's `/auth/callback`

**Flow:**
1. User clicks "Sign in with GitHub" → GitHub OAuth
2. GitHub redirects to → `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
3. Supabase processes OAuth → redirects to → `http://localhost:3000/auth/callback` (your app)
4. Your app creates user profile and redirects to dashboard

## Testing

Once enabled:
1. Restart your frontend application
2. Try signing in with GitHub or Google
3. You should be redirected to the OAuth provider's login page

## Troubleshooting

- **"Redirect URI mismatch"**: Make sure the redirect URL in your OAuth app matches exactly what's in Supabase
- **"Invalid client"**: Double-check your Client ID and Secret
- **"Provider not enabled"**: Make sure you clicked "Save" after enabling the provider

