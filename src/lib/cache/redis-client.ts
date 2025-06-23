// Enhanced Redis Client for Performance Optimization
import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../monitoring/logger';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  defaultTTL: number;
  maxRetries: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  connectTimeout: number;
  commandTimeout: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalOperations: number;
  hitRate: number;
  avgResponseTime: number;
  memoryUsage?: number;
  connectionStatus: string;
}

export interface CachePattern {
  pattern: string;
  ttl: number;
  tags: string[];
  compression?: boolean;
  serialization?: 'json' | 'msgpack' | 'binary';
}

// Redis configuration based on environment
const getRedisConfig = (): RedisOptions => {
  const baseConfig: RedisOptions = {
    // Connection settings
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // Connection pool settings
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
    
    // Performance settings
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    
    // Retry strategy
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    
    // Reconnect strategy
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      return err.message.includes(targetError);
    },
  };

  // Production-specific settings
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      // Use Redis Cluster in production if available
      enableOfflineQueue: false,
      maxMemoryPolicy: 'allkeys-lru',
    };
  }

  return baseConfig;
};

// Create Redis client instance
class RedisClient {
  private static instance: RedisClient;
  private client: Redis;
  private isConnected: boolean = false;

  private constructor() {
    this.client = new Redis(getRedisConfig());
    this.setupEventHandlers();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err: Error) => {
      this.isConnected = false;
      logger.error('Redis client error:', err);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
    }
  }

  public getClient(): Redis {
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  // Cache operations with error handling
  public async get(key: string): Promise<string | null> {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping cache get');
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  public async set(
    key: string, 
    value: string, 
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping cache set');
        return false;
      }

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping cache delete');
        return false;
      }
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) {
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isReady()) {
        return false;
      }
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  public async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      if (!this.isReady()) {
        return keys.map(() => null);
      }
      return await this.client.mget(...keys);
    } catch (error) {
      logger.error(`Redis MGET error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  public async mset(keyValuePairs: Record<string, string>): Promise<boolean> {
    try {
      if (!this.isReady()) {
        return false;
      }
      const pairs: string[] = [];
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        pairs.push(key, value);
      });
      await this.client.mset(...pairs);
      return true;
    } catch (error) {
      logger.error('Redis MSET error:', error);
      return false;
    }
  }

  // Hash operations
  public async hget(key: string, field: string): Promise<string | null> {
    try {
      if (!this.isReady()) return null;
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error(`Redis HGET error for ${key}.${field}:`, error);
      return null;
    }
  }

  public async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for ${key}.${field}:`, error);
      return false;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    try {
      if (!this.isReady()) return {};
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  // List operations
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      if (!this.isReady()) return 0;
      return await this.client.lpush(key, ...values);
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  public async rpop(key: string): Promise<string | null> {
    try {
      if (!this.isReady()) return null;
      return await this.client.rpop(key);
    } catch (error) {
      logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  // Set operations
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (!this.isReady()) return 0;
      return await this.client.sadd(key, ...members);
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error);
      return 0;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isReady()) return [];
      return await this.client.smembers(key);
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  // Cache invalidation patterns
  public async invalidatePattern(pattern: string): Promise<number> {
    try {
      if (!this.isReady()) return 0;
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (error) {
      logger.error(`Redis pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  // Health check
  public async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      return false;
    }
  }

  // Get cache statistics
  public async getStats(): Promise<Record<string, any>> {
    try {
      if (!this.isReady()) return {};
      const info = await this.client.info();
      const dbsize = await this.client.dbsize();
      
      return {
        connected: this.isConnected,
        status: this.client.status,
        dbsize,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    const sections = info.split('\r\n\r\n');
    
    sections.forEach(section => {
      const lines = section.split('\r\n');
      const sectionName = lines[0].replace('# ', '');
      result[sectionName] = {};
      
      lines.slice(1).forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          result[sectionName][key] = isNaN(Number(value)) ? value : Number(value);
        }
      });
    });
    
    return result;
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance();

// Export types
export type { RedisOptions };
export { Redis };

// Utility functions
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

export const hashKey = (key: string): string => {
  // Simple hash function for consistent key generation
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}; 