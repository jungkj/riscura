# Environment Setup Guide

## Quick Fix for DATABASE_URL Error

The error you're encountering is because the `DATABASE_URL` environment variable is missing. Here's how to fix it:

### 1. Create `.env.local` file

Create a file named `.env.local` in the root directory of your project with the following content:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/riscura"

# Next.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret-here-change-this"
NEXTAUTH_URL="http://localhost:3000"

# JWT Configuration
JWT_SECRET="your-jwt-secret-here-change-this"
JWT_EXPIRES_IN="7d"

# Session Configuration
SESSION_SECRET="your-session-secret-here-change-this"

# Security Configuration
BCRYPT_ROUNDS="12"

# Development Configuration
NODE_ENV="development"
DB_QUERY_LOGGING="true"
```

### 2. Update Database URL

Replace the placeholder `DATABASE_URL` with your actual PostgreSQL connection string:

**For local development:**
```bash
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/riscura"
```

**For hosted database (like Supabase, Railway, etc.):**
```bash
DATABASE_URL="postgresql://user:pass@host:port/database"
```

### 3. Generate Secure Secrets

For production use, generate secure random strings for:
- `NEXTAUTH_SECRET`
- `JWT_SECRET` 
- `SESSION_SECRET`

You can generate these using:
```bash
openssl rand -base64 32
```

### 4. Optional: Database Setup

If you don't have a PostgreSQL database yet:

**Option A: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create a database named `riscura`
3. Update the DATABASE_URL accordingly

**Option B: Use a hosted service**
- Supabase (free tier available)
- Railway (free tier available)
- Neon (free tier available)

### 5. Run Database Migrations

Once your database is set up:
```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Seed Clean Test User (Optional)

After database setup, create the clean test user:
```bash
node scripts/seed-clean-user.js
```

## Complete Environment Variables

For full functionality, you may also want to add:

```bash
# AI Configuration (Optional)
OPENAI_API_KEY="your-openai-api-key-here"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Storage Configuration (Optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"
```

## Troubleshooting

If you're still getting database errors:

1. **Check if PostgreSQL is running**
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Test database connection**
   ```bash
   npx prisma db push
   ```

3. **Check database health**
   - Visit `http://localhost:3000/api/health/database` after starting the app

4. **View database in Prisma Studio**
   ```bash
   npx prisma studio
   ```

The application will work without a database for basic UI testing, but database-dependent features will be disabled. 