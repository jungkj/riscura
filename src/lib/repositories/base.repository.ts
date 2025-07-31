import { PrismaClient } from '@prisma/client';
import db, {
  PaginationOptions,
  buildPaginationQuery,
  withOrganization,
  withAuditFields,
} from '@/lib/db';

// Base repository interface
export interface IBaseRepository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findMany(organizationId: string, options?: PaginationOptions): Promise<T[]>;
  create(data: Partial<T>, organizationId: string, userId?: string): Promise<T>;
  update(id: string, data: Partial<T>, organizationId: string, userId?: string): Promise<T>;
  delete(id: string, organizationId: string): Promise<T>;
  count(organizationId: string): Promise<number>;
}

// Base repository implementation
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(modelName: string) {
    this.prisma = db.client;
    this.modelName = modelName;
  }

  // Get the Prisma model delegate
  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  // Find by ID with organization isolation
  async findById(id: string, organizationId: string): Promise<T | null> {
    return this.model.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  // Find many with pagination and organization isolation
  async findMany(organizationId: string, options: PaginationOptions = {}): Promise<T[]> {
    const paginationQuery = buildPaginationQuery(options);

    return this.model.findMany({
      where: {
        organizationId,
      },
      ...paginationQuery,
    });
  }

  // Create with organization and audit fields
  async create(data: Partial<T>, organizationId: string, userId?: string): Promise<T> {
    return this.model.create({
      data: {
        ...data,
        organizationId,
        ...withAuditFields(userId),
      },
    });
  }

  // Update with audit fields
  async update(id: string, data: Partial<T>, organizationId: string, userId?: string): Promise<T> {
    return this.model.update({
      where: {
        id,
        organizationId,
      },
      data: {
        ...data,
        ...withAuditFields(userId),
      },
    });
  }

  // Delete with organization isolation
  async delete(id: string, organizationId: string): Promise<T> {
    return this.model.delete({
      where: {
        id,
        organizationId,
      },
    });
  }

  // Count with organization isolation
  async count(organizationId: string): Promise<number> {
    return this.model.count({
      where: {
        organizationId,
      },
    });
  }

  // Soft delete (if supported by model)
  async softDelete(id: string, organizationId: string): Promise<T> {
    return this.model.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // Find with custom filters
  async findWhere(
    where: Record<string, any>,
    organizationId: string,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    const paginationQuery = buildPaginationQuery(options);

    return this.model.findMany({
      where: {
        ...where,
        organizationId,
      },
      ...paginationQuery,
    });
  }

  // Search with full-text search
  async search(
    searchTerm: string,
    searchFields: string[],
    organizationId: string,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    const paginationQuery = buildPaginationQuery(options);

    return this.model.findMany({
      where: {
        organizationId,
        OR: searchFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        })),
      },
      ...paginationQuery,
    });
  }

  // Bulk operations
  async createMany(
    data: Partial<T>[],
    organizationId: string,
    userId?: string
  ): Promise<{ count: number }> {
    return this.model.createMany({
      data: data.map((item) => ({
        ...item,
        organizationId,
        ...withAuditFields(userId),
      })),
    });
  }

  async updateMany(
    where: Record<string, any>,
    data: Partial<T>,
    organizationId: string,
    userId?: string
  ): Promise<{ count: number }> {
    return this.model.updateMany({
      where: {
        ...where,
        organizationId,
      },
      data: {
        ...data,
        ...withAuditFields(userId),
      },
    });
  }

  async deleteMany(where: Record<string, any>, organizationId: string): Promise<{ count: number }> {
    return this.model.deleteMany({
      where: {
        ...where,
        organizationId,
      },
    });
  }

  // Aggregation helpers
  async aggregate(organizationId: string, aggregation: Record<string, any>): Promise<any> {
    return this.model.aggregate({
      where: {
        organizationId,
      },
      ...aggregation,
    });
  }

  async groupBy(
    organizationId: string,
    groupBy: string[],
    aggregation?: Record<string, any>
  ): Promise<any[]> {
    return this.model.groupBy({
      by: groupBy,
      where: {
        organizationId,
      },
      ...aggregation,
    });
  }

  // Transaction support
  async transaction<R>(
    organizationId: string,
    fn: (
      prisma: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
      >
    ) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(fn);
  }

  // Include relationships
  async findWithIncludes(
    id: string,
    organizationId: string,
    includes: Record<string, any>
  ): Promise<T | null> {
    return this.model.findFirst({
      where: {
        id,
        organizationId,
      },
      include: includes,
    });
  }

  async findManyWithIncludes(
    organizationId: string,
    includes: Record<string, any>,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    const paginationQuery = buildPaginationQuery(options);

    return this.model.findMany({
      where: {
        organizationId,
      },
      include: includes,
      ...paginationQuery,
    });
  }
}

// Helper types for repository operations
export interface RepositoryOptions {
  include?: Record<string, any>;
  select?: Record<string, any>;
  orderBy?: Record<string, any>;
}

export interface SearchOptions extends PaginationOptions {
  filters?: Record<string, any>;
  searchFields?: string[];
}

// Repository result wrapper
export interface RepositoryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper function to create paginated results
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): RepositoryResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
