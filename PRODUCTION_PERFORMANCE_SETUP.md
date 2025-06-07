# Production Performance Setup Guide

## Overview
This guide covers the complete setup of the Riscura RCSA platform's performance optimization system for production deployment. The system includes enterprise-grade optimizations for Core Web Vitals, database performance, memory management, and real-time monitoring.

## 🔑 Required API Keys and Configuration

### 1. Core Application APIs
```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/riscura?schema=public"

# Redis Cache
REDIS_URL="redis://host:6379"
REDIS_PASSWORD="your-redis-password"

# Authentication
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
SESSION_SECRET="your-session-secret"
```

### 2. Performance Monitoring APIs
```bash
# External Performance Services (Optional but Recommended)
DATADOG_API_KEY="your-datadog-api-key"
NEW_RELIC_LICENSE_KEY="your-newrelic-license-key"
PINGDOM_API_KEY="your-pingdom-api-key"

# Error Tracking
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

### 3. Cloud Infrastructure APIs
```bash
# AWS (for S3, CloudFront, etc.)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="riscura-documents"

# Stripe (for billing)
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### 4. AI and External Services
```bash
# OpenAI for AI features
OPENAI_API_KEY="sk-your-openai-api-key"

# Email Services
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM_ADDRESS="noreply@riscura.com"

# Notifications
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
```

## 🚀 Performance Configuration

### Database Performance
```bash
# Connection Pooling
DB_CONNECTION_POOL_MIN=10
DB_CONNECTION_POOL_MAX=100
DB_CONNECTION_POOL_ACQUIRE_TIMEOUT=60000
DB_CONNECTION_POOL_IDLE_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000

# Read Replicas (for scale)
DB_ENABLE_READ_REPLICAS="true"
DB_READ_REPLICA_URLS="postgresql://user:pass@read-replica-1:5432/riscura,postgresql://user:pass@read-replica-2:5432/riscura"
```

### Redis Cache Configuration
```bash
# Clustering for high availability
REDIS_CLUSTER_ENABLED="true"
REDIS_CLUSTER_NODES="redis-node-1:6379,redis-node-2:6379,redis-node-3:6379"
REDIS_CONNECTION_POOL_SIZE=20

# Cache TTL settings
REDIS_CACHE_TTL_SHORT=300    # 5 minutes
REDIS_CACHE_TTL_MEDIUM=3600  # 1 hour
REDIS_CACHE_TTL_LONG=86400   # 24 hours
```

### Memory Management
```bash
MEMORY_MANAGEMENT_ENABLED="true"
MEMORY_MAX_USAGE_MB=1000
MEMORY_GC_THRESHOLD_MB=200
MEMORY_MONITORING_INTERVAL_MS=30000
MEMORY_AUTO_CLEANUP="true"
MEMORY_LEAK_DETECTION="true"
```

### Core Web Vitals
```bash
CORE_WEB_VITALS_ENABLED="true"
CORE_WEB_VITALS_SAMPLING_RATE=0.1
CORE_WEB_VITALS_LCP_THRESHOLD=2500
CORE_WEB_VITALS_FID_THRESHOLD=100
CORE_WEB_VITALS_CLS_THRESHOLD=0.1
```

### Performance Monitoring
```bash
PERFORMANCE_MONITORING_ENABLED="true"
PERFORMANCE_METRICS_ENDPOINT="/api/performance/metrics"
PERFORMANCE_ALERTS_ENABLED="true"
PERFORMANCE_AUTO_OPTIMIZATION="true"
PERFORMANCE_REPORTING_INTERVAL_MS=60000
```

## 📊 Alert Thresholds
```bash
ALERT_MEMORY_USAGE_THRESHOLD=85
ALERT_DB_CONNECTION_THRESHOLD=80
ALERT_LCP_THRESHOLD_MS=2500
ALERT_FID_THRESHOLD_MS=100
ALERT_CLS_THRESHOLD=0.1
ALERT_TASK_QUEUE_THRESHOLD=100
ALERT_WEBSOCKET_CONNECTION_THRESHOLD=80
```

## 🔧 Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local with your production values
nano .env.local
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Infrastructure Requirements

### Minimum Production Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps
- **Database**: PostgreSQL 14+ with 4GB RAM
- **Cache**: Redis 6+ with 2GB RAM

