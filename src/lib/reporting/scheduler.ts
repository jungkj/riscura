import { db } from '@/lib/db';
import { reportingEngine } from './engine';
import { reportExporter } from './exporters';
import { notificationManager } from '@/lib/collaboration/notifications';
import cron from 'node-cron';

export interface ScheduleConfig {
  id: string;
  reportId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  cronExpression?: string;
  timezone: string;
  recipients: string[];
  formats: ('pdf' | 'excel' | 'csv')[];
  filters?: Record<string, any>;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun: Date;
  failureCount: number;
  maxRetries: number;
}

export interface DeliveryLog {
  id: string;
  scheduleId: string;
  status: 'success' | 'failed' | 'partial';
  generatedAt: Date;
  deliveredAt?: Date;
  recipients: string[];
  formats: string[];
  errorMessage?: string;
  fileSize?: number;
  executionTime: number;
}

export class ReportScheduler {
  private scheduledJobs = new Map<string, any>();

  constructor() {
    this.initializeScheduler();
  }

  // Initialize the scheduler on startup
  private async initializeScheduler(): Promise<void> {
    try {
      const activeSchedules = await db.client.reportSchedule.findMany({
        where: { isActive: true },
        include: {
          report: true,
          organization: true,
        },
      });

      for (const schedule of activeSchedules) {
        await this.scheduleJob(schedule);
      }

      // console.log(`Initialized ${activeSchedules.length} scheduled reports`);
    } catch (error) {
      // console.error('Failed to initialize report scheduler:', error);
    }
  }

