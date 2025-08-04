// API Response Caching System for Performance Optimization
// import { redisClient, createCacheKey, hashKey } from './redis-client'
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../monitoring/logger';
import crypto from 'crypto';

export interface APICacheConfig {
  defaultTTL: number;
  maxResponseSize: number;
  enableCompression: boolean;
  enableETag: boolean;
  enableStaleWhileRevalidate: boolean;
  staleTime: number;
  revalidateTime: number;
  varyHeaders: string[];
  excludePatterns: RegExp[];
  includePatterns: RegExp[];
  maxCacheSize: number;
  keyPrefix: string;
  cacheStrategies: Record<string, CacheStrategy>;
  conditionalRequests: boolean;
}

export interface CacheMetadata {
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  ttl: number;
  etag: string;
  contentType: string;
  size: number;
  compressed: boolean;
}

export interface APICacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  staleHits: number;
  revalidations: number;
  compressionSavings: number;
  avgResponseTime: number;
  hitRate: number;
  bandwidthSaved: number;
}

export interface CacheEntry {
  data: any;
  metadata: CacheMetadata;
  compressed: boolean;
}

export interface CacheStrategy {
  ttl: number;
  staleWhileRevalidate?: number;
  maxAge?: number;
  tags?: string[];
  varyHeaders?: string[];
  conditions?: CacheCondition[];
}

export interface CacheCondition {
  header?: string;
  query?: string;
  method?: string;
  pattern?: string;
  value?: any;
}

export interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
  contentType?: string;
  compressed?: boolean;
}

export interface APICacheStats {
  hits: number;
  misses: number;
  stale: number;
  revalidations: number;
  compressionSaved: number;
  avgResponseTime: number;
}

