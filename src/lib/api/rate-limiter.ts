import { NextRequest } from 'next/server';
import { createRateLimitError } from './error-handler';

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (_request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean; // Return rate limit info in headers
  legacyHeaders?: boolean; // Return legacy X-RateLimit-* headers
}

// Rate limit result
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// Rate limit store interface
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ totalHits: number; reset: Date }>;
  decrement?(key: string): Promise<void>;
  resetKey?(key: string): Promise<void>;
}

// In-memory rate limit store
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; reset: Date }>();

  async increment(key: string, windowMs: number): Promise<{ totalHits: number; reset: Date }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Clean up expired entries
    this.cleanup(windowStart);

    const existing = this.store.get(key);

    if (!existing || existing.reset <= now) {
      // Create new entry
      const reset = new Date(now.getTime() + windowMs);
      this.store.set(key, { count: 1, reset });
      return { totalHits: 1, reset };
    } else {
      // Increment existing entry
      existing.count++;
      return { totalHits: existing.count, reset: existing.reset };
    }
  }

  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing && existing.count > 0) {
      existing.count--;
      if (existing.count === 0) {
        this.store.delete(key);
      }
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(before: Date): void {
    for (const [key, value] of this.store.entries()) {
      if (value.reset <= before) {
        this.store.delete(key);
      }
    }
  }
}

// Redis rate limit store (for production use)
export class RedisRateLimitStore implements RateLimitStore {
  private redis: any; // Redis client instance

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async increment(key: string, windowMs: number): Promise<{ totalHits: number; reset: Date }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const reset = new Date(now + windowMs);

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Count current requests in window
    pipeline.zcard(key);

    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const totalHits = results[2][1]; // Count result

    return { totalHits, reset };
  }

  async decrement(key: string): Promise<void> {
    // For Redis, we could implement this by removing the most recent entry
    // This is optional and depends on your use case
    const entries = await this.redis.zrange(key, -1, -1);
    if (entries.length > 0) {
      await this.redis.zrem(key, entries[0]);
    }
  }

  async resetKey(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// Rate limiter class
export class RateLimiter {
  private store: RateLimitStore;
  private config: Required<RateLimitConfig>;

  constructor(_config: RateLimitConfig, store?: RateLimitStore) {
    this.store = store || new MemoryRateLimitStore();
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later',
      standardHeaders: config.standardHeaders !== false,
      legacyHeaders: config.legacyHeaders !== false,
    };
  }

  async checkLimit(_request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(request);
    const { totalHits, reset } = await this.store.increment(key, this.config.windowMs);

    const remaining = Math.max(0, this.config.max - totalHits);
    const success = totalHits <= this.config.max;

    const result: RateLimitResult = {
      success,
      limit: this.config.max,
      remaining,
      reset,
    };

    if (!success) {
      result.retryAfter = Math.ceil((reset.getTime() - Date.now()) / 1000);
    }

    return result;
  }

  async handleRequest(_request: NextRequest): Promise<RateLimitResult> {
    const _result = await this.checkLimit(request);

    if (!result.success) {
      throw createRateLimitError(result.retryAfter!, result.limit, result.remaining);
    }

    return result;
  }

  private defaultKeyGenerator(_request: NextRequest): string {
    // Use IP address or user ID if available
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userId = request.headers.get('x-user-id'); // Assuming user ID is set in headers after auth

    return userId || ip;
  }

  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.standardHeaders) {
      headers['RateLimit-Limit'] = result.limit.toString();
      headers['RateLimit-Remaining'] = result.remaining.toString();
      headers['RateLimit-Reset'] = result.reset.toISOString();
    }

    if (this.config.legacyHeaders) {
      headers['X-RateLimit-Limit'] = result.limit.toString();
      headers['X-RateLimit-Remaining'] = result.remaining.toString();
      headers['X-RateLimit-Reset'] = Math.ceil(result.reset.getTime() / 1000).toString();
    }

    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  }
}

// Pre-configured rate limiters for different endpoint types
export const createStandardRateLimiter = () =>
  new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this client',
  });

export const createAuthRateLimiter = () =>
  new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    keyGenerator: (request) => {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
      return `auth:${ip}`;
    },
    message: 'Too many authentication attempts, please try again later',
  });

export const createFileUploadRateLimiter = () =>
  new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 file uploads per hour
    keyGenerator: (request) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      return `upload:${userId}`;
    },
    message: 'Too many file uploads, please try again later',
  });

