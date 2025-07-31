// Advanced Rate Limiting System for API Protection
import { NextRequest } from 'next/server';
import { redisClient } from '../cache/redis-client';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  algorithm: 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket';
  keyGenerator: (req: NextRequest) => string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  enableDistributed: boolean;
  whitelistedIPs: string[];
  blacklistedIPs: string[];
  enableDynamicLimits: boolean;
  enableThreatDetection: boolean;
  burstMultiplier: number;
  gracePeriodMs: number;
}

export interface RateLimitRule {
  id: string;
  pattern: string | RegExp;
  config: RateLimitConfig;
  priority: number;
  enabled: boolean;
  description: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; requests: number }>;
  threatDetections: number;
  bytesSaved: number;
}

export interface ThreatDetection {
  ip: string;
  endpoint: string;
  pattern: 'burst' | 'distributed' | 'scraping' | 'brute-force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  evidence: Record<string, any>;
}

class RateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    topBlockedIPs: [],
    topEndpoints: [],
    threatDetections: 0,
    bytesSaved: 0,
  };
  private threatDetections: ThreatDetection[] = [];
  private ipRequestHistory: Map<string, number[]> = new Map();

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // Global API rate limit
    this.addRule({
      id: 'global-api',
      pattern: /^\/api\//,
      priority: 1,
      enabled: true,
      description: 'Global API rate limit',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        algorithm: 'sliding-window',
        keyGenerator: (req) => this.getClientIP(req),
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        enableDistributed: true,
        whitelistedIPs: [],
        blacklistedIPs: [],
        enableDynamicLimits: true,
        enableThreatDetection: true,
        burstMultiplier: 2,
        gracePeriodMs: 5000,
      },
    });

    // Authentication endpoints - stricter limits
    this.addRule({
      id: 'auth-endpoints',
      pattern: /^\/api\/auth\//,
      priority: 10,
      enabled: true,
      description: 'Authentication endpoints rate limit',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10,
        algorithm: 'sliding-window',
        keyGenerator: (req) => this.getClientIP(req),
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        enableDistributed: true,
        whitelistedIPs: [],
        blacklistedIPs: [],
        enableDynamicLimits: false,
        enableThreatDetection: true,
        burstMultiplier: 1,
        gracePeriodMs: 0,
      },
    });

    // Password reset - very strict
    this.addRule({
      id: 'password-reset',
      pattern: /^\/api\/auth\/reset-password/,
      priority: 20,
      enabled: true,
      description: 'Password reset rate limit',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        algorithm: 'fixed-window',
        keyGenerator: (req) => this.getClientIP(req),
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        enableDistributed: true,
        whitelistedIPs: [],
        blacklistedIPs: [],
        enableDynamicLimits: false,
        enableThreatDetection: true,
        burstMultiplier: 1,
        gracePeriodMs: 0,
      },
    });

    // File upload endpoints
    this.addRule({
      id: 'file-upload',
      pattern: /^\/api\/upload/,
      priority: 15,
      enabled: true,
      description: 'File upload rate limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        algorithm: 'token-bucket',
        keyGenerator: (req) => this.getClientIP(req),
        skipSuccessfulRequests: false,
        skipFailedRequests: true,
        enableDistributed: true,
        whitelistedIPs: [],
        blacklistedIPs: [],
        enableDynamicLimits: true,
        enableThreatDetection: true,
        burstMultiplier: 1.5,
        gracePeriodMs: 2000,
      },
    });

    // Search endpoints
    this.addRule({
      id: 'search-endpoints',
      pattern: /^\/api\/search/,
      priority: 5,
      enabled: true,
      description: 'Search endpoints rate limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        algorithm: 'leaky-bucket',
        keyGenerator: (req) => this.getClientIP(req),
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        enableDistributed: true,
        whitelistedIPs: [],
        blacklistedIPs: [],
        enableDynamicLimits: true,
        enableThreatDetection: true,
        burstMultiplier: 1.2,
        gracePeriodMs: 1000,
      },
    });
  }

  // Add or update rate limit rule
  public addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
  }

  // Remove rate limit rule
  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  // Get applicable rule for request
  private getApplicableRule(req: NextRequest): RateLimitRule | null {
    const pathname = new URL(req.url).pathname;
    const sortedRules = Array.from(this.rules.values())
      .filter((rule) => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (typeof rule.pattern === 'string') {
        if (pathname.startsWith(rule.pattern)) {
          return rule;
        }
      } else if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(pathname)) {
          return rule;
        }
      }
    }

    return null;
  }

  // Main rate limiting function
  public async checkRateLimit(req: NextRequest): Promise<RateLimitResult> {
    this.metrics.totalRequests++;

    const rule = this.getApplicableRule(req);
    if (!rule) {
      this.metrics.allowedRequests++;
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    const clientIP = this.getClientIP(req);
    const key = rule.config.keyGenerator(req);

    // Check IP whitelist/blacklist
    if (rule.config.blacklistedIPs.includes(clientIP)) {
      this.metrics.blockedRequests++;
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + rule.config.windowMs,
        reason: 'IP blacklisted',
        threatLevel: 'high',
      };
    }

    if (rule.config.whitelistedIPs.includes(clientIP)) {
      this.metrics.allowedRequests++;
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    // Perform rate limiting based on algorithm
    const result = await this.performRateLimit(key, rule.config);

    // Update metrics
    if (result.allowed) {
      this.metrics.allowedRequests++;
    } else {
      this.metrics.blockedRequests++;
      this.updateBlockedIPMetrics(clientIP);
    }

    // Threat detection
    if (rule.config.enableThreatDetection) {
      await this.detectThreats(req, rule, result);
    }

    // Track request history for analysis
    this.trackRequestHistory(clientIP);

    return result;
  }

  // Perform rate limiting based on algorithm
  private async performRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    switch (config.algorithm) {
      case 'fixed-window':
        return this.fixedWindowRateLimit(key, config);
      case 'sliding-window':
        return this.slidingWindowRateLimit(key, config);
      case 'token-bucket':
        return this.tokenBucketRateLimit(key, config);
      case 'leaky-bucket':
        return this.leakyBucketRateLimit(key, config);
      default:
        return this.fixedWindowRateLimit(key, config);
    }
  }

  // Fixed window rate limiting
  private async fixedWindowRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const window = Math.floor(Date.now() / config.windowMs);
    const redisKey = `rate_limit:fixed:${key}:${window}`;

    try {
      const current = (await redisClient.get<number>(redisKey)) || 0;
      const remaining = Math.max(0, config.maxRequests - current - 1);
      const resetTime = (window + 1) * config.windowMs;

      if (current >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        };
      }

      // Increment counter
      await redisClient.set(redisKey, current + 1, Math.ceil(config.windowMs / 1000));

      return {
        allowed: true,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Fixed window rate limit error:', error);
      // Fail open for Redis errors
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }
  }

  // Sliding window rate limiting
  private async slidingWindowRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const window = now - config.windowMs;
    const redisKey = `rate_limit:sliding:${key}`;

    try {
      // Use Redis sorted set for sliding window
      const pipeline = redisClient.client.pipeline();

      // Remove old entries
      pipeline.zremrangebyscore(redisKey, 0, window);

      // Count current requests
      pipeline.zcard(redisKey);

      // Add current request
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Set expiration
      pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));

      const results = await pipeline.exec();
      const currentCount = (results?.[1]?.[1] as number) || 0;

      const remaining = Math.max(0, config.maxRequests - currentCount - 1);
      const resetTime = now + config.windowMs;

      if (currentCount >= config.maxRequests) {
        // Remove the request we just added
        await redisClient.client.zrem(redisKey, `${now}-${Math.random()}`);

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(config.windowMs / 1000),
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Sliding window rate limit error:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }
  }

  // Token bucket rate limiting
  private async tokenBucketRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const redisKey = `rate_limit:token:${key}`;
    const refillRate = config.maxRequests / (config.windowMs / 1000); // tokens per second

    try {
      const bucketData = (await redisClient.get<{
        tokens: number;
        lastRefill: number;
      }>(redisKey)) || {
        tokens: config.maxRequests,
        lastRefill: now,
      };

      // Calculate tokens to add based on time elapsed
      const timePassed = (now - bucketData.lastRefill) / 1000;
      const tokensToAdd = timePassed * refillRate;
      const currentTokens = Math.min(config.maxRequests, bucketData.tokens + tokensToAdd);

      if (currentTokens < 1) {
        const timeToRefill = (1 - currentTokens) / refillRate;
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + timeToRefill * 1000,
          retryAfter: Math.ceil(timeToRefill),
        };
      }

      // Consume token
      const newBucketData = {
        tokens: currentTokens - 1,
        lastRefill: now,
      };

      await redisClient.set(redisKey, newBucketData, Math.ceil(config.windowMs / 1000));

      return {
        allowed: true,
        remaining: Math.floor(newBucketData.tokens),
        resetTime: now + ((config.maxRequests - newBucketData.tokens) / refillRate) * 1000,
      };
    } catch (error) {
      console.error('Token bucket rate limit error:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }
  }

  // Leaky bucket rate limiting
  private async leakyBucketRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const redisKey = `rate_limit:leaky:${key}`;
    const leakRate = config.maxRequests / (config.windowMs / 1000); // requests per second

    try {
      const bucketData = (await redisClient.get<{
        volume: number;
        lastLeak: number;
      }>(redisKey)) || {
        volume: 0,
        lastLeak: now,
      };

      // Calculate leaked volume based on time elapsed
      const timePassed = (now - bucketData.lastLeak) / 1000;
      const volumeLeaked = timePassed * leakRate;
      const currentVolume = Math.max(0, bucketData.volume - volumeLeaked);

      if (currentVolume >= config.maxRequests) {
        const timeToLeak = (currentVolume - config.maxRequests + 1) / leakRate;
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + timeToLeak * 1000,
          retryAfter: Math.ceil(timeToLeak),
        };
      }

      // Add request to bucket
      const newBucketData = {
        volume: currentVolume + 1,
        lastLeak: now,
      };

      await redisClient.set(redisKey, newBucketData, Math.ceil(config.windowMs / 1000));

      return {
        allowed: true,
        remaining: Math.floor(config.maxRequests - newBucketData.volume),
        resetTime: now + (newBucketData.volume / leakRate) * 1000,
      };
    } catch (error) {
      console.error('Leaky bucket rate limit error:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }
  }

  // Threat detection
  private async detectThreats(
    req: NextRequest,
    rule: RateLimitRule,
    result: RateLimitResult
  ): Promise<void> {
    const clientIP = this.getClientIP(req);
    const endpoint = new URL(req.url).pathname;
    const now = Date.now();

    // Detect burst patterns
    if (!result.allowed && result.retryAfter && result.retryAfter < 60) {
      this.addThreatDetection({
        ip: clientIP,
        endpoint,
        pattern: 'burst',
        severity: 'medium',
        timestamp: now,
        evidence: {
          retryAfter: result.retryAfter,
          remaining: result.remaining,
        },
      });
    }

    // Detect brute force on auth endpoints
    if (endpoint.includes('/auth/') && !result.allowed) {
      const recentAttempts = this.getRecentAttempts(clientIP, 5 * 60 * 1000); // 5 minutes
      if (recentAttempts > 20) {
        this.addThreatDetection({
          ip: clientIP,
          endpoint,
          pattern: 'brute-force',
          severity: 'high',
          timestamp: now,
          evidence: {
            recentAttempts,
            timeWindow: '5 minutes',
          },
        });
      }
    }

    // Detect scraping patterns
    const requestHistory = this.ipRequestHistory.get(clientIP) || [];
    if (requestHistory.length > 100) {
      const variance = this.calculateRequestVariance(requestHistory);
      if (variance < 100) {
        // Very regular intervals suggest automation
        this.addThreatDetection({
          ip: clientIP,
          endpoint,
          pattern: 'scraping',
          severity: 'medium',
          timestamp: now,
          evidence: {
            requestCount: requestHistory.length,
            variance,
          },
        });
      }
    }
  }

  // Helper methods
  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();

    return req.ip || '127.0.0.1';
  }

  private trackRequestHistory(ip: string): void {
    const history = this.ipRequestHistory.get(ip) || [];
    history.push(Date.now());

    // Keep only last 1000 requests
    if (history.length > 1000) {
      history.shift();
    }

    this.ipRequestHistory.set(ip, history);
  }

  private getRecentAttempts(ip: string, timeWindow: number): number {
    const history = this.ipRequestHistory.get(ip) || [];
    const cutoff = Date.now() - timeWindow;
    return history.filter((timestamp) => timestamp > cutoff).length;
  }

  private calculateRequestVariance(timestamps: number[]): number {
    if (timestamps.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;

    return variance;
  }

  private addThreatDetection(threat: ThreatDetection): void {
    this.threatDetections.push(threat);
    this.metrics.threatDetections++;

    // Keep only last 1000 threat detections
    if (this.threatDetections.length > 1000) {
      this.threatDetections.shift();
    }

    // Log high severity threats
    if (threat.severity === 'high' || threat.severity === 'critical') {
      console.warn('High severity threat detected:', threat);
    }
  }

  private updateBlockedIPMetrics(ip: string): void {
    const existing = this.metrics.topBlockedIPs.find((item) => item.ip === ip);
    if (existing) {
      existing.count++;
    } else {
      this.metrics.topBlockedIPs.push({ ip, count: 1 });
    }

    // Sort and keep top 10
    this.metrics.topBlockedIPs.sort((a, b) => b.count - a.count);
    this.metrics.topBlockedIPs = this.metrics.topBlockedIPs.slice(0, 10);
  }

  // Public methods for management
  public getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  public getThreatDetections(): ThreatDetection[] {
    return [...this.threatDetections];
  }

  public getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  public clearMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      topBlockedIPs: [],
      topEndpoints: [],
      threatDetections: 0,
      bytesSaved: 0,
    };
    this.threatDetections = [];
    this.ipRequestHistory.clear();
  }

  public addToBlacklist(ruleId: string, ip: string): void {
    const rule = this.rules.get(ruleId);
    if (rule && !rule.config.blacklistedIPs.includes(ip)) {
      rule.config.blacklistedIPs.push(ip);
    }
  }

  public addToWhitelist(ruleId: string, ip: string): void {
    const rule = this.rules.get(ruleId);
    if (rule && !rule.config.whitelistedIPs.includes(ip)) {
      rule.config.whitelistedIPs.push(ip);
    }
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Export class for custom instances
export { RateLimiter };
