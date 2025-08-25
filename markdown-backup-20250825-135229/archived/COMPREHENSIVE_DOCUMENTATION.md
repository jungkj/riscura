# 🚀 Riscura - Enterprise Risk Management Platform
## Complete Documentation & Implementation Guide

> **Single Source of Truth**  
> This document consolidates all project documentation, setup guides, API references, and implementation details into one comprehensive resource.

**Last Updated:** December 2024  
**Version:** 2.0.0  
**Status:** Production Ready  

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Quick Start Guide](#-quick-start-guide)
3. [Architecture & Technology Stack](#️-architecture--technology-stack)
4. [Development Environment Setup](#️-development-environment-setup)
5. [API Documentation](#-api-documentation)
6. [Authentication & OAuth Setup](#-authentication--oauth-setup)
7. [Database Management](#️-database-management)
8. [Deployment & Infrastructure](#-deployment--infrastructure)
9. [Security & Performance](#️-security--performance)
10. [Testing Strategy](#-testing-strategy)
11. [Feature Implementation Status](#-feature-implementation-status)
12. [Troubleshooting Guide](#-troubleshooting-guide)
13. [Development Workflow](#️-development-workflow)

---

## 🎯 Project Overview

Riscura is a comprehensive, AI-powered risk management and compliance platform built with Next.js, designed for enterprise-scale security, performance, and user experience.

### Core Features
- **Risk Assessment & Analysis** - Comprehensive risk identification, assessment, and mitigation tracking
- **Control Management** - Security control implementation, testing, and effectiveness monitoring
- **Compliance Framework Mapping** - SOC 2, ISO 27001, NIST, PCI DSS, and custom framework support
- **Document Management** - Centralized policy, procedure, and evidence management with version control
- **Reporting & Analytics** - Executive dashboards, compliance reports, and risk trend analysis

### AI-Powered Features
- **Intelligent Risk Analysis** - AI-driven risk identification and assessment recommendations
- **Automated Compliance Mapping** - Smart control-to-requirement mapping across frameworks
- **Document Intelligence** - Automated policy analysis and gap identification
- **Predictive Analytics** - Risk trend forecasting and early warning systems
- **Natural Language Processing** - Chat-based risk queries and insights

### Enterprise Features
- **Multi-Tenant Architecture** - Organization isolation with role-based access control
- **Advanced Security** - CSRF protection, rate limiting, input validation, audit logging
- **Performance Optimization** - Redis caching, CDN integration, bundle optimization
- **Mobile-First Design** - Touch-optimized interface with offline capabilities
- **PWA Support** - App-like experience with push notifications and offline storage

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 13+ database
- Redis 6+ for caching
- Docker (optional, for containerized deployment)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/your-org/riscura.git
cd riscura

# 2. Install dependencies
npm install

# 3. Setup development environment
npm run dev:setup

# 4. Start development server
npm run dev
```

### Test Credentials
- **Email:** testuser@riscura.com
- **Password:** test123

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 15 App Router with React 18
- **Language**: TypeScript (strict mode currently disabled)
- **Styling**: Tailwind CSS with custom enterprise design system
- **State Management**: React Context API and Zustand
- **PWA**: Service workers with offline capability

### Backend
- **Runtime**: Node.js with API routes
- **Database**: PostgreSQL via Prisma ORM (Supabase hosted)
- **Caching**: Redis with multi-layer caching strategy
- **Authentication**: NextAuth.js with SAML/OAuth support
- **API**: RESTful with standardized middleware

### AI Integration
- **Primary**: OpenAI GPT-4 and Anthropic Claude
- **Features**: Risk analysis, document processing, compliance mapping
- **Security**: Server-side only, no client-side API key exposure

### Infrastructure
- **Hosting**: Vercel (recommended) or AWS/Azure
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis Cloud or AWS ElastiCache
- **CDN**: Vercel Edge or CloudFront
- **Monitoring**: Sentry for error tracking

---

## ⚙️ Development Environment Setup

### Essential Commands

#### Development
```bash
npm run dev                # Start development server
npm run dev:setup         # Run development setup (installs deps, generates Prisma, seeds DB)
npm run dev:check         # Check development environment
npm run dev:test          # Push DB schema and start dev server
./test-website.sh         # Full stack website testing script
```

#### Type Checking & Linting
```bash
npm run type-check        # Quick TypeScript check
npm run type-check:full   # Full type check (use before commits)
npm run type-check:watch  # Continuous type checking
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run precommit         # Run both type-check:full and lint (use before commits)
```

#### Database
```bash
npm run db:generate       # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database
npm run db:reset         # Reset database (CAUTION: destroys data!)
```

#### Testing
```bash
npm run test             # Run Jest tests
npm run test:coverage    # Test coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:auth-flow   # Test authentication flow manually
npm run test:full-stack  # Full stack testing
```

### Environment Variables

#### Required Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/riscura"

# Authentication
NEXTAUTH_URL="http://localhost:3001"  # Must match APP_URL
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Security
JWT_SECRET="your-jwt-secret-key"
SESSION_SECRET="your-session-secret-here"
CSRF_SECRET="your-csrf-secret"
```

#### Production Variables
```env
# URLs (Production)
APP_URL="https://riscura.app"
NEXTAUTH_URL="https://riscura.app"
COOKIE_DOMAIN=".riscura.app"

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Security (Generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="[32-character-secret]"
JWT_SECRET="[32-character-secret]"
SESSION_SECRET="[32-character-secret]"
```

---

## 📡 API Documentation

### API Standardization System

All API endpoints use the `withApiMiddleware()` wrapper for consistent behavior:

```typescript
// Current pattern (most endpoints):
export const POST = withApiMiddleware(async (req) => {
  const user = (req as any).user;
  // Your handler code
  return NextResponse.json({ data });
});

// Recommended pattern (newer, supports validation & rate limiting):
export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: MyBodySchema,
  rateLimiters: ['standard'] // or 'auth', 'fileUpload', 'expensive', 'bulk', 'report'
})(async (context, validatedData) => {
  const { user, organizationId } = context;
  // Return data directly - middleware handles response formatting
  return { data: result };
});
```

### Rate Limiters
- `standard`: 1000 requests per 15 minutes
- `auth`: 5 attempts per 15 minutes
- `fileUpload`: 50 uploads per hour
- `expensive`: 10 operations per hour
- `bulk`: 5 operations per 10 minutes
- `report`: 20 reports per 30 minutes

### Response Format
```typescript
// Success Response
{
  success: true,
  data: T,
  meta: {
    total?: number,
    page?: number,
    limit?: number,
    timestamp: string,
    requestId: string,
    version: string
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any,
    timestamp: string,
    requestId: string
  }
}
```

### Key Endpoints
```bash
# Authentication
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/session
POST /api/auth/logout

# Google OAuth
GET  /api/google-oauth/login
GET  /api/google-oauth/callback
GET  /api/google-oauth/session

# Risk Management
GET    /api/risks
POST   /api/risks
GET    /api/risks/[id]
PUT    /api/risks/[id]
DELETE /api/risks/[id]

# Compliance
GET  /api/compliance/frameworks
GET  /api/compliance/assessments
POST /api/compliance/assessments

# Analytics
GET  /api/analytics
GET  /api/analytics/rcsa
```

---

## 🔐 Authentication & OAuth Setup

### Google OAuth Configuration

#### 1. Google Cloud Console Setup
1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:

**Development:**
- `http://localhost:3001/api/auth/callback/google`
- `http://localhost:3001/api/google-oauth/callback`

**Production:**
- `https://riscura.app/api/auth/callback/google`
- `https://riscura.app/api/google-oauth/callback`

#### 2. Environment Configuration
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

#### 3. Testing OAuth Flow
```bash
# Run diagnostics
npx tsx fix-oauth-auth.ts

# Test OAuth endpoints
./test-oauth.sh

# Manual testing
# 1. Visit /auth/login
# 2. Click "Sign in with Google"
# 3. Complete authentication
# 4. Verify redirect to /dashboard
```

### Session Management
- **JWT Strategy**: Token-based authentication with 30-day expiration
- **Cookie Strategy**: HTTP-only cookies for OAuth sessions
- **Refresh Tokens**: Automatic token refresh for long-lived sessions
- **Multi-device**: Support for multiple concurrent sessions

---

## 🗄️ Database Management

### Schema Overview
```prisma
// Core Models
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  firstName      String
  lastName       String
  role           UserRole
  organizationId String
  // ... additional fields
}

model Organization {
  id    String @id @default(cuid())
  name  String
  plan  String @default("free")
  users User[]
  // ... additional fields
}

model Risk {
  id             String        @id @default(cuid())
  title          String
  description    String?
  severity       RiskSeverity
  likelihood     RiskLikelihood
  organizationId String
  // ... additional fields
}
```

### Database Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Migration Strategy
1. **Development**: Use `db:push` for rapid iteration
2. **Production**: Always use `db:migrate:deploy`
3. **Backup**: Always backup before major schema changes
4. **Testing**: Use separate test database

---

## 🚀 Deployment & Infrastructure

### Vercel Deployment

#### Required Environment Variables
```env
# Core Configuration
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_URL="https://riscura.app"
NEXTAUTH_SECRET="[32-character-secret]"

# Google OAuth
GOOGLE_CLIENT_ID="[production-client-id].apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[production-client-secret]"

# Security
JWT_SECRET="[32-character-secret]"
SESSION_SECRET="[32-character-secret]"
CSRF_SECRET="[32-character-secret]"
```

#### Deployment Commands
```bash
# Standard build
npm run build

# Production build with increased memory
npm run build:vercel

# Deploy to Vercel
vercel --prod

# Trigger redeployment
git commit --allow-empty -m "Trigger deployment"
git push
```

### Infrastructure Setup

#### Free Tier Setup
- **Vercel**: Free hosting with generous limits
- **Supabase**: Free PostgreSQL database (500MB)
- **Redis Cloud**: Free Redis instance (30MB)
- **Total Cost**: $0/month for development and small production

#### Production Infrastructure
- **Vercel Pro**: $20/month for better performance
- **Supabase Pro**: $25/month for larger database
- **Redis Cloud**: $15/month for production caching
- **Total Cost**: ~$60/month for production

---

## 🛡️ Security & Performance

### Security Features
- **CSRF Protection**: Automatic CSRF token validation
- **Rate Limiting**: Configurable per endpoint type
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Authentication**: Secure JWT and session management

### Performance Optimizations
- **Redis Caching**: Multi-layer caching strategy
- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Webpack bundle analyzer
- **Virtual Scrolling**: For large data sets (100+ items)

### Security Headers
```typescript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': '[comprehensive CSP policy]'
}
```

---

## 🧪 Testing Strategy

### Test Types
```bash
# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Component Tests
npm run test:components

# Authentication Flow
npm run test:auth-flow

# Full Stack Testing
npm run test:full-stack
```

### Test Scripts
- `./test-website.sh` - Complete website functionality test
- `./test-oauth.sh` - OAuth authentication testing
- `./test-auth-endpoints.sh` - Authentication endpoint validation

### Coverage Requirements
- **Minimum**: 70% code coverage
- **Target**: 85% code coverage
- **Critical Paths**: 100% coverage (auth, payments, security)

---

## 📊 Feature Implementation Status

### ✅ Completed Features (Phase 1)
- Core risk management system
- User authentication (email/password + OAuth)
- Basic compliance framework mapping
- Document upload and management
- Dashboard with basic analytics
- Multi-tenant organization structure

### 🚧 In Progress (Phase 2)
- TypeScript strict mode migration (~785 errors across 165 files)
- API standardization improvements
- Performance optimization
- Security hardening
- Enhanced audit logging

### 📋 Planned Features (Phase 3)
- Advanced AI risk analysis
- Real-time collaboration features
- Advanced reporting and analytics
- Mobile app companion
- Enterprise SSO integration
- Advanced workflow automation

### Current Development Phase
**Phase 2**: Technical debt resolution and production readiness
- TypeScript strict mode migration
- API standardization
- Performance optimization
- Security improvements

---

## 🔧 Troubleshooting Guide

### Common Issues

#### OAuth Authentication Not Working
```bash
# 1. Check environment variables
npx tsx fix-oauth-auth.ts

# 2. Verify Google Cloud Console settings
# Ensure redirect URIs match exactly

# 3. Check session cookies
# Visit /api/google-oauth/debug

# 4. Test OAuth flow
./test-oauth.sh
```

#### Database Connection Issues
```bash
# Check database connection
npm run db:generate

# Test connection
npx tsx src/scripts/test-db-connection.ts

# Reset if needed
npm run db:reset
npm run db:seed
```

#### Build Failures
```bash
# Type check
npm run type-check:full

# Fix common issues
npm run lint:fix

# Clean and rebuild
npm run clean:all
npm install
npm run build
```

#### Performance Issues
```bash
# Analyze bundle
npm run bundle:analyze

# Check performance
npm run performance:analyze

# Optimize images
npm run optimize:images
```

---

## ⚡ Development Workflow

### Before Starting Development
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate

# 4. Check environment
npm run dev:check
```

### Before Committing
```bash
# 1. Run pre-commit checks
npm run precommit

# 2. Test authentication
npm run test:auth-flow

# 3. Run full test suite
npm run test:all

# 4. Build verification
npm run build
```

### TypeScript Guidelines
- **Current Status**: Strict mode disabled with ~785 errors
- **Use `// @ts-ignore` only with proper documentation**:
```typescript
// @ts-ignore - [REASON]: [DESCRIPTION] - [TRACKING_ID]
// TODO: [CLEANUP_PLAN] - Target: [DATE/MILESTONE]
```

### API Development Guidelines
1. **Always use `withApiMiddleware()`** for new endpoints
2. **Include organization context** in all data operations
3. **Use standardized error handling** with APIError classes
4. **Implement proper rate limiting** based on endpoint type
5. **Add comprehensive input validation** with Zod schemas

---

## 🎯 API Reference

### Authentication Endpoints
```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}

# Google OAuth
GET /api/google-oauth/login?redirect=/dashboard&remember=true

# Session Check
GET /api/auth/session
```

### Risk Management Endpoints
```bash
# List Risks
GET /api/risks
Headers: Authorization: Bearer {token}, Organization-ID: {orgId}

# Create Risk
POST /api/risks
Content-Type: application/json
{
  "title": "Risk Title",
  "description": "Risk Description",
  "severity": "HIGH",
  "likelihood": "MEDIUM"
}

# Update Risk
PUT /api/risks/{id}
```

### Compliance Endpoints
```bash
# List Frameworks
GET /api/compliance/frameworks

# Create Assessment
POST /api/compliance/assessments
{
  "frameworkId": "framework-id",
  "name": "Assessment Name",
  "description": "Assessment Description"
}
```

---

## 📈 Performance & Monitoring

### Performance Metrics
- **Target LCP**: < 2.5 seconds
- **Target FID**: < 100ms
- **Target CLS**: < 0.1
- **Bundle Size**: < 1MB initial load

### Monitoring Setup
```env
# Error Tracking
SENTRY_DSN="https://your-dsn@sentry.io/project"

# Analytics
GA_TRACKING_ID="G-XXXXXXXXXX"
MIXPANEL_TOKEN="your-mixpanel-token"

# Performance
WEB_VITALS_ENABLED="true"
```

---

## 🚨 Emergency Procedures

### Production Issues
1. **Check monitoring dashboard**: `/api/monitoring/dashboard`
2. **Review error logs**: Sentry dashboard
3. **Database health**: `npm run health:database`
4. **Rollback if needed**: `git revert [commit-hash]`

### Security Incidents
1. **Rotate secrets immediately**
2. **Check audit logs**: `/api/audit/reports`
3. **Review access patterns**
4. **Update security configuration**

---

## 📞 Support & Resources

### Getting Help
- **Documentation**: This file (single source of truth)
- **API Testing**: Use `/api/docs/ui` for interactive testing
- **Code Issues**: Check CLAUDE.md for AI assistant guidance
- **Security**: Review security configuration with `npm run security:check`

### Useful Commands Reference
```bash
# Quick health check
npm run verify:quick

# Full system verification
npm run verify

# Production readiness check
npm run production:ready

# Generate documentation
npm run docs:generate
```

---

**This documentation is maintained as the single source of truth for the Riscura platform. Keep it updated as the system evolves.**