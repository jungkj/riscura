# Redis Caching Integration Guide

## Overview

This document outlines the comprehensive Redis caching implementation for the Riscura platform, providing enterprise-grade performance optimization through multi-layer caching strategies.

## Architecture

### Cache Layer Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Memory Cache (1-10ms)                            │
│ - In-process memory storage                                 │
│ - Fastest access times                                      │
│ - Limited capacity (1000 entries max)                      │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Redis Cache (10-50ms)                            │
│ - Distributed caching                                       │
│ - Compression & serialization                              │
│ - Smart invalidation & prefetching                         │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Database (100-500ms)                             │
│ - PostgreSQL with optimized indexes                        │
│ - Primary data source                                       │
│ - Fallback when cache misses                               │
└─────────────────────────────────────────────────────────────┘
```

### Cache Components

1. **Enhanced Cache Layer** - Multi-tier caching with intelligent prefetching
2. **API Response Cache** - HTTP response caching with compression
3. **Session Cache** - User session and authentication data
4. **Query Cache** - Database query result caching
5. **Static Cache** - Long-lived reference data

## Implementation

### 1. Redis Client Configuration

```typescript
// Located in: src/lib/cache/redis-client.ts
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Performance settings
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetriesPerRequest: 3,
  
  // Production cluster support
  enableOfflineQueue: false,
  maxMemoryPolicy: 'allkeys-lru',
};
```

### 2. Multi-Layer Cache Usage

```typescript
import { enhancedCache } from '@/lib/cache/enhanced-cache-layer';

// Get with automatic fallback through cache layers
const userData = await enhancedCache.get(
  `org:${orgId}:user:${userId}`,
  async () => {
    // Fetcher function - only called on cache miss
    return await db.user.findUnique({ where: { id: userId } });
  },
  { 
    ttl: 600, // 10 minutes
    tags: ['users', `org:${orgId}`],
    priority: 'high'
  }
);

// Bulk operations for efficiency
const userMap = await enhancedCache.bulkGet([
  `org:${orgId}:user:1`,
  `org:${orgId}:user:2`,
  `org:${orgId}:user:3`
]);
```

### 3. API Response Caching

```typescript
import { withAPICache } from '@/lib/cache/api-cache';

// Apply caching to API routes
export const GET = withAPICache(
  async (request: NextRequest) => {
    // Your API handler
    return NextResponse.json(data);
  },
  {
    defaultTTL: 300, // 5 minutes
    enableCompression: true,
    enableStaleWhileRevalidate: true,
  }
);
```

### 4. Smart Invalidation

```typescript
// Invalidate related cache entries automatically
await enhancedCache.invalidateSmartly('risk', riskId, organizationId);

// This invalidates:
// - org:${orgId}:risk:${riskId}:*
// - org:${orgId}:dashboard:*
// - org:${orgId}:risks:metrics
// - org:${orgId}:compliance:*
// - org:${orgId}:activities:*
```

## Cache Strategies by Data Type

### User Data
- **TTL**: 30 minutes
- **Strategy**: Multi-layer with prefetching
- **Invalidation**: On user updates, role changes
- **Tags**: `users`, `org:${orgId}`

```typescript
const userCache = new CacheManager({
  prefix: 'riscura:user',
  ttl: 1800, // 30 minutes
});
```

### Dashboard Metrics
- **TTL**: 5 minutes
- **Strategy**: Stale-while-revalidate
- **Invalidation**: On data changes affecting metrics
- **Tags**: `dashboard`, `metrics`

```typescript
// Cache key pattern: org:${orgId}:dashboard:metrics
{
  ttl: 300,
  staleWhileRevalidate: 600,
  tags: ['dashboard', 'metrics'],
}
```

### Risk Data
- **TTL**: 10 minutes
- **Strategy**: Multi-layer with smart invalidation
- **Invalidation**: On risk CRUD operations
- **Tags**: `risks`, `org:${orgId}`

```typescript
// Individual risk: org:${orgId}:risk:${riskId}
// Risk list: org:${orgId}:risks:list:${filters_hash}
// Risk metrics: org:${orgId}:risks:metrics
```

### Static Reference Data
- **TTL**: 24 hours
- **Strategy**: Long-term caching
- **Invalidation**: Manual or on system updates
- **Tags**: `static`, `reference`

```typescript
// Examples:
// - static:subscription:plans
// - static:risk:categories
// - static:compliance:frameworks
```

### Billing Data
- **TTL**: 10 minutes
- **Strategy**: Critical data with short TTL
- **Invalidation**: On subscription changes
- **Tags**: `billing`, `subscription`

```typescript
// Cache patterns:
// - org:${orgId}:billing:status
// - org:${orgId}:subscription:limits
// - org:${orgId}:usage:current
```

## Performance Optimization Features

### 1. Intelligent Prefetching

The system automatically prefetches related data based on access patterns:

```typescript
// When user data is accessed, prefetch:
// - Organization details
// - User permissions
// - Recent activities
// - Dashboard metrics
```

### 2. Compression Optimization

Automatic compression for responses > 1KB with 20%+ savings:

```typescript
const compressionConfig = {
  threshold: 1024, // 1KB
  minSavings: 0.2, // 20%
  algorithm: 'base64', // or gzip/brotli
};
```

### 3. Cache Warming

Critical endpoints are pre-warmed on application startup:

```typescript
const warmupEndpoints = [
  '/api/dashboard/metrics',
  '/api/organizations/current',
  '/api/users/profile',
  '/api/risks/summary',
  '/api/compliance/status',
];
```

### 4. Stale-While-Revalidate

Serve stale content immediately while refreshing in background:

```typescript
{
  ttl: 300,           // Fresh for 5 minutes
  staleTime: 60,      // Serve stale for 1 minute
  revalidateTime: 300 // Background refresh after 5 minutes
}
```

## Monitoring and Metrics

### Cache Metrics

```typescript
const metrics = enhancedCache.getMetrics();
// {
//   totalRequests: 10000,
//   l1Hits: 3000,        // 30% memory hit rate
//   l2Hits: 5000,        // 50% Redis hit rate
//   misses: 2000,        // 20% miss rate
//   prefetchHits: 500,   // Prefetch effectiveness
//   compressionSaved: 1024000, // Bytes saved
//   avgResponseTime: 25, // Average cache response time
//   hitRate: 80          // Overall hit rate
// }
```

### Health Monitoring

```typescript
const health = await enhancedCache.getHealthStatus();
// {
//   status: 'healthy',
//   redis: true,
//   memory: true,
//   hitRate: 85.5,
//   avgResponseTime: 23,
//   compressionSaved: 2048000,
//   prefetchQueue: 5,
//   warmupInProgress: false
// }
```

### Performance Dashboards

Key metrics to monitor:
- **Hit Rate**: Target > 80%
- **Response Time**: Target < 50ms
- **Memory Usage**: Monitor Redis memory consumption
- **Compression Ratio**: Track bandwidth savings
- **Invalidation Rate**: Monitor cache churn

## Environment Configuration

### Development
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
CACHE_TTL_DEFAULT=300
CACHE_ENABLE_COMPRESSION=true
CACHE_ENABLE_PREFETCHING=true
```

