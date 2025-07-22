import { ReportType, ReportStatus, Report, ReportTemplate, ReportSchedule } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { PDFGenerator } from '@/lib/reports/pdf-generator';
import { ExcelGenerator } from '@/lib/reports/excel-generator';
import { ReportDataCollector } from '@/lib/reports/data-collector';
import { CloudStorageService } from '@/services/CloudStorageService';
import { prisma } from '@/lib/prisma';

// Validation schemas
export const CreateReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(ReportType),
  templateId: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

export const UpdateReportSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  data: z.record(z.any()).optional(),
  parameters: z.record(z.any()).optional(),
});

export const CreateReportTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(ReportType),
  templateConfig: z.record(z.any()),
  defaultParameters: z.record(z.any()).optional(),
});

export const CreateReportScheduleSchema = z.object({
  reportTemplateId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM']),
  scheduleConfig: z.record(z.any()),
  recipients: z.array(z.string().email()).default([]),
  isActive: z.boolean().default(true),
});

export interface ReportFilters {
  type?: ReportType;
  status?: ReportStatus;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export class ReportService {
  private pdfGenerator: PDFGenerator;
  private excelGenerator: ExcelGenerator;
  private dataCollector: ReportDataCollector;
  private cloudStorage: CloudStorageService;

  constructor() {
    this.pdfGenerator = new PDFGenerator();
    this.excelGenerator = new ExcelGenerator();
    this.dataCollector = new ReportDataCollector();
    this.cloudStorage = new CloudStorageService();
  }

  // Report CRUD operations
  async createReport(
    data: z.infer<typeof CreateReportSchema>,
    userId: string,
    organizationId: string
  ): Promise<Report> {
    const validated = CreateReportSchema.parse(data);

    // If template is specified, load default parameters
    let defaultParameters = {};
    if (validated.templateId) {
      const template = await prisma.reportTemplate.findUnique({
        where: { id: validated.templateId },
      });
      if (template?.defaultParameters) {
        defaultParameters = template.defaultParameters as object;
      }
    }

    return await prisma.report.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        templateId: validated.templateId,
        parameters: { ...defaultParameters, ...validated.parameters },
        createdBy: userId,
        organizationId,
      },
      include: {
        creator: true,
        organization: true,
      },
    });
  }

  async getReports(
    organizationId: string,
    filters: ReportFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: Report[]; total: number; pages: number }> {
    const where: Prisma.ReportWhereInput = {
      organizationId,
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.createdBy && { createdBy: filters.createdBy }),
      ...(filters.dateFrom && filters.dateTo && {
        createdAt: {
          gte: filters.dateFrom,
          lte: filters.dateTo,
        },
      }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: true,
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getReportById(id: string, organizationId: string): Promise<Report | null> {
    return await prisma.report.findFirst({
      where: { id, organizationId },
      include: {
        creator: true,
        organization: true,
      },
    });
  }

  async updateReport(
    id: string,
    data: z.infer<typeof UpdateReportSchema>,
    organizationId: string
  ): Promise<Report> {
    const validated = UpdateReportSchema.parse(data);

    // Find the report first to ensure it belongs to the organization
    const report = await prisma.report.findFirst({
      where: { id, organizationId },
    });
    
    if (!report) {
      throw new Error('Report not found');
    }

    return await prisma.report.update({
      where: { id },
      data: validated,
      include: {
        creator: true,
        organization: true,
      },
    });
  }

  async deleteReport(id: string, organizationId: string): Promise<void> {
    // Delete associated file if exists
    const report = await this.getReportById(id, organizationId);
    if (report?.fileUrl) {
      await this.cloudStorage.deleteFile(report.fileUrl);
    }

    // Find the report first to ensure it belongs to the organization
    const reportToDelete = await prisma.report.findFirst({
      where: { id, organizationId },
    });
    
    if (!reportToDelete) {
      throw new Error('Report not found');
    }

    await prisma.report.delete({
      where: { id },
    });
  }

  // Report generation
  async generateReport(
    reportId: string,
    format: 'pdf' | 'excel' = 'pdf',
    organizationId: string
  ): Promise<Report> {
    const report = await this.getReportById(reportId, organizationId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Collect data based on report type and parameters
    const reportData = await this.dataCollector.collectData(
      report.type,
      report.parameters as Record<string, any>,
      organizationId
    );

    // Generate report file
    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (format === 'pdf') {
      fileBuffer = await this.pdfGenerator.generate(report, reportData);
      fileName = `${report.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      mimeType = 'application/pdf';
    } else {
      fileBuffer = await this.excelGenerator.generate(report, reportData);
      fileName = `${report.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Upload to cloud storage
    const fileUrl = await this.cloudStorage.uploadFile(
      fileBuffer,
      fileName,
      mimeType,
      `reports/${organizationId}`
    );

    // Update report with file info
    return await prisma.report.update({
      where: { id: reportId },
      data: {
        data: reportData as any, // Cast to any for JSON field
        generatedAt: new Date(),
        fileUrl,
        format,
        status: 'PUBLISHED',
      },
      include: {
        creator: true,
        organization: true,
      },
    });
  }

  // Report Templates
  async createReportTemplate(
    data: z.infer<typeof CreateReportTemplateSchema>,
    userId: string,
    organizationId: string
  ): Promise<ReportTemplate> {
    const validated = CreateReportTemplateSchema.parse(data);

    return await prisma.reportTemplate.create({
      data: {
        name: validated.name,
        description: validated.description,
        type: validated.type,
        templateConfig: validated.templateConfig,
        defaultParameters: validated.defaultParameters,
        createdBy: userId,
        organizationId,
      },
      include: {
        creator: true,
        organization: true,
      },
    });
  }

  async getReportTemplates(
    organizationId: string,
    type?: ReportType
  ): Promise<ReportTemplate[]> {
    return await prisma.reportTemplate.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
      include: {
        creator: true,
      },
    });
  }

  async getReportTemplateById(
    id: string,
    organizationId: string
  ): Promise<ReportTemplate | null> {
    return await prisma.reportTemplate.findFirst({
      where: { id, organizationId },
      include: {
        creator: true,
        reportSchedules: true,
      },
    });
  }

  async updateReportTemplate(
    id: string,
    data: Partial<z.infer<typeof CreateReportTemplateSchema>>,
    organizationId: string
  ): Promise<ReportTemplate> {
    // Find the template first to ensure it belongs to the organization
    const template = await prisma.reportTemplate.findFirst({
      where: { id, organizationId },
    });
    
    if (!template) {
      throw new Error('Report template not found');
    }

    return await prisma.reportTemplate.update({
      where: { id },
      data,
      include: {
        creator: true,
      },
    });
  }

  async deleteReportTemplate(id: string, organizationId: string): Promise<void> {
    // Find the template first to ensure it belongs to the organization
    const template = await prisma.reportTemplate.findFirst({
      where: { id, organizationId },
    });
    
    if (!template) {
      throw new Error('Report template not found');
    }

    await prisma.reportTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Report Schedules
  async createReportSchedule(
    data: z.infer<typeof CreateReportScheduleSchema>,
    userId: string,
    organizationId: string
  ): Promise<ReportSchedule> {
    const validated = CreateReportScheduleSchema.parse(data);

    // Calculate next run time based on frequency
    const nextRunAt = this.calculateNextRunTime(
      validated.frequency,
      validated.scheduleConfig
    );

    return await prisma.reportSchedule.create({
      data: {
        reportTemplateId: validated.reportTemplateId,
        name: validated.name,
        description: validated.description,
        frequency: validated.frequency,
        scheduleConfig: validated.scheduleConfig,
        recipients: validated.recipients,
        isActive: validated.isActive,
        nextRunAt,
        createdBy: userId,
        organizationId,
      },
      include: {
        reportTemplate: true,
        creator: true,
      },
    });
  }

  async getReportSchedules(organizationId: string): Promise<ReportSchedule[]> {
    return await prisma.reportSchedule.findMany({
      where: { organizationId, isActive: true },
      orderBy: { nextRunAt: 'asc' },
      include: {
        reportTemplate: true,
        creator: true,
      },
    });
  }

  async updateReportSchedule(
    id: string,
    data: Partial<z.infer<typeof CreateReportScheduleSchema>>,
    organizationId: string
  ): Promise<ReportSchedule> {
    // Recalculate next run time if frequency changed
    let nextRunAt: Date | undefined;
    if (data.frequency || data.scheduleConfig) {
      const schedule = await prisma.reportSchedule.findUnique({
        where: { id },
      });
      if (schedule) {
        nextRunAt = this.calculateNextRunTime(
          data.frequency || schedule.frequency,
          data.scheduleConfig || (schedule.scheduleConfig as any)
        );
      }
    }

    // Find the schedule first to ensure it belongs to the organization
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id, organizationId },
    });
    
    if (!schedule) {
      throw new Error('Report schedule not found');
    }

    return await prisma.reportSchedule.update({
      where: { id },
      data: {
        ...data,
        ...(nextRunAt && { nextRunAt }),
      },
      include: {
        reportTemplate: true,
        creator: true,
      },
    });
  }

  async deleteReportSchedule(id: string, organizationId: string): Promise<void> {
    // Find the schedule first to ensure it belongs to the organization
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id, organizationId },
    });
    
    if (!schedule) {
      throw new Error('Report schedule not found');
    }

    await prisma.reportSchedule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Helper methods
  private calculateNextRunTime(
    frequency: string,
    config: Record<string, any>
  ): Date {
    const now = new Date();

    switch (frequency) {
      case 'DAILY':
        return new Date(now.setDate(now.getDate() + 1));
      case 'WEEKLY':
        return new Date(now.setDate(now.getDate() + 7));
      case 'MONTHLY':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'QUARTERLY':
        return new Date(now.setMonth(now.getMonth() + 3));
      case 'ANNUALLY':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'CUSTOM':
        // Parse cron expression or custom config
        // This would require a cron parser library
        return new Date(now.setDate(now.getDate() + 1)); // Default to daily
      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }

  // Get default date ranges for common report periods
  getDateRangeForPeriod(period: string): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    switch (period) {
      case 'today':
        return {
          dateFrom: new Date(now.setHours(0, 0, 0, 0)),
          dateTo: new Date(now.setHours(23, 59, 59, 999)),
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          dateFrom: new Date(yesterday.setHours(0, 0, 0, 0)),
          dateTo: new Date(yesterday.setHours(23, 59, 59, 999)),
        };
      case 'last7days':
        return {
          dateFrom: subDays(now, 7),
          dateTo: now,
        };
      case 'last30days':
        return {
          dateFrom: subDays(now, 30),
          dateTo: now,
        };
      case 'thisMonth':
        return {
          dateFrom: startOfMonth(now),
          dateTo: endOfMonth(now),
        };
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return {
          dateFrom: startOfMonth(lastMonth),
          dateTo: endOfMonth(lastMonth),
        };
      case 'thisQuarter':
        return {
          dateFrom: startOfQuarter(now),
          dateTo: endOfQuarter(now),
        };
      case 'thisYear':
        return {
          dateFrom: startOfYear(now),
          dateTo: endOfYear(now),
        };
      default:
        return {
          dateFrom: subDays(now, 30),
          dateTo: now,
        };
    }
  }
}

export default new ReportService();