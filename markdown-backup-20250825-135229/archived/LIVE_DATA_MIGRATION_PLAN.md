# Live Data Migration Plan

## Overview
This document outlines the comprehensive plan to ensure all frontend components in the Riscura application are efficiently connected to the backend database using real, live data instead of mock data.

## Current State Analysis

### ✅ What's Working (Already Using Live Data)
- **API Endpoints**: Comprehensive and working
  - `/api/dashboard` - Dashboard metrics and analytics
  - `/api/risks` - Risk management with filtering/pagination
  - `/api/controls` - Control management with advanced filtering
  - `/api/questionnaires` - Questionnaire management
  - `/api/documents` - Document management
  - `/api/users` - User management
  - `/api/auth` - Authentication system

- **Data Fetching Infrastructure**:
  - `use-live-data.ts` - Enhanced hooks with caching
  - `RiskContext` - Properly fetches real data
  - Database schema - Comprehensive Prisma models

### ❌ Issues Found (Still Using Mock Data)

#### 1. Components Using Mock Data
- `src/components/questionnaires/EnhancedQuestionnaireList.tsx` - Uses `mockQuestionnaires`
- `src/components/ai/AIInsightsWidget.tsx` - Uses `generateMockMetrics()`
- `src/components/ai/AISecurityDashboard.tsx` - Uses `generateMockSecurityTrends()`
- `src/components/ai/SmartInsights.tsx` - Uses `generateMockInsights()`
- `src/components/ai/CustomModelTrainingDashboard.tsx` - Multiple mock generators
- `src/components/questionnaires/AnalyticsDashboard.tsx` - Uses `generateMockData()`
- `src/pages/ai/AIInsightsPage.tsx` - Uses `generateMockData()`
- `src/pages/ai/DocumentAnalysisPage.tsx` - Uses `generateMockResults()`

#### 2. Context Providers with Mock Fallbacks
- `src/context/ControlContext.tsx` - Has mock data fallback
- `src/context/QuestionnaireContext.tsx` - Has mock data fallback
- `src/context/WorkflowContext.tsx` - Uses `generateMockWorkflows()`

#### 3. Missing API Endpoints
- `/api/analytics` - Needed for dashboard analytics
- `/api/workflows` - Workflow management
- `/api/ai/insights` - AI-powered insights
- `/api/ai/security` - AI security analytics

## Implementation Plan

### Phase 1: API Endpoints (COMPLETED)
- ✅ Enhanced `use-live-data.ts` with caching and error handling
- ✅ Created `/api/analytics` endpoint
- ✅ Created `/api/analytics/[type]` dynamic endpoint

### Phase 2: Component Migration

#### A. High Priority Components (Data Display)
1. **EnhancedQuestionnaireList** ✅ 
   ```typescript
   // BEFORE: Uses mockQuestionnaires
   const [questionnaires, setQuestionnaires] = useState<EnhancedQuestionnaire[]>(mockQuestionnaires);
   
   // AFTER: Uses live data
   const { data: questionnairesData, loading, error } = useQuestionnairesData();
   ```

2. **DashboardGrid** ✅
   ```typescript
   // BEFORE: Has duplicate data state
   const [data, setData] = useState<DashboardData | null>(null);
   
   // AFTER: Uses data prop
   const dashboardData = data;
   ```

3. **AIInsightsWidget**
   ```typescript
   // TODO: Replace generateMockMetrics() with useAnalyticsData('ai-insights')
   const { data: aiMetrics } = useAnalyticsData('ai-insights');
   ```

#### B. Context Providers
1. **ControlContext** ✅
   ```typescript
   // BEFORE: Had mock data fallback
   return generateMockControls();
   
   // AFTER: Only returns real data
   return controls;
   ```

2. **QuestionnaireContext** ✅
   ```typescript
   // BEFORE: generateMockQuestionnaires()
   // AFTER: Direct API calls
   const response = await fetch('/api/questionnaires');
   ```

### Phase 3: AI Components

#### Components to Update:
1. **AISecurityDashboard**
   - Replace `generateMockSecurityTrends()` with `useAnalyticsData('security')`
   - Replace `generateMockSecurityEvents()` with `useAnalyticsData('security-events')`