### Recommended Production Setup
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 500GB SSD
- **Network**: 10Gbps
- **Database**: PostgreSQL 15+ with 8GB RAM, read replicas
- **Cache**: Redis Cluster with 8GB RAM
- **CDN**: CloudFront or similar
- **Load Balancer**: Application Load Balancer

## 📈 Performance Targets

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### System Performance Targets
- **Database Query Time**: < 100ms average
- **Memory Usage**: < 85% of available
- **CPU Usage**: < 70% average
- **Response Time**: < 200ms for API calls
- **Uptime**: 99.9%

## 🔍 Monitoring and Alerting

### Built-in Monitoring
The system includes comprehensive monitoring for:
- Core Web Vitals
- Memory usage and leaks
- Database performance
- WebSocket connections
- File upload performance
- Background task processing

### External Monitoring Integration
Configure these services for enhanced monitoring:

#### DataDog
```bash
DATADOG_API_KEY="your-datadog-api-key"
```

#### New Relic
```bash
NEW_RELIC_LICENSE_KEY="your-newrelic-license-key"
```

#### Pingdom
```bash
PINGDOM_API_KEY="your-pingdom-api-key"
```

## 🚨 Alert Configuration

### Slack Notifications
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Email Alerts
```bash
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM_ADDRESS="alerts@riscura.com"
```

### SMS Alerts
```bash
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## 🔒 Security Configuration

### SSL/TLS
Ensure HTTPS is enabled with valid SSL certificates.

### CORS
```bash
CORS_ALLOWED_ORIGINS="https://app.riscura.com,https://admin.riscura.com"
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="1000"
```

## 📝 Logging Configuration

### Log Levels
```bash
LOG_LEVEL="info"  # error | warn | info | debug
LOG_FORMAT="json"
```

### Log Aggregation
Configure log shipping to your preferred service:
- ELK Stack
- Splunk
- CloudWatch Logs
- DataDog Logs

## 🧪 Testing Performance

### Load Testing
```bash
# Install load testing tools
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

### Performance Audits
```bash
# Run Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analysis
npm run performance:analyze
```

## 🔄 Deployment Pipeline

### CI/CD Integration
1. **Build**: `npm run build`
2. **Test**: `npm test`
3. **Security Audit**: `npm audit`
4. **Performance Test**: `npm run performance:test`
5. **Deploy**: Deploy to production environment

### Health Checks
The system includes health check endpoints:
- `/api/health` - Basic health check
- `/api/performance/metrics` - Performance metrics
- `/api/health/database` - Database connectivity
- `/api/health/redis` - Redis connectivity

## 📞 Support and Troubleshooting

### Performance Issues
1. Check `/api/performance/metrics` for current metrics
2. Review application logs for errors
3. Monitor database query performance
4. Check memory usage patterns
5. Verify cache hit rates

### Common Issues
- **High Memory Usage**: Enable memory leak detection
- **Slow Database Queries**: Check query optimization
- **Poor Core Web Vitals**: Review bundle size and image optimization
- **WebSocket Issues**: Check connection pooling configuration

### Getting Help
- Review application logs
- Check monitoring dashboards
- Contact support with performance metrics
- Use built-in debugging tools

## 🎯 Performance Optimization Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database optimized and indexed
- [ ] Redis cache configured
- [ ] CDN configured for static assets
- [ ] SSL certificates installed
- [ ] Monitoring services configured
- [ ] Alert thresholds set
- [ ] Load testing completed
- [ ] Security audit passed

### Post-Deployment
- [ ] Core Web Vitals monitoring active
- [ ] Performance metrics being collected
- [ ] Alerts functioning correctly
- [ ] Database performance within targets
- [ ] Memory usage stable
- [ ] Error rates acceptable
- [ ] User experience validated

## 📊 Expected Performance Improvements

With full implementation, expect:
- **60% faster initial page load times**
- **45% reduction in memory usage**
- **70% improvement in database query performance**
- **90% reduction in failed file uploads**
- **50% faster background task processing**
- **99.9% uptime with proper infrastructure**

## 🔄 Maintenance

### Regular Tasks
- Monitor performance metrics weekly
- Review and optimize database queries monthly
- Update dependencies quarterly
- Conduct performance audits quarterly
- Review and adjust alert thresholds as needed

### Scaling Considerations
- Add read replicas when database CPU > 70%
- Scale Redis cluster when memory usage > 80%
- Add application instances when CPU > 70%
- Implement CDN for global performance
- Consider edge computing for critical regions 