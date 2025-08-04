# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Riscura is an enterprise-grade, AI-powered risk management and compliance platform built with Next.js 15.4.5. It's a comprehensive GRC (Governance, Risk, and Compliance) solution designed for enterprise-scale security, performance, and user experience.

## Technology Stack

- **Frontend**: Next.js 15.4.5, React 18, TypeScript 5.5.3, Tailwind CSS, DaisyUI
- **Backend**: Node.js, Prisma ORM 6.13.0, PostgreSQL
- **Authentication**: NextAuth.js 4.24.11
- **AI Integration**: OpenAI GPT-4, Anthropic Claude SDK
- **Caching**: Redis with multi-layer caching strategy
- **State Management**: Zustand, React Context API
- **Testing**: Jest, Playwright, Testing Library
- **Infrastructure**: Docker-ready, Vercel deployment optimized

## Essential Development Commands

### Development
```bash
npm run dev                    # Start development server (port 3000)
npm run dev:setup             # Run initial development setup
npm run dev:check             # Check development environment
```

### Build & Type Checking
```bash
npm run build                 # Production build with memory optimization
npm run build:vercel          # Vercel-optimized build with higher memory
npm run type-check            # Full TypeScript type checking
npm run type-check:quick      # Quick type check (skip lib check)
npm run verify                # Full verification: generate, type-check, lint, build
npm run verify:quick          # Quick verification: generate, lint
```

### Database Commands
```bash
npm run db:generate           # Generate Prisma client
npm run db:push              # Push schema changes to database
npm run db:migrate           # Run database migrations
npm run db:seed              # Seed database with sample data
npm run db:studio            # Open Prisma Studio GUI
```

### Testing
```bash
npm test                     # Run unit tests
npm run test:e2e             # Run Playwright E2E tests
npm run test:coverage        # Run tests with coverage
npm run test:comprehensive   # Run comprehensive test suite
npm run test:auth-flow       # Test authentication flow
```

### Code Quality
```bash
npm run lint                 # Run ESLint
npm run lint:fix             # Auto-fix linting issues
npm run lint:strict          # Strict linting with zero warnings
npm run jsx:validate         # Validate JSX syntax
npm run format               # Format code with Prettier
```

### Performance & Security
```bash
npm run security:check       # Check security configuration
npm run performance:analyze  # Analyze bundle size
npm run audit:security       # Security audit
```

### Deployment
```bash
npm run deploy:pre-check     # Pre-deployment validation
npm run production:ready     # Full production readiness check
```

## High-Level Architecture

### Directory Structure
```
riscura/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   ├── components/          # React components organized by feature
│   │   ├── ai/             # AI-powered components
│   │   ├── compliance/     # Compliance management
│   │   ├── dashboard/      # Dashboard components
│   │   ├── risks/          # Risk management
│   │   └── ui/             # Shared UI components (DaisyUI-based)
│   ├── services/           # Business logic and API integrations
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React Context providers
│   ├── lib/                # Utility functions and configurations
│   └── types/              # TypeScript type definitions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── scripts/                # Build and utility scripts
└── docs/                   # Documentation
```

### Key Architectural Patterns

1. **App Router (Next.js 15)**: Uses the App Router for routing with React Server Components
2. **Multi-Tenant Architecture**: Organization-based data isolation with row-level security
3. **AI Integration Layer**: Centralized AI services with token management and caching
4. **Component Library**: DaisyUI-based design system for consistent UI
5. **Real-time Features**: WebSocket support for live updates and collaboration
6. **Progressive Web App**: Service worker, offline support, and push notifications

### Core Data Models (Prisma)
- **Organization**: Multi-tenant root entity
- **User**: Authentication and authorization
- **Risk**: Risk registry and assessments
- **Control**: Security controls and mitigations
- **ComplianceFramework**: SOC 2, ISO 27001, etc.
- **Document**: Policy and evidence management
- **Workflow**: Automated approval processes

### Authentication Flow
- NextAuth.js with multiple providers (credentials, OAuth)
- JWT-based session management
- Role-based access control (RBAC)
- API key authentication for integrations

### AI Features Architecture
- **AIService**: Core AI integration service
- **Multiple AI Providers**: OpenAI, Anthropic Claude
- **Token Management**: Usage tracking and optimization
- **Context Intelligence**: Smart context extraction for AI queries
- **Caching Layer**: Redis-based AI response caching

### Performance Optimizations
- **Virtual Scrolling**: Handle large datasets efficiently
- **Code Splitting**: Intelligent bundle optimization
- **Image Optimization**: Next.js Image with WebP/AVIF
- **Redis Caching**: Multi-layer caching strategy
- **Database Indexing**: Optimized Prisma queries

### Security Implementation
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: API and authentication rate limits
- **Input Validation**: Zod schema validation
- **Content Security Policy**: Strict CSP headers
- **Encryption**: At-rest and in-transit encryption

## Development Guidelines

### Component Development
- Use DaisyUI components from `src/components/ui/Daisy*.tsx`
- Follow existing patterns in neighboring components
- Implement proper error boundaries
- Add accessibility attributes (ARIA labels)

### State Management
- Use Zustand for global state
- React Context for feature-specific state
- Local state for component-specific data

### API Development
- RESTful API routes in `src/app/api/`
- Use Prisma for database operations
- Implement proper error handling
- Add rate limiting to public endpoints

### Testing Strategy
- Unit tests for utilities and services
- Integration tests for API routes
- E2E tests for critical user flows
- Performance tests for data-heavy features

## Common Issues & Solutions

### Memory Issues During Build
- Use `npm run build:vercel` for higher memory allocation
- Clear cache with `npm run clean`
- Check for circular dependencies

### Type Checking Failures
- Run `npm run db:generate` first
- Use `npm run type-check:quick` for faster checks
- Check for missing type imports

### JSX Syntax Errors
- Run `npm run jsx:validate` to identify issues
- Use `npm run jsx:fix` for auto-fixes
- Check component import/export mismatches

## Environment Variables

Key environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection for caching
- `NEXTAUTH_SECRET`: Authentication secret
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `NEXT_PUBLIC_APP_URL`: Application URL

## Critical Files to Understand

1. **Authentication**: `src/app/api/auth/[...nextauth]/route.ts`
2. **Database Schema**: `prisma/schema.prisma`
3. **AI Integration**: `src/services/AIService.ts`
4. **Main Layout**: `src/app/layout.tsx`
5. **Configuration**: `next.config.js`

## Deployment Notes

- Optimized for Vercel deployment
- TypeScript build errors temporarily ignored (`ignoreBuildErrors: true`)
- Uses standalone output mode
- Implements aggressive code splitting for performance
- Service worker for PWA functionality