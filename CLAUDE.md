# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev                # Start development server
npm run dev:setup         # Run development setup (installs deps, generates Prisma, seeds DB)
npm run dev:check         # Check development environment
npm run dev:test          # Push DB schema and start dev server
./test-website.sh         # Full stack website testing script
```

### Type Checking & Linting
```bash
npm run type-check        # Quick TypeScript check
npm run type-check:full   # Full type check (use before commits)
npm run type-check:watch  # Continuous type checking
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run precommit         # Run both type-check:full and lint (use before commits)
```

### Building & Production
```bash
npm run build             # Build for production
npm run build:prod        # Standard production build
npm run build:vercel      # Build with increased memory for Vercel
npm run start             # Start production server
npm run production:ready  # Full production validation
npm run production:deploy # Full production deployment with monitoring
```

### Database
```bash
npm run db:generate       # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:migrate:deploy # Deploy database migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database
npm run db:reset         # Reset database (CAUTION: destroys data!)
```

### Testing
```bash
npm run test             # Run Jest tests
npm run test:coverage    # Test coverage report
npm run test:watch       # Watch mode
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:components  # Component tests only
npm run test:ai-services # AI service tests only
npm run test:all         # All test suites
npm run test:full-suite  # Complete test suite including performance
npm run test:auth-flow   # Test authentication flow manually
npm run test:full-stack  # Full stack testing (tsx src/scripts/test-full-stack.ts)

# Run a single test file
npm test -- path/to/test.spec.ts
jest path/to/test.spec.ts --watch

# Test shell scripts
./test-website.sh            # Full stack website testing
./test-oauth-deployment.sh   # OAuth deployment verification
./test-auth-endpoints.sh     # Authentication endpoint testing
./scripts/test-redis.sh      # Redis connection testing
./scripts/test-email.sh      # Email service testing
```

### Performance & Security
```bash
npm run performance:analyze  # Bundle analysis
npm run bundle:analyze      # Webpack bundle analyzer
npm run bundle:optimize     # Optimize and analyze bundle
npm run security:check      # Security configuration check
npm run security:audit      # Full security audit
npm run optimize:images     # Optimize image assets
```

### Development Utilities
```bash
npm run verify           # Full verification: generate, type-check, lint, build
npm run verify:quick     # Quick verification: generate and lint only
npm run clean            # Clean Next.js build cache
npm run clean:all        # Full clean including node_modules
npm run cache:clear      # Clear application cache
npm run config:verify    # Verify environment configuration
npm run generate-secrets # Generate secure secrets
npm run debug:login      # Debug login issues
```

### Monitoring & Documentation
```bash
npm run monitoring:init     # Initialize monitoring systems
npm run monitoring:verify   # Verify monitoring configuration
npm run docs:generate       # Generate API documentation
npm run docs:serve         # Serve docs on port 8080
npm run support:init       # Initialize support system
npm run alerts:test        # Test alert system
```

## Architecture Overview

### Project Structure
- **Framework**: Next.js 15 App Router with React 18
- **Language**: TypeScript (strict mode currently disabled)
- **Database**: PostgreSQL via Prisma ORM (Supabase hosted)
- **Authentication**: NextAuth.js with SAML/OAuth support
- **Styling**: Tailwind CSS with custom enterprise design system
- **State Management**: React Context API and Zustand
- **Caching**: Redis with multi-layer caching strategy
- **AI Integration**: OpenAI GPT-4 and Anthropic Claude

### Key Directories
- `/src/app/` - Next.js App Router pages and API routes
  - `/api/` - RESTful API endpoints with standardized middleware
  - Page routes organized by feature (dashboard, compliance, etc.)
- `/src/components/` - React components organized by domain
  - `/ui/` - Reusable UI primitives
  - Feature-specific components (risks, compliance, ai, etc.)
- `/src/lib/` - Core utilities and configurations
  - `/api/` - API standardization system (MUST use for new endpoints)
  - `/security/` - Security middleware
  - `/performance/` - Optimization utilities
  - `/auth/` - Authentication utilities and middleware
  - `/billing/` - Billing and subscription management
- `/src/context/` - Global state management providers
- `/src/services/` - Business logic service layer
  - `/ai/` - AI service integrations
- `/src/hooks/` - Custom React hooks
- `/src/types/` - TypeScript type definitions
- `/scripts/` - Development and deployment scripts
- `/src/scripts/` - Test and utility scripts

### Critical Development Guidelines

1. **API Development**: Always use `withApiMiddleware()` wrapper for new API endpoints
   ```typescript
   // Current pattern (most endpoints use this):
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
   
   Available rate limiters:
   - `standard`: 1000 requests per 15 minutes
   - `auth`: 5 attempts per 15 minutes
   - `fileUpload`: 50 uploads per hour
   - `expensive`: 10 operations per hour
   - `bulk`: 5 operations per 10 minutes
   - `report`: 20 reports per 30 minutes

