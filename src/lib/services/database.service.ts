import { db, checkDatabaseConnection, isDatabaseSeeded } from '@/lib/db';
import { createRiskRepository } from '@/lib/repositories';
import type { RiskFilters } from '@/lib/repositories';
import type { RiskLevel, RiskStatus } from '@prisma/client';

/**
 * Database Service - High-level database operations
 * Provides abstraction over repositories and handles complex business logic
 */
export class DatabaseService {
  private static instance: DatabaseService;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Health and status operations
  async checkHealth(): Promise<{
    isConnected: boolean;
    isSeeded: boolean;
    version?: string;
  }> {
    try {
      const isConnected = await checkDatabaseConnection();
      const isSeeded = await isDatabaseSeeded();
      
      let version: string | undefined;
      if (isConnected) {
        const result = await db.raw`SELECT version();`;
        version = result[0]?.version;
      }

      return {
        isConnected,
        isSeeded,
        version,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        isConnected: false,
        isSeeded: false,
      };
    }
  }

  // Risk operations
  async getRisks(
    organizationId: string,
    filters?: RiskFilters,
    options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ) {
    const riskRepo = await createRiskRepository();
    return riskRepo.findFiltered(organizationId, filters, options);
  }

  async getRiskById(riskId: string, organizationId: string) {
    const riskRepo = await createRiskRepository();
    return riskRepo.findByIdWithRelations(riskId, organizationId);
  }

  async createRisk(
    riskData: {
      title: string;
      description: string;
      category: any; // Will be typed by Prisma
      likelihood?: number;
      impact?: number;
      owner?: string;
    },
    organizationId: string,
    userId?: string
  ) {
    const riskRepo = await createRiskRepository();
    
    // Calculate risk score if likelihood and impact provided
    const riskScore = (riskData.likelihood || 1) * (riskData.impact || 1);
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

    return riskRepo.create(
      {
        ...riskData,
        riskScore,
        riskLevel,
        status: 'identified' as any,
        dateIdentified: new Date(),
      },
      organizationId,
      userId
    );
  }

  async updateRisk(
    riskId: string,
    updateData: Partial<{
      title: string;
      description: string;
      category: any;
      likelihood: number;
      impact: number;
      owner: string;
      status: any;
    }>,
    organizationId: string,
    userId?: string
  ) {
    const riskRepo = await createRiskRepository();
    
    // Recalculate risk score if likelihood or impact changed
    if (updateData.likelihood !== undefined || updateData.impact !== undefined) {
      return riskRepo.updateRiskScore(
        riskId,
        organizationId,
        updateData.likelihood || 1,
        updateData.impact || 1,
        userId
      );
    }

    return riskRepo.update(riskId, updateData, organizationId, userId);
  }

  async deleteRisk(riskId: string, organizationId: string) {
    const riskRepo = await createRiskRepository();
    return riskRepo.delete(riskId, organizationId);
  }

  async getRiskStatistics(organizationId: string) {
    const riskRepo = await createRiskRepository();
    return riskRepo.getStatistics(organizationId);
  }

  async getRisksForDashboard(organizationId: string) {
    const riskRepo = await createRiskRepository();
    
    const [
      statistics,
      highPriorityRisks,
      dueForReview
    ] = await Promise.all([
      riskRepo.getStatistics(organizationId),
      riskRepo.findHighPriority(organizationId, { limit: 5 }),
      riskRepo.findDueForReview(organizationId, 30)
    ]);

    return {
      statistics,
      highPriorityRisks,
      dueForReview,
      summary: {
        totalRisks: statistics.total,
        criticalRisks: statistics.byLevel.critical || 0,
        highRisks: statistics.byLevel.high || 0,
        averageScore: Math.round(statistics.averageScore * 10) / 10,
        dueForReviewCount: statistics.dueForReview,
      }
    };
  }

  // Transaction operations
  async executeTransaction<T>(
    organizationId: string,
    operation: (prisma: any) => Promise<T>
  ): Promise<T> {
    return db.transaction(operation);
  }

