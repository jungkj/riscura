# Riscura RCSA Platform - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 6+
- Nginx (for reverse proxy)
- SSL certificates
- Domain name configured

### Required Services
- Stripe account (for billing)
- SendGrid/AWS SES (for emails)
- AWS S3 (for document storage)
- Sentry (for error tracking)
- OpenAI API key (for AI features)

## Environment Setup

### 1. Clone and Install
```bash
git clone https://github.com/your-org/riscura.git
cd riscura
npm install
```

### 2. Configure Environment Variables
```bash
cp env.example .env.production
# Edit .env.production with your production values
```

### 3. Critical Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/riscura_prod?schema=public&sslmode=require"

# Security (generate secure values)
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
MASTER_ENCRYPTION_KEY=$(openssl rand -base64 32)
ENCRYPTION_SALT=$(openssl rand -base64 16)

# Application
NODE_ENV=production
APP_URL=https://app.riscura.com
SKIP_EMAIL_VERIFICATION=false
```

## Database Setup

### 1. Create Production Database
```sql
CREATE DATABASE riscura_prod;
CREATE USER riscura_app WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE riscura_prod TO riscura_app;
```

### 2. Run Migrations
```bash
npx prisma migrate deploy
```

### 3. Create Initial Admin User
```bash
# Create a script or use Prisma Studio to create the first admin user
npx prisma studio
```

### 4. Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_risks_org_status ON risks(organization_id, status);
CREATE INDEX idx_controls_org_type ON controls(organization_id, type);
CREATE INDEX idx_activities_org_created ON activities(organization_id, created_at);

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
```

## Application Deployment

### 1. Build Application
```bash
npm run build
```

### 2. PM2 Process Management
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'riscura',
    script: 'npm',
    args: 'start',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name app.riscura.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.riscura.com;

    ssl_certificate /etc/ssl/certs/riscura.crt;
    ssl_certificate_key /etc/ssl/private/riscura.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Security Configuration

### 1. Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 2. Database Security
```bash
# Enable SSL for PostgreSQL
# In postgresql.conf:
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# In pg_hba.conf:
hostssl all all 0.0.0.0/0 md5
```

### 3. Application Security
- Enable all security features in production
- Implement rate limiting
- Enable CORS with specific origins
- Use secure session configuration
- Implement proper CSP headers

### 4. Secrets Management
```bash
# Use environment variables or secret management service
# Never commit secrets to git
# Rotate keys regularly
```

## Monitoring & Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Health check endpoint
curl https://app.riscura.com/api/health
```

### 2. Database Monitoring
```sql
-- Monitor slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check database size
SELECT pg_database_size('riscura_prod');

-- Monitor connections
SELECT count(*) FROM pg_stat_activity;
```

### 3. Error Tracking with Sentry
```javascript
// Already configured in the application
// Monitor at https://sentry.io/organizations/your-org/
```

### 4. Application Logs
```bash
# View logs
pm2 logs riscura

# Log aggregation with ELK stack or CloudWatch
```

## Backup & Recovery

### 1. Database Backups
```bash
# Daily automated backups
0 2 * * * pg_dump -U riscura_app -h localhost riscura_prod | gzip > /backups/riscura_$(date +\%Y\%m\%d).sql.gz

# Backup to S3
0 3 * * * aws s3 cp /backups/riscura_$(date +\%Y\%m\%d).sql.gz s3://riscura-backups/
```

### 2. Document Backups
```bash
# S3 cross-region replication
aws s3api put-bucket-replication --bucket riscura-documents --replication-configuration file://replication.json
```

### 3. Recovery Procedures
```bash
# Restore database
gunzip < backup.sql.gz | psql -U riscura_app -d riscura_prod

# Test recovery procedures regularly
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Regular maintenance
VACUUM ANALYZE;
REINDEX DATABASE riscura_prod;

-- Query optimization
EXPLAIN ANALYZE SELECT ...;
```

### 2. Redis Caching
```bash
# Configure Redis
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 3. CDN Configuration
- Use CloudFlare or AWS CloudFront
- Cache static assets
- Enable compression

### 4. Application Performance
```javascript
// Enable production optimizations
NODE_ENV=production
ENABLE_COMPRESSION=true
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection limits
SELECT count(*) FROM pg_stat_activity;

# Reset connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
```

#### 2. Memory Issues
```bash
# Check memory usage
pm2 monit

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pm2 start ecosystem.config.js
```

#### 3. Performance Issues
```bash
# Enable debug logging
LOG_LEVEL=debug pm2 restart riscura

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Health Checks
```bash
# Application health
curl https://app.riscura.com/api/health

# Database health
curl https://app.riscura.com/api/health/db

# Redis health
redis-cli ping
```

## Maintenance Checklist

### Daily
- [ ] Check application logs for errors
- [ ] Monitor system resources
- [ ] Verify backup completion

### Weekly
- [ ] Review error reports in Sentry
- [ ] Check database performance
- [ ] Update dependencies for security patches

### Monthly
- [ ] Rotate encryption keys
- [ ] Review and optimize slow queries
- [ ] Test disaster recovery procedures
- [ ] Security audit

### Quarterly
- [ ] Full system backup and recovery test
- [ ] Performance baseline review
- [ ] Security penetration testing
- [ ] Infrastructure cost optimization

## Support

For production support:
- Email: support@riscura.com
- Slack: #riscura-production
- On-call: See PagerDuty rotation

## Additional Resources
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Security Best Practices](./docs/security.md)
- [Scaling Guide](./docs/scaling.md) 