export const createExpensiveOperationRateLimiter = () =>
  new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 expensive operations per hour (like assessment execution)
    keyGenerator: (request) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      return `expensive:${userId}`;
    },
    message: 'Too many resource-intensive operations, please try again later',
  });

export const createBulkOperationRateLimiter = () =>
  new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 bulk operations per 10 minutes
    keyGenerator: (request) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      return `bulk:${userId}`;
    },
    message: 'Too many bulk operations, please try again later',
  });

export const createReportGenerationRateLimiter = () =>
  new RateLimiter({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 20, // 20 reports per 30 minutes
    keyGenerator: (request) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      return `report:${userId}`;
    },
    message: 'Too many report generation requests, please try again later',
  });

// Rate limiter manager
export class RateLimiterManager {
  private limiters = new Map<string, RateLimiter>();

  constructor() {
    // Initialize standard rate limiters
    this.limiters.set('standard', createStandardRateLimiter());
    this.limiters.set('auth', createAuthRateLimiter());
    this.limiters.set('upload', createFileUploadRateLimiter());
    this.limiters.set('expensive', createExpensiveOperationRateLimiter());
    this.limiters.set('bulk', createBulkOperationRateLimiter());
    this.limiters.set('report', createReportGenerationRateLimiter());
  }

  getLimiter(_type: string): RateLimiter {
    const limiter = this.limiters.get(type);
    if (!limiter) {
      throw new Error(`Rate limiter type '${type}' not found`);
    }
    return limiter;
  }

  addLimiter(_type: string, limiter: RateLimiter): void {
    this.limiters.set(type, limiter);
  }

  async checkLimits(_request: NextRequest, types: string[]): Promise<RateLimitResult[]> {
    const results = await Promise.all(
      types.map((type) => this.getLimiter(type).checkLimit(request))
    );
    return results;
  }

  async handleRequest(_request: NextRequest, types: string[]): Promise<RateLimitResult[]> {
    const results = await Promise.all(
      types.map((type) => this.getLimiter(type).handleRequest(request))
    );
    return results;
  }
}

// Global rate limiter manager
export const rateLimiterManager = new RateLimiterManager();

// Utility functions for common rate limiting patterns
export function getRateLimiterForEndpoint(path: string, method: string): string[] {
  const limiters = ['standard']; // Always apply standard rate limiting

  // Authentication endpoints
  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    limiters.push('auth');
  }

  // File upload endpoints
  if (path.includes('/upload') || path.includes('/documents')) {
    limiters.push('upload');
  }

  // Assessment execution (expensive operations)
  if (path.includes('/assessments') && path.includes('/execute')) {
    limiters.push('expensive');
  }

  // Bulk operations
  if (path.includes('/bulk') || (method === 'POST' && path.includes('/import'))) {
    limiters.push('bulk');
  }

  // Report generation
  if (path.includes('/reports') && method === 'POST') {
    limiters.push('report');
  }

  return limiters;
}

// Middleware function for applying rate limiting
export async function applyRateLimit(
  _request: NextRequest,
  limiters?: string[]
): Promise<{ success: boolean; headers: Record<string, string>; error?: any }> {
  try {
    const url = new URL(request.url);
    const applicableLimiters = limiters || getRateLimiterForEndpoint(url.pathname, request.method);

    const results = await rateLimiterManager.handleRequest(request, applicableLimiters);

    // Combine headers from all rate limiters
    const headers: Record<string, string> = {};
    results.forEach((result, index) => {
      const limiterHeaders = rateLimiterManager
        .getLimiter(applicableLimiters[index])
        .getRateLimitHeaders(result);
      Object.assign(headers, limiterHeaders);
    });

    return { success: true, headers };
  } catch (error) {
    return { success: false, headers: {}, error };
  }
}

// Rate limit decorator for API handlers
export function withRateLimit(limiters?: string[]) {
  return function <T extends any[], R>(
    _target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: T): Promise<R> {
      // Assume first argument is NextRequest
      const request = args[0] as NextRequest;

      const rateLimitResult = await applyRateLimit(request, limiters);
      if (!rateLimitResult.success) {
        throw rateLimitResult.error;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Helper function to extract rate limit info for responses
export function extractRateLimitInfo(result: RateLimitResult) {
  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.retryAfter,
  };
}
