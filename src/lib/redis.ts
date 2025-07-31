// Re-export redis client for backward compatibility
export { redisClient as redis } from './cache/redis-client';
export { RedisClient } from './cache/redis-client';
export type { CacheConfig, CacheEntry } from './cache/redis-client';
