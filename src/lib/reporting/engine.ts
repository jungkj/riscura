import { db } from '@/lib/db';
import { collaborationServer } from '@/lib/websocket/server';

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'report' | 'export';
  templateId?: string;
  organizationId: string;
  createdBy: string;
  layout: ReportLayout;
  filters: ReportFilter[];
  scheduledRuns: ScheduledRun[];
  permissions: ReportPermission[];
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportLayout {
  widgets: ReportWidget[];
  gridSettings: {
    cols: number;
    rowHeight: number;
    margin: [number, number];
    containerPadding: [number, number];
    breakpoints: Record<string, number>;
  };
}

export interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'kpi' | 'text' | 'image' | 'filter';
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  dataSource: DataSourceConfig;
  visualization: VisualizationConfig;
  filters: WidgetFilter[];
  drillDown?: DrillDownConfig;
  refreshInterval?: number;
}

export interface DataSourceConfig {
  type: 'query' | 'api' | 'static';
  source: string;
  query?: string;
  parameters?: Record<string, any>;
  aggregations?: AggregationConfig[];
  joins?: JoinConfig[];
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'funnel';
  xAxis?: string;
  yAxis?: string[];
  groupBy?: string;
  colorScheme?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  customOptions?: Record<string, any>;
}

export interface ReportFilter {
  id: string;
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  defaultValue?: any;
  required?: boolean;
}

export interface ScheduledRun {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'email';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

export interface ReportPermission {
  userId?: string;
  roleId?: string;
  permission: 'view' | 'edit' | 'admin';
}

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: string;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  threshold: {
    critical: number;
    warning: number;
    target: number;
  };
  organizationId: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'risk' | 'control' | 'compliance' | 'governance' | 'executive';
  type: 'regulatory' | 'management' | 'operational';
  layout: ReportLayout;
  requiredFields: string[];
  tags: string[];
  isSystem: boolean;
}

export class ReportingEngine {

