import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '@/config/env';

// Connection pool configuration
const DATABASE_CONFIG = {
  pool: {
    max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
    min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
    idle: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '10000'),
    acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT || '60000'),
    evict: parseInt(process.env.DATABASE_POOL_EVICT_TIMEOUT || '1000'),
  },
  retry: {
    attempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3'),
    delay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000'),
    backoff: parseFloat(process.env.DATABASE_RETRY_BACKOFF || '2'),
  },
  timeout: {
    query: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
    transaction: parseInt(process.env.DATABASE_TRANSACTION_TIMEOUT || '60000'),
  },
};

// Global connection instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma client options for production
const prismaOptions: Prisma.PrismaClientOptions = {
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
};

// Connection pool status interface
export interface ConnectionPoolStatus {
  isHealthy: boolean;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  pendingRequests: number;
  avgQueryTime: number;
  uptime: number;
  lastHealthCheck: Date;
  errors?: string[];
}

// Database connection class
class DatabaseConnection {
  private client: PrismaClient;
  private connectionStartTime: Date;
  private queryTimes: number[] = [];
  private maxQueryTimes = 100;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private connectionAttempts = 0;

  constructor() {
    this.connectionStartTime = new Date();
    this.client = new PrismaClient(prismaOptions);
    this.setupConnectionHandlers();
    this.startHealthChecks();
  }

  private setupConnectionHandlers() {
    // Skip event handlers to avoid TypeScript issues
    // Query timing will be handled in health checks
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        // console.error('Health check failed:', error)
      }
    }, 30000);
  }

  async connect(): Promise<PrismaClient> {
    if (this.isConnected) {
      return this.client;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= DATABASE_CONFIG.retry.attempts; attempt++) {
      try {
        // console.log(`Database connection attempt ${attempt}/${DATABASE_CONFIG.retry.attempts}`)

        await this.client.$connect();
        await this.client.$queryRaw`SELECT 1`;

        this.isConnected = true;
        this.connectionAttempts = attempt;

        // console.log(`Database connected successfully on attempt ${attempt}`)
        return this.client;
      } catch (error) {
        lastError = error as Error;
        // console.error(`Database connection attempt ${attempt} failed:`, error)

        if (attempt < DATABASE_CONFIG.retry.attempts) {
          const delay =
            DATABASE_CONFIG.retry.delay * Math.pow(DATABASE_CONFIG.retry.backoff, attempt - 1);
          // console.log(`Retrying in ${delay}ms...`)
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to connect to database after ${DATABASE_CONFIG.retry.attempts} attempts: ${lastError?.message}`
    );
  }

  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.client) {
      await this.client.$disconnect();
      this.isConnected = false;
    }
  }

  async healthCheck(): Promise<ConnectionPoolStatus> {
    try {
      const startTime = Date.now();

      await this.client.$queryRaw`SELECT 1`;

      const dbStats = await this.client.$queryRaw<
        Array<{
          numbackends: number;
          xact_commit: number;
          xact_rollback: number;
        }>
      >`
        SELECT 
          numbackends,
          xact_commit,
          xact_rollback
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;

      const queryTime = Date.now() - startTime;
      this.queryTimes.push(queryTime);

      const avgQueryTime =
        this.queryTimes.length > 0
          ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
          : 0;

      const _stats = dbStats[0] || {};

      const status: ConnectionPoolStatus = {
        isHealthy: true,
        activeConnections: stats.numbackends || 0,
        idleConnections: 0,
        totalConnections: stats.numbackends || 0,
        maxConnections: DATABASE_CONFIG.pool.max,
        pendingRequests: 0,
        avgQueryTime,
        uptime: Date.now() - this.connectionStartTime.getTime(),
        lastHealthCheck: new Date(),
      };

      this.isConnected = true;
      return status;
    } catch (error) {
      this.isConnected = false;
      return {
        isHealthy: false,
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        maxConnections: DATABASE_CONFIG.pool.max,
        pendingRequests: 0,
        avgQueryTime: 0,
        uptime: Date.now() - this.connectionStartTime.getTime(),
        lastHealthCheck: new Date(),
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  getClient(): PrismaClient {
    return this.client;
  }

  async executeWithRetry<T>(
    operation: (client: PrismaClient) => Promise<T>,
    operationName = 'database operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= DATABASE_CONFIG.retry.attempts; attempt++) {
      try {
        if (!this.isConnected) {
          await this.connect();
        }

        return await operation(this.client);
      } catch (error) {
        lastError = error as Error;
        // console.error(`${operationName} attempt ${attempt} failed:`, error)

        if (this.isConnectionError(error)) {
          this.isConnected = false;

          if (attempt < DATABASE_CONFIG.retry.attempts) {
            const delay =
              DATABASE_CONFIG.retry.delay * Math.pow(DATABASE_CONFIG.retry.backoff, attempt - 1);
            // console.log(`Retrying ${operationName} in ${delay}ms...`)
            await this.sleep(delay);
            continue;
          }
        }

        throw error;
      }
    }

    throw new Error(
      `${operationName} failed after ${DATABASE_CONFIG.retry.attempts} attempts: ${lastError?.message}`
    );
  }

  private isConnectionError(__error: any): boolean {
    const connectionErrorMessages = [
      'connection terminated',
      'connection refused',
      'connection reset',
      'timeout',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    return connectionErrorMessages.some((msg) => errorMessage.includes(msg));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async gracefulShutdown(): Promise<void> {
    // console.log('Initiating graceful database shutdown...')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    try {
      await this.client.$disconnect();
      // console.log('Database disconnected successfully')
    } catch (error) {
      // console.error('Error during database shutdown:', error)
    }
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

// Initialize connection on startup
let initializationPromise: Promise<PrismaClient> | null = null;

export const initializeDatabase = async (): Promise<PrismaClient> => {
  if (!initializationPromise) {
    initializationPromise = databaseConnection.connect();
  }
  return initializationPromise;
};

// Export the database client
export const db = global.__prisma || databaseConnection.getClient();

if (env.NODE_ENV !== 'production') {
  global.__prisma = db;
}

// Export connection utilities
export { databaseConnection, DATABASE_CONFIG };

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    // console.log('SIGTERM received, shutting down database connection...')
    await databaseConnection.gracefulShutdown();
  });

  process.on('SIGINT', async () => {
    // console.log('SIGINT received, shutting down database connection...')
    await databaseConnection.gracefulShutdown();
  });
}