  // Bulk operations
  async bulkCreateRisks(
    risks: Array<{
      title: string;
      description: string;
      category: any;
      likelihood?: number;
      impact?: number;
    }>,
    organizationId: string,
    userId?: string
  ) {
    return this.executeTransaction(organizationId, async () => {
      const results: any[] = [];
      
      for (const riskData of risks) {
        const risk = await this.createRisk(riskData, organizationId, userId);
        results.push(risk);
      }
      
      return results;
    });
  }

  // Search operations
  async searchRisks(
    searchTerm: string,
    organizationId: string,
    options?: { page?: number; limit?: number }
  ) {
    const riskRepo = await createRiskRepository();
    return riskRepo.search(
      searchTerm,
      ['title', 'description'],
      organizationId,
      options
    );
  }

  // Organization operations
  async getOrganizationOverview(organizationId: string) {
    try {
      const [
        riskStats,
        userCount,
        // Add more entity counts as we implement them
      ] = await Promise.all([
        this.getRiskStatistics(organizationId),
        db.client.user.count({ where: { organizationId } }),
        // Add more counts here
      ]);

      return {
        organization: {
          id: organizationId,
        },
        statistics: {
          risks: riskStats,
          users: userCount,
        },
        health: await this.checkHealth(),
      };
    } catch (error) {
      console.error('Failed to get organization overview:', error);
      throw new Error('Failed to retrieve organization data');
    }
  }

  // Activity logging helper
  async logActivity(
    type: string,
    entityType: string,
    entityId: string,
    description: string,
    organizationId: string,
    userId?: string,
    metadata?: any
  ) {
    return db.client.activity.create({
      data: {
        type,
        entityType,
        entityId,
        description,
        metadata,
        organizationId,
        userId,
        isPublic: true,
      },
    });
  }

  // Performance monitoring
  async getPerformanceMetrics() {
    try {
      const metrics = await db.metrics;
      return {
        ...metrics,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }

  // Database maintenance operations
  async runMaintenance(): Promise<{
    success: boolean;
    operations: string[];
    errors?: string[];
  }> {
    const operations: string[] = [];
    const errors: string[] = [];

    try {
      // Update computed fields that might be stale
      operations.push('Updating risk scores');
      await db.raw`
        UPDATE risks 
        SET risk_score = likelihood * impact,
            updated_at = NOW()
        WHERE likelihood IS NOT NULL AND impact IS NOT NULL;
      `;

      // Clean up old activities (older than 1 year)
      operations.push('Cleaning old activities');
      await db.client.activity.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
          isPublic: false,
        },
      });

      operations.push('Maintenance completed successfully');
      return { success: true, operations };

    } catch (error) {
      console.error('Maintenance operation failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return { success: false, operations, errors };
    }
  }

  // Cleanup method for testing
  async cleanup(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Cleanup can only be called in test environment');
    }

    // Clean all data for testing
    await db.client.activity.deleteMany({});
    await db.client.notification.deleteMany({});
    await db.client.comment.deleteMany({});
    await db.client.message.deleteMany({});
    await db.client.response.deleteMany({});
    await db.client.questionnaire.deleteMany({});
    await db.client.task.deleteMany({});
    await db.client.controlRiskMapping.deleteMany({});
    await db.client.document.deleteMany({});
    await db.client.control.deleteMany({});
    await db.client.risk.deleteMany({});
    await db.client.workflow.deleteMany({});
    await db.client.report.deleteMany({});
    await db.client.session.deleteMany({});
    await db.client.user.deleteMany({});
    await db.client.organization.deleteMany({});
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export types for external use
export type DatabaseHealthStatus = Awaited<ReturnType<DatabaseService['checkHealth']>>;
export type OrganizationOverview = Awaited<ReturnType<DatabaseService['getOrganizationOverview']>>;
export type RiskDashboardData = Awaited<ReturnType<DatabaseService['getRisksForDashboard']>>; 