  // Create a new report
  async createReport(config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportConfig> {
    const report = await db.client.report.create({
      data: {
        ...config,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'REPORT_CREATED',
        entityType: 'REPORT',
        entityId: report.id,
        description: `Report created: ${config.name}`,
        userId: config.createdBy,
        organizationId: config.organizationId,
        metadata: {
          reportType: config.type,
          widgetCount: config.layout.widgets.length,
        },
        isPublic: false,
      },
    });

    return report;
  }

  // Generate report data
  async generateReportData(reportId: string, filters: Record<string, any> = {}): Promise<{
    widgets: Array<{
      id: string;
      data: any[];
      metadata: {
        totalRecords: number;
        lastUpdated: Date;
        executionTime: number;
      };
    }>;
    summary: {
      totalWidgets: number;
      dataPoints: number;
      generatedAt: Date;
    };
  }> {
    const startTime = Date.now();

    const report = await db.client.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const widgetData = await Promise.all(
      report.layout.widgets.map(async (widget) => {
        const data = await this.generateWidgetData(widget, filters);
        return {
          id: widget.id,
          data: data.records,
          metadata: {
            totalRecords: data.total,
            lastUpdated: new Date(),
            executionTime: data.executionTime,
          },
        };
      })
    );

    const totalDataPoints = widgetData.reduce((sum, widget) => sum + widget.metadata.totalRecords, 0);

    return {
      widgets: widgetData,
      summary: {
        totalWidgets: report.layout.widgets.length,
        dataPoints: totalDataPoints,
        generatedAt: new Date(),
      },
    };
  }

  // Generate data for a specific widget
  private async generateWidgetData(widget: ReportWidget, globalFilters: Record<string, any>): Promise<{
    records: any[];
    total: number;
    executionTime: number;
  }> {
    const startTime = Date.now();

    let data: any[] = [];
    let total = 0;

    switch (widget.dataSource.type) {
      case 'query':
        const result = await this.executeQuery(widget.dataSource, { ...globalFilters, ...this.parseWidgetFilters(widget.filters) });
        data = result.records;
        total = result.total;
        break;

      case 'api':
        const apiResult = await this.callExternalAPI(widget.dataSource, globalFilters);
        data = apiResult.data;
        total = apiResult.total;
        break;

      case 'static':
        data = JSON.parse(widget.dataSource.source);
        total = data.length;
        break;
    }

    // Apply aggregations
    if (widget.dataSource.aggregations) {
      data = this.applyAggregations(data, widget.dataSource.aggregations);
    }

    const executionTime = Date.now() - startTime;

    return { records: data, total, executionTime };
  }

  // Execute database query
  private async executeQuery(dataSource: DataSourceConfig, filters: Record<string, any>): Promise<{
    records: any[];
    total: number;
  }> {
    const { query, parameters = {} } = dataSource;

    if (!query) {
      throw new Error('Query not specified');
    }

    // Build parameterized query with filters
    const mergedParams = { ...parameters, ...filters };
    
    // This is a simplified example - in practice you'd want proper query building
    const records = await db.client.$queryRaw`
      SELECT * FROM (${query}) AS subquery 
      WHERE 1=1 
      ${Object.entries(filters).map(([key, value]) => 
        value !== undefined ? `AND ${key} = ${value}` : ''
      ).join(' ')}
    `;

    return {
      records: Array.isArray(records) ? records : [],
      total: Array.isArray(records) ? records.length : 0,
    };
  }

  // Call external API
  private async callExternalAPI(dataSource: DataSourceConfig, filters: Record<string, any>): Promise<{
    data: any[];
    total: number;
  }> {
    // Implementation for external API calls
    // This would integrate with external risk/compliance systems
    return { data: [], total: 0 };
  }

  // Apply aggregations to data
  private applyAggregations(data: any[], aggregations: AggregationConfig[]): any[] {
    let result = [...data];

    for (const agg of aggregations) {
      switch (agg.type) {
        case 'sum':
          result = this.groupAndSum(result, agg.groupBy, agg.field);
          break;
        case 'count':
          result = this.groupAndCount(result, agg.groupBy);
          break;
        case 'average':
          result = this.groupAndAverage(result, agg.groupBy, agg.field);
          break;
        case 'max':
          result = this.groupAndMax(result, agg.groupBy, agg.field);
          break;
        case 'min':
          result = this.groupAndMin(result, agg.groupBy, agg.field);
          break;
      }
    }

    return result;
  }

  // Group and sum data
  private groupAndSum(data: any[], groupBy: string, field: string): any[] {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) {
        acc[key] = { [groupBy]: key, [field]: 0, count: 0 };
      }
      acc[key][field] += Number(item[field]) || 0;
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Group and count data
  private groupAndCount(data: any[], groupBy: string): any[] {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) {
        acc[key] = { [groupBy]: key, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Group and average data
  private groupAndAverage(data: any[], groupBy: string, field: string): any[] {
    const grouped = this.groupAndSum(data, groupBy, field);
    return grouped.map(item => ({
      ...item,
      [field]: item[field] / item.count,
    }));
  }

  // Group and get max value
  private groupAndMax(data: any[], groupBy: string, field: string): any[] {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) {
        acc[key] = { [groupBy]: key, [field]: Number(item[field]) || 0 };
      } else {
        acc[key][field] = Math.max(acc[key][field], Number(item[field]) || 0);
      }
      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Group and get min value
  private groupAndMin(data: any[], groupBy: string, field: string): any[] {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) {
        acc[key] = { [groupBy]: key, [field]: Number(item[field]) || 0 };
      } else {
        acc[key][field] = Math.min(acc[key][field], Number(item[field]) || 0);
      }
      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Parse widget filters
  private parseWidgetFilters(filters: WidgetFilter[]): Record<string, any> {
    return filters.reduce((acc, filter) => {
      if (filter.value !== undefined && filter.value !== null) {
        acc[filter.field] = filter.value;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  // Export report to PDF
  async exportToPDF(reportId: string, filters: Record<string, any> = {}): Promise<Buffer> {
    // Implementation would use jsPDF and html2canvas
    // to convert the report to PDF
    throw new Error('PDF export not yet implemented');
  }

  // Export report to Excel
  async exportToExcel(reportId: string, filters: Record<string, any> = {}): Promise<Buffer> {
    // Implementation would use xlsx library
    // to generate Excel file
    throw new Error('Excel export not yet implemented');
  }

  // Get report templates
  async getReportTemplates(category?: string): Promise<ReportTemplate[]> {
    const where: any = {};
    if (category) {
      where.category = category;
    }

    return await db.client.reportTemplate.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });
  }

  // Create KPI definition
  async createKPI(kpi: Omit<KPIDefinition, 'id'>): Promise<KPIDefinition> {
    return await db.client.kpiDefinition.create({
      data: kpi,
    });
  }

  // Calculate KPI value
  async calculateKPI(kpiId: string, dateRange: { from: Date; to: Date }): Promise<{
    value: number;
    previousValue?: number;
    trend: 'up' | 'down' | 'stable';
    status: 'critical' | 'warning' | 'good';
  }> {
    const kpi = await db.client.kpiDefinition.findUnique({
      where: { id: kpiId },
    });

    if (!kpi) {
      throw new Error('KPI not found');
    }

    // Execute KPI formula (simplified implementation)
    const value = await this.executeKPIFormula(kpi.formula, dateRange);
    
    // Calculate previous period for trend
    const previousPeriod = {
      from: new Date(dateRange.from.getTime() - (dateRange.to.getTime() - dateRange.from.getTime())),
      to: dateRange.from,
    };
    const previousValue = await this.executeKPIFormula(kpi.formula, previousPeriod);

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (value > previousValue * 1.05) trend = 'up';
    else if (value < previousValue * 0.95) trend = 'down';

    // Determine status
    let status: 'critical' | 'warning' | 'good' = 'good';
    if (value >= kpi.threshold.critical) status = 'critical';
    else if (value >= kpi.threshold.warning) status = 'warning';

    return { value, previousValue, trend, status };
  }

  // Execute KPI formula
  private async executeKPIFormula(formula: string, dateRange: { from: Date; to: Date }): Promise<number> {
    // This is a simplified implementation
    // In practice, you'd want a proper formula parser
    
    // Example formulas:
    // "COUNT(risks WHERE status='open')"
    // "AVG(risks.likelihood * risks.impact)"
    // "SUM(controls.effectiveness_score) / COUNT(controls)"
    
    if (formula.includes('COUNT(risks')) {
      const count = await db.client.risk.count({
        where: {
          createdAt: { gte: dateRange.from, lte: dateRange.to },
          status: 'open',
        },
      });
      return count;
    }

    // Add more formula implementations as needed
    return 0;
  }

  // Schedule report generation
  async scheduleReport(reportId: string, schedule: Omit<ScheduledRun, 'id' | 'lastRun' | 'nextRun'>): Promise<ScheduledRun> {
    const nextRun = this.calculateNextRun(schedule);

    const scheduledRun = await db.client.scheduledRun.create({
      data: {
        ...schedule,
        reportId,
        nextRun,
      },
    });

    return scheduledRun;
  }

  // Calculate next run time for scheduled report
  private calculateNextRun(schedule: Pick<ScheduledRun, 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'time' | 'timezone'>): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDay = schedule.dayOfWeek || 1; // Default to Monday
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;

      case 'monthly':
        const targetDate = schedule.dayOfMonth || 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case 'quarterly':
        nextRun.setMonth(Math.floor(nextRun.getMonth() / 3) * 3);
        nextRun.setDate(1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;

      case 'yearly':
        nextRun.setMonth(0, 1);
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
    }

    return nextRun;
  }

  // Process scheduled reports
  async processScheduledReports(): Promise<void> {
    const dueReports = await db.client.scheduledRun.findMany({
      where: {
        isActive: true,
        nextRun: { lte: new Date() },
      },
      include: {
        report: true,
      },
    });

    for (const scheduledRun of dueReports) {
      try {
        await this.generateScheduledReport(scheduledRun);
        
        // Update next run time
        const nextRun = this.calculateNextRun(scheduledRun);
        await db.client.scheduledRun.update({
          where: { id: scheduledRun.id },
          data: {
            lastRun: new Date(),
            nextRun,
          },
        });

      } catch (error) {
        console.error(`Failed to generate scheduled report ${scheduledRun.id}:`, error);
      }
    }
  }

  // Generate and deliver scheduled report
  private async generateScheduledReport(scheduledRun: any): Promise<void> {
    const reportData = await this.generateReportData(scheduledRun.reportId);

    let fileBuffer: Buffer | undefined;
    let filename: string | undefined;
    let mimeType: string | undefined;

    switch (scheduledRun.format) {
      case 'pdf':
        fileBuffer = await this.exportToPDF(scheduledRun.reportId);
        filename = `${scheduledRun.report.name}.pdf`;
        mimeType = 'application/pdf';
        break;

      case 'excel':
        fileBuffer = await this.exportToExcel(scheduledRun.reportId);
        filename = `${scheduledRun.report.name}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'csv':
        // Implementation for CSV export
        throw new Error('CSV export not yet implemented');

      case 'email':
        // Send email with embedded report
        await this.sendReportEmail(scheduledRun, reportData);
        return;
    }

    // Send report file to recipients
    if (fileBuffer && filename && mimeType) {
      for (const recipientId of scheduledRun.recipients) {
        await this.deliverReportFile(recipientId, filename, fileBuffer, mimeType);
      }
    }
  }

  // Send report via email
  private async sendReportEmail(scheduledRun: any, reportData: any): Promise<void> {
    // Implementation would send HTML email with embedded charts
    console.log('Sending report email to:', scheduledRun.recipients);
  }

  // Deliver report file to user
  private async deliverReportFile(recipientId: string, filename: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    // Implementation would store file and notify user
    console.log('Delivering report file:', filename, 'to user:', recipientId);
  }
}

export interface AggregationConfig {
  type: 'sum' | 'count' | 'average' | 'max' | 'min';
  field: string;
  groupBy: string;
}

export interface JoinConfig {
  table: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: string;
}

export interface WidgetFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

export interface DrillDownConfig {
  enabled: boolean;
  target: string;
  parameters: Record<string, string>;
}

export const reportingEngine = new ReportingEngine(); 