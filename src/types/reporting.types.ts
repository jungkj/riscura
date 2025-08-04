// === Advanced Reporting & Analytics Types ===

export interface ReportTemplate {
  id: string
  name: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  version: string;

  // Configuration
  config: ReportConfig
  layout: ReportLayout;

  // Content Structure
  sections: ReportSection[]
  dataSources: DataSourceConfig[];
  filters: ReportFilter[];
  parameters: ReportParameter[];

  // Styling & Branding
  styling: ReportStyling

  // Access & Permissions
  permissions: ReportPermissions

  // AI Features
  aiFeatures: AIReportFeatures

  // Metadata
  createdBy: string
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;

  // Template Management
  isPublic: boolean
  isSystem: boolean;
  tags: string[];
  organizationId: string;
}

export type ReportCategory =
  | 'executive'
  | 'operational'
  | 'compliance'
  | 'risk_management'
  | 'audit'
  | 'performance'
  | 'financial'
  | 'custom';

export type ReportType =
  | 'dashboard'
  | 'detailed_report'
  | 'summary_report'
  | 'benchmark_report'
  | 'trend_analysis'
  | 'compliance_report'
  | 'executive_brief'
  | 'operational_metrics'
  | 'custom';

export interface ReportConfig {
  refreshFrequency: RefreshFrequency;
  autoRefresh: boolean;
  cacheEnabled: boolean;
  cacheDuration: number; // minutes
  maxDataPoints: number;
  dateRange: DateRangeConfig;
  aggregationLevel: AggregationLevel;
  includeHistorical: boolean;
  realTimeUpdates: boolean;
}

export type RefreshFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
export type AggregationLevel = 'raw' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface DateRangeConfig {
  type: 'relative' | 'absolute' | 'dynamic';
  relative?: RelativeDateRange;
  absolute?: { start: Date; end: Date }
  dynamic?: DynamicDateRange;
}

export interface RelativeDateRange {
  unit: 'days' | 'weeks' | 'months' | 'quarters' | 'years';
  value: number;
  includeToday: boolean;
}

export interface DynamicDateRange {
  expression: string; // e.g., "last_quarter", "ytd", "mtd"
  timezone: string;
}

export interface ReportLayout {
  orientation: 'portrait' | 'landscape';
  pageSize: PageSize;
  columns: number;
  gridTemplate: GridTemplate;
  responsiveBreakpoints: ResponsiveBreakpoint[];
}

export type PageSize = 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid' | 'custom';

export interface GridTemplate {
  rows: string[];
  columns: string[];
  areas: string[][];
  gap: { row: number; column: number }
}

export interface ResponsiveBreakpoint {
  breakpoint: number; // pixels
  columns: number;
  layout: Partial<ReportLayout>;
}

export interface ReportSection {
  id: string;
  name: string;
  title: string;
  type: SectionType;
  order: number;

  // Layout
  position: SectionPosition
  size: SectionSize;

  // Configuration
  config: SectionConfig

  // Data Binding
  dataSource: string; // reference to data source
  query: DataQuery;

  // Visualization
  visualization: VisualizationConfig

  // Conditional Display
  conditions?: DisplayCondition[]

  // AI Features
  aiEnhancements?: AISectionEnhancements
}

export type SectionType =
  | 'chart'
  | 'table'
  | 'metric'
  | 'text'
  | 'image'
  | 'list'
  | 'grid'
  | 'kpi'
  | 'gauge'
  | 'heatmap'
  | 'treemap'
  | 'waterfall'
  | 'funnel'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'sankey'
  | 'narrative'
  | 'executive_summary';

export interface SectionPosition {
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  gridArea?: string;
}

