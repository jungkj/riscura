# Riscura RCSA Platform - Deployment Guide

## Phase 1.10: Performance Optimization & Deployment

This guide covers the complete deployment and performance optimization setup for the Riscura RCSA platform.

## Architecture Overview

### Infrastructure Components

- **Application**: Next.js 14 application with TypeScript
- **Database**: PostgreSQL 15 with performance optimizations
- **Cache**: Redis 7 with clustering and encryption
- **Load Balancer**: AWS Application Load Balancer with SSL termination
- **CDN**: CloudFront with global edge locations
- **Container Platform**: AWS ECS Fargate with auto-scaling
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **CI/CD**: GitHub Actions with automated testing and deployment

### Performance Features

- **Caching Strategy**: Multi-level caching with Redis and CDN
- **Database Optimization**: Query optimization, connection pooling, indexing
- **Code Splitting**: Dynamic imports and bundle optimization
- **Image Optimization**: WebP conversion and lazy loading
- **API Compression**: Gzip/Brotli compression for responses
- **Monitoring**: Real-time performance tracking and alerting

## Prerequisites

### Required Tools

```bash
# Install required tools
npm install -g aws-cli
npm install -g @aws-cdk/cli
npm install -g terraform
brew install docker
brew install docker-compose
```

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-org/riscura.git
cd riscura

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

## Local Development

### Quick Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Development without Docker

```bash
# Start PostgreSQL and Redis
brew services start postgresql
brew services start redis

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/riscura_db"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Security
ENCRYPTION_SALT="your-encryption-salt"
MASTER_ENCRYPTION_KEY="your-master-key"
AUDIT_INTEGRITY_KEY="your-audit-key"

# AWS (for production)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="your-s3-bucket"
CLOUDFRONT_DOMAIN="your-cloudfront-domain"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

## Production Deployment

### 1. Infrastructure Setup with Terraform

```bash
# Navigate to infrastructure directory
cd infrastructure/aws

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="environment=production"

# Apply infrastructure
terraform apply -var="environment=production"

# Get outputs
terraform output
```

### 2. Container Registry Setup

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t riscura-app .
docker tag riscura-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/riscura-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/riscura-app:latest
```

### 3. Database Migration

```bash
# Run migrations
npm run db:migrate

# Seed production data (if needed)
npm run db:seed:production
```

### 4. SSL Certificate Setup

```bash
# Validate ACM certificate (automated via Terraform)
# Add DNS records for domain validation
# Certificate will be automatically validated and attached to ALB
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Code Quality**: ESLint, TypeScript, Prettier checks
2. **Security Scanning**: Snyk, Trivy, CodeQL analysis
3. **Testing**: Unit, integration, and E2E tests
4. **Performance Testing**: Lighthouse CI and load testing
5. **Build & Push**: Docker image build and ECR push
6. **Deploy**: Blue-green deployment to ECS
7. **Database Migration**: Automated schema updates
8. **Monitoring**: Health checks and rollback on failure

### Required GitHub Secrets

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION

# Database
DATABASE_URL

# Application Secrets
NEXTAUTH_SECRET
STRIPE_SECRET_KEY
ENCRYPTION_SALT
MASTER_ENCRYPTION_KEY

# Monitoring
SENTRY_DSN
SNYK_TOKEN
LHCI_GITHUB_APP_TOKEN

# Notifications
SLACK_WEBHOOK

# Environment URLs
STAGING_URL
PRODUCTION_URL
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_risks_organization_id ON risks(organization_id);
CREATE INDEX CONCURRENTLY idx_controls_risk_id ON controls(risk_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Analyze query performance
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Redis Caching Strategy

```typescript
// Cache configuration
const cacheConfig = {
  // API responses
  'api:*': { ttl: 300 }, // 5 minutes
  
  // User sessions
  'session:*': { ttl: 3600 }, // 1 hour
  
  // Static data
  'frameworks:*': { ttl: 86400 }, // 24 hours
  
  // Real-time data
  'dashboard:*': { ttl: 60 }, // 1 minute
};
```

### CDN Configuration

```javascript
// CloudFront behaviors
const cacheBehaviors = [
  {
    pathPattern: '/api/*',
    cachePolicyId: 'dynamic-content', // No caching for API
  },
  {
    pathPattern: '/_next/static/*',
    cachePolicyId: 'static-assets', // Long-term caching
  },
  {
    pathPattern: '/images/*',
    cachePolicyId: 'optimized-images', // Image optimization
  },
];
```

## Monitoring & Alerting

### Health Check Endpoints

- **Liveness**: `GET /api/health` - Overall system health
- **Readiness**: `HEAD /api/health` - Ready to serve traffic
- **Metrics**: `GET /api/metrics` - Prometheus metrics

### Key Metrics

- **Application Performance**:
  - Response time (p95, p99)
  - Throughput (requests/second)
  - Error rate (%)
  - Memory usage (MB)

- **Database Performance**:
  - Query execution time
  - Connection pool utilization
  - Slow query count
  - Cache hit ratio

- **Infrastructure**:
  - CPU utilization (%)
  - Memory utilization (%)
  - Network I/O
  - Disk utilization

### Alerts Configuration

```yaml
# Critical alerts
- name: HighErrorRate
  condition: error_rate > 5%
  severity: critical
  
