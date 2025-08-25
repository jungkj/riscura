# Supabase Setup Guide

## Quick Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for project to be ready (2-3 minutes)

2. **Get Database Credentials**
   - Go to Settings > Database
   - Copy the connection string
   - Copy the API keys

3. **Update Environment Variables**
   Create `.env.local` with your Supabase credentials:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
   ```

4. **Initialize Database**
   ```bash
   npx prisma db push
   npm run db:seed
   npm run create:test-user
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Test User Credentials
- **Email:** testuser@riscura.com
- **Password:** test123
- **Login URL:** http://localhost:3001/auth/login

## Why Supabase?
- ✅ No local setup required
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Real-time features
- ✅ Production-ready
- ✅ Built-in security 