export interface SectionSize {
  width: string;
  height: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export interface SectionConfig {
  title: {
    show: boolean;
    text?: string;
    style: TextStyle;
  }
  borders: BorderConfig;
  background: BackgroundConfig;
  padding: SpacingConfig;
  margin: SpacingConfig;
  interactive: boolean;
  drillDown?: DrillDownConfig;
  exportable: boolean;
}

export interface VisualizationConfig {
  chartType: ChartType;
  chartConfig: ChartConfig;
  colorScheme: ColorScheme;
  legend: LegendConfig;
  axes: AxesConfig;
  annotations: AnnotationConfig[];
  interactions: InteractionConfig;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'column'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'treemap'
  | 'waterfall'
  | 'funnel'
  | 'gauge'
  | 'radar'
  | 'sankey'
  | 'candlestick'
  | 'box_plot'
  | 'violin'
  | 'histogram'
  | 'density';

export interface ChartConfig {
  data: DataMapping;
  series: SeriesConfig[];
  dimensions: DimensionConfig[];
  measures: MeasureConfig[];
  sorting: SortConfig[];
  grouping: GroupConfig[];
  aggregations: AggregationConfig[];
}

export interface DataMapping {
  x: string; // field name
  y: string | string[];
  category?: string;
  size?: string;
  color?: string;
  label?: string;
}

export interface SeriesConfig {
  name: string;
  type: ChartType;
  yAxis: string;
  data: string;
  style: SeriesStyle;
  visible: boolean;
}

export interface SeriesStyle {
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  strokeDash?: number[];
  fill?: boolean;
  marker?: MarkerStyle;
}

export interface MarkerStyle {
  enabled: boolean;
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  size: number;
  color?: string;
}

export interface ColorScheme {
  type: 'categorical' | 'sequential' | 'diverging' | 'custom';
  palette: string[];
  interpolation?: 'linear' | 'log' | 'sqrt';
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'inside';
  alignment: 'start' | 'center' | 'end';
  orientation: 'horizontal' | 'vertical';
  style: TextStyle;
}

export interface AxesConfig {
  x: AxisConfig;
  y: AxisConfig;
  y2?: AxisConfig;
}

export interface AxisConfig {
  show: boolean;
  title: {
    show: boolean;
    text?: string;
    style: TextStyle;
  }
  labels: {
    show: boolean;
    format?: string;
    rotation?: number;
    style: TextStyle;
  }
  grid: {
    show: boolean;
    style: LineStyle;
  }
  ticks: {
    show: boolean;
    count?: number;
    style: LineStyle;
  }
  scale: ScaleConfig;
}

export interface ScaleConfig {
  type: 'linear' | 'log' | 'time' | 'category';
  domain?: [number, number];
  nice?: boolean;
  zero?: boolean;
}

export interface AnnotationConfig {
  id: string;
  type: 'line' | 'area' | 'point' | 'text' | 'arrow';
  data: AnnotationData;
  style: AnnotationStyle;
  conditions?: AnnotationCondition[];
}

export interface AnnotationData {
  x?: number | string;
  y?: number | string;
  x2?: number | string;
  y2?: number | string;
  text?: string;
  value?: number;
}

export interface AnnotationStyle {
  color: string;
  strokeWidth?: number;
  strokeDash?: number[];
  opacity?: number;
  fontSize?: number;
  fontWeight?: number;
}

export interface AnnotationCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
  value: number | [number, number];
}

export interface InteractionConfig {
  hover: boolean;
  click: boolean;
  zoom: boolean;
  pan: boolean;
  brush: boolean;
  crossfilter: boolean;
  tooltip: TooltipConfig;
}

export interface TooltipConfig {
  enabled: boolean;
  format: string;
  fields: string[];
  style: TooltipStyle;
}

export interface TooltipStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  padding: SpacingConfig;
}

// Data Source Configuration
export interface DataSourceConfig {
  id: string
  name: string;
  type: DataSourceType;
  connection: ConnectionConfig;
  schema: DataSchema;
  refresh: RefreshConfig;
  cache: CacheConfig;
}

export type DataSourceType = 'database' | 'api' | 'file' | 'stream' | 'calculated' | 'external';

export interface ConnectionConfig {
  endpoint?: string;
  authentication?: AuthConfig;
  parameters?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth';
  credentials?: Record<string, string>;
}

