// Reporting types for Riscura RCSA Platform

export interface ReportData {
  id: string
  title: string;
  type: string;
  organizationName?: string;
  widgets: ReportWidget[];
  summary?: ReportSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportWidget {
  id: string;
  title?: string;
  type: 'table' | 'chart' | 'kpi' | 'text' | 'filter';
  data: any[];
  config?: WidgetConfig;
  position?: WidgetPosition;
}

export interface ReportSummary {
  totalWidgets: number;
  dataPoints: number;
  generatedAt: Date;
  metrics?: Record<string, any>;
}

export interface WidgetConfig {
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  columns?: string[];
  filters?: Record<string, any>;
  styling?: Record<string, any>;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ExportOptions {
  format?: ExportFormat;
  compression?: boolean;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  customFields?: Record<string, any>;
}

export interface ChartData {
  label: string;
  value: number;
  category?: string;
  color?: string;
}

export interface KPIData {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  unit?: string;
}

export interface TableData {
  [key: string]: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: Partial<ReportWidget>[];
  defaultFilters?: Record<string, any>;
  category: string;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: ExportFormat;
  isActive: boolean;
  nextRun: Date;
  lastRun?: Date;
}

export interface ReportMetrics {
  totalReports: number;
  reportsThisMonth: number;
  averageGenerationTime: number;
  popularTemplates: string[];
  exportCounts: Record<ExportFormat, number>;
}
