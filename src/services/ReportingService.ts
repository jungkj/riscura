import { generatePDF, ReportData, ReportSection, formatTableData, formatChartData } from '@/lib/pdf/pdf-generator-mock';
import { exportToExcel, exportToCSV, ExcelWorkbookData } from '@/lib/pdf/excel-exporter';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';
import { EmailService } from './EmailService';
import * as cron from 'node-cron';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'risk_assessment' | 'compliance_status' | 'control_effectiveness' | 'executive_summary' | 'audit_trail' | 'custom';
  category: 'operational' | 'compliance' | 'executive' | 'technical';
  sections: ReportSectionTemplate[];
  parameters?: ReportParameter[];
  scheduling?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    nextRun?: Date;
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export interface ReportSectionTemplate {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'summary' | 'list';
  dataSource: string;
  query?: string;
  filters?: Record<string, any>;
  formatting?: {
    columns?: Array<{ key: string; header: string; format?: string }>;
    chartType?: 'bar' | 'pie' | 'line';
    groupBy?: string;
    sortBy?: string;
  };
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'text' | 'number';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
}

export interface GenerateReportRequest {
  templateId: string;
  format: 'pdf' | 'excel' | 'csv';
  parameters?: Record<string, any>;
  title?: string;
  subtitle?: string;
  filters?: Record<string, any>;
  recipients?: string[];
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  parameters: Record<string, any>;
  nextRun: Date;
  lastRun?: Date;
  status: 'active' | 'paused' | 'error';
  createdBy: string;
  createdAt: Date;
}

export interface ReportHistory {
  id: string;
  templateId: string;
  title: string;
  format: string;
  generatedAt: Date;
  generatedBy: string;
  fileSize: number;
  downloadCount: number;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
  filePath?: string;
}

export interface ReportConfig {
  id?: string;
  name: string;
  type: ReportType;
  description?: string;
  template: string;
  parameters: Record<string, any>;
  filters: ReportFilters;
  format: ReportFormat[];
  organizationId: string;
  createdBy: string;
  isScheduled?: boolean;
  schedule?: ScheduleConfig;
  recipients?: string[];
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  timezone: string;
  enabled: boolean;
}

export interface ReportFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  categories?: string[];
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  departments?: string[];
  tags?: string[];
  customFilters?: Record<string, any>;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  filePath: string;
  fileSize: number;
  generatedAt: Date;
  generatedBy: string;
  organizationId: string;
  downloadUrl: string;
  expiresAt?: Date;
  parameters: Record<string, any>;
}

export enum ReportType {
  RISK_ASSESSMENT = 'risk_assessment',
  COMPLIANCE_STATUS = 'compliance_status',
  CONTROL_EFFECTIVENESS = 'control_effectiveness',
  EXECUTIVE_SUMMARY = 'executive_summary',
  AUDIT_TRAIL = 'audit_trail',
  CUSTOM = 'custom',
  VENDOR_ASSESSMENT = 'vendor_assessment',
  SECURITY_DASHBOARD = 'security_dashboard',
  PERFORMANCE_METRICS = 'performance_metrics'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

export class ReportingService {
  private emailService: EmailService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.emailService = new EmailService();
    this.initializeScheduledReports();
  }