export interface DataSchema {
  fields: FieldDefinition[];
  relationships: RelationshipDefinition[];
  constraints: ConstraintDefinition[];
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  format?: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: string;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  | 'array';

export interface RelationshipDefinition {
  name: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  from: string;
  to: string;
  foreignKey: string;
}

export interface ConstraintDefinition {
  type: 'unique' | 'check' | 'foreign_key' | 'not_null';
  fields: string[];
  condition?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface RefreshConfig {
  enabled: boolean;
  frequency: RefreshFrequency;
  schedule?: ScheduleConfig;
  triggers?: TriggerConfig[];
}

export interface ScheduleConfig {
  timezone: string;
  cron?: string;
  time?: string;
  days?: number[];
}

export interface TriggerConfig {
  type: 'data_change' | 'time_based' | 'manual' | 'api_call';
  condition?: string;
  parameters?: Record<string, unknown>;
}

export interface CacheConfig {
  enabled: boolean;
  duration: number; // minutes
  key: string;
  strategy: 'memory' | 'disk' | 'redis' | 'database';
}

// Query and Filtering
export interface DataQuery {
  select: SelectClause[]
  from: string;
  joins?: JoinClause[];
  where?: WhereClause[];
  groupBy?: string[];
  having?: WhereClause[];
  orderBy?: OrderClause[];
  limit?: number;
  offset?: number;
}

export interface SelectClause {
  field: string;
  alias?: string;
  aggregation?: AggregationType;
  expression?: string;
}

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'stddev' | 'variance';

export interface JoinClause {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  on: string;
  alias?: string;
}

export interface WhereClause {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  logic?: 'AND' | 'OR';
}

export type ComparisonOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'like'
  | 'not_like'
  | 'is_null'
  | 'is_not_null'
  | 'between';

export interface OrderClause {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportFilter {
  id: string;
  name: string;
  type: FilterType;
  field: string;
  label: string;
  description?: string;

  // Configuration
  config: FilterConfig

  // Default Values
  defaultValue?: unknown
  required: boolean;

  // UI Configuration
  ui: FilterUIConfig

