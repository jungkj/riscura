import { Risk, RiskCategory } from '@/types';
import { RiskCategory as PrismaRiskCategory, RiskLevel, RiskStatus } from '@prisma/client';
import { BaseRepository, RepositoryResult, createPaginatedResult } from './base.repository';
import { PaginationOptions } from '@/lib/db';

export interface RiskFilters {
  category?: PrismaRiskCategory;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  status?: RiskStatus;
  owner?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface RiskWithControls extends Omit<Risk, 'controls'> {
  controls?: Array<{
    id: string;
    title: string;
    type: string;
    effectiveness: number;
  }>;
  _count?: {
    controls: number;
    comments: number;
    tasks: number;
  };
}

export class RiskRepository extends BaseRepository<Risk> {
  constructor() {
    super('risk');
  }

  // Find risks with advanced filtering
  async findFiltered(
    organizationId: string,
    filters: RiskFilters = {},
    options: PaginationOptions = {}
  ): Promise<RepositoryResult<Risk>> {
    const where: any = {
      organizationId,
    };

    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.riskLevel) {
      where.riskLevel = filters.riskLevel;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.owner) {
      where.owner = filters.owner;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.dateIdentified = {};
      if (filters.dateFrom) {
        where.dateIdentified.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateIdentified.lte = filters.dateTo;
      }
    }

    // Get total count
    const total = await this.model.count({ where });

    // Get paginated data
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const data = await this.model.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            controls: true,
            comments: true,
            tasks: true,
          },
        },
      },
    });

    return createPaginatedResult(data, total, page, limit);
  }

  // Find risk with all relationships
  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<RiskWithControls | null> {
    return this.model.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        controls: {
          include: {
            control: {
              select: {
                id: true,
                title: true,
                type: true,
                effectiveness: true,
                status: true,
              },
            },
          },
        },
        evidence: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            uploadedAt: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            controls: true,
            comments: true,
            tasks: true,
          },
        },
      },
    });
  }

  // Find risks by category with statistics
  async findByCategory(
    organizationId: string,
    category: PrismaRiskCategory,
    options: PaginationOptions = {}
  ): Promise<RepositoryResult<Risk>> {
    return this.findFiltered(organizationId, { category }, options);
  }

  // Find high-priority risks
  async findHighPriority(
    organizationId: string,
    options: PaginationOptions = {}
  ): Promise<Risk[]> {
    return this.model.findMany({
      where: {
        organizationId,
        riskLevel: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
      orderBy: [
        { riskScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options.limit || 10,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Find risks due for review
  async findDueForReview(
    organizationId: string,
    daysAhead: number = 30
  ): Promise<Risk[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.model.findMany({
      where: {
        organizationId,
        nextReview: {
          lte: futureDate,
        },
        status: {
          not: 'CLOSED',
        },
      },
      orderBy: {
        nextReview: 'asc',
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Get risk statistics by organization
  async getStatistics(organizationId: string): Promise<{
    total: number;
    byCategory: Record<PrismaRiskCategory, number>;
    byLevel: Record<'low' | 'medium' | 'high' | 'critical', number>;
    byStatus: Record<RiskStatus, number>;
    averageScore: number;
    dueForReview: number;
  }> {
    const [
      total,
      byCategory,
      byLevel,
      byStatus,
      averageScoreResult,
      dueForReview,
    ] = await Promise.all([
      this.count(organizationId),
      
      this.model.groupBy({
        by: ['category'],
        where: { organizationId },
        _count: { _all: true },
      }),
      
      this.model.groupBy({
        by: ['riskLevel'],
        where: { organizationId },
        _count: { _all: true },
      }),
      
      this.model.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      
      this.model.aggregate({
        where: { organizationId },
        _avg: { riskScore: true },
      }),
      
      this.model.count({
        where: {
          organizationId,
          nextReview: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          status: { not: 'CLOSED' },
        },
      }),
    ]);

    // Transform grouped results into records
    const categoryStats = {} as Record<PrismaRiskCategory, number>;
    byCategory.forEach((item: any) => {
      categoryStats[item.category as PrismaRiskCategory] = item._count._all;
    });

    const levelStats = {} as Record<'low' | 'medium' | 'high' | 'critical', number>;
    byLevel.forEach((item: any) => {
      levelStats[item.riskLevel as 'low' | 'medium' | 'high' | 'critical'] = item._count._all;
    });

    const statusStats = {} as Record<RiskStatus, number>;
    byStatus.forEach((item: any) => {
      statusStats[item.status as RiskStatus] = item._count._all;
    });

    return {
      total,
      byCategory: categoryStats,
      byLevel: levelStats,
      byStatus: statusStats,
      averageScore: averageScoreResult._avg.riskScore || 0,
      dueForReview,
    };
  }

  // Update risk score based on likelihood and impact
  async updateRiskScore(
    id: string,
    organizationId: string,
    likelihood: number,
    impact: number,
    userId?: string
  ): Promise<Risk> {
    const riskScore = likelihood * impact;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';

    if (riskScore >= 20) {
      riskLevel = 'critical';
    } else if (riskScore >= 15) {
      riskLevel = 'high';
    } else if (riskScore >= 8) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return this.update(
      id,
      {
        likelihood,
        impact,
        riskScore,
        riskLevel,
        lastAssessed: new Date(),
      },
      organizationId,
      userId
    );
  }

  // Link control to risk
  async linkControl(
    riskId: string,
    controlId: string,
    effectiveness: number,
    organizationId: string
  ): Promise<void> {
    await this.prisma.controlRiskMapping.create({
      data: {
        riskId,
        controlId,
        effectiveness,
      },
    });
  }

  // Unlink control from risk
  async unlinkControl(
    riskId: string,
    controlId: string,
    organizationId: string
  ): Promise<void> {
    await this.prisma.controlRiskMapping.deleteMany({
      where: {
        riskId,
        controlId,
        risk: {
          organizationId,
        },
      },
    });
  }

  // Update control effectiveness for a risk
  async updateControlEffectiveness(
    riskId: string,
    controlId: string,
    effectiveness: number,
    organizationId: string
  ): Promise<void> {
    await this.prisma.controlRiskMapping.updateMany({
      where: {
        riskId,
        controlId,
        risk: {
          organizationId,
        },
      },
      data: {
        effectiveness,
      },
    });
  }
} 