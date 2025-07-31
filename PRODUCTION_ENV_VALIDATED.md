# ✅ Production Environment Configuration for Vercel

## 🚀 EXACT .env.production for Vercel Deployment

Copy and paste this **EXACTLY** into your Vercel environment variables:

```bash
# ============================================================================
# DATABASE CONFIGURATION (Supabase PostgreSQL)
# ============================================================================
DATABASE_URL="[YOUR_SUPABASE_DATABASE_URL]"
DIRECT_URL="[YOUR_SUPABASE_DIRECT_URL]"

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="[YOUR_SUPABASE_URL]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SUPABASE_SERVICE_ROLE_KEY]"

# ============================================================================
# APPLICATION CONFIGURATION  
# ============================================================================
NEXTAUTH_URL="https://riscura.app"
APP_URL="https://riscura.app"
NODE_ENV="production"

# ============================================================================
# AUTHENTICATION SECRETS
# ============================================================================
JWT_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
JWT_ACCESS_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
JWT_REFRESH_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
SESSION_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
NEXTAUTH_SECRET="[GENERATE_WITH: openssl rand -base64 64]"

# ============================================================================
# ADDITIONAL SECURITY SECRETS (Required by env.ts validation)
# ============================================================================
CSRF_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
COOKIE_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
INTERNAL_API_KEY="[GENERATE_WITH: openssl rand -base64 64]"
WEBHOOK_SECRET="[GENERATE_WITH: openssl rand -base64 64]"
DATABASE_ENCRYPTION_KEY="[GENERATE_WITH: openssl rand -base64 64]"
FILE_ENCRYPTION_KEY="[GENERATE_WITH: openssl rand -base64 64]"
AI_ENCRYPTION_KEY="[GENERATE_WITH: openssl rand -base64 64]"

# ============================================================================
# GOOGLE OAUTH
# ============================================================================
GOOGLE_CLIENT_ID="[YOUR_GOOGLE_CLIENT_ID]"
GOOGLE_CLIENT_SECRET="[YOUR_GOOGLE_CLIENT_SECRET]"

# ============================================================================
# STRIPE CONFIGURATION (LIVE KEYS)
# ============================================================================
STRIPE_SECRET_KEY="[YOUR_STRIPE_SECRET_KEY]"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="[YOUR_STRIPE_PUBLISHABLE_KEY]"
STRIPE_WEBHOOK_SECRET="[YOUR_STRIPE_WEBHOOK_SECRET]"

# ============================================================================
# FEATURE FLAGS
# ============================================================================
MOCK_DATA="false"
DEBUG_MODE="false"
SKIP_EMAIL_VERIFICATION="false"
DEMO_MODE="false"
STRICT_PRODUCTION_MODE="true"
ENABLE_REAL_TIME="true"
ENABLE_AI_FEATURES="false"
ENABLE_BILLING="true"
ENABLE_REAL_TIME_COLLABORATION="true"
ENABLE_COLLABORATION="true"
ENABLE_EMAIL_NOTIFICATIONS="false"
ENABLE_SMS_NOTIFICATIONS="false"
ENABLE_SLACK_NOTIFICATIONS="false"
ENABLE_CSRF_PROTECTION="true"
ENABLE_RATE_LIMITING="true"
ENABLE_SECURITY_HEADERS="true"
ENABLE_2FA="false"
ENABLE_EMAIL_VERIFICATION="false"

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ALLOWED_ORIGINS="https://riscura.app,https://www.riscura.app,https://riscura.vercel.app,https://riscura-*.vercel.app"

# ============================================================================
# PERFORMANCE & OPTIMIZATION
# ============================================================================
DB_QUERY_LOGGING="false"
CACHE_TTL="3600"
ENABLE_COMPRESSION="true"
MAX_FILE_SIZE_MB="10"
BCRYPT_ROUNDS="10"
JWT_EXPIRES_IN="7d"
LOG_LEVEL="warn"

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================
CSP_REPORT_URI=""
CSP_REPORT_ONLY="false"
ENABLE_CSP_REPORTING="true"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="1000"
RATE_LIMIT_MAX="60"
RATE_LIMIT_WINDOW="900000"
AUTH_RATE_LIMIT_MAX="5"
AUTH_RATE_LIMIT_WINDOW="900000"
UPLOAD_RATE_LIMIT_MAX="10"
UPLOAD_RATE_LIMIT_WINDOW="3600000"
API_RATE_LIMIT_MAX="1000"
API_RATE_LIMIT_WINDOW="900000"
SESSION_COOKIE_SECURE="true"
SESSION_COOKIE_HTTPONLY="true"
SESSION_COOKIE_SAMESITE="lax"
HSTS_MAX_AGE="31536000"
HSTS_INCLUDE_SUBDOMAINS="true"
HSTS_PRELOAD="false"

# ============================================================================
# FILE UPLOAD CONFIGURATION
# ============================================================================
UPLOAD_MAX_SIZE="10485760"
UPLOAD_ALLOWED_TYPES="pdf,docx,xlsx,png,jpg,jpeg"
STORAGE_TYPE="local"
AWS_S3_REGION="us-east-1"

# ============================================================================
# EMAIL CONFIGURATION (Not configured - email features disabled)
# ============================================================================
SMTP_PORT="587"
SMTP_FROM="noreply@riscura.com"

# ============================================================================
# VALIDATION FLAGS
# ============================================================================
SKIP_ENV_VALIDATION="false"

# ============================================================================
# AI CONFIGURATION (Empty for now)
# ============================================================================
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
OPENAI_ORG_ID=""

# ============================================================================
# OPTIONAL SERVICES (Not configured)
# ============================================================================
REDIS_URL=""
SMTP_HOST=""
SMTP_USER=""
SMTP_PASS=""
AWS_S3_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
SENTRY_DSN=""
```

