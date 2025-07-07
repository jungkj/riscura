# Free Infrastructure Setup for Riscura

## Overview
This document outlines the free services and alternatives used in the Riscura platform to minimize costs while maintaining functionality.

## 1. Database: Supabase PostgreSQL (Free Tier)

### Current Setup
- **Provider**: Supabase
- **Database**: PostgreSQL 17.4
- **Current Usage**: 13MB / 500MB (2.6%)
- **Connection String**: Configured in `.env`

### Limits
- Database size: 500MB
- API requests: 500K/month
- Concurrent connections: 60
- Bandwidth: 2GB/month

### Monitoring
```bash
# Test connection and check usage
npx tsx src/scripts/test-db-connection.ts
```

## 2. File Storage: Supabase Storage (Free Tier)

### Current Setup
- **Provider**: Supabase Storage
- **Storage Limit**: 1GB
- **Implementation**: `/src/lib/storage/supabase-storage.ts`

### Features
- Organized buckets: documents, attachments, reports, avatars
- File size limit: 10MB per file
- Private files with signed URLs
- MIME type restrictions

### Initialize Storage
```bash
npx tsx src/scripts/init-storage.ts
```

### API Endpoints
- `POST /api/upload` - Upload files
- `GET /api/upload/stats` - Check storage usage

## 3. Caching: In-Memory Cache with DB Fallback

### Current Setup
- **Primary**: LRU in-memory cache
- **Fallback**: PostgreSQL persistence (optional)
- **Implementation**: `/src/lib/cache/memory-cache.ts`

### Features
- Redis-compatible API
- 500 items max (configurable)
- 5-minute default TTL
- Optional database persistence
- Automatic cleanup of expired entries

### Configuration
```env
CACHE_PERSIST=true  # Enable database persistence
```

## 4. Real-time: Supabase Realtime (Alternative)

### Limits
- 200 concurrent connections
- 100K messages/month

### WebSocket Alternative
For now, we're using a custom WebSocket implementation that can be deployed on:
- Railway.app (free tier: 500 hours/month)
- Render.com (free tier available)
- Fly.io (free tier with generous limits)

## 5. Email: Free Alternatives

### Options
1. **Resend** (Recommended)
   - 100 emails/day free
   - Easy integration
   - Good deliverability

2. **SendGrid**
   - 100 emails/day free forever
   - Requires domain verification

3. **Mailgun**
   - 5,000 emails/month for 3 months

### Implementation
```typescript
// Update email provider in /src/lib/email/
// Currently using a placeholder
```

## 6. Authentication

### Current Setup
- **NextAuth.js** with JWT strategy
- No external auth provider costs
- Sessions stored in JWT tokens

## 7. Monitoring & Analytics

### Free Options
1. **Vercel Analytics** (if deployed on Vercel)
   - Basic web vitals
   - No additional setup

2. **Umami** (Self-hosted)
   - Privacy-focused
   - Can be hosted on free PostgreSQL

3. **Plausible** (Self-hosted)
   - Similar to Google Analytics
   - GDPR compliant

## 8. Error Tracking

### Free Options
1. **Sentry** (Free tier)
   - 5K errors/month
   - 1 user
   - 30-day retention

2. **LogRocket** (Free tier)
   - 1,000 sessions/month
   - 1 month retention

## Cost Summary

### Current Monthly Costs: $0
- Supabase (Free tier): $0
- Hosting (local dev): $0
- Domain (not required for dev): $0

### When You Need to Upgrade
1. **Database**: When approaching 400MB (80% of limit)
2. **Storage**: When approaching 800MB (80% of limit)
3. **API Calls**: Monitor monthly usage in Supabase dashboard
4. **Concurrent Users**: When expecting >50 concurrent users

## Deployment Options (Free)

### For Testing/Demo
1. **Vercel** (Recommended)
   - Automatic deployments
   - Serverless functions
   - Great Next.js support
   - Free SSL

2. **Netlify**
   - Similar to Vercel
   - 100GB bandwidth/month

3. **Railway**
   - 500 hours/month free
   - Good for WebSocket server

### Environment Variables for Production
```env
# Update these for production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_URL=https://your-domain.vercel.app

# Keep Supabase URLs the same
# Add email provider credentials when ready
```

## Backup Strategy

### Database Backups
```bash
# Create manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Supabase also provides daily backups on free tier
```

### File Backups
- Supabase Storage is replicated
- Consider periodic exports for critical files

## Monitoring Usage

### Database Size
```sql
SELECT pg_database_size(current_database())::bigint / 1024 / 1024 as size_mb;
```

### Storage Usage
```bash
curl -X GET http://localhost:3000/api/upload/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cache Stats
```typescript
import { cache } from '@/lib/cache/memory-cache';
console.log(cache.getStats());
```

## Next Steps

1. **Set up email provider** when ready to send emails
2. **Configure monitoring** before production launch
3. **Set up automated backups** for critical data
4. **Plan for scaling** - know your upgrade triggers

## Support

For issues or questions about the free infrastructure setup:
1. Check Supabase documentation
2. Review usage in Supabase dashboard
3. Monitor application logs for errors