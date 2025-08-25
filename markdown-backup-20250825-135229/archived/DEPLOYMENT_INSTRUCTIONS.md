# OAuth Deployment Instructions

## ✅ Code Changes Deployed
The following fixes have been deployed:
- Enhanced NextAuth route handler
- Fixed auth configuration
- Added _log endpoint
- Created debug endpoint
- Updated build-time environment handling

## ⚠️ Required: Update Vercel Environment Variables

You must update the following environment variable in your Vercel project settings:

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/dashboard

### 2. Select your project (riscura)

### 3. Go to Settings → Environment Variables

### 4. Update NEXTAUTH_URL
- Find `NEXTAUTH_URL` 
- Change value from `https://riscura.vercel.app` to `https://riscura.app`

### 5. Verify these are set:
- `GOOGLE_CLIENT_ID` - Should be set (starts with "548053257140-...")
- `GOOGLE_CLIENT_SECRET` - Should be set
- `NEXTAUTH_SECRET` - Should be set

### 6. Redeploy
After updating environment variables, you need to trigger a new deployment:
- Either click "Redeploy" in Vercel dashboard
- Or push an empty commit:
  ```bash
  git commit --allow-empty -m "Trigger deployment with updated env vars"
  git push
  ```

## Testing OAuth After Deployment

Once redeployed with correct environment variables:

1. Test the debug endpoint:
   ```bash
   curl https://riscura.app/api/auth/debug
   ```

2. Test OAuth endpoints:
   ```bash
   ./test-oauth-deployment.sh
   ```

3. Test Google OAuth flow:
   - Visit https://riscura.app/oauth-debug
   - Click "Sign in with Google"

## Current Status
- ✅ Code changes deployed
- ❌ Environment variables need updating in Vercel
- ❌ Redeployment needed after env var update

The 500 errors are occurring because the NEXTAUTH_URL doesn't match the actual domain. This must be fixed in Vercel's environment variables.