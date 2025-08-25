# Testing Guide for Riscura Full Stack Application

## Quick Start Testing

### 1. Basic Health Check
```bash
# Test database connection
npm run db:push

# Quick verification (lint + generate)
npm run verify:quick
```

### 2. Development Server Test
```bash
# Start the development server
npm run dev

# Open in browser
# http://localhost:3000

# Test credentials
# Email: testuser@riscura.com
# Password: test123
```

### 3. Full Build Test
```bash
# Clean and build (this takes 3-5 minutes)
npm run clean
npm run build

# If successful, start production server
npm start
```

## Comprehensive Test Commands

### Option 1: Full Stack Test Script
```bash
# Run all tests
./test-website.sh
```

### Option 2: Manual Step-by-Step
```bash
# 1. Check environment
node -v  # Should be >= 18.17.0
npm -v   # Should be >= 9.0.0

# 2. Install dependencies
npm install

# 3. Database setup
npm run db:generate
npm run db:push

# 4. Run linting
npm run lint

# 5. Type checking (may use lots of memory)
npm run type-check

# 6. Build application
npm run build

# 7. Start production
npm start
```

### Option 3: Quick Development Test
```bash
# This is the fastest way to test
npm run dev:test
```

## Common Issues and Solutions

### 1. TypeScript Memory Issues
```bash
# If type-check runs out of memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm run type-check
```

### 2. Build Failures
```bash
# Clean build artifacts
npm run clean

# Clean everything and reinstall
npm run clean:all
```

### 3. Database Connection Issues
```bash
# Test database connection
npx tsx src/scripts/test-db-connection.ts

# Check Supabase status
# https://status.supabase.com/
```

### 4. Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

## Testing Specific Features

### 1. Test Authentication
- Navigate to http://localhost:3000
- Click "Sign in"
- Use credentials: testuser@riscura.com / test123
- You should see the dashboard

### 2. Test Chat Feature
- After login, go to Team > Chat
- Create a new channel
- Send messages
- Upload files (10MB limit)

### 3. Test Analytics Dashboard
- Go to Dashboard > Analytics
- Check if charts load
- Verify data displays correctly

### 4. Test File Storage
```bash
# Check storage stats
curl http://localhost:3000/api/upload/stats \
  -H "Cookie: [your-session-cookie]"
```

### 5. Test API Health
```bash
# Health check
curl http://localhost:3000/api/health

# With authentication
curl http://localhost:3000/api/analytics \
  -H "Cookie: [your-session-cookie]"
```

## Performance Testing

### 1. Bundle Analysis
```bash
npm run bundle:analyze
```

### 2. Lighthouse Test
```bash
# Build first
npm run build

# Run performance test
npm run performance:test
```

## Database Testing

### 1. Prisma Studio
```bash
# Visual database browser
npm run db:studio
```

### 2. Test Infrastructure
```bash
# Comprehensive infrastructure test
npx tsx src/scripts/test-free-infrastructure.ts
```

## Deployment Testing

### 1. Production Build Check
```bash
npm run production:ready
```

### 2. Environment Variables Check
```bash
# Verify all required env vars
node -e "require('dotenv').config(); console.log('DB:', !!process.env.DATABASE_URL, 'Auth:', !!process.env.NEXTAUTH_SECRET)"
```

## Continuous Testing

For development, use:
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Type checking in watch mode
npm run type-check:watch
```

## Success Criteria

✅ Development server starts without errors
✅ Can login with test credentials
✅ All pages load without 404s
✅ No console errors in browser
✅ Chat functionality works
✅ File uploads work (< 10MB)
✅ Production build completes successfully

## Getting Help

If tests fail:
1. Check error messages carefully
2. Run `npm run clean:all` and try again
3. Verify `.env` file has all required variables
4. Check Supabase dashboard for database issues
5. Review `/docs/free-infrastructure-setup.md` for configuration