// Enterprise API Key Management System
import crypto from 'crypto';
import { redisClient } from '../cache/redis-client';

export interface APIKey {
  id: string;
  key: string;
  hashedKey: string;
  name: string;
  description: string;
  userId: string;
  organizationId: string;
  scopes: APIScope[];
  permissions: APIPermission[];
  status: 'active' | 'inactive' | 'revoked' | 'expired';
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  ipWhitelist: string[];
  referrerWhitelist: string[];
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  rotationSchedule?: {
    enabled: boolean;
    intervalDays: number;
    nextRotation: number;
    notifyDaysBefore: number;
  };
  usage: {
    totalRequests: number;
    lastRequest: number;
    requestsByEndpoint: Record<string, number>;
    errorCount: number;
    bytesTransferred: number;
  };
  metadata: Record<string, any>;
}

export interface APIScope {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface APIPermission {
  permission: string;
  granted: boolean;
  grantedAt: number;
  grantedBy: string;
}

export interface APIKeyValidationResult {
  isValid: boolean;
  apiKey?: APIKey;
  reason?: string;
  remainingRequests?: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  warnings?: string[];
}

export interface APIKeyUsage {
  keyId: string;
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  bytesTransferred: number;
  clientIP: string;
  userAgent: string;
  errorMessage?: string;
}

export interface APIKeyMetrics {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  revokedKeys: number;
  totalRequests: number;
  requestsLast24h: number;
  topKeys: Array<{ keyId: string; requests: number; name: string }>;
  topEndpoints: Array<{ endpoint: string; requests: number }>;
  errorRate: number;
  averageResponseTime: number;
}

class APIKeyManager {
  private keyStore: Map<string, APIKey> = new Map();
  private usageStore: APIKeyUsage[] = [];
  private rotationTimer?: NodeJS.Timeout;

  constructor() {
    this.setupRotationScheduler();
    this.loadKeysFromStorage();
  }

  // Generate new API key
  public async generateAPIKey(config: {
    name: string;
    description: string;
    userId: string;
    organizationId: string;
    scopes: APIScope[];
    permissions: APIPermission[];
    rateLimits?: Partial<APIKey['rateLimits']>;
    expiresInDays?: number;
    ipWhitelist?: string[];
    referrerWhitelist?: string[];
    enableRotation?: boolean;
    rotationIntervalDays?: number;
    metadata?: Record<string, any>;
  }): Promise<APIKey> {
    const keyId = this.generateKeyId();
    const rawKey = this.generateRawKey();
    const hashedKey = this.hashKey(rawKey);
    const now = Date.now();

    const apiKey: APIKey = {
      id: keyId,
      key: `rsk_${keyId}_${rawKey}`, // Prefixed format
      hashedKey,
      name: config.name,
      description: config.description,
      userId: config.userId,
      organizationId: config.organizationId,
      scopes: config.scopes,
      permissions: config.permissions,
      status: 'active',
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 10,
        ...config.rateLimits,
      },
      ipWhitelist: config.ipWhitelist || [],
      referrerWhitelist: config.referrerWhitelist || [],
      createdAt: now,
      updatedAt: now,
      expiresAt: config.expiresInDays ? now + (config.expiresInDays * 24 * 60 * 60 * 1000) : undefined,
      usage: {
        totalRequests: 0,
        lastRequest: 0,
        requestsByEndpoint: {},
        errorCount: 0,
        bytesTransferred: 0,
      },
      metadata: config.metadata || {},
    };

    // Setup rotation if enabled
    if (config.enableRotation) {
      apiKey.rotationSchedule = {
        enabled: true,
        intervalDays: config.rotationIntervalDays || 90,
        nextRotation: now + ((config.rotationIntervalDays || 90) * 24 * 60 * 60 * 1000),
        notifyDaysBefore: 7,
      };
    }

    // Store the key
    this.keyStore.set(keyId, apiKey);
    await this.saveKeyToStorage(apiKey);

    return apiKey;
  }

