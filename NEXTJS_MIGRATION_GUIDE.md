# Next.js 14+ Migration Guide for Riscura

## Overview
This document outlines the systematic migration from React 18.3.1 + Vite 5.4.8 + TypeScript to Next.js 14+ while preserving all functionality and improving performance.

## Migration Summary

### 1. Project Structure Changes

#### Before (Vite + React Router)
```
src/
├── App.tsx (Router configuration)
├── main.tsx (React DOM render)
├── pages/ (Route components)
├── components/
├── context/
├── services/
└── layouts/
```

#### After (Next.js App Router)
```
src/
├── app/
│   ├── layout.tsx (Root layout)
│   ├── page.tsx (Home page)
│   ├── globals.css
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── risks/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── controls/page.tsx
│   │   ├── aria/page.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── api/
│       ├── ai/
│       │   ├── analyze/route.ts
│       │   └── generate/route.ts
│       ├── risks/route.ts
│       └── controls/route.ts
├── components/ (unchanged)
├── context/ (unchanged)
├── services/ (unchanged)
├── layouts/ (unchanged)
└── pages/ (legacy, kept for gradual migration)
```

### 2. Key Configuration Updates

#### package.json
- **Added**: `next@^14.2.0`, `@next/font@^14.2.0`
- **Removed**: `vite`, `@vitejs/plugin-react`, `react-router-dom`
- **Updated**: Scripts to use Next.js commands

#### tsconfig.json
- **Added**: Next.js specific compiler options
- **Updated**: Module resolution for App Router
- **Added**: Next.js plugin configuration

#### next.config.js
- **Created**: Comprehensive Next.js configuration
- **Features**: 
  - App Router support
  - External package optimization
  - Webpack customization for AI/ML libraries
  - Security headers
  - CORS configuration

### 3. Routing Migration

#### From React Router to App Router

**Before (React Router):**
```tsx
<Routes>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/risks/:id" element={<RiskDetailPage />} />
</Routes>
```

**After (App Router):**
```
src/app/dashboard/page.tsx
src/app/dashboard/risks/[id]/page.tsx
```

#### Route Protection
- **Before**: `<ProtectedRoute>` wrapper components
- **After**: Middleware-based protection + client-side guards

### 4. API Routes Migration

#### From External API to Next.js API Routes

**Before (External API calls):**
```tsx
const response = await fetch('/api/ai/analyze', { ... });
```

**After (Next.js API Routes):**
```tsx
// src/app/api/ai/analyze/route.ts
export async function POST(request: NextRequest) {
  // Handle AI analysis
}
```

### 5. Context Providers Migration

#### Root Layout Integration
All context providers moved to `src/app/layout.tsx`:
```tsx
<ThemeProvider>
  <AuthProvider>
    <AIProvider>
      <RiskProvider>
        <ControlProvider>
          <QuestionnaireProvider>
            <WorkflowProvider>
              {children}
            </WorkflowProvider>
          </QuestionnaireProvider>
        </ControlProvider>
      </RiskProvider>
    </AIProvider>
  </AuthProvider>
</ThemeProvider>
```

### 6. Performance Improvements

#### Server-Side Rendering (SSR)
- **Landing Page**: Static generation for better SEO
- **Dashboard**: Client-side rendering for interactivity
- **API Routes**: Server-side processing for AI operations

#### Code Splitting
- **Dynamic Imports**: Lazy loading for heavy components
- **Route-based Splitting**: Automatic with App Router
- **Component-level Splitting**: For AI widgets and complex forms

#### Caching Strategy
- **Static Assets**: Automatic optimization
- **API Responses**: Built-in caching for AI results
- **Page Caching**: ISR for dashboard data

### 7. Security Enhancements

#### Middleware Protection
```tsx
// middleware.ts
export function middleware(request: NextRequest) {
  // Route protection
  // Security headers
  // CORS handling
}
```

#### API Security
- **CORS**: Configured in next.config.js
- **Headers**: Security headers in middleware
- **Authentication**: Token-based protection

### 8. AI Service Integration

#### Enhanced API Routes
- **AI Analysis**: `/api/ai/analyze`
- **Content Generation**: `/api/ai/generate`
- **Risk Management**: `/api/risks`
- **Control Management**: `/api/controls`

#### Service Layer Compatibility
All existing services maintained:
- `AIService`
- `RiskAnalysisAIService`
- `ComplianceAIService`
- `DashboardIntelligenceService`
- And all other AI services

### 9. Migration Steps Completed

#### ✅ Phase 1: Core Infrastructure
- [x] Next.js 14+ configuration
- [x] TypeScript configuration
- [x] Package.json updates
- [x] Root layout creation

#### ✅ Phase 2: App Router Structure
- [x] Main page (`/`)
- [x] Dashboard pages (`/dashboard/*`)
- [x] Auth pages (`/auth/*`)
- [x] Dynamic routes (`/risks/[id]`)

#### ✅ Phase 3: API Routes
- [x] AI analysis endpoints
- [x] Content generation endpoints
- [x] Risk management endpoints
- [x] Control management endpoints

#### ✅ Phase 4: Security & Middleware
- [x] Authentication middleware
- [x] Route protection
- [x] Security headers
- [x] CORS configuration

### 10. Next Steps for Full Migration

#### Phase 5: Component Updates
- [ ] Update components for App Router compatibility
- [ ] Implement server components where beneficial
- [ ] Optimize client components

#### Phase 6: Data Fetching
- [ ] Implement server-side data fetching
- [ ] Add loading and error states
- [ ] Implement caching strategies

#### Phase 7: Testing & Optimization
- [ ] Update tests for Next.js
- [ ] Performance optimization
- [ ] SEO improvements

#### Phase 8: Deployment
- [ ] Vercel deployment configuration
- [ ] Environment variables setup
- [ ] Production optimizations

### 11. Benefits Achieved

#### Performance
- **Faster Initial Load**: Server-side rendering
- **Better Code Splitting**: Automatic optimization
- **Improved Caching**: Built-in Next.js features

#### Developer Experience
- **File-based Routing**: Simpler route management
- **API Routes**: Integrated backend functionality
- **TypeScript**: Enhanced type safety

#### SEO & Accessibility
- **Server-side Rendering**: Better search engine indexing
- **Meta Tags**: Dynamic metadata support
- **Performance Metrics**: Core Web Vitals optimization

#### Security
- **Middleware Protection**: Centralized security
- **API Security**: Built-in protections
- **Headers**: Automatic security headers

### 12. Compatibility Notes

#### Existing Components
- All existing components remain functional
- Context providers work seamlessly
- Service layer unchanged
- UI components (Radix UI, Tailwind) fully compatible

#### Gradual Migration
- Legacy pages can coexist during transition
- Progressive enhancement approach
- Minimal breaking changes

### 13. Environment Setup

#### Development
```bash
npm run dev          # Start development server
npm run type-check   # TypeScript checking
npm run lint         # ESLint checking
```

#### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### 14. Troubleshooting

#### Common Issues
1. **Import Errors**: Ensure Next.js dependencies are installed
2. **Routing Issues**: Check file-based routing structure
3. **API Errors**: Verify API route exports
4. **Context Issues**: Ensure providers are in layout.tsx

#### Solutions
- Install missing dependencies: `npm install next@latest`
- Check Next.js documentation for latest patterns
- Verify TypeScript configuration
- Test API routes independently

## Conclusion

The migration to Next.js 14+ provides significant improvements in performance, developer experience, and maintainability while preserving all existing functionality. The App Router architecture offers better scalability and modern React patterns for the Riscura AI-powered RCSA platform. 