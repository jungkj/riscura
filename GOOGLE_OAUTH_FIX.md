# Google OAuth Fix Instructions

## Issue
The Google OAuth login is failing with a 500 error because the NEXTAUTH_URL is misconfigured.

## Steps to Fix

### 1. Update Vercel Environment Variables

Go to your Vercel project settings and update:
- **NEXTAUTH_URL**: Change from `https://riscura.vercel.app` to `https://riscura.app`

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Click on your OAuth 2.0 Client ID
5. In "Authorized redirect URIs", add:
   - `https://riscura.app/api/auth/callback/google`
6. Remove the old URI if it exists:
   - `https://riscura.vercel.app/api/auth/callback/google`
7. Save the changes

### 3. Redeploy on Vercel

After updating the environment variable, you need to redeploy:
1. Go to your Vercel dashboard
2. Click on your project
3. Go to the "Deployments" tab
4. Click on the three dots menu on the latest deployment
5. Select "Redeploy"

### 4. Test

After redeployment completes:
1. Go to https://riscura.app
2. Try logging in with Google
3. It should now work correctly

## Additional Notes

- The error occurs because NextAuth uses NEXTAUTH_URL to construct callback URLs
- Google OAuth requires exact match of redirect URIs
- Always ensure your NEXTAUTH_URL matches your actual domain

## Environment Variables to Verify

Make sure these are set in Vercel:
- `NEXTAUTH_URL=https://riscura.app`
- `GOOGLE_CLIENT_ID` (your Google OAuth client ID)
- `GOOGLE_CLIENT_SECRET` (your Google OAuth client secret)
- `NEXTAUTH_SECRET` (for session encryption)