  // Validate API key
  public async validateAPIKey(
    keyString: string,
    endpoint: string,
    method: string,
    clientIP: string,
    referrer?: string
  ): Promise<APIKeyValidationResult> {
    const result: APIKeyValidationResult = {
      isValid: false,
    };

    try {
      // Parse key format
      const keyParts = keyString.split('_');
      if (keyParts.length !== 3 || keyParts[0] !== 'rsk') {
        result.reason = 'Invalid key format';
        return result;
      }

      const keyId = keyParts[1];
      const rawKey = keyParts[2];

      // Get API key from store
      const apiKey = this.keyStore.get(keyId) || await this.loadKeyFromStorage(keyId);
      if (!apiKey) {
        result.reason = 'Key not found';
        return result;
      }

      // Verify key hash
      const hashedKey = this.hashKey(rawKey);
      if (!crypto.timingSafeEqual(Buffer.from(apiKey.hashedKey), Buffer.from(hashedKey))) {
        result.reason = 'Invalid key';
        await this.recordSuspiciousActivity(keyId, 'invalid_key_attempt', { clientIP });
        return result;
      }

      // Check key status
      if (apiKey.status !== 'active') {
        result.reason = `Key is ${apiKey.status}`;
        return result;
      }

      // Check expiration
      if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
        result.reason = 'Key expired';
        apiKey.status = 'expired';
        await this.saveKeyToStorage(apiKey);
        return result;
      }

      // Check IP whitelist
      if (apiKey.ipWhitelist.length > 0 && !this.isIPWhitelisted(clientIP, apiKey.ipWhitelist)) {
        result.reason = 'IP not whitelisted';
        await this.recordSuspiciousActivity(keyId, 'ip_not_whitelisted', { clientIP });
        return result;
      }

      // Check referrer whitelist
      if (referrer && apiKey.referrerWhitelist.length > 0 && !this.isReferrerWhitelisted(referrer, apiKey.referrerWhitelist)) {
        result.reason = 'Referrer not whitelisted';
        await this.recordSuspiciousActivity(keyId, 'referrer_not_whitelisted', { referrer, clientIP });
        return result;
      }

      // Check scopes
      if (!this.hasRequiredScope(apiKey, endpoint, method)) {
        result.reason = 'Insufficient scope';
        return result;
      }

      // Check rate limits
      const rateLimitResult = await this.checkRateLimits(apiKey, clientIP);
      if (!rateLimitResult.allowed) {
        result.reason = 'Rate limit exceeded';
        result.remainingRequests = rateLimitResult.remaining;
        return result;
      }

      // Key is valid
      result.isValid = true;
      result.apiKey = apiKey;
      result.remainingRequests = rateLimitResult.remaining;

      // Check for warnings
      const warnings = this.checkWarnings(apiKey);
      if (warnings.length > 0) {
        result.warnings = warnings;
      }

      return result;
    } catch (error) {
      console.error('API key validation error:', error);
      result.reason = 'Validation error';
      return result;
    }
  }

  // Record API key usage
  public async recordUsage(usage: APIKeyUsage): Promise<void> {
    this.usageStore.push(usage);

    // Update API key usage statistics
    const apiKey = this.keyStore.get(usage.keyId);
    if (apiKey) {
      apiKey.usage.totalRequests++;
      apiKey.usage.lastRequest = usage.timestamp;
      apiKey.usage.requestsByEndpoint[usage.endpoint] = 
        (apiKey.usage.requestsByEndpoint[usage.endpoint] || 0) + 1;
      apiKey.usage.bytesTransferred += usage.bytesTransferred;
      
      if (usage.statusCode >= 400) {
        apiKey.usage.errorCount++;
      }

      apiKey.lastUsedAt = usage.timestamp;
      apiKey.updatedAt = usage.timestamp;

      await this.saveKeyToStorage(apiKey);
    }

    // Store usage in Redis for analytics
    await this.storeUsageInRedis(usage);

    // Keep only recent usage records in memory
    if (this.usageStore.length > 10000) {
      this.usageStore = this.usageStore.slice(-5000);
    }
  }

  // Rotate API key
  public async rotateAPIKey(keyId: string, notifyUser = true): Promise<APIKey> {
    const existingKey = this.keyStore.get(keyId);
    if (!existingKey) {
      throw new Error('API key not found');
    }

    const rawKey = this.generateRawKey();
    const hashedKey = this.hashKey(rawKey);
    const now = Date.now();

    // Update the key
    existingKey.key = `rsk_${keyId}_${rawKey}`;
    existingKey.hashedKey = hashedKey;
    existingKey.updatedAt = now;

    // Update rotation schedule
    if (existingKey.rotationSchedule) {
      existingKey.rotationSchedule.nextRotation = 
        now + (existingKey.rotationSchedule.intervalDays * 24 * 60 * 60 * 1000);
    }

    await this.saveKeyToStorage(existingKey);

    // Notify user if requested
    if (notifyUser) {
      await this.notifyKeyRotation(existingKey);
    }

    return existingKey;
  }

  // Revoke API key
  public async revokeAPIKey(keyId: string, reason?: string): Promise<void> {
    const apiKey = this.keyStore.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.status = 'revoked';
    apiKey.updatedAt = Date.now();
    
    if (reason) {
      apiKey.metadata.revocationReason = reason;
    }

    await this.saveKeyToStorage(apiKey);
    
    // Remove from Redis cache
    await redisClient.delete(`api_key:${keyId}`);
  }

  // Update API key scopes
  public async updateScopes(keyId: string, scopes: APIScope[]): Promise<void> {
    const apiKey = this.keyStore.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.scopes = scopes;
    apiKey.updatedAt = Date.now();

    await this.saveKeyToStorage(apiKey);
  }

  // Update rate limits
  public async updateRateLimits(keyId: string, rateLimits: Partial<APIKey['rateLimits']>): Promise<void> {
    const apiKey = this.keyStore.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.rateLimits = { ...apiKey.rateLimits, ...rateLimits };
    apiKey.updatedAt = Date.now();

    await this.saveKeyToStorage(apiKey);
  }

  // Get API key metrics
  public async getMetrics(): Promise<APIKeyMetrics> {
    const keys = Array.from(this.keyStore.values());
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);

    const totalRequests = keys.reduce((sum, key) => sum + key.usage.totalRequests, 0);
    const requestsLast24h = this.usageStore.filter(usage => usage.timestamp > last24h).length;
    const totalErrors = keys.reduce((sum, key) => sum + key.usage.errorCount, 0);
    const totalResponseTime = this.usageStore.reduce((sum, usage) => sum + usage.responseTime, 0);

    // Top keys by usage
    const topKeys = keys
      .sort((a, b) => b.usage.totalRequests - a.usage.totalRequests)
      .slice(0, 10)
      .map(key => ({
        keyId: key.id,
        requests: key.usage.totalRequests,
        name: key.name,
      }));

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    this.usageStore.forEach(usage => {
      endpointCounts.set(usage.endpoint, (endpointCounts.get(usage.endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, requests]) => ({ endpoint, requests }));

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === 'active').length,
      expiredKeys: keys.filter(k => k.status === 'expired').length,
      revokedKeys: keys.filter(k => k.status === 'revoked').length,
      totalRequests,
      requestsLast24h,
      topKeys,
      topEndpoints,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      averageResponseTime: this.usageStore.length > 0 ? totalResponseTime / this.usageStore.length : 0,
    };
  }

  // List API keys for user/organization
  public async listAPIKeys(filters: {
    userId?: string;
    organizationId?: string;
    status?: APIKey['status'];
    limit?: number;
    offset?: number;
  }): Promise<{ keys: APIKey[]; total: number }> {
    let keys = Array.from(this.keyStore.values());

    // Apply filters
    if (filters.userId) {
      keys = keys.filter(k => k.userId === filters.userId);
    }

    if (filters.organizationId) {
      keys = keys.filter(k => k.organizationId === filters.organizationId);
    }

    if (filters.status) {
      keys = keys.filter(k => k.status === filters.status);
    }

    const total = keys.length;

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    keys = keys.slice(offset, offset + limit);

    // Remove sensitive data
    const sanitizedKeys = keys.map(key => ({
      ...key,
      key: `${key.key.substring(0, 12)}...${key.key.substring(key.key.length - 4)}`,
      hashedKey: '[HIDDEN]',
    }));

    return { keys: sanitizedKeys, total };
  }

  // Private helper methods
  private generateKeyId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private generateRawKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private isIPWhitelisted(clientIP: string, whitelist: string[]): boolean {
    return whitelist.some(pattern => {
      if (pattern.includes('/')) {
        // CIDR notation
        return this.isIPInCIDR(clientIP, pattern);
      } else if (pattern.includes('*')) {
        // Wildcard pattern
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(clientIP);
      } else {
        // Exact match
        return clientIP === pattern;
      }
    });
  }

  private isReferrerWhitelisted(referrer: string, whitelist: string[]): boolean {
    const referrerUrl = new URL(referrer);
    return whitelist.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(referrerUrl.hostname);
      } else {
        return referrerUrl.hostname === pattern;
      }
    });
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check implementation
    // In production, use a proper IP library
    const [network, prefixLength] = cidr.split('/');
    // Implementation would depend on IP library
    return false; // Placeholder
  }

  private hasRequiredScope(apiKey: APIKey, endpoint: string, method: string): boolean {
    return apiKey.scopes.some(scope => {
      // Check if endpoint matches resource pattern
      const resourceMatch = scope.resource === '*' || endpoint.startsWith(scope.resource);
      
      // Check if method is allowed
      const methodMatch = scope.actions.includes('*') || scope.actions.includes(method.toLowerCase());
      
      return resourceMatch && methodMatch;
    });
  }

  private async checkRateLimits(apiKey: APIKey, clientIP: string): Promise<{
    allowed: boolean;
    remaining: { perMinute: number; perHour: number; perDay: number };
  }> {
    const now = Date.now();
    const keyId = apiKey.id;

    // Check rate limits using Redis
    const minuteKey = `rate_limit:${keyId}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `rate_limit:${keyId}:hour:${Math.floor(now / 3600000)}`;
    const dayKey = `rate_limit:${keyId}:day:${Math.floor(now / 86400000)}`;

    try {
      const [minuteCount, hourCount, dayCount] = await Promise.all([
        redisClient.get<number>(minuteKey) || 0,
        redisClient.get<number>(hourKey) || 0,
        redisClient.get<number>(dayKey) || 0,
      ]);

      const remaining = {
        perMinute: Math.max(0, apiKey.rateLimits.requestsPerMinute - minuteCount),
        perHour: Math.max(0, apiKey.rateLimits.requestsPerHour - hourCount),
        perDay: Math.max(0, apiKey.rateLimits.requestsPerDay - dayCount),
      };

      const allowed = 
        minuteCount < apiKey.rateLimits.requestsPerMinute &&
        hourCount < apiKey.rateLimits.requestsPerHour &&
        dayCount < apiKey.rateLimits.requestsPerDay;

      if (allowed) {
        // Increment counters
        await Promise.all([
          redisClient.set(minuteKey, minuteCount + 1, 60),
          redisClient.set(hourKey, hourCount + 1, 3600),
          redisClient.set(dayKey, dayCount + 1, 86400),
        ]);
      }

      return { allowed, remaining };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open
      return {
        allowed: true,
        remaining: {
          perMinute: apiKey.rateLimits.requestsPerMinute,
          perHour: apiKey.rateLimits.requestsPerHour,
          perDay: apiKey.rateLimits.requestsPerDay,
        },
      };
    }
  }

  private checkWarnings(apiKey: APIKey): string[] {
    const warnings: string[] = [];
    const now = Date.now();

    // Check expiration warning
    if (apiKey.expiresAt) {
      const daysUntilExpiry = (apiKey.expiresAt - now) / (24 * 60 * 60 * 1000);
      if (daysUntilExpiry <= 7) {
        warnings.push(`Key expires in ${Math.ceil(daysUntilExpiry)} days`);
      }
    }

    // Check rotation warning
    if (apiKey.rotationSchedule?.enabled) {
      const daysUntilRotation = (apiKey.rotationSchedule.nextRotation - now) / (24 * 60 * 60 * 1000);
      if (daysUntilRotation <= apiKey.rotationSchedule.notifyDaysBefore) {
        warnings.push(`Key rotation scheduled in ${Math.ceil(daysUntilRotation)} days`);
      }
    }

    return warnings;
  }

  private async recordSuspiciousActivity(
    keyId: string,
    activity: string,
    details: Record<string, any>
  ): Promise<void> {
    const event = {
      keyId,
      activity,
      details,
      timestamp: Date.now(),
    };

    console.warn('Suspicious API key activity:', event);
    
    // Store in Redis for analysis
    await redisClient.client.lpush('suspicious_api_activity', JSON.stringify(event));
    await redisClient.client.expire('suspicious_api_activity', 86400); // 24 hours
  }

  private async storeUsageInRedis(usage: APIKeyUsage): Promise<void> {
    const key = `api_usage:${usage.keyId}:${Math.floor(usage.timestamp / 3600000)}`; // Hourly buckets
    await redisClient.client.hincrby(key, 'requests', 1);
    await redisClient.client.hincrby(key, 'bytes', usage.bytesTransferred);
    await redisClient.client.expire(key, 86400 * 30); // 30 days
  }

  private setupRotationScheduler(): void {
    // Check for keys needing rotation every hour
    this.rotationTimer = setInterval(async () => {
      await this.checkRotationSchedule();
    }, 60 * 60 * 1000);
  }

  private async checkRotationSchedule(): Promise<void> {
    const now = Date.now();
    
    for (const apiKey of this.keyStore.values()) {
      if (apiKey.rotationSchedule?.enabled && apiKey.rotationSchedule.nextRotation <= now) {
        try {
          await this.rotateAPIKey(apiKey.id, true);
          console.log(`Auto-rotated API key: ${apiKey.id}`);
        } catch (error) {
          console.error(`Failed to auto-rotate API key ${apiKey.id}:`, error);
        }
      }
    }
  }

  private async notifyKeyRotation(apiKey: APIKey): Promise<void> {
    // Implementation would send notification to user
    console.log(`API key rotated for user ${apiKey.userId}: ${apiKey.name}`);
  }

  private async saveKeyToStorage(apiKey: APIKey): Promise<void> {
    // Store in Redis with expiration
    const ttl = apiKey.expiresAt ? Math.ceil((apiKey.expiresAt - Date.now()) / 1000) : 86400 * 365;
    await redisClient.set(`api_key:${apiKey.id}`, apiKey, ttl);
  }

  private async loadKeyFromStorage(keyId: string): Promise<APIKey | null> {
    return await redisClient.get<APIKey>(`api_key:${keyId}`);
  }

  private async loadKeysFromStorage(): Promise<void> {
    // Implementation would load keys from persistent storage
    console.log('Loading API keys from storage...');
  }
}

// Create singleton instance
export const apiKeyManager = new APIKeyManager();

// Export class for custom instances
export { APIKeyManager }; 