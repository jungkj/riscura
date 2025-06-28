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
    try {
      // Validate configuration
      await this.validateReportConfig(config);

      // Aggregate data based on report type
      const data = await this.aggregateReportData(config);

      // Generate reports in requested formats
      const reports: GeneratedReport[] = [];
      
      for (const format of config.format) {
        const report = await this.generateReportInFormat(config, data, format);
        reports.push(report);
      }

      // Save metadata
      await this.saveReportMetadata(config, reports);

      // Email if configured
      if (config.recipients?.length) {
        await this.emailReports(config, reports);
      }

      return reports;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule a report for regular generation
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
        await this.generateReport(savedConfig);
        console.log(`Scheduled report generated: ${savedConfig.name}`);
      } catch (error) {
        console.error(`Failed to generate scheduled report: ${savedConfig.name}`, error);
      }
                }, {
        timezone: config.schedule.timezone,
      });

      // Start the job if enabled
      if (config.schedule.enabled) {
        job.start();
      }

      // Store job reference
      this.scheduledJobs.set(savedConfig.id!, job);

    return savedConfig.id!;
  }

  /**
   * Get available report templates
   */
  async getReportTemplates(organizationId: string): Promise<any[]> {
    // Mock implementation - in real app, this would query a templates table
    return [
      {
        id: 'risk-assessment-template',
        name: 'Risk Assessment Report',
        description: 'Comprehensive risk analysis report',
        type: 'risk_assessment',
        category: 'operational',
      },
      {
        id: 'compliance-status-template',
        name: 'Compliance Status Report',
        description: 'Current compliance framework status',
        type: 'compliance_status',
        category: 'compliance',
      },
      {
        id: 'control-effectiveness-template',
        name: 'Control Effectiveness Report',
        description: 'Analysis of control implementation and effectiveness',
        type: 'control_effectiveness',
        category: 'operational',
      },
      {
        id: 'executive-summary-template',
        name: 'Executive Summary',
        description: 'High-level summary for executive stakeholders',
        type: 'executive_summary',
        category: 'executive',
      },
    ];
  }

  /**
   * Get report generation history
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
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const whereClause: any = { organizationId };

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) whereClause.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.createdAt.lte = filters.dateTo;
    }

    if (filters.createdBy) {
      whereClause.createdBy = filters.createdBy;
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const total = await prisma.report.count({ where: whereClause });

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
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const whereClause: any = { organizationId };

    if (filters.categories?.length) {
      whereClause.category = { in: filters.categories };
    }

    if (filters.status?.length) {
      whereClause.status = { in: filters.status };
    }

    if (filters.dateRange) {
      whereClause.dateIdentified = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    const risks = await prisma.risk.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
        controls: {
          include: {
            control: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        evidence: true,
      },
    });

    // Risk summary calculations
    const summary = {
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.riskLevel === 'CRITICAL').length,
      highRisks: risks.filter(r => r.riskLevel === 'HIGH').length,
      mediumRisks: risks.filter(r => r.riskLevel === 'MEDIUM').length,
      lowRisks: risks.filter(r => r.riskLevel === 'LOW').length,
      averageScore: risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length || 0,
    };

    // Risk by category
    const risksByCategory = risks.reduce((acc, risk) => {
      if (!acc[risk.category]) acc[risk.category] = 0;
      acc[risk.category]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      risks,
      summary,
      risksByCategory,
      topRisks: risks
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10),
      generatedAt: new Date(),
      filters,
    };
  }

  private async aggregateComplianceData(organizationId: string, filters: ReportFilters): Promise<any> {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const whereClause: any = { organizationId };
    
    if (filters.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    const frameworks = await prisma.complianceFramework.findMany({
      where: whereClause,
      include: {
        requirements: true,
        assessments: {
          where: filters.dateRange ? {
            createdAt: {
              gte: filters.dateRange.from,
              lte: filters.dateRange.to,
            },
          } : undefined,
          include: {
            controlAssessments: true,
          },
        },
      },
    });

    // Calculate compliance scores
    const complianceScores = frameworks.map((framework: any) => {
      const totalRequirements = framework.requirements?.length || 0;
      const metRequirements = framework.requirements?.filter((req: any) => 
        req.controls && req.controls.length > 0 && req.controls.some((controlId: string) => {
          // Check if any control referenced in the requirement is implemented
          return framework.assessments.some((assessment: any) => 
            assessment.controlAssessments.some((result: any) => 
              result.controlId === controlId && result.status === 'EFFECTIVE'
            )
          );
        })
      ).length || 0;
      
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
      overallCompliance: complianceScores.reduce((sum: number, score: any) => sum + score.score, 0) / complianceScores.length || 0,
      generatedAt: new Date(),
      filters,
    };
  }

  private async aggregateControlData(organizationId: string, filters: ReportFilters): Promise<any> {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

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
      const rating = control.effectivenessRating || 'INEFFECTIVE';
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
        const pdfBuffer = await generatePDF(data);
        filePath = `/tmp/reports/${fileName}.pdf`;
        require('fs').writeFileSync(filePath, pdfBuffer);
        fileSize = pdfBuffer.length;
        break;

      case ReportFormat.EXCEL:
        const excelData: ExcelWorkbookData = {
          title: config.name,
          sheets: [{
            name: 'Data',
            data: {
              title: config.name,
              headers: data.headers || ['Item', 'Value'],
              rows: data.rows || []
            }
          }],
          metadata: {
            author: 'Riscura Platform',
            created: new Date(),
            description: config.description || 'Report generated by Riscura'
          }
        };
        const excelBuffer = await exportToExcel(excelData, {
          fileName: `${fileName}.xlsx`,
          worksheetName: config.name,
        });
        filePath = `/tmp/reports/${fileName}.xlsx`;
        require('fs').writeFileSync(filePath, excelBuffer);
        fileSize = excelBuffer.length;
        break;

      case ReportFormat.CSV:
        const csvData = {
          title: config.name,
          headers: data.headers || ['Item', 'Value'],
          rows: data.rows || []
        };
        const csvContent = exportToCSV(csvData);
        filePath = `/tmp/reports/${fileName}.csv`;
        require('fs').writeFileSync(filePath, csvContent);
        fileSize = Buffer.byteLength(csvContent);
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
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    try {
      await prisma.report.create({
        data: {
          title: config.name,
          type: config.type as any,
          status: 'PUBLISHED' as any,
          organizationId: config.organizationId,
          createdBy: config.createdBy,
          parameters: config.parameters,
          data: {
            reports: reports.map(r => ({
              id: r.id,
              format: r.format,
              filePath: r.filePath,
              fileSize: r.fileSize,
              generatedAt: r.generatedAt,
            }))
          },
        },
      });
    } catch (error) {
      console.error('Error saving report metadata:', error);
      throw new Error(`Failed to save report metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create and export a singleton instance
export const reportingService = new ReportingService(); 