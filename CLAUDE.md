# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev                # Start development server
npm run dev:setup         # Run development setup
npm run dev:check         # Check development environment
```

### Type Checking & Linting
```bash
npm run type-check        # Quick TypeScript check
npm run type-check:full   # Full type check (use before commits)
npm run type-check:watch  # Continuous type checking
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
```

### Building & Production
```bash
npm run build             # Build for production
npm run start             # Start production server
npm run production:ready  # Full production validation
```

### Database
```bash
npm run db:generate       # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database
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

# Run a single test file
npm test -- path/to/test.spec.ts
jest path/to/test.spec.ts --watch
```

### Performance & Security
```bash
npm run performance:analyze  # Bundle analysis
npm run bundle:analyze      # Webpack bundle analyzer
npm run security:check      # Security configuration check
npm run security:audit      # Full security audit
```

## Architecture Overview

### Project Structure
- **Framework**: Next.js 14 App Router with React 18
- **Language**: TypeScript (strict mode currently disabled)
- **Database**: PostgreSQL via Prisma ORM (Supabase hosted)
- **Authentication**: NextAuth.js with SAML/OAuth support
- **Styling**: Tailwind CSS with custom enterprise design system
- **State Management**: React Context API pattern
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

### Critical Development Guidelines

1. **API Development**: Always use `withApiMiddleware()` wrapper for new API endpoints
   ```typescript
   export const POST = withApiMiddleware(async (req) => {
     // Your handler code
   });
   ```

2. **TypeScript**: While strict mode is disabled, aim for type safety. Two files are excluded from checking:
   - `src/app/api/stripe/webhook/route.ts`
   - `src/components/ai/VoiceInterface.tsx`

3. **Before Committing**: Always run `npm run type-check:full` to catch errors

4. **Multi-Tenant Architecture**: All data operations must respect organization boundaries

5. **Security**: Never expose secrets, always validate inputs, use CSRF protection

6. **Error Handling**: Use standardized APIError class from middleware

7. **Database Queries**: Always include organizationId in Prisma queries for multi-tenancy

### Environment Variables
Key environment variables needed (see env.example):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for caching
- `NEXTAUTH_URL` - Authentication base URL
- `NEXTAUTH_SECRET` - Auth secret key
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `STRIPE_SECRET_KEY` - Stripe API key for billing

### Test Credentials
- Email: testuser@riscura.com
- Password: test123

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

## Development Guidelines

### File Structure Conventions
- **API Routes**: Follow Next.js App Router pattern in `/src/app/api/`
- **Components**: Domain-organized in `/src/components/` with UI primitives in `/ui/`
- **Services**: Business logic in `/src/services/` with clear separation of concerns
- **Types**: Shared types in `/src/types/` with domain-specific type files
- **Utils**: Shared utilities in `/src/lib/` with feature-specific subdirectories

### Code Quality Standards
- **TypeScript**: Strict mode disabled but aim for type safety
- **API Endpoints**: Must use `withApiMiddleware()` from `/src/lib/api/middleware.ts`
- **Error Handling**: Use standardized error classes and response formatting
- **Performance**: Implement virtual scrolling for large datasets (100+ items)
- **Caching**: Multi-layer caching with Redis for expensive operations
- **Testing**: Write tests for new features, aim for 80% coverage

### Common Patterns
- **Authentication Check**: Use `getAuthenticatedUser()` from auth middleware
- **Rate Limiting**: Applied automatically via `withApiMiddleware()`
- **Validation**: Use Zod schemas for request validation
- **Response Format**: Use `ApiResponseFormatter` for consistent API responses
- **Error Responses**: Use `globalErrorHandler` for error formatting