  // Conditional Logic
  dependencies?: FilterDependency[]
  conditions?: FilterCondition[];
}

export type FilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'radio'
  | 'range'
  | 'date_range'
  | 'search'
  | 'hierarchy';

export interface FilterConfig {
  options?: FilterOption[];
  range?: { min: number; max: number }
  dateFormat?: string;
  validation?: ValidationRule[];
  caseSensitive?: boolean;
  allowCustom?: boolean;
}

export interface FilterOption {
  value: unknown;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

export interface FilterUIConfig {
  placeholder?: string;
  helpText?: string;
  size: 'small' | 'medium' | 'large';
  width?: string;
  searchable?: boolean;
  clearable?: boolean;
  multiline?: boolean;
}

export interface FilterDependency {
  filterIds: string[];
  condition: DependencyCondition;
  action: DependencyAction;
}

export interface DependencyCondition {
  type: 'value' | 'state' | 'custom';
  expression: string;
}

export type DependencyAction = 'show' | 'hide' | 'enable' | 'disable' | 'update_options';

export interface FilterCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface ReportParameter {
  id: string;
  name: string;
  type: ParameterType;
  label: string;
  description?: string;
  defaultValue?: unknown;
  required: boolean;
  validation?: ValidationRule[];
}

export type ParameterType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

// Styling and Theming
export interface ReportStyling {
  theme: ThemeConfig
  typography: TypographyConfig;
  colors: ColorConfig;
  spacing: SpacingConfig;
  borders: BorderConfig;
  shadows: ShadowConfig;
  branding: BrandingConfig;
}

export interface ThemeConfig {
  name: string;
  variant: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  }
  fontWeight: {
    normal: number;
    medium: number;
    bold: number;
  }
  lineHeight: {
    tight: number;
    normal: number;
    loose: number;
  }
}

export interface ColorConfig {
  primary: ColorPalette;
  secondary: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
  neutral: ColorPalette;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SpacingConfig {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface BorderConfig {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
  radius?: number;
}

export interface BackgroundConfig {
  color?: string;
  gradient?: GradientConfig;
  image?: BackgroundImageConfig;
  opacity?: number;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  direction?: number; // degrees for linear
  stops: GradientStop[];
}

export interface GradientStop {
  offset: number; // 0-1
  color: string;
}

export interface BackgroundImageConfig {
  url: string;
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  position: string;
  size: 'cover' | 'contain' | 'auto';
  attachment: 'scroll' | 'fixed';
}

export interface ShadowConfig {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface BrandingConfig {
  logo?: LogoConfig;
  watermark?: WatermarkConfig;
  header?: HeaderConfig;
  footer?: FooterConfig;
}

export interface LogoConfig {
  enabled: boolean;
  url: string;
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  size: { width: number; height: number }
  opacity: number;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'center' | 'diagonal';
  style: TextStyle;
}

export interface HeaderConfig {
  enabled: boolean;
  height: number;
  content: HeaderContent[];
  style: HeaderStyle;
}

export interface HeaderContent {
  type: 'text' | 'logo' | 'date' | 'page_number' | 'custom';
  content: string;
  position: 'left' | 'center' | 'right';
  style: TextStyle;
}

export interface HeaderStyle {
  backgroundColor: string;
  borderBottom: BorderConfig;
  padding: SpacingConfig;
}

export interface FooterConfig {
  enabled: boolean;
  height: number;
  content: HeaderContent[];
  style: HeaderStyle;
}

export interface TextStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  lineHeight?: number;
}

export interface LineStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  opacity?: number;
}

// AI-Powered Features
export interface AIReportFeatures {
  narrativeGeneration: NarrativeGenerationConfig
  insightGeneration: InsightGenerationConfig;
  recommendationEngine: RecommendationEngineConfig;
  anomalyDetection: AnomalyDetectionConfig;
  predictiveAnalytics: PredictiveAnalyticsConfig;
  naturalLanguageQuery: NLQueryConfig;
}

export interface NarrativeGenerationConfig {
  enabled: boolean;
  sections: string[]; // section IDs to generate narratives for
  style: NarrativeStyle;
  length: 'short' | 'medium' | 'long';
  language: string;
  tone: 'formal' | 'casual' | 'technical' | 'executive';
  includeInsights: boolean;
  includeRecommendations: boolean;
}

export type NarrativeStyle =
  | 'bullet_points'
  | 'paragraph'
  | 'executive_summary'
  | 'detailed_analysis';

export interface InsightGenerationConfig {
  enabled: boolean;
  types: InsightType[];
  confidence: number; // minimum confidence threshold
  priority: InsightPriority[];
  categories: string[];
  maxInsights: number;
}

export type InsightType =
  | 'trend'
  | 'anomaly'
  | 'correlation'
  | 'threshold_breach'
  | 'pattern'
  | 'forecast'
  | 'benchmark_comparison';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface RecommendationEngineConfig {
  enabled: boolean;
  types: RecommendationType[];
  context: RecommendationContext;
  personalization: PersonalizationConfig;
  maxRecommendations: number;
}

export type RecommendationType =
  | 'process_improvement'
  | 'risk_mitigation'
  | 'cost_optimization'
  | 'performance_enhancement'
  | 'compliance_improvement'
  | 'automation_opportunity';

export interface RecommendationContext {
  organizationProfile: OrganizationProfile;
  userRole: string;
  historicalData: boolean;
  industryBenchmarks: boolean;
  regulatoryRequirements: boolean;
}

export interface OrganizationProfile {
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  region: string;
  riskProfile: 'low' | 'medium' | 'high';
  maturityLevel: number; // 1-5
}

export interface PersonalizationConfig {
  enabled: boolean;
  userPreferences: boolean;
  roleBasedFiltering: boolean;
  historicalInteractions: boolean;
  learningEnabled: boolean;
}

export interface AnomalyDetectionConfig {
  enabled: boolean;
  algorithms: AnomalyAlgorithm[];
  sensitivity: number; // 0-1
  seasonality: boolean;
  trendFiltering: boolean;
  minDataPoints: number;
}

export type AnomalyAlgorithm =
  | 'statistical'
  | 'isolation_forest'
  | 'local_outlier_factor'
  | 'dbscan'
  | 'lstm_autoencoder';

export interface PredictiveAnalyticsConfig {
  enabled: boolean;
  models: PredictiveModel[];
  horizon: number; // days
  confidence: number; // 0-1
  scenarios: ScenarioConfig[];
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: ModelType;
  features: string[];
  target: string;
  accuracy: number;
  lastTrained: Date;
}

export type ModelType =
  | 'linear_regression'
  | 'random_forest'
  | 'xgboost'
  | 'lstm'
  | 'arima'
  | 'prophet';

export interface ScenarioConfig {
  name: string;
  description: string;
  parameters: ScenarioParameter[];
  probability: number;
}

export interface ScenarioParameter {
  field: string;
  adjustment: number; // percentage change
  type: 'increase' | 'decrease' | 'absolute';
}

export interface NLQueryConfig {
  enabled: boolean;
  supportedLanguages: string[];
  contextAware: boolean;
  suggestionsEnabled: boolean;
  maxTokens: number;
}

export interface AISectionEnhancements {
  smartFormatting: boolean;
  contextualInsights: boolean;
  dynamicAnnotations: boolean;
  intelligentGrouping: boolean;
  adaptiveVisualization: boolean;
}

// Report Generation and Export
export interface ReportGeneration {
  id: string
  templateId: string;
  status: GenerationStatus;
  progress: number; // 0-100