class APICache {
  private static instance: APICache;
  private config: APICacheConfig;
  private metrics: APICacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    staleHits: 0,
    revalidations: 0,
    compressionSavings: 0,
    avgResponseTime: 0,
    hitRate: 0,
    bandwidthSaved: 0,
  };
  private responseTimes: number[] = [];
  private revalidationQueue: Set<string> = new Set();
  private stats: APICacheStats;

  private constructor(_config: Partial<APICacheConfig> = {}) {
    this.config = {
      defaultTTL: 300, // 5 minutes
      maxResponseSize: 1024 * 1024, // 1MB
      enableCompression: true,
      enableETag: true,
      enableStaleWhileRevalidate: true,
      staleTime: 60, // 1 minute stale tolerance
      revalidateTime: 300, // 5 minutes revalidation interval
      varyHeaders: ['authorization', 'accept-language', 'user-agent'],
      excludePatterns: [/\/api\/auth\//, /\/api\/upload\//, /\/api\/websocket\//],
      includePatterns: [
        /\/api\/risks\//,
        /\/api\/compliance\//,
        /\/api\/reports\//,
        /\/api\/dashboard\//,
      ],
      maxCacheSize: 10000,
      keyPrefix: 'api:',
      conditionalRequests: true,
      cacheStrategies: {
        // Static content
        'GET:/api/static/*': {
          ttl: 86400, // 24 hours
          maxAge: 86400,
          tags: ['static'],
        },
        // User data
        'GET:/api/users/*': {
          ttl: 600, // 10 minutes
          staleWhileRevalidate: 300,
          tags: ['users'],
          varyHeaders: ['Authorization'],
        },
        // Dashboard data
        'GET:/api/dashboard/*': {
          ttl: 300, // 5 minutes
          staleWhileRevalidate: 600,
          tags: ['dashboard'],
          varyHeaders: ['Authorization', 'Accept-Language'],
        },
        // Reports
        'GET:/api/reports/*': {
          ttl: 1800, // 30 minutes
          maxAge: 1800,
          tags: ['reports'],
          conditions: [{ query: 'format', value: 'pdf' }],
        },
        // Real-time data
        'GET:/api/realtime/*': {
          ttl: 30, // 30 seconds
          staleWhileRevalidate: 60,
          tags: ['realtime'],
        },
      },
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      stale: 0,
      revalidations: 0,
      compressionSaved: 0,
      avgResponseTime: 0,
    };
  }

  public static getInstance(config?: Partial<APICacheConfig>): APICache {
    if (!APICache.instance) {
      APICache.instance = new APICache(config);
    }
    return APICache.instance;
  }

  // Check if request should be cached
  public shouldCache(_request: NextRequest): boolean {
    const { pathname } = new URL(request.url);
    const method = request.method.toUpperCase();

    // Only cache GET requests by default
    if (method !== 'GET') {
      return false;
    }

    // Check exclude patterns
    if (this.config.excludePatterns.some((pattern) => pattern.test(pathname))) {
      return false;
    }

    // Check include patterns
    if (this.config.includePatterns.length > 0) {
      return this.config.includePatterns.some((pattern) => pattern.test(pathname));
    }

    return true;
  }

  // Generate cache key for request
  public generateCacheKey(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    query: Record<string, any> = {}
  ): string {
    const strategy = this.findMatchingStrategy(method, url);
    const varyHeaders = strategy?.varyHeaders || [];

    const keyData = {
      method: method.toUpperCase(),
      url: this.normalizeURL(url),
      query: this.sortObject(query),
      vary: varyHeaders.reduce(
        (acc, header) => {
          acc[header.toLowerCase()] = headers[header.toLowerCase()];
          return acc;
        },
        {} as Record<string, string>
      ),
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16);

    return `${this.config.keyPrefix}${hash}`;
  }

  private normalizeURL(url: string): string {
    try {
      const parsed = new URL(url, 'http://localhost');
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  }

  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = obj[key];
      });
    return sorted;
  }

  private findMatchingStrategy(method: string, url: string): CacheStrategy | null {
    const key = `${method.toUpperCase()}:${url}`;

    for (const [pattern, strategy] of Object.entries(this.config.cacheStrategies)) {
      if (this.matchesPattern(key, pattern)) {
        return strategy;
      }
    }

    return null;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '\\?');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  // Get cached response
  public async getCachedResponse(_request: NextRequest): Promise<{
    response: NextResponse | null;
    isStale: boolean;
  }> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const cacheKey = this.generateCacheKey(
        request.method,
        request.url,
        request.headers,
        request.query
      );
      const strategy = this.findMatchingStrategy(request.method, request.url);

      const _cached = await redisClient.get<CacheEntry>(cacheKey);

      if (!cached) {
        this.metrics.cacheMisses++;
        logger.cache('get', cacheKey, false, Date.now() - startTime);
        return { response: null, isStale: false };
      }

      const now = Date.now();
      const age = now - cached.metadata.timestamp;
      const isStale = age > cached.metadata.ttl * 1000;
      const isVeryStale = age > (cached.metadata.ttl + this.config.staleTime) * 1000;

      // If very stale, treat as miss
      if (isVeryStale) {
        this.metrics.cacheMisses++;
        await redisClient.delete(cacheKey);
        logger.cache('get', cacheKey, false, Date.now() - startTime);
        return { response: null, isStale: false };
      }

      // If stale but within tolerance, serve stale and revalidate
      if (isStale && this.config.enableStaleWhileRevalidate) {
        this.metrics.staleHits++;
        this.scheduleRevalidation(cacheKey, request);
      } else {
        this.metrics.cacheHits++;
      }

      // Decompress if needed
      let responseData = cached.data;
      if (cached.compressed && this.config.enableCompression) {
        responseData = await this.decompress(cached.data);
      }

      // Create response
      const response = new NextResponse(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': cached.metadata.contentType || 'application/json',
          'Cache-Control': this.generateCacheControlHeader(cached.metadata.ttl, isStale),
          'X-Cache': isStale ? 'STALE' : 'HIT',
          'X-Cache-Age': Math.floor(age / 1000).toString(),
          ...(this.config.enableETag && { ETag: cached.metadata.etag }),
        },
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, cached.metadata.size);

      logger.cache('get', cacheKey, true, Date.now() - startTime);
      return { response, isStale };
    } catch (error) {
      logger.error('API cache get error:', error);
      this.metrics.cacheMisses++;
      return { response: null, isStale: false };
    }
  }

  // Cache response
  public async cacheResponse(
    _request: NextRequest,
    response: NextResponse,
    ttl?: number
  ): Promise<void> {
    try {
      const responseData = await response.clone().json();
      const responseSize = JSON.stringify(responseData).length;

      // Skip caching if response is too large
      if (responseSize > this.config.maxResponseSize) {
        return;
      }

      const cacheKey = this.generateCacheKey(
        request.method,
        request.url,
        request.headers,
        request.query
      );
      const now = Date.now();
      const finalTTL = ttl || this.config.defaultTTL;

      // Generate ETag
      const etag = this.config.enableETag ? `"${hashKey(JSON.stringify(responseData))}"` : '';

      // Compress if enabled and beneficial
      let dataToCache = responseData;
      let compressed = false;
      if (this.config.enableCompression && responseSize > 1024) {
        const compressedData = await this.compress(responseData);
        const compressionRatio = compressedData.length / responseSize;

        if (compressionRatio < 0.8) {
          // Only use if >20% savings
          dataToCache = compressedData;
          compressed = true;
          this.metrics.compressionSavings += responseSize - compressedData.length;
        }
      }

      const metadata: CacheMetadata = {
        url: request.url,
        method: request.method,
        headers: this.extractRelevantHeaders(request),
        timestamp: now,
        ttl: finalTTL,
        etag,
        contentType: response.headers.get('content-type') || 'application/json',
        size: responseSize,
        compressed,
      };

      const cacheEntry: CacheEntry = {
        data: dataToCache,
        metadata,
        compressed,
      };

      // Cache with appropriate tags
      const tags = this.generateCacheTags(request);
      await redisClient.set(cacheKey, cacheEntry, finalTTL, tags);
    } catch (error) {
      logger.error('API cache set error:', error);
    }
  }

  // Invalidate cache by pattern
  public async invalidateByPattern(_pattern: string): Promise<number> {
    return await redisClient.invalidateByTags([pattern]);
  }

  // Invalidate cache by endpoint
  public async invalidateByEndpoint(endpoint: string): Promise<number> {
    const tag = `endpoint:${endpoint}`;
    return await redisClient.invalidateByTags([tag]);
  }

  // Invalidate cache by resource
  public async invalidateByResource(resource: string, id?: string): Promise<number> {
    const tags = id ? [`resource:${resource}:${id}`] : [`resource:${resource}`];
    return await redisClient.invalidateByTags(tags);
  }

  // Warm cache for critical endpoints
  public async warmCache(endpoints: Array<{ url: string; method?: string }>): Promise<void> {
    const promises = endpoints.map(async ({ url, method = 'GET' }) => {
      try {
        const request = new NextRequest(url, { method });

        if (this.shouldCache(request)) {
          const cacheKey = this.generateCacheKey(
            request.method,
            request.url,
            request.headers,
            request.query
          );
          const exists = await redisClient.exists(cacheKey);

          if (!exists) {
            // Trigger background fetch to warm cache
            this.scheduleRevalidation(cacheKey, request);
          }
        }
      } catch (error) {
        logger.error(`Cache warming failed for ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Get cache metrics
  public getMetrics(): APICacheMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      staleHits: 0,
      revalidations: 0,
      compressionSavings: 0,
      avgResponseTime: 0,
      hitRate: 0,
      bandwidthSaved: 0,
    };
    this.responseTimes = [];
  }

  // Private helper methods
  private generateCacheControlHeader(ttl: number, isStale: boolean): string {
    if (isStale) {
      return `public, max-age=0, stale-while-revalidate=${this.config.staleTime}`;
    }
    return `public, max-age=${ttl}, stale-while-revalidate=${this.config.staleTime}`;
  }

  private extractRelevantHeaders(_request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    this.config.varyHeaders.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });
    return headers;
  }

  private generateCacheTags(_request: NextRequest): string[] {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const tags: string[] = [];

    // Add endpoint tag
    tags.push(`endpoint:${url.pathname}`);

    // Add resource tags based on path
    if (pathSegments.length >= 2) {
      const resource = pathSegments[1]; // e.g., 'risks', 'compliance'
      tags.push(`resource:${resource}`);

      // Add specific resource ID if present
      if (pathSegments.length >= 3 && pathSegments[2] !== 'search') {
        tags.push(`resource:${resource}:${pathSegments[2]}`);
      }
    }

    // Add method tag
    tags.push(`method:${request.method.toLowerCase()}`);

    return tags;
  }

  private async compress(_data: any): Promise<string> {
    // Simple compression using JSON stringification + base64
    // In production, consider using gzip or brotli
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString).toString('base64');
  }

  private async decompress(compressedData: string): Promise<any> {
    // Decompress base64 encoded data
    const jsonString = Buffer.from(compressedData, 'base64').toString();
    return JSON.parse(jsonString);
  }

  private scheduleRevalidation(cacheKey: string, request: NextRequest): void {
    if (this.revalidationQueue.has(cacheKey)) {
      return; // Already scheduled
    }

    this.revalidationQueue.add(cacheKey);
    this.metrics.revalidations++;

    // Schedule background revalidation
    setTimeout(async () => {
      try {
        // In a real implementation, this would trigger a background job
        // to fetch fresh data and update the cache
        logger.info(`Revalidating cache for: ${request.url}`);

        // Remove from queue after processing
        this.revalidationQueue.delete(cacheKey);
      } catch (error) {
        logger.error('Cache revalidation error:', error);
        this.revalidationQueue.delete(cacheKey);
      }
    }, 100); // Small delay to batch revalidations
  }

  private updateMetrics(responseTime: number, responseSize: number): void {
    this.responseTimes.push(responseTime);
    this.metrics.bandwidthSaved += responseSize;

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Update averages
    this.metrics.avgResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    const totalRequests =
      this.metrics.cacheHits + this.metrics.cacheMisses + this.metrics.staleHits;
    this.metrics.hitRate =
      totalRequests > 0
        ? ((this.metrics.cacheHits + this.metrics.staleHits) / totalRequests) * 100
        : 0;
  }

  // Handle conditional requests
  public checkConditionalRequest(
    cachedResponse: CachedResponse,
    requestHeaders: Record<string, string>
  ): { status: number; headers: Record<string, string> } | null {
    if (!this.config.conditionalRequests) {
      return null;
    }

    const ifNoneMatch = requestHeaders['if-none-match'];
    const ifModifiedSince = requestHeaders['if-modified-since'];

    // Check ETag
    if (ifNoneMatch && cachedResponse.etag) {
      if (ifNoneMatch === cachedResponse.etag || ifNoneMatch === '*') {
        return {
          status: 304,
          headers: {
            etag: cachedResponse.etag,
            'cache-control': `max-age=${cachedResponse.ttl}`,
          },
        };
      }
    }

    // Check Last-Modified
    if (ifModifiedSince && cachedResponse.lastModified) {
      const modifiedTime = new Date(cachedResponse.lastModified).getTime();
      const requestTime = new Date(ifModifiedSince).getTime();

      if (modifiedTime <= requestTime) {
        return {
          status: 304,
          headers: {
            'last-modified': cachedResponse.lastModified,
            'cache-control': `max-age=${cachedResponse.ttl}`,
          },
        };
      }
    }

    return null;
  }

  // Add cache headers to response
  public addCacheHeaders(
    _response: CachedResponse,
    headers: Record<string, string> = {}
  ): Record<string, string> {
    const age = Math.floor((Date.now() - response.timestamp) / 1000);
    const maxAge = Math.max(0, response.ttl - age);

    return {
      ...headers,
      'cache-control': `public, max-age=${maxAge}`,
      age: age.toString(),
      etag: response.etag || '',
      'last-modified': response.lastModified || '',
      'x-cache': 'HIT',
    };
  }

  // Invalidate cache by tags
  public async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;

    try {
      for (const tag of tags) {
        const keys = await redisClient.smembers(`tag:${tag}`);

        if (keys.length > 0) {
          for (const key of keys) {
            await redisClient.del(key);
            totalInvalidated++;
          }
          await redisClient.del(`tag:${tag}`);
        }
      }

      logger.info(`Invalidated ${totalInvalidated} API cache entries for tags: ${tags.join(', ')}`);
    } catch (error) {
      logger.error('API cache invalidation error:', error);
    }

    return totalInvalidated;
  }

  // Background revalidation
  public async revalidate(
    cacheKey: string,
    revalidateFn: () => Promise<{
      data: any;
      headers: Record<string, string>;
      status: number;
    }>
  ): Promise<void> {
    if (this.revalidationQueue.has(cacheKey)) {
      return;
    }

    this.revalidationQueue.add(cacheKey);
    this.metrics.revalidations++;

    try {
      const response = await revalidateFn();
      // The cache key needs to be reconstructed from the original request
      // This is a simplified version - in practice, you'd store request metadata
      logger.info(`Revalidated cache entry: ${cacheKey}`);
    } catch (error) {
      logger.error(`Revalidation failed for ${cacheKey}:`, error);
    } finally {
      this.revalidationQueue.delete(cacheKey);
    }
  }

  // Purge cache
  public async purge(pattern?: string): Promise<number> {
    try {
      const fullPattern = pattern
        ? `${this.config.keyPrefix}${pattern}`
        : `${this.config.keyPrefix}*`;

      const invalidated = await redisClient.invalidatePattern(fullPattern);
      logger.info(`Purged ${invalidated} API cache entries`);
      return invalidated;
    } catch (error) {
      logger.error('API cache purge error:', error);
      return 0;
    }
  }

  // Get cache statistics
  public getStats(): APICacheStats {
    return { ...this.stats };
  }

  // Get cache hit ratio
  public getHitRatio(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses + this.metrics.staleHits;
    return total > 0 ? ((this.metrics.cacheHits + this.metrics.staleHits) / total) * 100 : 0;
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const redisHealthy = await redisClient.ping();
      const hitRatio = this.getHitRatio();

      return {
        status: redisHealthy ? 'healthy' : 'unhealthy',
        details: {
          redis: redisHealthy,
          hitRatio,
          revalidationQueue: this.revalidationQueue.size,
          compressionSaved: this.metrics.compressionSavings,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }
}

// Export singleton instance
export const apiCache = APICache.getInstance();

// Export class for custom instances
export { APICache };

// Middleware function for Next.js API routes
export const withAPICache = (
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<APICacheConfig> = {}
) => {
  const cache = new APICache(options);

  return async (_request: NextRequest): Promise<NextResponse> => {
    // Check if request should be cached
    if (!cache.shouldCache(request)) {
      return handler(request);
    }

    // Try to get cached response
    const { response: cachedResponse, isStale } = await cache.getCachedResponse(request);

    if (cachedResponse && !isStale) {
      return cachedResponse;
    }

    // Execute handler and cache response
    const response = await handler(request);

    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      await cache.cacheResponse(request, response);
    }

    // Add cache headers
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'MISS');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
};

// Utility functions for common invalidation patterns
export const invalidateUserAPI = async (userId?: string): Promise<number> => {
  const patterns = userId
    ? [`resource:users:${userId}`, 'endpoint:/api/users']
    : ['resource:users', 'endpoint:/api/users'];

  return await redisClient.invalidateByTags(patterns);
};

export const invalidateRiskAPI = async (riskId?: string): Promise<number> => {
  const patterns = riskId
    ? [`resource:risks:${riskId}`, 'endpoint:/api/risks']
    : ['resource:risks', 'endpoint:/api/risks'];

  return await redisClient.invalidateByTags(patterns);
};

export const invalidateComplianceAPI = async (complianceId?: string): Promise<number> => {
  const patterns = complianceId
    ? [`resource:compliance:${complianceId}`, 'endpoint:/api/compliance']
    : ['resource:compliance', 'endpoint:/api/compliance'];

  return await redisClient.invalidateByTags(patterns);
};
