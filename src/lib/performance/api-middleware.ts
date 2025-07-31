import { NextRequest, NextResponse } from 'next/server';
import { apiMonitor } from './monitoring';

// ============================================================================
// PERFORMANCE MIDDLEWARE
// ============================================================================

interface PerformanceOptions {
  enableCompression?: boolean;
  enableCaching?: boolean;
  cacheTTL?: number;
  enableProfiling?: boolean;
}

export function withPerformance(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: PerformanceOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const url = new URL(req.url);
    const endpoint = `${req.method} ${url.pathname}`;

    try {
      // Execute the handler
      const response = await handler(req);

      // Track performance
      const duration = performance.now() - startTime;
      apiMonitor.trackRequest(endpoint, duration);

      // Add performance headers
      const enhancedResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      enhancedResponse.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
      enhancedResponse.headers.set('X-Powered-By', 'RISCURA');

      // Add caching headers if enabled
      if (options.enableCaching && req.method === 'GET') {
        const ttl = options.cacheTTL || 300; // 5 minutes default
        enhancedResponse.headers.set('Cache-Control', `public, max-age=${ttl}`);
        enhancedResponse.headers.set('ETag', generateETag(response.body));
      }

      // Add compression headers
      if (options.enableCompression) {
        enhancedResponse.headers.set('Content-Encoding', 'gzip');
      }

      return enhancedResponse;
    } catch (error) {
      const duration = performance.now() - startTime;
      apiMonitor.trackRequest(`${endpoint} (ERROR)`, duration);

      console.error(`API Error in ${endpoint} after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}

// ============================================================================
// RESPONSE OPTIMIZATION
// ============================================================================

export function optimizeResponse(
  data: any,
  options: {
    fields?: string[];
    limit?: number;
    compress?: boolean;
  } = {}
) {
  let optimizedData = data;

  // Field selection (GraphQL-style)
  if (options.fields && Array.isArray(data)) {
    optimizedData = data.map((item) => selectFields(item, options.fields!));
  } else if (options.fields && typeof data === 'object') {
    optimizedData = selectFields(data, options.fields);
  }

  // Limit results
  if (options.limit && Array.isArray(optimizedData)) {
    optimizedData = optimizedData.slice(0, options.limit);
  }

  return optimizedData;
}

function selectFields(obj: any, fields: string[]): any {
  const result: any = {};
  for (const field of fields) {
    if (field.includes('.')) {
      // Nested field selection
      const [parent, ...nested] = field.split('.');
      if (obj[parent]) {
        if (!result[parent]) result[parent] = {};
        result[parent] = { ...result[parent], ...selectFields(obj[parent], [nested.join('.')]) };
      }
    } else {
      if (obj[field] !== undefined) {
        result[field] = obj[field];
      }
    }
  }
  return result;
}

// ============================================================================
// PAGINATION OPTIMIZATION
// ============================================================================

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
}

export function optimizePagination(options: PaginationOptions) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(options.maxPageSize || 100, Math.max(1, options.pageSize || 20));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: { page: number; pageSize: number }
) {
  const { page, pageSize } = pagination;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ============================================================================
// COMPRESSION UTILITIES
// ============================================================================

export function shouldCompress(req: NextRequest): boolean {
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  return acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate');
}

export function generateETag(content: any): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  // Simple hash function for ETag
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

// ============================================================================
// RATE LIMITING FOR PERFORMANCE
// ============================================================================

class RateLimiter {
  private requests = new Map<string, Array<{ timestamp: number; count: number }>>();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const keyRequests = this.requests.get(key)!;

    // Remove old requests outside the window
    const validRequests = keyRequests.filter((req) => req.timestamp > windowStart);
    this.requests.set(key, validRequests);

    // Count total requests in window
    const totalRequests = validRequests.reduce((sum, req) => sum + req.count, 0);

    if (totalRequests >= limit) {
      return false;
    }

    // Add current request
    validRequests.push({ timestamp: now, count: 1 });
    return true;
  }

  getRemainingRequests(key: string, limit: number, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    const keyRequests = this.requests.get(key) || [];
    const validRequests = keyRequests.filter((req) => req.timestamp > windowStart);
    const totalRequests = validRequests.reduce((sum, req) => sum + req.count, 0);

    return Math.max(0, limit - totalRequests);
  }
}

export const rateLimiter = new RateLimiter();

// ============================================================================
// HEALTH CHECK UTILITIES
// ============================================================================

export async function getPerformanceHealth() {
  const stats = apiMonitor.getMetrics();

  return {
    timestamp: new Date().toISOString(),
    endpoints: Object.keys(stats).length,
    averageResponseTime:
      Object.values(stats).reduce((sum: number, stat: any) => {
        return sum + (stat?.avg || 0);
      }, 0) / Object.keys(stats).length,
    slowEndpoints: Object.entries(stats)
      .filter(([, stat]: [string, any]) => stat?.avg > 1000)
      .map(([endpoint]) => endpoint),
  };
}

// ============================================================================
// LAZY LOADING HELPERS
// ============================================================================

export function createLazyLoader<T>(
  loadFn: () => Promise<T>,
  ttl = 300000 // 5 minutes
) {
  let cache: { data: T; expires: number } | null = null;
  let loading: Promise<T> | null = null;

  return async (): Promise<T> => {
    // Return cached data if valid
    if (cache && Date.now() < cache.expires) {
      return cache.data;
    }

    // Return existing loading promise if in progress
    if (loading) {
      return loading;
    }

    // Start loading
    loading = loadFn();

    try {
      const data = await loading;
      cache = {
        data,
        expires: Date.now() + ttl,
      };
      return data;
    } finally {
      loading = null;
    }
  };
}