2. **TypeScript**: While strict mode is disabled, aim for type safety. Two files are excluded from checking:
   - `src/app/api/stripe/webhook/route.ts`
   - `src/components/ai/VoiceInterface.tsx`

3. **Before Committing**: Always run `npm run precommit` or `npm run type-check:full` to catch errors
   - Note: TypeScript strict mode is currently disabled - focus on functionality while maintaining reasonable type safety
   - Use `// @ts-ignore` sparingly and only with proper documentation (see TypeScript Strict Mode Guidelines)

4. **Multi-Tenant Architecture**: All data operations must respect organization boundaries

5. **Security**: Never expose secrets, always validate inputs, use CSRF protection

6. **Error Handling**: Use standardized APIError class from middleware

7. **Database Queries**: Always include organizationId in Prisma queries for multi-tenancy

### Environment Variables
Key environment variables needed (see `env.example` for comprehensive list with descriptions):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for caching
- `NEXTAUTH_URL` - Authentication base URL
- `NEXTAUTH_SECRET` - Auth secret key
- `OPENAI_API_KEY` - OpenAI API key for AI features (server-side only, never expose to client)
- `STRIPE_SECRET_KEY` - Stripe API key for billing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret
- `AWS_S3_BUCKET` - S3 bucket for document storage
- `SENDGRID_API_KEY` - Email service API key
- Additional configs for AWS, email, monitoring, and performance optimization

See `env.example` for:
- Advanced performance settings (connection pools, caching, memory management)
- Monitoring and alerting configuration
- Feature flags
- Security settings
- Rate limiting configuration

### Test Credentials
- Email: testuser@riscura.com
- Password: test123

### TypeScript Strict Mode Guidelines
- **Current Status**: Strict mode disabled with ~785 errors across 165 files
- **Use `// @ts-ignore` ONLY with proper documentation**:
  ```typescript
  // @ts-ignore - [REASON]: [DESCRIPTION] - [TRACKING_ID]
  // TODO: [CLEANUP_PLAN] - Target: [DATE/MILESTONE]
  // Related: [ISSUE_LINK] or [TECH_DEBT_ITEM]
  ```
- **Never use for**: New code, legitimate errors, shortcuts, undefined/null references
- **Weekly cleanup targets**: Systematic reduction of TypeScript errors

### Key Configuration Files
- **TypeScript**: `tsconfig.json` - Strict mode disabled, excludes 2 files from type checking
- **Next.js**: `next.config.js` - Performance optimizations, security headers, webpack config
- **Database**: `prisma/schema.prisma` - Multi-tenant PostgreSQL schema
- **Testing**: `jest.config.mjs` - Jest configuration with DOM testing environment
- **Playwright**: `playwright.config.ts` - E2E testing configuration

### Performance Considerations
- Use virtual scrolling for large lists (100+ items)
- Implement code splitting for heavy components
- Leverage Redis caching for expensive operations
- Follow mobile-first responsive design
- Bundle optimization with multiple cache groups in webpack
- Build commands use increased memory allocation for large codebases

### AI Integration Pattern
- AI services are modular and located in `/src/services/ai/`
- Use structured prompt templates
- Implement token usage tracking
- Always have fallback strategies for AI failures
- Support both OpenAI and Anthropic models

### Mobile & PWA Features
- Touch-optimized UI components
- Offline capability with service workers
- Push notification support
- App-like navigation with gesture support

## Current Development Phase

The codebase is in Phase 2 of a multi-phase development plan:
- **Phase 1** (Completed): Initial POC development with focus on rapid iteration
- **Phase 2** (Current): Technical debt resolution and production readiness
  - TypeScript strict mode migration (~785 errors across 165 files)
  - API standardization improvements
  - Performance optimization
  - Security hardening
- **Phase 3** (Planned): Scale optimization and enterprise features

### TypeScript Strict Mode Guidelines

The codebase currently has TypeScript strict mode disabled with ongoing migration efforts. When working with TypeScript:

1. **Using @ts-ignore**: Only use when absolutely necessary with proper documentation:
   ```typescript
   // @ts-ignore - Temporary: [Specific reason, e.g., "Third-party library type mismatch, tracked in issue #123"]
   ```

2. **Do NOT use @ts-ignore for**:
   - Simple type definition fixes
   - Missing imports that can be added
   - Basic null/undefined checks
   - Property access issues fixable with optional chaining (`?.`)

3. **Priority areas for type improvements**:
   - New code should be fully typed
   - API endpoints should use proper request/response types
   - Critical business logic should have comprehensive types