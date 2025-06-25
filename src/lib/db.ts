import { PrismaClient } from '@prisma/client';

// Extend PrismaClient for global typing
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Database connection configuration
interface DatabaseConfig {
  url: string;
  directUrl?: string;
  maxConnections: number;
  minConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
  queryTimeout: number;
  enableLogging: boolean;
  retryAttempts: number;
  retryDelay: number;
}

// Get database configuration from environment
function getDatabaseConfig(): DatabaseConfig {
  // Skip database configuration on client side
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not available on the client side');
  }

  const databaseUrl = process.env.DATABASE_URL;
  
  // Validate required environment variables
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is missing');
    throw new Error(
      'DATABASE_URL environment variable is required. Please set it in your .env file.\n' +
      'Example: DATABASE_URL="postgresql://username:password@localhost:5432/riscura"\n' +
      '\nTo fix this:\n' +
      '1. Copy .env.example to .env\n' +
      '2. Set your DATABASE_URL in the .env file\n' +
      '3. Ensure PostgreSQL is running\n' +
      '4. Run: tsx scripts/init-database.ts'
    );
  }

  // Validate URL format
  try {
    new URL(databaseUrl);
  } catch (error) {
    throw new Error(
      `Invalid DATABASE_URL format. Please provide a valid PostgreSQL connection string.\n` +
      `Example: DATABASE_URL="postgresql://username:password@localhost:5432/riscura"`
    );
  }

  return {
    url: databaseUrl,
    directUrl: process.env.DIRECT_URL || databaseUrl,
    maxConnections: parseInt(process.env.DB_CONNECTION_POOL_MAX || '50', 10),
    minConnections: parseInt(process.env.DB_CONNECTION_POOL_MIN || '5', 10),
    acquireTimeout: parseInt(process.env.DB_CONNECTION_POOL_ACQUIRE_TIMEOUT || '60000', 10),
    idleTimeout: parseInt(process.env.DB_CONNECTION_POOL_IDLE_TIMEOUT || '10000', 10),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
    enableLogging: process.env.DB_QUERY_LOGGING === 'true' || process.env.NODE_ENV === 'development',
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000', 10),
  };
}

// Database logging configuration
function getLogConfig(): ('query' | 'info' | 'warn' | 'error')[] {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enableLogging = process.env.DB_QUERY_LOGGING === 'true';
  
  if (isDevelopment || enableLogging) {
    return ['query', 'info', 'warn', 'error'];
  }
  
  return ['error', 'warn'];
}

// Create Prisma client with proper configuration
function createPrismaClient(): PrismaClient {
  const config = getDatabaseConfig();
  
  console.log('🔗 Initializing database connection...');
  console.log(`📊 Connection pool: ${config.minConnections}-${config.maxConnections}`);
  console.log(`⏱️  Query timeout: ${config.queryTimeout}ms`);
  
  return new PrismaClient({
    log: getLogConfig(),
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: config.url,
      },
    },
  });
}

// Retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'database operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        console.error(`❌ ${operationName} failed after ${maxAttempts} attempts:`, error);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️  ${operationName} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms...`);
      console.warn('Error:', error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Global Prisma instance (singleton pattern)
let prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  // Prevent client-side initialization
  if (typeof window !== 'undefined') {
    throw new Error('Prisma client cannot be initialized on the client side');
  }

  if (!prisma) {
    prisma = createPrismaClient();
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      // Set up basic logging without event handlers for now
      console.log('🔧 Database client initialized in development mode');
    }
  }
  
  return prisma;
}

// Safe prisma client getter
function getSafePrismaClient(): PrismaClient {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not available on the client side');
  }
  
  if (!prisma) {
    prisma = getPrismaClient();
  }
  
  return prisma;
}

// Development hot reloading support (server-side only)
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV !== 'production') {
    if (!globalThis.prisma) {
      globalThis.prisma = getPrismaClient();
    }
    prisma = globalThis.prisma;
  } else {
    prisma = getPrismaClient();
  }
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const client = getSafePrismaClient();
    await withRetry(async () => {
      await client.$queryRaw`SELECT 1 as health_check`;
    }, 2, 500, 'database health check');
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Database health check passed (${responseTime}ms)`);
    
    return {
      isHealthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ Database health check failed (${responseTime}ms):`, errorMessage);
    
    return {
      isHealthy: false,
      responseTime,
      error: errorMessage,
    };
  }
}