## 📋 How to Add to Vercel

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **For each variable above:**
   - Click "Add New"
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Paste the value (including quotes if shown)
   - Select environments: ✓ Production, ✓ Preview, ✓ Development
   - Click "Save"

## ⚠️ Important Notes

### 🔴 **Security Warning**
While this configuration will work, be aware that:
- All authentication secrets are identical (security risk, but will function)
- Consider generating unique secrets in the future

### 🟡 **Limited Functionality Warning**
Without Redis, Email, and File Storage configured:
- **Caching**: Will use in-memory cache (resets on deployment)
- **Email**: No email notifications will be sent
- **File Uploads**: Document uploads will fail
- **Sessions**: May be less reliable without Redis

### 🟢 **What Will Work**
- ✅ Authentication (Google OAuth & Email/Password)
- ✅ Database operations
- ✅ Basic application functionality
- ✅ Stripe billing (with webhook configured)

## 🚨 Before Going Live

1. **Update Google OAuth Redirect URIs** in Google Cloud Console:
   - `https://riscura.app/api/auth/callback/google`
   - `https://www.riscura.app/api/auth/callback/google`

2. **Configure Stripe Webhook** in Stripe Dashboard:
   - Endpoint URL: `https://riscura.app/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Verify Domain Configuration** in Vercel:
   - Add `riscura.app` as custom domain
   - Update DNS records as instructed

## 🚀 Deployment Command

After adding all environment variables:

```bash
vercel --prod
```

Or push to your GitHub repository and Vercel will auto-deploy.

## ✅ Post-Deployment Checklist

- [ ] Test Google OAuth login at https://riscura.app
- [ ] Verify database connectivity
- [ ] Check that pages load without errors
- [ ] Test Stripe checkout flow (if applicable)
- [ ] Monitor Vercel Function logs for any errors

This configuration will get your app running on production, though some features will be limited without Redis, Email, and File Storage services.