- name: HighResponseTime
  condition: p95_response_time > 2000ms
  severity: high
  
- name: DatabaseConnections
  condition: db_connections > 80%
  severity: medium
  
- name: MemoryUsage
  condition: memory_usage > 85%
  severity: medium
```

## Security Configuration

### SSL/TLS Setup

```nginx
# Nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;
```

### Security Headers

```typescript
// Security headers middleware
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
};
```

## Backup & Recovery

### Database Backups

```bash
# Automated backups (configured in Terraform)
# - Daily snapshots with 7-day retention
# - Point-in-time recovery enabled
# - Cross-region backup replication

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

### Application Data Backup

```bash
# S3 backup for uploaded files
aws s3 sync s3://riscura-storage/ s3://riscura-backup/ --delete

# Redis backup
redis-cli BGSAVE
```

## Scaling Configuration

### Auto Scaling

```hcl
# ECS Service Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/riscura-cluster/riscura-service"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  target_value       = 70.0
  predefined_metric_type = "ECSServiceAverageCPUUtilization"
}
```

### Database Scaling

```hcl
# RDS Auto Scaling
resource "aws_db_instance" "main" {
  max_allocated_storage = 1000
  monitoring_interval   = 60
  performance_insights_enabled = true
}
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart service
   aws ecs update-service --force-new-deployment
   ```

2. **Database Connection Issues**
   ```bash
   # Check connection pool
   SELECT * FROM pg_stat_activity;
   
   # Kill idle connections
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
   ```

3. **Cache Issues**
   ```bash
   # Redis memory usage
   redis-cli INFO memory
   
   # Clear cache
   redis-cli FLUSHDB
   ```

### Logs Access

```bash
# Application logs
aws logs get-log-events --log-group-name /ecs/riscura

# Database logs
aws rds describe-db-log-files --db-instance-identifier riscura-db

# Load balancer logs
aws s3 sync s3://riscura-logs/alb/ ./logs/
```

## Maintenance

### Regular Tasks

- **Weekly**: Review performance metrics and alerts
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Capacity planning and cost optimization
- **Annually**: Security audit and compliance review

### Update Procedures

```bash
# Update application
git pull origin main
docker build -t riscura-app:latest .
aws ecs update-service --force-new-deployment

# Update infrastructure
terraform plan
terraform apply

# Database maintenance
VACUUM ANALYZE;
REINDEX DATABASE riscura_db;
```

## Support

For deployment issues:
1. Check the monitoring dashboards
2. Review application logs
3. Verify health check endpoints
4. Contact the development team

## Performance Benchmarks

### Target Performance Metrics

- **Page Load Time**: < 2 seconds (p95)
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Cache Hit Rate**: > 90%
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%

### Load Testing Results

```bash
# Run load tests
npm run test:load

# Expected results:
# - 1000 concurrent users
# - 95th percentile response time < 2000ms
# - Error rate < 1%
# - Throughput > 500 requests/second
```

This completes the deployment setup for the Riscura RCSA platform with enterprise-grade performance optimization and production-ready infrastructure. 