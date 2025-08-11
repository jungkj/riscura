# Production Environment Requirements

## Required Environment Variables

The following environment variables MUST be set in production (Vercel or your hosting platform):

### Core Authentication
```env
# NextAuth Configuration
NEXTAUTH_URL=https://riscura.app
NEXTAUTH_SECRET=[generate-secure-secret]  # Use: openssl rand -base64 32

# JWT Configuration  
JWT_ACCESS_SECRET=[generate-secure-secret]  # Use: openssl rand -base64 32
```

### Database
```env
# PostgreSQL (Supabase)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

### Optional (but recommended)
```env
# Google OAuth (if using OAuth)
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]

# Redis (for caching)
REDIS_URL=redis://[host]:[port]

# OpenAI (for AI features)
OPENAI_API_KEY=[your-openai-api-key]

# Email Service
SENDGRID_API_KEY=[your-sendgrid-api-key]
```


## Verification Checklist

### 1. Environment Variables on Vercel
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Ensure all required variables are set for Production environment
- [ ] NEXTAUTH_URL must match your production domain exactly
- [ ] NEXTAUTH_SECRET and JWT_ACCESS_SECRET must be secure random strings
- [ ] DATABASE_URL and DIRECT_URL must point to your production database

### 2. Database Connection
- [ ] Verify DATABASE_URL is correctly formatted
- [ ] Ensure connection pooling is configured (pgbouncer=true)
- [ ] Test connection with: `npx prisma db pull` (locally with prod DATABASE_URL)

### 3. Authentication Flow
- [ ] `/api/auth/session-check` returns `{ authenticated: true }` after login
- [ ] `/api/auth/session` returns user session (not 500)
- [ ] Login with credentials works (use the admin@riscura.com account with password set in database)

### 4. Data Verification
- [ ] Run the production data setup script: `npx tsx src/scripts/fix-production-data.ts`
- [ ] This creates the admin@riscura.com user and placeholder data
- [ ] Verify `/api/dashboard` returns non-zero metrics
- [ ] Check `/api/risks?limit=1` returns at least one risk
- [ ] Check `/api/controls?limit=1` returns at least one control

## Common Issues and Solutions

### Issue: Session returns 500
**Solution:** 
- Check NEXTAUTH_SECRET is set
- Verify DATABASE_URL is correct
- Ensure Prisma client is generated in build

### Issue: Dashboard shows 0 counts
**Solution:**
- Run data alignment script
- Verify user has correct organizationId
- Check API endpoints return data

### Issue: Authentication fails
**Solution:**
- Verify NEXTAUTH_URL matches production URL
- Check JWT_ACCESS_SECRET is set
- Ensure database has user record

## Production Deployment Commands

```bash
# 1. Build and test locally with production-like environment
npm run build
npm run start

# 2. Deploy to Vercel
vercel --prod

# 3. After deployment, run data setup (if needed)
# Set DATABASE_URL to production database locally, then:
npx tsx src/scripts/fix-production-data.ts

# 4. Verify deployment
curl https://riscura.app/api/auth/session-check
curl https://riscura.app/api/dashboard
```

## Security Notes

1. **Never expose secrets** in logs or error messages
2. **Use strong secrets** for NEXTAUTH_SECRET and JWT_ACCESS_SECRET
3. **Enable HTTPS only** (handled by Vercel automatically)
4. **Implement rate limiting** (already configured in middleware)
5. **Change default passwords** after initial setup

## Support

If issues persist after following this guide:
1. Check Vercel Function logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure database migrations are up to date
4. Test with the minimal authentication flow first