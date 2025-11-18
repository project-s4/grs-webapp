# OAuth Troubleshooting Guide

## Error: "Unable to exchange external code: server_error"

This error means Supabase received the OAuth code from Google/GitHub but couldn't exchange it for an access token. This is usually a configuration issue.

### Common Causes:

1. **Incorrect Client Secret** - The Client Secret in Supabase doesn't match your OAuth app
2. **Code Already Used** - OAuth codes are single-use and expire quickly
3. **Mismatched Client ID** - The Client ID in Supabase doesn't match your OAuth app

### Fix Steps:

#### 1. Verify Client Secret in Supabase

1. Go to: https://supabase.com/dashboard/project/hwlngdpexkgbtrzatfox/authentication/providers
2. For **GitHub** provider:
   - Check that Client ID matches your GitHub OAuth App
   - Re-enter the Client Secret (copy fresh from GitHub)
   - Click "Save"
3. For **Google** provider:
   - Check that Client ID matches your Google OAuth App
   - Re-enter the Client Secret (copy fresh from Google)
   - Click "Save"

#### 2. Verify OAuth App Configuration

**GitHub:**
1. Go to: https://github.com/settings/developers
2. Click on your OAuth App
3. Verify "Client ID" matches what's in Supabase
4. Click "Regenerate client secret" to get a fresh secret
5. Copy the new secret and update it in Supabase

**Google:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Verify "Client ID" matches what's in Supabase
4. If needed, reset the client secret (or create a new one)
5. Copy the secret and update it in Supabase

#### 3. Verify Callback URL is Correct

Make sure your OAuth apps have the correct callback URL:
- **GitHub/Google OAuth App:** `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- **Supabase Redirect URLs:** `https://grievancego.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`

### Quick Fix Checklist:

- [ ] Go to Supabase > Authentication > Providers
- [ ] For GitHub: Verify Client ID, re-enter Client Secret, Save
- [ ] For Google: Verify Client ID, re-enter Client Secret, Save
- [ ] Verify OAuth app callback URL is exactly: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`
- [ ] Try signing in again (OAuth codes are single-use, so you'll need a fresh attempt)

### If Still Not Working:

1. **Double-check Client Secrets:**
   - Make sure there are no extra spaces or newlines when copying
   - Try regenerating the secret in GitHub/Google and updating Supabase

2. **Check OAuth App Status:**
   - Make sure your OAuth app is active/not deleted
   - For Google, make sure OAuth consent screen is configured

3. **Test with Fresh Code:**
   - Close browser and try again (old codes expire)
   - Try in incognito/private window

## Other Common Errors

### Error: "provider is not enabled"
- **Fix:** Enable the provider in Supabase > Authentication > Providers

### Error: "redirect_uri_mismatch"
- **Fix:** Make sure callback URL in OAuth app is exactly: `https://hwlngdpexkgbtrzatfox.supabase.co/auth/v1/callback`

### Error: "invalid_client"
- **Fix:** Client ID or Secret is incorrect - verify in both Supabase and OAuth app

### Error: "code expired" or "invalid_grant"
- **Fix:** OAuth codes expire quickly - just try signing in again