### Production
```env
REDIS_HOST=redis-cluster.riscura.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_password
REDIS_DB=0
CACHE_TTL_DEFAULT=300
CACHE_ENABLE_COMPRESSION=true
CACHE_ENABLE_PREFETCHING=true
CACHE_MAX_MEMORY_POLICY=allkeys-lru
```

## Best Practices

### 1. Cache Key Design
- Use consistent naming patterns
- Include organization ID for multi-tenancy
- Use meaningful prefixes and separators
- Example: `org:${orgId}:${resource}:${id}:${action}`

### 2. TTL Strategy
- Short TTL (1-5 min): Frequently changing data
- Medium TTL (10-30 min): User-specific data
- Long TTL (1-24 hours): Static reference data
- Very Long TTL (1+ days): Rarely changing system data

### 3. Invalidation Patterns
- Invalidate specific keys when possible
- Use pattern-based invalidation for related data
- Implement smart invalidation for complex dependencies
- Monitor invalidation rates to prevent cache churn

### 4. Error Handling
- Always provide fallback to database
- Log cache errors but don't fail requests
- Use circuit breaker pattern for Redis failures
- Implement graceful degradation

### 5. Security Considerations
- Never cache sensitive data (passwords, tokens)
- Use encryption for sensitive cached data
- Implement proper access controls
- Regular security audits of cached data

## Troubleshooting

### Common Issues

1. **High Miss Rate**
   - Check TTL configuration
   - Verify cache key consistency
   - Monitor invalidation patterns
   - Review prefetching effectiveness

2. **Slow Cache Performance**
   - Check Redis memory usage
   - Monitor network latency
   - Review compression settings
   - Optimize serialization

3. **Memory Issues**
   - Implement LRU eviction policy
   - Monitor cache size growth
   - Adjust TTL for large objects
   - Use compression for large payloads

4. **Inconsistent Data**
   - Review invalidation logic
   - Check for race conditions
   - Verify cache coherence
   - Implement proper locking

### Performance Tuning

1. **Redis Configuration**
   - Tune memory allocation
   - Configure appropriate eviction policy
   - Optimize network settings
   - Monitor connection pooling

2. **Application Level**
   - Batch cache operations
   - Use bulk get/set operations
   - Implement proper error handling
   - Monitor cache hit rates

3. **Infrastructure**
   - Use Redis cluster for scalability
   - Implement read replicas
   - Monitor network latency
   - Consider memory optimization

## Migration Guide

### From No Caching

1. **Phase 1**: Implement basic Redis caching
2. **Phase 2**: Add API response caching
3. **Phase 3**: Implement multi-layer caching
4. **Phase 4**: Add intelligent features (prefetching, compression)

### From Simple Caching

1. **Assess Current Implementation**
2. **Migrate to Enhanced Cache Layer**
3. **Implement Smart Invalidation**
4. **Add Performance Monitoring**

## Conclusion

The Redis caching implementation provides enterprise-grade performance optimization with:

- **Multi-layer caching** for optimal performance
- **Intelligent prefetching** for predictive loading
- **Smart invalidation** for data consistency
- **Comprehensive monitoring** for operational visibility
- **Automatic compression** for bandwidth optimization
- **Graceful degradation** for high availability

This system significantly improves application performance, reduces database load, and provides a scalable foundation for growth.

---

**Last Updated**: July 4, 2024
**Next Review**: August 4, 2024