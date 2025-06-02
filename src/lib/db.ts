import { PrismaClient } from '@prisma/client';

// Extend PrismaClient for global typing
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Database configuration options
const databaseConfig = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,
  errorFormat: 'pretty' as const,
};

// Create Prisma client instance with connection pooling
const createPrismaClient = () => {
  return new PrismaClient({
    ...databaseConfig,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Global Prisma instance (for development hot reloading)
const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// Transaction wrapper for complex operations
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(fn);
}

// Multi-tenant query helper
export function withOrganization(organizationId: string) {
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
  
  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  };
}

// Search helper for full-text search
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): Record<string, unknown> {
  if (!searchTerm) return {};
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    })),
  };
}

// Database utilities
export const db = {
  // Core Prisma client
  client: prisma,
  
  // Connection management
  connect: async () => await prisma.$connect(),
  disconnect: disconnectDatabase,
  healthCheck: checkDatabaseConnection,
  
  // Transaction management
  transaction: withTransaction,
  
  // Multi-tenancy helpers
  forOrganization: withOrganization,
  
  // Audit helpers
  withAudit: withAuditFields,
  
  // Query builders
  paginate: buildPaginationQuery,
  search: buildSearchQuery,
  
  // Raw query execution
  raw: prisma.$queryRaw,
  rawUnsafe: prisma.$queryRawUnsafe,
  
  // Metrics and monitoring
  metrics: prisma.$metrics,
};

// Export the Prisma client as default
export default prisma;

// Export types for use in other files
export type { PrismaClient } from '@prisma/client';
export type DatabaseTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

// Performance monitoring utilities
export class DatabaseMetrics {
  private static instance: DatabaseMetrics;
  private queryStartTimes: Map<string, number> = new Map();
  
  public static getInstance(): DatabaseMetrics {
    if (!DatabaseMetrics.instance) {
      DatabaseMetrics.instance = new DatabaseMetrics();
    }
    return DatabaseMetrics.instance;
  }
  
  public startQuery(queryId: string): void {
    this.queryStartTimes.set(queryId, Date.now());
  }
  
  public endQuery(queryId: string): number {
    const startTime = this.queryStartTimes.get(queryId);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.queryStartTimes.delete(queryId);
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryId} took ${duration}ms`);
    }
    
    return duration;
  }
}

// Database seed check
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const organizationCount = await prisma.organization.count();
    return organizationCount > 0;
  } catch (error) {
    console.error('Error checking database seed status:', error);
    return false;
  }
}

// Schema validation utility
export async function validateDatabaseSchema(): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    // Test basic model access
    await prisma.organization.findFirst();
    await prisma.user.findFirst();
    await prisma.risk.findFirst();
    await prisma.control.findFirst();
    
    return { isValid: true, errors: [] };
  } catch (error) {
    errors.push(`Schema validation failed: ${error}`);
    return { isValid: false, errors };
  }
} 