// Enhanced connection check with detailed diagnostics
export async function checkDatabaseConnectionDetailed(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  connectionInfo: {
    version?: string;
    maxConnections?: number;
    activeConnections?: number;
  };
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const client = getSafePrismaClient();
    const [versionResult, connectionResult] = await Promise.all([
      withRetry(async () => {
        return await client.$queryRaw<{ version: string }[]>`SELECT version() as version`;
      }, 2, 500, 'version check'),
      withRetry(async () => {
        return await client.$queryRaw<{ max_connections: number; active_connections: number }[]>`
          SELECT 
            current_setting('max_connections')::int as max_connections,
            (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
        `;
      }, 2, 500, 'connection check'),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: true,
      responseTime,
      connectionInfo: {
        version: versionResult[0]?.version,
        maxConnections: connectionResult[0]?.max_connections,
        activeConnections: connectionResult[0]?.active_connections,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      isHealthy: false,
      responseTime,
      connectionInfo: {},
      error: errorMessage,
    };
  }
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  if (!prisma) {
    return;
  }
  
  try {
    console.log('🔌 Disconnecting from database...');
    if (prisma) {
      await prisma.$disconnect();
    }
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
}

// Connect to database with retry logic
export async function connectDatabase(): Promise<void> {
  try {
    console.log('🔗 Connecting to database...');
    
    await withRetry(async () => {
      await prisma.$connect();
    }, 3, 1000, 'database connection');
    
    console.log('✅ Database connected successfully');
    
    // Verify connection with health check
    const healthCheck = await checkDatabaseConnection();
    if (!healthCheck.isHealthy) {
      throw new Error(`Database health check failed: ${healthCheck.error}`);
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

// Transaction wrapper with retry logic
export async function withTransaction<T>(
  fn: (prisma: any) => Promise<T>,
  options: {
    maxAttempts?: number;
    timeout?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, timeout = 30000 } = options;
  
  return withRetry(async () => {
    return await prisma.$transaction(fn, {
      timeout,
    });
  }, maxAttempts, 1000, 'database transaction');
}

// Multi-tenant query helper
export function withOrganization(organizationId: string) {
  if (!organizationId) {
    throw new Error('Organization ID is required for multi-tenant operations');
  }
  
  return {
    where: {
      organizationId,
    },
  };
}

// Audit trail helper
export function withAuditFields(userId?: string) {
  return {
    createdBy: userId,
    updatedAt: new Date(),
  };
}

// Pagination helper
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function buildPaginationQuery(options: PaginationOptions = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  // Validate pagination parameters
  if (page < 1) {
    throw new Error('Page number must be greater than 0');
  }
  
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  };
}

// Enhanced search helper
export function buildSearchQuery(
  searchTerm: string,
  fields: string[],
  options: {
    caseSensitive?: boolean;
    exactMatch?: boolean;
  } = {}
): Record<string, unknown> {
  if (!searchTerm?.trim()) {
    return {};
  }
  
  const { caseSensitive = false, exactMatch = false } = options;
  
  if (exactMatch) {
    return {
      OR: fields.map(field => ({
        [field]: {
          equals: searchTerm,
          mode: caseSensitive ? 'default' : 'insensitive',
        },
      })),
    };
  }
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: caseSensitive ? 'default' : 'insensitive',
      },
    })),
  };
}

// Database utilities
export const db = {
  // Core Prisma client
  get client() {
    return getSafePrismaClient();
  },
  
  // Connection management
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  healthCheck: checkDatabaseConnection,
  healthCheckDetailed: checkDatabaseConnectionDetailed,
  
  // Transaction management
  transaction: withTransaction,
  
  // Multi-tenancy helpers
  forOrganization: withOrganization,
  
  // Audit helpers
  withAudit: withAuditFields,
  
  // Query builders
  paginate: buildPaginationQuery,
  search: buildSearchQuery,
  
  // Raw query execution with retry
  raw: async (query: TemplateStringsArray, ...values: any[]) => {
    return withRetry(async () => {
      return await prisma.$queryRaw(query, ...values);
    }, 2, 500, 'raw query');
  },
  
  rawUnsafe: async (query: string, ...values: any[]) => {
    return withRetry(async () => {
      return await prisma.$queryRawUnsafe(query, ...values);
    }, 2, 500, 'raw unsafe query');
  },
};

// Export the Prisma client as default and named export
export default prisma;
export { prisma };

// Export types for use in other files
export type { PrismaClient } from '@prisma/client';
export type DatabaseTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

// Database status checker
export async function getDatabaseStatus(): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  connections: {
    active: number;
    max: number;
    utilization: number;
  };
  performance: {
    averageResponseTime: number;
    slowQueries: number;
  };
  lastHealthCheck: Date;
}> {
  const startTime = Date.now();
  
  try {
    const healthCheck = await checkDatabaseConnectionDetailed();
    
    if (!healthCheck.isHealthy) {
      return {
        status: 'unhealthy',
        uptime: 0,
        connections: { active: 0, max: 0, utilization: 0 },
        performance: { averageResponseTime: healthCheck.responseTime, slowQueries: 0 },
        lastHealthCheck: new Date(),
      };
    }
    
    const { connectionInfo } = healthCheck;
    const utilization = connectionInfo.maxConnections 
      ? (connectionInfo.activeConnections || 0) / connectionInfo.maxConnections * 100
      : 0;
    
    const status = utilization > 80 ? 'degraded' : 'healthy';
    
    return {
      status,
      uptime: Date.now() - startTime,
      connections: {
        active: connectionInfo.activeConnections || 0,
        max: connectionInfo.maxConnections || 0,
        utilization,
      },
      performance: {
        averageResponseTime: healthCheck.responseTime,
        slowQueries: 0, // TODO: Implement slow query tracking
      },
      lastHealthCheck: new Date(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      uptime: 0,
      connections: { active: 0, max: 0, utilization: 0 },
      performance: { averageResponseTime: Date.now() - startTime, slowQueries: 0 },
      lastHealthCheck: new Date(),
    };
  }
}

// Graceful shutdown process
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught exception:', error);
  await disconnectDatabase();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  await disconnectDatabase();
  process.exit(1);
}); 