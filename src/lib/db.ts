import { PrismaClient } from '@prisma/client';
import { getProductionDatabaseUrl } from './db-config';

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
function getDatabaseConfig(): DatabaseConfig | null {
  // Skip database configuration on client side
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not available on the client side');
  }

  // During build time, return a minimal configuration
  if (process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build') {
    return {
      url: 'postgresql://build:build@localhost:5432/build',
      directUrl: 'postgresql://build:build@localhost:5432/build',
      maxConnections: 1,
      minConnections: 1,
      acquireTimeout: 1000,
      idleTimeout: 1000,
      queryTimeout: 1000,
      enableLogging: false,
      retryAttempts: 1,
      retryDelay: 100,
    };
  }

  // Check for both uppercase and lowercase versions (Vercel might use lowercase)
  // Also check for other common Vercel database env var names
  // Use the production override if applicable
  let databaseUrl = getProductionDatabaseUrl() || 
                   process.env.DATABASE_URL || 
                   process.env.database_url || 
                   process.env.POSTGRES_URL ||
                   process.env.POSTGRES_PRISMA_URL ||
                   process.env.POSTGRES_URL_NON_POOLING;
  
  // The production override is now handled by getProductionDatabaseUrl()
  
  // Check if URL is already a pooled URL (contains pooler.supabase.com)
  const isAlreadyPooled = databaseUrl?.includes('pooler.supabase.com');
  
  // For production, if we have a DIRECT_URL set, prefer the main DATABASE_URL
  // This handles cases where Vercel sets both
  if (process.env.NODE_ENV === 'production' && process.env.DIRECT_URL && databaseUrl === process.env.DIRECT_URL) {
    console.log('⚠️  Using DIRECT_URL in production, checking for pooled alternative...');
    const pooledAlternative = process.env.DATABASE_URL || process.env.database_url || process.env.POSTGRES_URL;
    if (pooledAlternative && pooledAlternative !== process.env.DIRECT_URL) {
      console.log('✅ Found pooled URL alternative, switching to it');
      databaseUrl = pooledAlternative;
    }
  }
  
  if (databaseUrl && !isAlreadyPooled) {
    console.log('🔍 Checking database URL format:', {
      urlPreview: databaseUrl.substring(0, 60) + '...',
      isProduction: process.env.NODE_ENV === 'production',
      isPooled: isAlreadyPooled
    });
  }
  
  // Auto-convert Supabase direct URL to pooled URL
  // Always convert in production environment, not just on Vercel
  if (databaseUrl && process.env.NODE_ENV === 'production' && !isAlreadyPooled) {
    const supabaseDirectPattern = /postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:5432\/postgres/;
    const match = databaseUrl.match(supabaseDirectPattern);
    
    if (match) {
      const [, password, projectRef] = match;
      // Get the region from environment or default to us-east-1
      const region = process.env.SUPABASE_REGION || 'us-east-1';
      // Convert to pooled connection URL with the correct region
      const pooledUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
      console.log('🔄 Converting Supabase direct URL to pooled URL');
      console.log('Environment:', { 
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL, 
        VERCEL_ENV: process.env.VERCEL_ENV,
        originalHost: `db.${projectRef}.supabase.co`,
        newHost: `aws-0-${region}.pooler.supabase.com`,
        region: region
      });
      databaseUrl = pooledUrl;
    } else {
      console.log('🔍 Database URL format:', {
        isDirectUrl: databaseUrl?.includes('db.') && databaseUrl?.includes('.supabase.co'),
        isPooledUrl: isAlreadyPooled,
        urlPattern: databaseUrl?.substring(0, 50) + '...'
      });
    }
  }
  
  // Validate required environment variables
  if (!databaseUrl) {
    // In development, allow missing DATABASE_URL for demo mode
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  DATABASE_URL not set - database operations will be unavailable');
      console.warn('   Demo mode will be used for demo account (admin@riscura.com)');
      return null;
    }
    
    // In production, DATABASE_URL is required
    console.error('❌ DATABASE_URL environment variable is missing');
    console.error('Checked: DATABASE_URL =', process.env.DATABASE_URL, 'database_url =', process.env.database_url);
    throw new Error(
      'DATABASE_URL environment variable is required in production.\n' +
      'Example: DATABASE_URL="postgresql://username:password@localhost:5432/riscura"'
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
function createPrismaClient(): PrismaClient | null {
  const config = getDatabaseConfig();
  
  // If no config (DATABASE_URL missing in dev), return null
  if (!config) {
    return null;
  }
  
  console.log('🔗 Initializing database connection...');
  console.log(`📊 Connection pool: ${config.minConnections}-${config.maxConnections}`);
  console.log(`⏱️  Query timeout: ${config.queryTimeout}ms`);
  
  // Log the URL we're about to use (first 60 chars only for security)
  console.log('🔍 Using database URL:', config.url.substring(0, 60) + '...');
  
  const datasourceUrl = new URL(config.url);
  const isSupabasePooled = datasourceUrl.hostname.includes('pooler.supabase.com');
  
  // Add connection pool parameters for Supabase
  if (isSupabasePooled) {
    datasourceUrl.searchParams.set('pgbouncer', 'true');
    datasourceUrl.searchParams.set('connection_limit', '1');
    console.log('✅ Configured for Supabase pooled connection');
  } else if (datasourceUrl.hostname.includes('supabase.co')) {
    console.warn('⚠️  Using direct Supabase connection - this may cause issues in production!');
  }
  
  return new PrismaClient({
    log: getLogConfig(),
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: datasourceUrl.toString(),
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
let prisma: PrismaClient | null | undefined;
let databaseAvailable: boolean | undefined;

// Check if database is available
export function isDatabaseAvailable(): boolean {
  if (databaseAvailable !== undefined) {
    return databaseAvailable;
  }
  
  // Check if we can get a config
  const config = getDatabaseConfig();
  databaseAvailable = config !== null;
  return databaseAvailable;
}

function getPrismaClient(): PrismaClient | null {
  // Prevent client-side initialization
  if (typeof window !== 'undefined') {
    throw new Error('Prisma client cannot be initialized on the client side');
  }

  if (prisma === undefined) {
    prisma = createPrismaClient();
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && prisma) {
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
  
  if (prisma === undefined) {
    prisma = getPrismaClient();
  }
  
  if (!prisma) {
    throw new Error('Database is not available. Please set DATABASE_URL environment variable.');
  }
  
  return prisma;
}

// Development hot reloading support (server-side only)
// Skip initialization during build time
// DO NOT initialize eagerly - let getPrismaClient() handle it lazily
if (typeof window === 'undefined' && process.env.BUILDING !== 'true' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // Only set up global reference in development for hot reloading
  // But don't actually initialize Prisma yet
  if (process.env.NODE_ENV !== 'production') {
    // Just mark that we've set up the global reference
    // Actual initialization happens lazily on first use
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
  if (!isDatabaseAvailable()) {
    console.warn('⚠️ Database not available, skipping connection');
    return;
  }
  
  try {
    console.log('🔗 Connecting to database...');
    
    const client = getSafePrismaClient();
    await withRetry(async () => {
      await client.$connect();
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
  if (!isDatabaseAvailable()) {
    throw new Error('Database is not available for transactions');
  }
  
  const { maxAttempts = 3, timeout = 30000 } = options;
  const client = getSafePrismaClient();
  
  return withRetry(async () => {
    return await client.$transaction(fn, {
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
    if (!isDatabaseAvailable()) {
      throw new Error('Database is not available. Please set DATABASE_URL environment variable.');
    }
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
    if (!isDatabaseAvailable()) {
      throw new Error('Database is not available for raw queries');
    }
    return withRetry(async () => {
      const client = getSafePrismaClient();
      return await client.$queryRaw(query, ...values);
    }, 2, 500, 'raw query');
  },
  
  rawUnsafe: async (query: string, ...values: any[]) => {
    if (!isDatabaseAvailable()) {
      throw new Error('Database is not available for raw queries');
    }
    return withRetry(async () => {
      const client = getSafePrismaClient();
      return await client.$queryRawUnsafe(query, ...values);
    }, 2, 500, 'raw unsafe query');
  },
};

// Export the Prisma client as default and named export
// Use lazy getter to avoid initialization during build
const getPrismaClientLazy = () => {
  if (!isDatabaseAvailable()) {
    throw new Error('Database is not available. Please set DATABASE_URL environment variable.');
  }
  return getSafePrismaClient();
};

// Create a proxy that lazily initializes Prisma when accessed
const prismaProxy = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client[prop as keyof PrismaClient];
  }
});

export default prismaProxy;
export { prismaProxy as prisma };

// Export direct model access with lazy initialization
export const user = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.user[prop as keyof typeof client.user];
  }
});

export const organization = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.organization[prop as keyof typeof client.organization];
  }
});

export const risk = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.risk[prop as keyof typeof client.risk];
  }
});

export const control = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.control[prop as keyof typeof client.control];
  }
});

export const document = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.document[prop as keyof typeof client.document];
  }
});

export const questionnaire = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.questionnaire[prop as keyof typeof client.questionnaire];
  }
});

export const controlRiskMapping = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClientLazy();
    return client.controlRiskMapping[prop as keyof typeof client.controlRiskMapping];
  }
});

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