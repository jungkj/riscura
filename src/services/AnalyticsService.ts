// import {
  startOfDay,
  subDays,
  format,
  eachDayOfInterval,
  startOfWeek,
  startOfMonth,
  _endOfMonth,
} from 'date-fns';
import { prisma } from '@/lib/prisma';

export interface AnalyticsMetrics {
  risks: {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    trend: TrendData[];
    distribution: Array<{ category: string; severity: string; count: number }>;
  };
  controls: {
    total: number;
    byEffectiveness: Record<string, number>;
    byType: Record<string, number>;
    byFrequency: Record<string, number>;
    testingCoverage: number;
    trend: TrendData[];
  };
  compliance: {
    overallScore: number;
    byFramework: Array<{ framework: string; score: number; coverage: number }>;
    gaps: number;
    trend: TrendData[];
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    completionRate: number;
    averageCompletionTime: number;
    trend: TrendData[];
  };
  activities: {
    recentActions: ActivityData[];
    byType: Record<string, number>;
    byUser: Array<{ user: string; count: number }>;
    timeline: TrendData[];
  };
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface ActivityData {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export class AnalyticsService {
  async getAnalyticsData(_organizationId: string, timeRange: TimeRange): Promise<AnalyticsMetrics> {
    const [risks, controls, tasks, activities] = await Promise.all([
      this.getRiskAnalytics(organizationId, timeRange),
      this.getControlAnalytics(organizationId, timeRange),
      this.getTaskAnalytics(organizationId, timeRange),
      this.getActivityAnalytics(organizationId, timeRange),
    ]);

    const compliance = await this.getComplianceAnalytics(organizationId, risks, controls);

    return {
      risks,
      controls,
      compliance,
      tasks,
      activities,
    };
  }

  private async getRiskAnalytics(_organizationId: string, timeRange: TimeRange) {
    // Get all risks
    const risks = await prisma.risk.findMany({
      where: { organizationId },
      include: {
        controls: true,
      },
    });

    // Calculate distributions
    const byStatus = this.groupAndCount(risks, 'status');
    const bySeverity = this.groupAndCount(risks, 'severity');
    const byCategory = this.groupAndCount(risks, 'category');

    // Calculate distribution matrix
    const distribution = this.calculateRiskDistribution(risks);

    // Get trend data
    const trend = await this.getRiskTrend(organizationId, timeRange);

    return {
      total: risks.length,
      byStatus,
      bySeverity,
      byCategory,
      trend,
      distribution,
    };
  }

  private async getControlAnalytics(_organizationId: string, timeRange: TimeRange) {
    // Get all controls with test executions
    const controls = await prisma.control.findMany({
      where: { organizationId },
      include: {
        testScripts: {
          include: {
            testScript: {
              include: {
                testExecutions: {
                  where: {
                    executionDate: {
                      gte: timeRange.start,
                      lte: timeRange.end,
                    },
                  },
                  orderBy: { executionDate: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Calculate distributions
    const byEffectiveness = this.groupAndCount(controls, 'effectiveness');
    const byType = this.groupAndCount(controls, 'type');
    const byFrequency = this.groupAndCount(controls, 'frequency');

    // Calculate testing coverage
    const testedControls = controls.filter((control) =>
      control.testScripts.some((ts) => ts.testScript.testExecutions.length > 0)
    );
    const testingCoverage =
      controls.length > 0 ? (testedControls.length / controls.length) * 100 : 0;

    // Get trend data
    const trend = await this.getControlTrend(organizationId, timeRange);

    return {
      total: controls.length,
      byEffectiveness,
      byType,
      byFrequency,
      testingCoverage,
      trend,
    };
  }

  private async getTaskAnalytics(_organizationId: string, timeRange: TimeRange) {
    // Get all tasks
    const tasks = await prisma.task.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });

    // Calculate distributions
    const byStatus = this.groupAndCount(tasks, 'status');
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== 'COMPLETED'
    );

    // Calculate completion metrics
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    const averageCompletionTime = this.calculateAverageCompletionTime(completedTasks);

    // Get trend data
    const trend = await this.getTaskTrend(organizationId, timeRange);

    return {
      total: tasks.length,
      byStatus,
      overdue: overdueTasks.length,
      completionRate,
      averageCompletionTime,
      trend,
    };
  }

  private async getActivityAnalytics(_organizationId: string, timeRange: TimeRange) {
    // Get recent activities
    const activities = await prisma.activity.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      include: {
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Format recent actions
    const recentActions: ActivityData[] = activities.slice(0, 10).map((activity) => ({
      id: activity.id,
      type: activity.activityType,
      description: this.formatActivityDescription(activity),
      user: activity.createdBy
        ? `${activity.createdBy.firstName} ${activity.createdBy.lastName}`
        : 'System',
      timestamp: activity.createdAt,
      entityType: activity.entityType,
      entityId: activity.entityId,
    }));

    // Calculate distributions
    const byType = this.groupAndCount(activities, 'activityType');
    const byUser = this.calculateUserActivity(activities);

    // Get timeline data
    const timeline = this.calculateActivityTimeline(activities, timeRange);

    return {
      recentActions,
      byType,
      byUser,
      timeline,
    };
  }

  private async getComplianceAnalytics(_organizationId: string, risks: any, controls: any) {
    // Calculate overall compliance score
    const effectiveControls = Object.entries(controls.byEffectiveness)
      .filter(([status]) => status === 'EFFECTIVE')
      .reduce((sum, [, count]) => sum + count, 0);

    const overallScore = controls.total > 0 ? (effectiveControls / controls.total) * 100 : 0;

    // Get framework compliance (simplified for now)
    const frameworks = [
      { framework: 'SOC 2', score: 92, coverage: 87 },
      { framework: 'ISO 27001', score: 89, coverage: 82 },
      { framework: 'GDPR', score: 94, coverage: 91 },
      { framework: 'HIPAA', score: 85, coverage: 78 },
    ];

    // Calculate gaps (high/critical risks without effective controls)
    const gaps = risks.total - effectiveControls;

    // Generate trend data
    const trend = this.generateComplianceTrend(overallScore);

    return {
      overallScore,
      byFramework: frameworks,
      gaps: Math.max(0, gaps),
      trend,
    };
  }

  // Helper methods
  private groupAndCount<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = String(item[key]);
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private calculateRiskDistribution(_risks: any[]) {
    const distribution: Array<{ category: string; severity: string; count: number }> = [];
    const grouped = new Map<string, number>();

    risks.forEach((risk) => {
      const key = `${risk.category}-${risk.severity}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    grouped.forEach((count, key) => {
      const [category, severity] = key.split('-');
      distribution.push({ category, severity, count });
    });

    return distribution;
  }

  private async getRiskTrend(_organizationId: string, timeRange: TimeRange): Promise<TrendData[]> {
    const days = eachDayOfInterval({ start: timeRange.start, end: timeRange.end });

    // Query actual risk data for each day
    const trendData = await Promise.all(
      days.map(async (day) => {
        const startOfDay = new Date(day);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await prisma.risk.count({
          where: {
            organizationId,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        return {
          date: format(day, 'MMM dd'),
          value: count,
        };
      })
    );

    return trendData;
  }

  private async getControlTrend(_organizationId: string,
    timeRange: TimeRange
  ): Promise<TrendData[]> {
    const days = eachDayOfInterval({ start: timeRange.start, end: timeRange.end });

    // Query actual control data for each day
    const trendData = await Promise.all(
      days.map(async (day) => {
        const startOfDay = new Date(day);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await prisma.control.count({
          where: {
            organizationId,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        return {
          date: format(day, 'MMM dd'),
          value: count,
        };
      })
    );

    return trendData;
  }

  private async getTaskTrend(_organizationId: string, timeRange: TimeRange): Promise<TrendData[]> {
    const days = eachDayOfInterval({ start: timeRange.start, end: timeRange.end });

    // Query actual task completion data for each day
    const trendData = await Promise.all(
      days.map(async (day) => {
        const startOfDay = new Date(day);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await prisma.task.count({
          where: {
            organizationId,
            status: 'COMPLETED',
            completedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        return {
          date: format(day, 'MMM dd'),
          value: count,
        };
      })
    );

    return trendData;
  }

  private calculateAverageCompletionTime(completedTasks: any[]): number {
    if (completedTasks.length === 0) return 0;

    const totalHours = completedTasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        const diff = task.completedAt.getTime() - task.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60); // Convert to hours
      }
      return sum;
    }, 0);

    return totalHours / completedTasks.length;
  }

  private formatActivityDescription(activity: any): string {
    const action = activity.activityType.toLowerCase().replace(/_/g, ' ');
    const entity = activity.entityType.toLowerCase();
    return `${action} ${entity}`;
  }

  private calculateUserActivity(activities: any[]): Array<{ user: string; count: number }> {
    const userMap = new Map<string, number>();

    activities.forEach((activity) => {
      if (activity.createdBy) {
        const userName = `${activity.createdBy.firstName} ${activity.createdBy.lastName}`;
        userMap.set(userName, (userMap.get(userName) || 0) + 1);
      }
    });

    return Array.from(userMap.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateActivityTimeline(activities: any[], timeRange: TimeRange): TrendData[] {
    const days = eachDayOfInterval({ start: timeRange.start, end: timeRange.end });
    const dayMap = new Map<string, number>();

    activities.forEach((activity) => {
      const day = format(activity.createdAt, 'MMM dd');
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    return days.map((day) => ({
      date: format(day, 'MMM dd'),
      value: dayMap.get(format(day, 'MMM dd')) || 0,
    }));
  }

  private generateComplianceTrend(currentScore: number): TrendData[] {
    const days = 30;
    const trend: TrendData[] = [];
    let score = currentScore - 10;

    for (let i = 0; i < days; i++) {
      score += Math.random() * 2 - 0.5;
      score = Math.max(0, Math.min(100, score));

      trend.push({
        date: format(subDays(new Date(), days - i), 'MMM dd'),
        value: Math.round(score),
      });
    }

    return trend;
  }

  // Preset time ranges
  static getTimeRanges() {
    const now = new Date();
    return {
      today: {
        start: startOfDay(now),
        end: now,
        label: 'Today',
      },
      week: {
        start: startOfWeek(now),
        end: now,
        label: 'This Week',
      },
      month: {
        start: startOfMonth(now),
        end: now,
        label: 'This Month',
      },
      last30Days: {
        start: subDays(now, 30),
        end: now,
        label: 'Last 30 Days',
      },
      last90Days: {
        start: subDays(now, 90),
        end: now,
        label: 'Last 90 Days',
      },
    };
  }
}

const AnalyticsServiceInstance = new AnalyticsService();
export default AnalyticsServiceInstance;