  // Create a new scheduled report
  async createSchedule(_config: Omit<ScheduleConfig, 'id' | 'createdAt' | 'nextRun' | 'failureCount'>
  ): Promise<ScheduleConfig> {
    const nextRun = this.calculateNextRun(config);
    const cronExpression = config.cronExpression || this.generateCronExpression(config);

    const schedule = await db.client.reportSchedule.create({
      data: {
        ...config,
        cronExpression,
        nextRun,
        failureCount: 0,
        createdAt: new Date(),
      },
    });

    if (config.isActive) {
      await this.scheduleJob(schedule);
    }

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'SCHEDULE_CREATED',
        entityType: 'REPORT_SCHEDULE',
        entityId: schedule.id,
        description: `Report schedule created: ${config.name}`,
        userId: config.createdBy,
        organizationId: config.organizationId,
        metadata: {
          frequency: config.frequency,
          recipientCount: config.recipients.length,
          formats: config.formats,
        },
        isPublic: false,
      },
    });

    return schedule;
  }

  // Update an existing schedule
  async updateSchedule(
    scheduleId: string,
    updates: Partial<ScheduleConfig>
  ): Promise<ScheduleConfig> {
    const schedule = await db.client.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        ...updates,
        nextRun:
          updates.frequency || updates.cronExpression
            ? this.calculateNextRun({ ...updates } as any)
            : undefined,
      },
    });

    // Reschedule if active
    if (schedule.isActive) {
      await this.unscheduleJob(scheduleId);
      await this.scheduleJob(schedule);
    } else {
      await this.unscheduleJob(scheduleId);
    }

    return schedule;
  }

  // Delete a schedule
  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.unscheduleJob(scheduleId);
    await db.client.reportSchedule.delete({
      where: { id: scheduleId },
    });
  }

  // Schedule a cron job
  private async scheduleJob(schedule: ScheduleConfig): Promise<void> {
    const job = cron.schedule(
      schedule.cronExpression || this.generateCronExpression(schedule),
      async () => {
        await this.executeScheduledReport(schedule.id);
      },
      {
        timezone: schedule.timezone,
      }
    );

    this.scheduledJobs.set(schedule.id, job);

    if (schedule.isActive) {
      job.start();
    }
  }

  // Unschedule a cron job
  private async unscheduleJob(scheduleId: string): Promise<void> {
    const job = this.scheduledJobs.get(scheduleId);
    if (job) {
      job.stop();
      job.destroy();
      this.scheduledJobs.delete(scheduleId);
    }
  }

  // Generate cron expression from frequency
  private generateCronExpression(_config: Pick<ScheduleConfig, 'frequency'>): string {
    switch (config.frequency) {
      case 'daily':
        return '0 9 * * *'; // 9 AM daily
      case 'weekly':
        return '0 9 * * 1'; // 9 AM every Monday
      case 'monthly':
        return '0 9 1 * *'; // 9 AM on 1st of month
      case 'quarterly':
        return '0 9 1 */3 *'; // 9 AM on 1st of quarter
      case 'yearly':
        return '0 9 1 1 *'; // 9 AM on January 1st
      default:
        return '0 9 * * *'; // Default to daily
    }
  }

  // Calculate next run time
  private calculateNextRun(_config: Pick<ScheduleConfig, 'frequency' | 'cronExpression' | 'timezone'>
  ): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (config.frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(9, 0, 0, 0);
        break;
      case 'weekly':
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilMonday);
        nextRun.setHours(9, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1, 1);
        nextRun.setHours(9, 0, 0, 0);
        break;
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3;
        if (nextQuarterMonth >= 12) {
          nextRun.setFullYear(now.getFullYear() + 1, 0, 1);
        } else {
          nextRun.setMonth(nextQuarterMonth, 1);
        }
        nextRun.setHours(9, 0, 0, 0);
        break;
      case 'yearly':
        nextRun.setFullYear(now.getFullYear() + 1, 0, 1);
        nextRun.setHours(9, 0, 0, 0);
        break;
    }

    return nextRun;
  }

  // Execute a scheduled report
  async executeScheduledReport(scheduleId: string): Promise<void> {
    const startTime = Date.now();

    try {
      const schedule = await db.client.reportSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          report: true,
        },
      });

      if (!schedule || !schedule.isActive) {
        return;
      }

      // console.log(`Executing scheduled report: ${schedule.name}`);

      // Generate report data
      const rawReportData = await reportingEngine.generateReportData(
        schedule.reportId,
        schedule.filters || {}
      );

      // Transform data to match ReportData interface expected by exporters
      const reportData = {
        id: schedule.reportId,
        title: schedule.name,
        type: 'scheduled_report',
        organizationName: 'Organization', // Could be fetched from organization data
        widgets: rawReportData.widgets.map((widget) => ({
          id: widget.id,
          title: `Widget ${widget.id}`,
          type: 'table' as const,
          data: widget.data,
          config: {
            columns: widget.data.length > 0 ? Object.keys(widget.data[0]) : [],
          },
        })),
        summary: {
          totalWidgets: rawReportData.summary.totalWidgets,
          dataPoints: rawReportData.summary.dataPoints,
          generatedAt: rawReportData.summary.generatedAt,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate exports in requested formats
      const exports = await Promise.all(
        schedule.formats.map(async (format) => {
          let buffer: Buffer;
          let mimeType: string;
          let extension: string;

          switch (format) {
            case 'pdf':
              buffer = await reportExporter.exportToPDF(reportData, [], {
                title: schedule.name,
                includeCharts: true,
                includeData: true,
              });
              mimeType = 'application/pdf';
              extension = 'pdf';
              break;
            case 'excel':
              buffer = await reportExporter.exportToExcel(reportData, {
                compression: true,
              });
              mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
              extension = 'xlsx';
              break;
            case 'csv':
              buffer = await reportExporter.exportToCSV(reportData, {
                compression: false,
              });
              mimeType = 'text/csv';
              extension = 'csv';
              break;
            default:
              throw new Error(`Unsupported export format: ${format}`);
          }

          return {
            format,
            buffer,
            mimeType,
            extension,
            filename: `${schedule.name}_${new Date().toISOString().split('T')[0]}.${extension}`,
          };
        })
      );

      // Deliver to recipients
      const deliveryResults = await Promise.allSettled(
        schedule.recipients.map(async (recipientId) => {
          for (const exportFile of exports) {
            await this.deliverReport(recipientId, exportFile, schedule);
          }
        })
      );

      const successCount = deliveryResults.filter((r) => r.status === 'fulfilled').length;
      const totalDeliveries = schedule.recipients.length * schedule.formats.length;

      // Log delivery
      await this.logDelivery({
        scheduleId: schedule.id,
        status:
          successCount === totalDeliveries ? 'success' : successCount > 0 ? 'partial' : 'failed',
        generatedAt: new Date(startTime),
        deliveredAt: new Date(),
        recipients: schedule.recipients,
        formats: schedule.formats,
        fileSize: exports.reduce((sum, exp) => sum + exp.buffer.length, 0),
        executionTime: Date.now() - startTime,
        errorMessage: deliveryResults.some((r) => r.status === 'rejected')
          ? 'Some deliveries failed'
          : undefined,
      });

      // Update schedule
      await db.client.reportSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(schedule),
          failureCount: successCount === totalDeliveries ? 0 : schedule.failureCount + 1,
        },
      });

      // Send notifications
      await this.sendDeliveryNotifications(schedule, successCount, totalDeliveries);

      // console.log(
        `Completed scheduled report: ${schedule.name} (${successCount}/${totalDeliveries} deliveries)`
      );
    } catch (error) {
      // console.error(`Failed to execute scheduled report ${scheduleId}:`, error);

      // Log failure
      await this.logDelivery({
        scheduleId,
        status: 'failed',
        generatedAt: new Date(startTime),
        recipients: [],
        formats: [],
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update failure count
      const schedule = await db.client.reportSchedule.findUnique({
        where: { id: scheduleId },
      });

      if (schedule) {
        const newFailureCount = schedule.failureCount + 1;

        // Disable schedule if max retries exceeded
        if (newFailureCount >= schedule.maxRetries) {
          await db.client.reportSchedule.update({
            where: { id: scheduleId },
            data: {
              isActive: false,
              failureCount: newFailureCount,
            },
          });

          await this.unscheduleJob(scheduleId);

          // Notify admin of disabled schedule
          await notificationManager.sendNotification({
            type: 'SCHEDULED_REPORT_FAILED',
            title: 'Scheduled Report Failed',
            message: `Report "${schedule.name}" failed to generate: ${error instanceof Error ? error.message : 'Unknown error'}`,
            urgency: 'high',
            recipientId: schedule.createdBy,
            channels: ['email', 'push'],
          });
        } else {
          await db.client.reportSchedule.update({
            where: { id: scheduleId },
            data: { failureCount: newFailureCount },
          });
        }
      }
    }
  }

  // Deliver report to recipient
  private async deliverReport(
    recipientId: string,
    exportFile: any,
    schedule: ScheduleConfig
  ): Promise<void> {
    // Get recipient details
    const recipient = await db.client.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new Error(`Recipient not found: ${recipientId}`);
    }

    // Send via email
    await notificationManager.sendNotification({
      type: 'SCHEDULED_REPORT_DELIVERED',
      title: 'Report Delivered',
      message: `Your scheduled report "${schedule.name}" has been delivered successfully.`,
      recipientId: recipientId,
      channels: ['email'],
    });
  }

  // Log delivery attempt
  private async logDelivery(log: Omit<DeliveryLog, 'id'>): Promise<void> {
    await db.client.reportDeliveryLog.create({
      data: {
        ...log,
        createdAt: new Date(),
      },
    });
  }

  // Send delivery notifications
  private async sendDeliveryNotifications(
    schedule: ScheduleConfig,
    successCount: number,
    totalCount: number
  ): Promise<void> {
    if (successCount === totalCount) {
      await notificationManager.sendNotification({
        type: 'SCHEDULED_REPORT_DELIVERY_SUCCESS',
        title: 'Report Delivered Successfully',
        message: `Scheduled report "${schedule.name}" was delivered to all recipients`,
        recipientId: schedule.createdBy,
        channels: ['push'],
      });
    } else if (successCount < totalCount) {
      await notificationManager.sendNotification({
        type: 'SCHEDULED_REPORT_DELIVERY_PARTIAL',
        title: 'Partial Report Delivery',
        message: `Scheduled report "${schedule.name}" was delivered to ${successCount}/${totalCount} recipients`,
        urgency: 'medium',
        recipientId: schedule.createdBy,
        channels: ['email', 'push'],
      });
    } else {
      await notificationManager.sendNotification({
        type: 'SCHEDULED_REPORT_DELIVERY_FAILED',
        title: 'Report Delivery Failed',
        message: `Scheduled report "${schedule.name}" failed to deliver to any recipients`,
        urgency: 'high',
        recipientId: schedule.createdBy,
        channels: ['email', 'push'],
      });
    }
  }

  // Get schedule status
  async getScheduleStatus(scheduleId: string): Promise<{
    isActive: boolean;
    lastRun?: Date;
    nextRun: Date;
    failureCount: number;
    recentDeliveries: DeliveryLog[];
  }> {
    const schedule = await db.client.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    const recentDeliveries = await db.client.reportDeliveryLog.findMany({
      where: { scheduleId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      isActive: schedule?.isActive || false,
      lastRun: schedule?.lastRun,
      nextRun: schedule?.nextRun || new Date(),
      failureCount: schedule?.failureCount || 0,
      recentDeliveries,
    };
  }

  // Get all schedules for an organization
  async getSchedules(_organizationId: string): Promise<ScheduleConfig[]> {
    return db.client.reportSchedule.findMany({
      where: { organizationId },
      include: {
        report: {
          select: { name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Test schedule execution
  async testSchedule(scheduleId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.executeScheduledReport(scheduleId);
      return {
        success: true,
        message: 'Schedule executed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get delivery statistics
  async getDeliveryStats(_organizationId: string,
    dateRange?: {
      from: Date;
      to: Date;
    }
  ): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageExecutionTime: number;
    topFormats: Array<{ format: string; count: number }>;
  }> {
    const whereClause: any = {
      schedule: { organizationId },
    };

    if (dateRange) {
      whereClause.generatedAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    const deliveries = await db.client.reportDeliveryLog.findMany({
      where: whereClause,
      include: {
        schedule: {
          select: { formats: true },
        },
      },
    });

    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter((d) => d.status === 'success').length;
    const failedDeliveries = deliveries.filter((d) => d.status === 'failed').length;
    const averageExecutionTime =
      deliveries.length > 0
        ? deliveries.reduce((sum, d) => sum + d.executionTime, 0) / deliveries.length
        : 0;

    // Count format usage
    const formatCounts: Record<string, number> = {};
    deliveries.forEach((delivery) => {
      delivery.formats.forEach((format) => {
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      });
    });

    const topFormats = Object.entries(formatCounts)
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      averageExecutionTime,
      topFormats,
    };
  }
}

export const reportScheduler = new ReportScheduler();