  // Configuration
  parameters: Record<string, unknown>
  filters: Record<string, unknown>;
  dateRange: { start: Date; end: Date }

  // Output
  format: ExportFormat[]
  outputs: GeneratedOutput[];

  // Metadata
  requestedBy: string
  requestedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;

  // AI Generated Content
  aiContent?: AIGeneratedContent
}

export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type ExportFormat =
  | 'pdf'
  | 'excel'
  | 'csv'
  | 'powerpoint'
  | 'html'
  | 'json'
  | 'image'
  | 'word';

export interface GeneratedOutput {
  format: ExportFormat;
  url: string;
  size: number;
  generatedAt: Date;
  metadata: OutputMetadata;
}

export interface OutputMetadata {
  pageCount?: number;
  chartCount?: number;
  tableCount?: number;
  dataPoints?: number;
  processingTime: number;
}

export interface AIGeneratedContent {
  narratives: GeneratedNarrative[];
  insights: GeneratedInsight[];
  recommendations: GeneratedRecommendation[];
  summaries: GeneratedSummary[];
}

export interface GeneratedNarrative {
  sectionId: string;
  content: string;
  confidence: number;
  sources: string[];
  keywords: string[];
}

export interface GeneratedInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  priority: InsightPriority;
  category: string;
  dataPoints: DataPoint[];
  visualizations?: string[];
}

export interface DataPoint {
  metric: string;
  value: number;
  context: string;
  significance: number;
}

export interface GeneratedRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  steps: string[];
  resources: string[];
  dependencies: string[];
}

export interface GeneratedSummary {
  type: 'executive' | 'technical' | 'operational';
  content: string;
  keyPoints: string[];
  metrics: SummaryMetric[];
  confidence: number;
}

export interface SummaryMetric {
  name: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

// Scheduling and Distribution
export interface ReportSchedule {
  id: string
  templateId: string;
  name: string;
  description?: string;

  // Schedule Configuration
  frequency: ScheduleFrequency
  schedule: CronSchedule;
  timezone: string;

  // Generation Options
  parameters: Record<string, unknown>
  filters: Record<string, unknown>;
  formats: ExportFormat[];

  // Distribution
  distribution: DistributionConfig

  // Status
  enabled: boolean
  lastRun?: Date;
  nextRun: Date;
  runCount: number;

  // Metadata
  createdBy: string
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduleFrequency =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'custom';

export interface CronSchedule {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  expression?: string; // full cron expression
}

export interface DistributionConfig {
  channels: DistributionChannel[];
  recipients: Recipient[];
  conditions: DistributionCondition[];
}

export interface DistributionChannel {
  type: ChannelType;
  config: ChannelConfig;
  enabled: boolean;
}

export type ChannelType =
  | 'email'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'ftp'
  | 'sftp'
  | 's3'
  | 'sharepoint'
  | 'api';

export interface ChannelConfig {
  endpoint?: string;
  authentication?: AuthConfig;
  template?: string;
  attachments: boolean;
  embedImages: boolean;
  compression?: 'none' | 'zip' | 'gzip';
  encryption?: EncryptionConfig;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES256' | 'PGP';
  key?: string;
  passphrase?: string;
}

export interface Recipient {
  id: string;
  type: 'user' | 'group' | 'role' | 'external';
  identifier: string; // email, user ID, etc.
  name: string;
  preferences: RecipientPreferences;
}

export interface RecipientPreferences {
  formats: ExportFormat[];
  delivery: 'attachment' | 'link' | 'inline';
  notifications: boolean;
  frequency?: ScheduleFrequency;
}

export interface DistributionCondition {
  type: 'data_threshold' | 'schedule_override' | 'approval_required';
  condition: string;
  action: 'send' | 'skip' | 'delay' | 'escalate';
}

// Permissions and Access Control
export interface ReportPermissions {
  view: PermissionRule[]
  edit: PermissionRule[];
  delete: PermissionRule[];
  export: PermissionRule[];
  schedule: PermissionRule[];
  share: PermissionRule[];
}

export interface PermissionRule {
  type: 'user' | 'role' | 'group' | 'organization';
  identifier: string;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

// Analytics and Usage Tracking
export interface ReportAnalytics {
  reportId: string
  period: { start: Date; end: Date }