  /**
   * Generate a report on demand
   */
  async generateReport(config: ReportConfig): Promise<GeneratedReport[]> {
    const results: GeneratedReport[] = [];

    try {
      // Validate configuration
      await this.validateReportConfig(config);

      // Aggregate data based on report type
      const data = await this.aggregateReportData(config);

      // Generate reports in requested formats
      for (const format of config.format) {
        const result = await this.generateReportInFormat(config, data, format);
        results.push(result);
      }

      // Save report metadata to database
      await this.saveReportMetadata(config, results);

      // Send email if recipients specified
      if (config.recipients && config.recipients.length > 0) {
        await this.emailReports(config, results);
      }

      return results;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(config: ReportConfig): Promise<string> {
    if (!config.schedule) {
      throw new Error('Schedule configuration is required');
    }

    // Save scheduled report configuration
    const savedConfig = await this.saveScheduledReport(config);

    // Create cron job
    const cronExpression = this.buildCronExpression(config.schedule);
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Executing scheduled report: ${config.name}`);
        await this.generateReport(config);
      } catch (error) {
        console.error(`Scheduled report failed: ${config.name}`, error);
        // Optionally notify administrators
      }
    }, {
      scheduled: config.schedule.enabled,
      timezone: config.schedule.timezone
    });

    this.scheduledJobs.set(savedConfig.id!, job);

    return savedConfig.id!;
  }

  /**
   * Get available report templates
   */
  async getReportTemplates(organizationId: string): Promise<any[]> {
    const templates = [
      {
        id: 'risk_assessment_standard',
        name: 'Risk Assessment Report',
        type: ReportType.RISK_ASSESSMENT,
        description: 'Comprehensive risk assessment with heat maps and trending',
        parameters: ['dateRange', 'categories', 'priority'],
        preview: '/templates/risk-assessment-preview.png'
      },
      {
        id: 'compliance_status_standard',
        name: 'Compliance Status Report',
        type: ReportType.COMPLIANCE_STATUS,
        description: 'Framework compliance status with gap analysis',
        parameters: ['frameworks', 'dateRange', 'departments'],
        preview: '/templates/compliance-status-preview.png'
      },
      {
        id: 'control_effectiveness_standard',
        name: 'Control Effectiveness Report',
        type: ReportType.CONTROL_EFFECTIVENESS,
        description: 'Control testing results and effectiveness metrics',
        parameters: ['controlTypes', 'dateRange', 'testingFrequency'],
        preview: '/templates/control-effectiveness-preview.png'
      },
      {
        id: 'executive_summary_standard',
        name: 'Executive Summary Dashboard',
        type: ReportType.EXECUTIVE_SUMMARY,
        description: 'High-level risk and compliance overview for executives',
        parameters: ['dateRange', 'includeMetrics', 'includeCharts'],
        preview: '/templates/executive-summary-preview.png'
      },
      {
        id: 'audit_trail_standard',
        name: 'Audit Trail Report',
        type: ReportType.AUDIT_TRAIL,
        description: 'Detailed audit log with user activities and changes',
        parameters: ['dateRange', 'users', 'actions', 'entities'],
        preview: '/templates/audit-trail-preview.png'
      }
    ];

    return templates;
  }

  /**
   * Get report history
   */
  async getReportHistory(
    organizationId: string,
    filters: {
      type?: ReportType;
      dateFrom?: Date;
      dateTo?: Date;
      createdBy?: string;
    } = {},
    pagination: { skip: number; take: number } = { skip: 0, take: 20 }
  ): Promise<{ reports: any[]; total: number }> {
    const whereClause: any = {
      organizationId,
    };

    if (filters.type) whereClause.type = filters.type;
    if (filters.createdBy) whereClause.createdBy = filters.createdBy;
    if (filters.dateFrom || filters.dateTo) {
      whereClause.generatedAt = {};
      if (filters.dateFrom) whereClause.generatedAt.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.generatedAt.lte = filters.dateTo;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { generatedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.report.count({ where: whereClause }),
    ]);

    return { reports, total };
  }

  /**
   * Aggregate data for report generation
   */
  private async aggregateReportData(config: ReportConfig): Promise<any> {
    const { type, filters, organizationId } = config;

    switch (type) {
      case ReportType.RISK_ASSESSMENT:
        return await this.aggregateRiskData(organizationId, filters);
      
      case ReportType.COMPLIANCE_STATUS:
        return await this.aggregateComplianceData(organizationId, filters);
      
      case ReportType.CONTROL_EFFECTIVENESS:
        return await this.aggregateControlData(organizationId, filters);
      
      case ReportType.EXECUTIVE_SUMMARY:
        return await this.aggregateExecutiveData(organizationId, filters);
      
      case ReportType.AUDIT_TRAIL:
        return await this.aggregateAuditData(organizationId, filters);
      
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  private async aggregateRiskData(organizationId: string, filters: ReportFilters): Promise<any> {
    const whereClause: any = { organizationId };

    // Apply filters
    if (filters.dateRange) {
      whereClause.dateIdentified = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    if (filters.categories?.length) {
      whereClause.category = { in: filters.categories };
    }

    if (filters.status?.length) {
      whereClause.status = { in: filters.status };
    }

    if (filters.assignedTo?.length) {
      whereClause.owner = { in: filters.assignedTo };
    }

    const [risks, riskStats, riskTrends] = await Promise.all([
      // Get detailed risk data
      prisma.risk.findMany({
        where: whereClause,
        include: {
          creator: {
            select: { firstName: true, lastName: true, email: true },
          },
          controls: {
            include: {
              control: {
                select: { id: true, title: true, status: true, effectivenessRating: true },
              },
            },
          },
        },
        orderBy: { riskScore: 'desc' },
      }),

      // Get risk statistics
      prisma.risk.groupBy({
        by: ['category', 'riskLevel', 'status'],
        where: whereClause,
        _count: true,
        _avg: { riskScore: true },
      }),

      // Get risk trends (last 12 months)
      prisma.risk.groupBy({
        by: ['dateIdentified'],
        where: {
          ...whereClause,
          dateIdentified: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        _count: true,
        orderBy: { dateIdentified: 'asc' },
      }),
    ]);

    // Calculate risk metrics
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(r => r.riskLevel === 'CRITICAL').length;
    const highRisks = risks.filter(r => r.riskLevel === 'HIGH').length;
    const averageRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks || 0;

    // Risk distribution by category
    const categoryDistribution = riskStats.reduce((acc, stat) => {
      if (!acc[stat.category]) acc[stat.category] = 0;
      acc[stat.category] += stat._count;
      return acc;
    }, {} as Record<string, number>);

    // Top risks
    const topRisks = risks.slice(0, 10);

    return {
      summary: {
        totalRisks,
        criticalRisks,
        highRisks,
        averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      },
      risks,
      categoryDistribution,
      riskTrends,
      topRisks,
      generatedAt: new Date(),
      filters,
    };
  }

  private async aggregateComplianceData(organizationId: string, filters: ReportFilters): Promise<any> {
    // Implementation for compliance data aggregation
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      include: {
        requirements: {
          include: {
            controls: true,
          },
        },
        assessments: {
          where: filters.dateRange ? {
            createdAt: {
              gte: filters.dateRange.from,
              lte: filters.dateRange.to,
            },
          } : undefined,
          include: {
            controlResults: true,
          },
        },
      },
    });

    // Calculate compliance scores
    const complianceScores = frameworks.map(framework => {
      const totalRequirements = framework.requirements.length;
      const metRequirements = framework.requirements.filter(req => 
        req.controls.some(control => control.status === 'IMPLEMENTED')
      ).length;
      
      return {
        frameworkId: framework.id,
        frameworkName: framework.name,
        score: totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 0,
        totalRequirements,
        metRequirements,
      };
    });

    return {
      frameworks,
      complianceScores,
      overallCompliance: complianceScores.reduce((sum, score) => sum + score.score, 0) / complianceScores.length || 0,
      generatedAt: new Date(),
      filters,
    };
  }

  private async aggregateControlData(organizationId: string, filters: ReportFilters): Promise<any> {
    const whereClause: any = { organizationId };

    if (filters.categories?.length) {
      whereClause.category = { in: filters.categories };
    }

    if (filters.status?.length) {
      whereClause.status = { in: filters.status };
    }

    const controls = await prisma.control.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
        risks: {
          include: {
            risk: {
              select: { id: true, title: true, riskLevel: true },
            },
          },
        },
      },
    });

    // Calculate effectiveness metrics
    const effectivenessStats = controls.reduce((acc, control) => {
      const rating = control.effectivenessRating;
      if (!acc[rating]) acc[rating] = 0;
      acc[rating]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      controls,
      effectivenessStats,
      totalControls: controls.length,
      averageEffectiveness: controls.reduce((sum, c) => {
        const ratingMap = { 'EFFECTIVE': 4, 'MOSTLY_EFFECTIVE': 3, 'PARTIALLY_EFFECTIVE': 2, 'INEFFECTIVE': 1 };
        return sum + (ratingMap[c.effectivenessRating as keyof typeof ratingMap] || 0);
      }, 0) / controls.length || 0,
      generatedAt: new Date(),
      filters,
    };
  }

  private async aggregateExecutiveData(organizationId: string, filters: ReportFilters): Promise<any> {
    // Aggregate high-level metrics for executive summary
    const [riskData, complianceData, controlData] = await Promise.all([
      this.aggregateRiskData(organizationId, filters),
      this.aggregateComplianceData(organizationId, filters),
      this.aggregateControlData(organizationId, filters),
    ]);

    return {
      executiveSummary: {
        totalRisks: riskData.summary.totalRisks,
        criticalRisks: riskData.summary.criticalRisks,
        averageCompliance: complianceData.overallCompliance,
        totalControls: controlData.totalControls,
        controlEffectiveness: controlData.averageEffectiveness,
      },
      riskOverview: riskData,
      complianceOverview: complianceData,
      controlOverview: controlData,
      generatedAt: new Date(),
      filters,
    };
  }

  private async aggregateAuditData(organizationId: string, filters: ReportFilters): Promise<any> {
    // Since there's no audit log model in the schema, we'll create a mock implementation
    // In a real implementation, this would query the audit log table
    return {
      auditEntries: [],
      summary: {
        totalEntries: 0,
        userActions: {},
        entityChanges: {},
      },
      generatedAt: new Date(),
      filters,
    };
  }

  /**
   * Generate report in specific format
   */
  private async generateReportInFormat(
    config: ReportConfig,
    data: any,
    format: ReportFormat
  ): Promise<GeneratedReport> {
    const reportId = `${config.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    let filePath: string;
    let fileSize: number;

    switch (format) {
      case ReportFormat.PDF:
        const pdfResult = await generatePDF(config.template, data, {
          fileName: `${fileName}.pdf`,
          organizationId: config.organizationId,
        });
        filePath = pdfResult.filePath;
        fileSize = pdfResult.fileSize;
        break;

      case ReportFormat.EXCEL:
        const excelResult = await exportToExcel(data, {
          fileName: `${fileName}.xlsx`,
          sheetName: config.name,
        });
        filePath = excelResult.filePath;
        fileSize = excelResult.fileSize;
        break;

      case ReportFormat.CSV:
        const csvResult = await exportToCSV(data, {
          fileName: `${fileName}.csv`,
        });
        filePath = csvResult.filePath;
        fileSize = csvResult.fileSize;
        break;

      case ReportFormat.JSON:
        const jsonPath = `/tmp/reports/${fileName}.json`;
        const jsonContent = JSON.stringify(data, null, 2);
        require('fs').writeFileSync(jsonPath, jsonContent);
        filePath = jsonPath;
        fileSize = Buffer.byteLength(jsonContent);
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      id: reportId,
      name: config.name,
      type: config.type,
      format,
      filePath,
      fileSize,
      generatedAt: new Date(),
      generatedBy: config.createdBy,
      organizationId: config.organizationId,
      downloadUrl: `/api/reports/${reportId}/download`,
      parameters: config.parameters,
    };
  }

  /**
   * Email reports to recipients
   */
  private async emailReports(config: ReportConfig, reports: GeneratedReport[]): Promise<void> {
    if (!config.recipients?.length) return;

    const attachments = reports.map(report => ({
      filename: `${report.name}.${report.format}`,
      path: report.filePath,
    }));

    await this.emailService.sendEmail({
      to: config.recipients,
      subject: `Report: ${config.name}`,
      html: `
        <h2>Your requested report is ready</h2>
        <p><strong>Report Name:</strong> ${config.name}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Formats:</strong> ${reports.map(r => r.format.toUpperCase()).join(', ')}</p>
        <p>Please find the attached report files.</p>
      `,
      attachments,
    });
  }

  /**
   * Build cron expression from schedule config
   */
  private buildCronExpression(schedule: ScheduleConfig): string {
    const [hour, minute] = schedule.time.split(':').map(Number);

    switch (schedule.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      
      case 'weekly':
        return `${minute} ${hour} * * ${schedule.dayOfWeek || 0}`;
      
      case 'monthly':
        return `${minute} ${hour} ${schedule.dayOfMonth || 1} * *`;
      
      case 'quarterly':
        return `${minute} ${hour} 1 */3 *`;
      
      default:
        throw new Error(`Unsupported frequency: ${schedule.frequency}`);
    }
  }

  /**
   * Initialize scheduled reports from database
   */
  private async initializeScheduledReports(): Promise<void> {
    try {
      // In a real implementation, this would load scheduled reports from database
      // For now, we'll skip this since there's no scheduled reports table in the schema
      console.log('Scheduled reports initialized');
    } catch (error) {
      console.error('Failed to initialize scheduled reports:', error);
    }
  }

  /**
   * Validate report configuration
   */
  private async validateReportConfig(config: ReportConfig): Promise<void> {
    if (!config.name || !config.type || !config.organizationId || !config.createdBy) {
      throw new Error('Missing required configuration fields');
    }

    if (!config.format || config.format.length === 0) {
      throw new Error('At least one output format must be specified');
    }

    // Validate date range
    if (config.filters.dateRange) {
      const { from, to } = config.filters.dateRange;
      if (from > to) {
        throw new Error('Invalid date range: from date must be before to date');
      }
    }
  }

  /**
   * Save scheduled report configuration
   */
  private async saveScheduledReport(config: ReportConfig): Promise<ReportConfig> {
    // In a real implementation, this would save to a scheduled_reports table
    // For now, we'll just return the config with a generated ID
    return {
      ...config,
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Save report metadata to database
   */
  private async saveReportMetadata(config: ReportConfig, reports: GeneratedReport[]): Promise<void> {
    for (const report of reports) {
      await prisma.report.create({
        data: {
          id: report.id,
          name: report.name,
          type: report.type as any,
          status: 'COMPLETED',
          format: report.format,
          filePath: report.filePath,
          fileSize: report.fileSize,
          generatedAt: report.generatedAt,
          organizationId: report.organizationId,
          createdBy: report.generatedBy,
          parameters: report.parameters,
        },
      });
    }
  }
}

// Create and export a singleton instance
export const reportingService = new ReportingService(); 