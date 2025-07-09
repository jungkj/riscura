# Required Environment Variables for Vercel

## Critical Missing Variable

Based on the errors, it appears the `DATABASE_URL` is not set in Vercel, which is causing the authentication system to fail during initialization.

## Required Environment Variables

Please ensure ALL of these are set in your Vercel project settings:

### 1. Database Connection (CRITICAL - Currently Missing)
```
DATABASE_URL="postgresql://postgres:Gynaha2pf!123@db.zggstcxinvxsfksssdyr.supabase.co:5432/postgres"
```

### 2. NextAuth Configuration (Already Set)
- ✅ `NEXTAUTH_URL` = `https://riscura.app`
- ✅ `NEXTAUTH_SECRET` = (your secret)

### 3. Google OAuth (Already Set)
- ✅ `GOOGLE_CLIENT_ID` = `548053257140-ss1e6ndmkvmgbvsc3k84593sqn963rc6.apps.googleusercontent.com`
- ✅ `GOOGLE_CLIENT_SECRET` = (your secret)

### 4. Other Required Variables
Check if these are set:
- `JWT_ACCESS_SECRET` - For JWT token signing
- `JWT_SECRET` - For JWT encryption
- `APP_URL` - Should be `https://riscura.app`

## How to Add DATABASE_URL in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your "riscura" project
3. Go to Settings → Environment Variables
4. Click "Add New"
5. Add:
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres:Gynaha2pf!123@db.zggstcxinvxsfksssdyr.supabase.co:5432/postgres`
   - Environment: All (Production, Preview, Development)
6. Click "Save"

## After Adding Environment Variables

1. Trigger a new deployment:
   ```bash
   git commit --allow-empty -m "Trigger deployment with DATABASE_URL"
   git push
   ```

2. Or redeploy from Vercel dashboard

## Test URLs After Deployment

1. Test minimal auth (no database): https://riscura.app/api/auth-test/providers
2. Test main auth: https://riscura.app/api/auth/providers
3. Test debug endpoint: https://riscura.app/api/auth/debug
4. Test OAuth flow: https://riscura.app/oauth-debug

The authentication system is failing because it cannot connect to the database. The code changes we made will help it fail more gracefully, but for full functionality, the DATABASE_URL must be set in Vercel.