2. **SmartInsights**
   - Replace `generateMockInsights()` with `useAnalyticsData('insights')`

3. **CustomModelTrainingDashboard**
   - Replace all mock generators with appropriate API calls

### Phase 4: Analytics Components

#### Components to Update:
1. **AnalyticsDashboard**
   - Replace `generateMockData()` with `useAnalyticsData('questionnaire-analytics')`

2. **AIInsightsPage**
   - Replace mock data with real AI insights from API

3. **DocumentAnalysisPage**
   - Replace `generateMockResults()` with document analysis API

## Required API Endpoints

### 1. AI Insights API
```typescript
// POST /api/ai/insights
// GET /api/ai/insights
// GET /api/ai/insights/[type]
```

### 2. Security Analytics API
```typescript
// GET /api/analytics/security
// GET /api/analytics/security-events
```

### 3. Workflow API
```typescript
// GET /api/workflows
// POST /api/workflows
// PUT /api/workflows/[id]
// DELETE /api/workflows/[id]
```

## Data Flow Optimization

### 1. Caching Strategy
- ✅ Implemented in-memory cache in `use-live-data.ts`
- ✅ Configurable stale time per endpoint
- ✅ Cache invalidation on mutations

### 2. Error Handling
- ✅ Comprehensive error states
- ✅ Fallback to cached data when available
- ✅ Retry mechanisms

### 3. Loading States
- ✅ Skeleton loading components
- ✅ Progressive loading for better UX
- ✅ Background refresh without loading states

## Performance Optimizations

### 1. Data Fetching
- ✅ Parallel API calls where possible
- ✅ Request deduplication
- ✅ Automatic cleanup of aborted requests

### 2. Component Optimization
- ✅ Memoization of expensive computations
- ✅ Lazy loading of heavy components
- ✅ Virtual scrolling for large lists

### 3. Bundle Optimization
- Remove unused mock data generators
- Tree-shake unused utilities
- Optimize imports

## Testing Strategy

### 1. Unit Tests
- Test data fetching hooks
- Test component behavior with real data
- Test error handling scenarios

### 2. Integration Tests
- Test API endpoint functionality
- Test data flow through components
- Test caching behavior

### 3. End-to-End Tests
- Test complete user workflows
- Test performance under load
- Test offline scenarios

## Migration Checklist

### Immediate Actions (High Priority)
- [ ] Update AIInsightsWidget to use real data
- [ ] Update AISecurityDashboard to use real data
- [ ] Update SmartInsights component
- [ ] Create missing AI insights API endpoints
- [ ] Update AnalyticsDashboard component

### Short Term (Medium Priority)
- [ ] Update CustomModelTrainingDashboard
- [ ] Create workflow API endpoints
- [ ] Update WorkflowContext
- [ ] Remove mock data generators from codebase

### Long Term (Low Priority)
- [ ] Implement real-time data updates
- [ ] Add offline data synchronization
- [ ] Implement advanced caching strategies
- [ ] Add data compression for large datasets

## Monitoring and Maintenance

### 1. Performance Monitoring
- Track API response times
- Monitor cache hit rates
- Watch for memory leaks

### 2. Error Monitoring
- Track API error rates
- Monitor failed data fetches
- Alert on critical failures

### 3. Usage Analytics
- Track most used endpoints
- Monitor data usage patterns
- Optimize based on usage

## Environment Configuration

### Development
```bash
MOCK_DATA=false
DATABASE_URL=postgresql://...
```

### Production
```bash
MOCK_DATA=false
DATABASE_URL=postgresql://...
```

## Rollback Plan

1. **Immediate Rollback**: Set `MOCK_DATA=true` in environment
2. **Component Rollback**: Revert individual components to mock data
3. **Database Rollback**: Restore database if needed

## Success Metrics

- [ ] 100% of components using live data
- [ ] Zero mock data generators in production builds
- [ ] API response times < 200ms
- [ ] Cache hit rate > 80%
- [ ] Zero data-related errors in production

## Next Steps

1. **Complete AI component migration** (Priority 1)
2. **Create missing API endpoints** (Priority 1)
3. **Remove mock data generators** (Priority 2)
4. **Implement real-time updates** (Priority 3)
5. **Add comprehensive monitoring** (Priority 3) 