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
     - **Authorization callback URL**: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
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

### 5. Update Redirect URLs (Important!)

After enabling providers, make sure the redirect URLs are configured:

**For Production:**
- `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- Your production domain: `https://yourdomain.com/auth/callback`

**For Local Development:**
- `http://localhost:3000/auth/callback`

These should be set in:
- Supabase Dashboard > Authentication > URL Configuration > Redirect URLs
- Your OAuth app settings (GitHub/Google)

## Testing

Once enabled:
1. Restart your frontend application
2. Try signing in with GitHub or Google
3. You should be redirected to the OAuth provider's login page

## Troubleshooting

- **"Redirect URI mismatch"**: Make sure the redirect URL in your OAuth app matches exactly what's in Supabase
- **"Invalid client"**: Double-check your Client ID and Secret
- **"Provider not enabled"**: Make sure you clicked "Save" after enabling the provider