  // Usage Metrics
  views: number
  downloads: number;
  shares: number;
  generationTime: AnalyticsMetric;

  // User Engagement
  userMetrics: UserMetrics
  sectionMetrics: SectionMetrics[];

  // Performance
  performance: PerformanceMetrics

  // Errors and Issues
  errors: ErrorMetric[]

  // AI Insights
  aiUsage: AIUsageMetrics
}

export interface AnalyticsMetric {
  total: number;
  average: number;
  min: number;
  max: number;
  trend: TrendData[];
}

export interface TrendData {
  date: Date;
  value: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  userEngagement: UserEngagement[];
}

export interface UserEngagement {
  userId: string;
  views: number;
  timeSpent: number; // seconds
  interactions: number;
  lastAccess: Date;
}

export interface SectionMetrics {
  sectionId: string;
  views: number;
  timeSpent: number;
  interactions: number;
  drillDowns: number;
  exports: number;
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  cacheHitRate: number;
  dataFreshness: number; // minutes since last refresh
  errorRate: number;
  availability: number; // percentage
}

export interface ErrorMetric {
  type: 'generation' | 'data' | 'export' | 'distribution';
  count: number;
  lastOccurrence: Date;
  description: string;
}

export interface AIUsageMetrics {
  narrativesGenerated: number;
  insightsGenerated: number;
  recommendationsGenerated: number;
  queriesProcessed: number;
  averageConfidence: number;
  processingTime: number;
}

// Display and Conditional Logic
export interface DisplayCondition {
  type: 'data' | 'parameter' | 'user' | 'time' | 'custom'
  condition: ConditionExpression;
  action: 'show' | 'hide' | 'highlight' | 'disable';
}

export interface ConditionExpression {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  logic?: 'AND' | 'OR';
  nested?: ConditionExpression[];
}

export interface DrillDownConfig {
  enabled: boolean;
  target: DrillDownTarget;
  parameters: DrillDownParameter[];
  filters: DrillDownFilter[];
}

export interface DrillDownTarget {
  type: 'report' | 'dashboard' | 'url' | 'modal';
  target: string;
  openIn: 'same_window' | 'new_window' | 'modal' | 'sidebar';
}

export interface DrillDownParameter {
  source: string;
  target: string;
  transform?: string;
}

export interface DrillDownFilter {
  field: string;
  value: string;
  operator?: ComparisonOperator;
}

// Helper Types
export interface DimensionConfig {
  field: string
  alias?: string;
  type: 'categorical' | 'temporal' | 'ordinal';
  hierarchy?: string[];
  format?: string;
}

export interface MeasureConfig {
  field: string;
  alias?: string;
  aggregation: AggregationType;
  format?: string;
  calculation?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface GroupConfig {
  field: string;
  type: 'dimension' | 'measure';
  level?: number;
}

export interface AggregationConfig {
  field: string;
  function: AggregationType;
  alias?: string;
}

// Backward Compatibility with existing types
export interface LegacyReportTemplate {
  id: string
  name: string;
  description: string;
  type: 'executive_dashboard' | 'risk_register' | 'control_effectiveness' | 'compliance' | 'custom';
  sections: LegacyReportSection[];
  parameters: LegacyReportParameter[];
  schedule?: LegacyScheduleConfig;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  tags?: string[];
}

export interface LegacyReportSection {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'text' | 'metrics' | 'list';
  order: number;
  config: {
    dataSource: string;
    chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
    filters?: Record<string, unknown>;
    columns?: string[];
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  }
  styling?: {
    width?: string;
    height?: string;
    backgroundColor?: string;
  }
}

export interface LegacyReportParameter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number';
  required: boolean;
  defaultValue?: unknown;
}

export interface LegacyScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  enabled: boolean;
}
