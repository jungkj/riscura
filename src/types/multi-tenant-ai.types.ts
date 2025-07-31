// Multi-Tenant AI Architecture Types

// Core Tenant Management
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  status: TenantStatus;
  subscription: TenantSubscription;
  configuration: TenantConfiguration;
  branding: TenantBranding;
  aiPersonality: AIPersonality;
  isolation: TenantIsolation;
  analytics: TenantAnalytics;
  billing: TenantBilling;
  security: TenantSecurity;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata: TenantMetadata;
}

export type TenantStatus =
  | 'active'
  | 'suspended'
  | 'trial'
  | 'inactive'
  | 'pending_activation'
  | 'deactivated';

export interface TenantSubscription {
  plan: SubscriptionPlan;
  tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'expired';
  limits: SubscriptionLimits;
  features: SubscriptionFeatures;
  billing: BillingInfo;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'custom';
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxUsers: number;
  maxAIQueries: number;
  maxModels: number;
  maxKnowledgeBases: number;
  maxDocuments: number;
  maxStorage: number; // GB
  maxAPIRequests: number;
  maxCustomBranding: boolean;
  maxIntegrations: number;
}

export interface SubscriptionFeatures {
  customModels: boolean;
  knowledgeBase: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  ssoIntegration: boolean;
  auditLogs: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  whiteLabeling: boolean;
}

// Tenant Configuration
export interface TenantConfiguration {
  aiModels: TenantAIModels;
  dataRetention: DataRetentionPolicy;
  privacy: PrivacySettings;
  integrations: TenantIntegrations;
  workflows: WorkflowConfiguration;
  notifications: NotificationSettings;
  customization: CustomizationSettings;
}

export interface TenantAIModels {
  defaultModel: string;
  availableModels: ModelConfiguration[];
  customModels: CustomModelConfig[];
  modelPreferences: ModelPreferences;
  fallbackStrategy: FallbackStrategy;
}

export interface ModelConfiguration {
  modelId: string;
  name: string;
  type: 'text' | 'chat' | 'embedding' | 'classification' | 'generation';
  provider: 'openai' | 'anthropic' | 'custom' | 'local';
  version: string;
  enabled: boolean;
  configuration: ModelSettings;
  usage: ModelUsageStats;
  permissions: ModelPermissions;
}

export interface ModelSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  systemPrompt?: string;
  customInstructions?: string[];
  safetySettings: SafetySettings;
}

export interface ModelPermissions {
  allowedUsers: string[];
  allowedRoles: string[];
  restrictedFeatures: string[];
  accessLevel: 'full' | 'restricted' | 'read_only';
}

export interface CustomModelConfig {
  id: string;
  name: string;
  baseModel: string;
  fineTuningData: string;
  trainingStatus: 'pending' | 'training' | 'completed' | 'failed';
  performance: ModelPerformanceMetrics;
  deploymentStatus: 'deployed' | 'staging' | 'inactive';
}

// AI Personality & Branding
export interface AIPersonality {
  name: string;
  description: string;
  tone: PersonalityTone;
  communication: CommunicationStyle;
  expertise: ExpertiseArea[];
  responseStyle: ResponseStyle;
  avatar: AvatarConfiguration;
  voice: VoiceConfiguration;
  behaviors: BehaviorSettings;
  customPrompts: CustomPrompts;
}

export interface PersonalityTone {
  formal: number; // 0-100
  friendly: number; // 0-100
  professional: number; // 0-100
  empathetic: number; // 0-100
  assertive: number; // 0-100
  humorous: number; // 0-100
}

export interface CommunicationStyle {
  verbosity: 'concise' | 'moderate' | 'detailed' | 'comprehensive';
  technicalLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  questioningStyle: 'direct' | 'exploratory' | 'socratic' | 'supportive';
  explanationDepth: 'surface' | 'moderate' | 'deep' | 'exhaustive';
}

export interface ExpertiseArea {
  domain: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  keywords: string[];
  specializations: string[];
}

export interface ResponseStyle {
  useExamples: boolean;
  includeSteps: boolean;
  provideSources: boolean;
  askClarifyingQuestions: boolean;
  offerAlternatives: boolean;
  structuredFormat: boolean;
}

export interface TenantBranding {
  logo: BrandAsset;
  colors: ColorScheme;
  typography: TypographySettings;
  messaging: BrandMessaging;
  customCSS?: string;
  whiteLabel: boolean;
  domain: DomainSettings;
  assets: BrandAssets;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface BrandMessaging {
  welcomeMessage: string;
  tagline: string;
  aboutMessage: string;
  helpMessage: string;
  errorMessages: Record<string, string>;
  customGreetings: string[];
}

// Tenant Isolation
export interface TenantIsolation {
  dataIsolation: DataIsolationConfig;
  computeIsolation: ComputeIsolationConfig;
  networkIsolation: NetworkIsolationConfig;
  storageIsolation: StorageIsolationConfig;
  encryptionConfig: TenantEncryption;
}

export interface DataIsolationConfig {
  strategy: 'database_per_tenant' | 'schema_per_tenant' | 'row_level_security' | 'hybrid';
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  dataResidency: string; // Geographic location
  backupIsolation: boolean;
  auditTrail: boolean;
}

export interface ComputeIsolationConfig {
  dedicatedResources: boolean;
  resourceLimits: ResourceLimits;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  gpuIsolation: boolean;
  containerIsolation: ContainerIsolationConfig;
}

export interface ResourceLimits {
  maxCPU: number;
  maxMemory: number;
  maxGPU: number;
  maxStorage: number;
  maxBandwidth: number;
  maxConcurrentRequests: number;
}

export interface NetworkIsolationConfig {
  vpcIsolation: boolean;
  subnetIsolation: boolean;
  firewallRules: FirewallRule[];
  allowedIPs: string[];
  blockedIPs: string[];
  rateLimiting: RateLimitConfig;
}

export interface StorageIsolationConfig {
  dedicatedStorage: boolean;
  encryptionKeys: string[];
  accessControls: StorageAccessControl[];
  backupStrategy: BackupStrategy;
  dataLifecycle: DataLifecyclePolicy;
}

// Analytics & Billing
export interface TenantAnalytics {
  usage: UsageAnalytics;
  performance: PerformanceAnalytics;
  costs: CostAnalytics;
  users: UserAnalytics;
  insights: AnalyticsInsights;
  reports: AnalyticsReports;
}

export interface UsageAnalytics {
  aiQueries: QueryAnalytics;
  modelUsage: ModelUsageAnalytics;
  features: FeatureUsageAnalytics;
  api: APIUsageAnalytics;
  storage: StorageUsageAnalytics;
  bandwidth: BandwidthAnalytics;
}

export interface QueryAnalytics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  queriesPerDay: TimeSeriesData[];
  queryTypes: QueryTypeBreakdown[];
  userSatisfaction: SatisfactionMetrics;
}

export interface TenantBilling {
  currentPeriod: BillingPeriod;
  usage: BillingUsage;
  costs: BillingCosts;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  billing: BillingSettings;
}

export interface BillingUsage {
  aiQueries: number;
  apiRequests: number;
  storageUsed: number;
  bandwidthUsed: number;
  customModels: number;
  additionalFeatures: Record<string, number>;
}

export interface BillingCosts {
  baseSubscription: number;
  usageOverages: number;
  additionalFeatures: number;
  discounts: number;
  taxes: number;
  total: number;
  currency: string;
}

// Security & Compliance
export interface TenantSecurity {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  compliance: ComplianceConfig;
  monitoring: SecurityMonitoring;
  incidents: SecurityIncident[];
}

export interface AuthenticationConfig {
  ssoEnabled: boolean;
  ssoProvider: string;
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  allowedDomains: string[];
}

export interface AuthorizationConfig {
  rbacEnabled: boolean;
  roles: TenantRole[];
  permissions: TenantPermission[];
  accessPolicies: AccessPolicy[];
  auditEnabled: boolean;
}

export interface TenantRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inheritFrom?: string[];
  users: string[];
}

// Multi-Tenant Management
export interface TenantManager {
  tenants: Map<string, Tenant>;
  isolation: IsolationManager;
  billing: BillingManager;
  analytics: AnalyticsManager;
  security: SecurityManager;
}

export interface IsolationManager {
  createTenantEnvironment(tenantId: string): Promise<TenantEnvironment>;
  destroyTenantEnvironment(tenantId: string): Promise<void>;
  isolateData(tenantId: string, data: unknown): Promise<unknown>;
  validateIsolation(tenantId: string): Promise<IsolationValidationResult>;
}

export interface TenantEnvironment {
  tenantId: string;
  namespace: string;
  database: DatabaseConfig;
  storage: StorageConfig;
  compute: ComputeConfig;
  network: NetworkConfig;
  monitoring: MonitoringConfig;
}

export interface BillingManager {
  calculateUsage(tenantId: string, period: BillingPeriod): Promise<BillingUsage>;
  generateInvoice(tenantId: string, usage: BillingUsage): Promise<Invoice>;
  processPayment(tenantId: string, invoice: Invoice): Promise<PaymentResult>;
  updateLimits(tenantId: string, limits: SubscriptionLimits): Promise<void>;
}

// Conversation Context
export interface TenantConversationContext {
  tenantId: string;
  userId: string;
  sessionId: string;
  conversationId: string;
  aiPersonality: AIPersonality;
  modelConfiguration: ModelConfiguration;
  isolation: ConversationIsolation;
  tracking: ConversationTracking;
  customization: ConversationCustomization;
}

export interface ConversationIsolation {
  dataEncryption: boolean;
  memoryIsolation: boolean;
  crossTenantPrevention: boolean;
  auditLogging: boolean;
}

export interface ConversationTracking {
  usage: UsageTracking;
  performance: PerformanceTracking;
  satisfaction: SatisfactionTracking;
  costs: CostTracking;
}

export interface AIResponse {
  content: string;
  metadata: ResponseMetadata;
  tenantContext: TenantConversationContext;
  billing: ResponseBilling;
  isolation: ResponseIsolation;
}

export interface ResponseMetadata {
  modelUsed: string;
  tokensUsed: number;
  responseTime: number;
  confidence: number;
  sources: string[];
  personalityApplied: boolean;
  customizationsApplied: string[];
}

// Utility Interfaces
export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface QueryTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface SatisfactionMetrics {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
  feedbackCount: number;
}

export interface ModelUsageAnalytics {
  modelId: string;
  queriesCount: number;
  averageResponseTime: number;
  successRate: number;
  userSatisfaction: number;
  costs: number;
}

export interface FeatureUsageAnalytics {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  averageSessionTime: number;
  adoptionRate: number;
}

export interface APIUsageAnalytics {
  endpoint: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  topUsers: string[];
}

export interface StorageUsageAnalytics {
  totalUsed: number;
  totalLimit: number;
  utilizationPercentage: number;
  growthRate: number;
  projectedUsage: number;
}

export interface BandwidthAnalytics {
  inbound: number;
  outbound: number;
  total: number;
  peakUsage: number;
  averageUsage: number;
}

export interface AnalyticsInsights {
  trends: TrendInsight[];
  anomalies: AnomalyInsight[];
  recommendations: RecommendationInsight[];
  predictions: PredictionInsight[];
}

export interface TrendInsight {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  change: number;
  period: string;
  significance: 'low' | 'medium' | 'high';
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  status: 'current' | 'upcoming' | 'completed';
}

export interface Invoice {
  id: string;
  tenantId: string;
  period: BillingPeriod;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto';
  details: PaymentMethodDetails;
  isDefault: boolean;
  isValid: boolean;
}

export interface BillingSettings {
  autoPayment: boolean;
  paymentMethod: string;
  billingEmail: string;
  invoiceDelivery: 'email' | 'portal' | 'both';
  currency: string;
  taxId?: string;
}

// Additional supporting interfaces
export interface BillingInfo {
  billingEmail: string;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  taxInformation: TaxInfo;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface TaxInfo {
  taxId?: string;
  taxRate: number;
  taxExempt: boolean;
}

export interface TenantMetadata {
  industry: string;
  companySize: string;
  region: string;
  timezone: string;
  language: string;
  tags: string[];
  notes: string;
}

export interface DataRetentionPolicy {
  conversationRetention: number; // days
  logRetention: number; // days
  analyticsRetention: number; // days
  backupRetention: number; // days
  archivalPolicy: ArchivalPolicy;
}

export interface PrivacySettings {
  dataProcessingConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  dataExportEnabled: boolean;
  dataDeleteEnabled: boolean;
  privacyLevel: 'standard' | 'enhanced' | 'maximum';
}

export interface TenantIntegrations {
  sso: SSOIntegration[];
  apis: APIIntegration[];
  webhooks: WebhookIntegration[];
  thirdParty: ThirdPartyIntegration[];
}

export interface WorkflowConfiguration {
  approvalWorkflows: ApprovalWorkflow[];
  automationRules: AutomationRule[];
  customWorkflows: CustomWorkflow[];
}

export interface NotificationSettings {
  emailNotifications: EmailNotificationConfig;
  slackIntegrations: SlackIntegrationConfig[];
  webhookNotifications: WebhookNotificationConfig[];
  inAppNotifications: InAppNotificationConfig;
}

export interface CustomizationSettings {
  uiCustomizations: UICustomization[];
  behaviorCustomizations: BehaviorCustomization[];
  featureToggles: FeatureToggle[];
}

export interface ModelPreferences {
  preferredModels: string[];
  fallbackModels: string[];
  costOptimization: boolean;
  performanceOptimization: boolean;
  qualityThreshold: number;
}

export interface FallbackStrategy {
  enabled: boolean;
  strategy: 'round_robin' | 'cost_optimized' | 'performance_optimized' | 'custom';
  maxRetries: number;
  retryDelay: number;
}

export interface ModelUsageStats {
  totalQueries: number;
  successRate: number;
  averageResponseTime: number;
  costPerQuery: number;
  lastUsed: Date;
}

export interface SafetySettings {
  contentFiltering: boolean;
  piiDetection: boolean;
  toxicityFiltering: boolean;
  safetyThreshold: number;
  customFilters: string[];
}

export interface ModelPerformanceMetrics {
  accuracy: number;
  latency: number;
  throughput: number;
  errorRate: number;
  userSatisfaction: number;
}

export interface AvatarConfiguration {
  type: 'image' | 'icon' | 'animated' | 'custom';
  source: string;
  style: 'realistic' | 'cartoon' | 'abstract' | 'professional';
  customizations: AvatarCustomization[];
}

export interface VoiceConfiguration {
  enabled: boolean;
  provider: 'aws_polly' | 'google_tts' | 'azure_speech' | 'custom';
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface BehaviorSettings {
  proactiveHelp: boolean;
  contextAwareness: boolean;
  learningEnabled: boolean;
  memoryEnabled: boolean;
  personalizedResponses: boolean;
}

export interface CustomPrompts {
  systemPrompt: string;
  greetingPrompts: string[];
  helpPrompts: string[];
  errorPrompts: string[];
  closingPrompts: string[];
}

export interface BrandAsset {
  url: string;
  altText: string;
  dimensions: { width: number; height: number };
  format: string;
}

export interface TypographySettings {
  primaryFont: string;
  secondaryFont: string;
  headingFont: string;
  bodyFont: string;
  fontSizes: Record<string, string>;
  fontWeights: Record<string, string>;
}

export interface DomainSettings {
  customDomain?: string;
  subdomain: string;
  sslEnabled: boolean;
  redirects: DomainRedirect[];
}

export interface BrandAssets {
  favicon: BrandAsset;
  socialImages: BrandAsset[];
  customIcons: BrandAsset[];
  backgroundImages: BrandAsset[];
}

export interface TenantEncryption {
  algorithm: string;
  keyRotationPeriod: number;
  keyManagement: 'tenant' | 'managed' | 'hybrid';
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
}

export interface ContainerIsolationConfig {
  dedicatedContainers: boolean;
  resourceQuotas: ResourceQuotas;
  networkPolicies: NetworkPolicy[];
  securityContexts: SecurityContext[];
}

export interface FirewallRule {
  name: string;
  direction: 'inbound' | 'outbound';
  protocol: string;
  port: number;
  source: string;
  action: 'allow' | 'deny';
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  queueSize: number;
}

export interface StorageAccessControl {
  principalId: string;
  permissions: string[];
  resource: string;
  conditions: AccessCondition[];
}

export interface BackupStrategy {
  frequency: string;
  retention: number;
  encryption: boolean;
  offsite: boolean;
  testingSchedule: string;
}

export interface DataLifecyclePolicy {
  stages: LifecycleStage[];
  transitions: LifecycleTransition[];
  deletionPolicy: DeletionPolicy;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  retentionRate: number;
  churnRate: number;
}

export interface AnalyticsReports {
  scheduled: ScheduledReport[];
  custom: CustomReport[];
  exports: ReportExport[];
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'custom';
  host: string;
  port: number;
  database: string;
  schema?: string;
  credentials: DatabaseCredentials;
  isolation: DatabaseIsolation;
}

export interface StorageConfig {
  type: 's3' | 'gcs' | 'azure_blob' | 'local';
  bucket: string;
  region: string;
  credentials: StorageCredentials;
  encryption: StorageEncryption;
}

export interface ComputeConfig {
  type: 'kubernetes' | 'docker' | 'vm' | 'serverless';
  resources: ComputeResources;
  scaling: ScalingConfig;
  monitoring: ComputeMonitoring;
}

export interface NetworkConfig {
  vpc: string;
  subnets: string[];
  securityGroups: string[];
  loadBalancer: LoadBalancerConfig;
  dns: DNSConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
  dashboards: DashboardConfig[];
  logging: LoggingConfig;
}

export interface IsolationValidationResult {
  isValid: boolean;
  violations: IsolationViolation[];
  recommendations: string[];
  lastValidated: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  method: string;
  timestamp: Date;
  error?: string;
}

export interface UsageTracking {
  queries: number;
  tokens: number;
  responseTime: number;
  costs: number;
  features: string[];
}

export interface PerformanceTracking {
  latency: number;
  throughput: number;
  errorRate: number;
  availability: number;
}

export interface SatisfactionTracking {
  rating?: number;
  feedback?: string;
  thumbsUp?: boolean;
  reportedIssues: string[];
}

export interface CostTracking {
  baseCost: number;
  additionalCosts: number;
  total: number;
  currency: string;
}

export interface ResponseBilling {
  cost: number;
  billableUnits: number;
  unitType: string;
  tenantId: string;
}

export interface ResponseIsolation {
  dataEncrypted: boolean;
  crossTenantCheck: boolean;
  auditLogged: boolean;
  complianceValidated: boolean;
}

export interface AnomalyInsight {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  affectedMetrics: string[];
}

export interface RecommendationInsight {
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface PredictionInsight {
  metric: string;
  prediction: number;
  confidence: number;
  horizon: string;
  methodology: string;
}

export interface PaymentMethodDetails {
  // Varies by payment method type
  [key: string]: unknown;
}

export interface ArchivalPolicy {
  enabled: boolean;
  archiveAfterDays: number;
  compressionEnabled: boolean;
  encryptionRequired: boolean;
}

export interface SSOIntegration {
  id: string;
  provider: string;
  configuration: Record<string, unknown>;
  enabled: boolean;
}

export interface APIIntegration {
  id: string;
  name: string;
  endpoint: string;
  authentication: AuthenticationMethod;
  rateLimit: number;
  enabled: boolean;
}

export interface WebhookIntegration {
  id: string;
  url: string;
  events: string[];
  authentication: AuthenticationMethod;
  enabled: boolean;
}

export interface ThirdPartyIntegration {
  id: string;
  service: string;
  configuration: Record<string, unknown>;
  capabilities: string[];
  enabled: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  stages: WorkflowStage[];
  conditions: WorkflowCondition[];
  enabled: boolean;
}

export interface AutomationRule {
  id: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
}

export interface CustomWorkflow {
  id: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
  enabled: boolean;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  templates: EmailTemplate[];
  frequency: NotificationFrequency;
  recipients: string[];
}

export interface SlackIntegrationConfig {
  enabled: boolean;
  webhook: string;
  channels: string[];
  events: string[];
}

export interface WebhookNotificationConfig {
  enabled: boolean;
  webhooks: NotificationWebhook[];
  events: string[];
  authentication: AuthenticationMethod;
}

export interface InAppNotificationConfig {
  enabled: boolean;
  types: NotificationType[];
  persistence: NotificationPersistence;
}

export interface UICustomization {
  component: string;
  properties: Record<string, unknown>;
  conditions: CustomizationCondition[];
  enabled: boolean;
}

export interface BehaviorCustomization {
  behavior: string;
  configuration: Record<string, unknown>;
  scope: CustomizationScope;
  enabled: boolean;
}

export interface FeatureToggle {
  feature: string;
  enabled: boolean;
  conditions: ToggleCondition[];
  rolloutPercentage: number;
}

export interface AvatarCustomization {
  property: string;
  value: unknown;
  condition?: string;
}

export interface DomainRedirect {
  from: string;
  to: string;
  type: 'permanent' | 'temporary';
  enabled: boolean;
}

export interface ResourceQuotas {
  cpu: string;
  memory: string;
  storage: string;
  pods: number;
}

export interface NetworkPolicy {
  name: string;
  rules: NetworkPolicyRule[];
  enabled: boolean;
}

export interface SecurityContext {
  runAsUser: number;
  runAsGroup: number;
  capabilities: SecurityCapability[];
  readOnlyRootFilesystem: boolean;
}

export interface AccessCondition {
  type: string;
  operator: string;
  value: unknown;
}

export interface DeletionPolicy {
  automated: boolean;
  retentionPeriod: number;
  confirmationRequired: boolean;
  backupBeforeDeletion: boolean;
}

export interface LifecycleStage {
  name: string;
  duration: number;
  actions: LifecycleAction[];
  conditions: LifecycleCondition[];
}

export interface LifecycleTransition {
  from: string;
  to: string;
  trigger: TransitionTrigger;
  conditions: TransitionCondition[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  schedule: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  enabled: boolean;
}

export interface CustomReport {
  id: string;
  name: string;
  query: ReportQuery;
  visualization: ReportVisualization;
  filters: ReportFilter[];
}

export interface ReportExport {
  id: string;
  reportId: string;
  format: string;
  generatedAt: Date;
  downloadUrl: string;
  expiresAt: Date;
}

export interface DatabaseCredentials {
  username: string;
  password: string;
  connectionString?: string;
}

export interface DatabaseIsolation {
  dedicated: boolean;
  schema: string;
  tablespace?: string;
  encryption: boolean;
}

export interface StorageCredentials {
  accessKey: string;
  secretKey: string;
  sessionToken?: string;
}

export interface StorageEncryption {
  enabled: boolean;
  algorithm: string;
  keyId: string;
}

export interface ComputeResources {
  cpu: string;
  memory: string;
  gpu?: string;
  storage: string;
}

export interface ScalingConfig {
  autoScaling: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory: number;
}

export interface ComputeMonitoring {
  metrics: string[];
  alerts: string[];
  dashboards: string[];
}

export interface LoadBalancerConfig {
  type: string;
  algorithm: string;
  healthCheck: HealthCheckConfig;
  ssl: SSLConfig;
}

export interface DNSConfig {
  zone: string;
  records: DNSRecord[];
  ttl: number;
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  actions: AlertAction[];
  enabled: boolean;
}

export interface DashboardConfig {
  name: string;
  panels: DashboardPanel[];
  layout: DashboardLayout;
  refreshInterval: number;
}

export interface LoggingConfig {
  level: string;
  destinations: LogDestination[];
  retention: number;
  structured: boolean;
}

export interface IsolationViolation {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

export interface AuthenticationMethod {
  type: 'api_key' | 'oauth' | 'jwt' | 'basic' | 'custom';
  configuration: Record<string, unknown>;
}

export interface WorkflowStage {
  id: string;
  name: string;
  type: string;
  configuration: Record<string, unknown>;
  dependencies: string[];
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface AutomationTrigger {
  type: string;
  configuration: Record<string, unknown>;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface AutomationAction {
  type: string;
  configuration: Record<string, unknown>;
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  conditions: WorkflowCondition[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface NotificationFrequency {
  immediate: boolean;
  digest: boolean;
  digestFrequency: string;
}

export interface NotificationWebhook {
  url: string;
  events: string[];
  authentication: AuthenticationMethod;
  enabled: boolean;
}

export interface NotificationType {
  type: string;
  priority: 'low' | 'medium' | 'high';
  channels: string[];
}

export interface NotificationPersistence {
  duration: number;
  dismissible: boolean;
  persistent: boolean;
}

export interface CustomizationCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface CustomizationScope {
  users: string[];
  roles: string[];
  global: boolean;
}

export interface ToggleCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface NetworkPolicyRule {
  direction: 'ingress' | 'egress';
  ports: PortRule[];
  from?: PeerRule[];
  to?: PeerRule[];
}

export interface SecurityCapability {
  action: 'add' | 'drop';
  capability: string;
}

export interface LifecycleAction {
  type: string;
  configuration: Record<string, unknown>;
}

export interface LifecycleCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface TransitionTrigger {
  type: string;
  configuration: Record<string, unknown>;
}

export interface TransitionCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface ReportQuery {
  sql?: string;
  aggregation?: AggregationQuery;
  filters: QueryFilter[];
}

export interface ReportVisualization {
  type: 'chart' | 'table' | 'metric' | 'map';
  configuration: Record<string, unknown>;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface HealthCheckConfig {
  path: string;
  interval: number;
  timeout: number;
  retries: number;
}

export interface SSLConfig {
  enabled: boolean;
  certificate: string;
  privateKey: string;
  protocols: string[];
}

export interface DNSRecord {
  name: string;
  type: string;
  value: string;
  ttl: number;
}

export interface AlertAction {
  type: string;
  configuration: Record<string, unknown>;
}

export interface DashboardPanel {
  id: string;
  type: string;
  configuration: Record<string, unknown>;
  position: PanelPosition;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  responsive: boolean;
}

export interface LogDestination {
  type: string;
  configuration: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: string;
  configuration: Record<string, unknown>;
  dependencies: string[];
}

export interface WorkflowVariable {
  name: string;
  type: string;
  defaultValue: unknown;
}

export interface PortRule {
  port: number;
  protocol: string;
}

export interface PeerRule {
  podSelector?: Record<string, string>;
  namespaceSelector?: Record<string, string>;
  ipBlock?: IPBlockRule;
}

export interface AggregationQuery {
  groupBy: string[];
  metrics: AggregationMetric[];
  timeRange: TimeRange;
}

export interface QueryFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IPBlockRule {
  cidr: string;
  except?: string[];
}

export interface AggregationMetric {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  alias?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: string;
}

// Type guards for runtime validation
export const isTenant = (obj: unknown): obj is Tenant => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'status' in obj &&
    'subscription' in obj
  );
};

export const isTenantConversationContext = (obj: unknown): obj is TenantConversationContext => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'tenantId' in obj &&
    'userId' in obj &&
    'sessionId' in obj
  );
};

export const isAIResponse = (obj: unknown): obj is AIResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'content' in obj &&
    'metadata' in obj &&
    'tenantContext' in obj
  );
};

// Missing interfaces for security and compliance
export interface PerformanceAnalytics {
  responseTime: TimeSeriesData[];
  throughput: TimeSeriesData[];
  errorRates: TimeSeriesData[];
  availability: TimeSeriesData[];
  userExperience: UserExperienceMetrics;
  bottlenecks: PerformanceBottleneck[];
}

export interface CostAnalytics {
  totalCosts: number;
  costBreakdown: CostBreakdown[];
  trends: CostTrend[];
  projections: CostProjection[];
  optimizationOpportunities: CostOptimization[];
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  keyRotationFrequency: number;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  keyManagement: KeyManagementConfig;
}

export interface ComplianceConfig {
  standards: ComplianceStandard[];
  policies: CompliancePolicy[];
  auditing: ComplianceAuditing;
  reporting: ComplianceReporting;
  certifications: ComplianceCertification[];
}

export interface SecurityMonitoring {
  realTimeMonitoring: boolean;
  alertThresholds: SecurityThreshold[];
  incidentResponse: IncidentResponseConfig;
  threatDetection: ThreatDetectionConfig;
  compliance: ComplianceMonitoring;
}

export interface SecurityIncident {
  id: string;
  type: SecurityIncidentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affectedTenants: string[];
  mitigation: string[];
  lessons: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number;
  lockoutThreshold: number;
  lockoutDuration: number;
}

export interface TenantPermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  conditions: PermissionCondition[];
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  rules: AccessPolicyRule[];
  effect: 'allow' | 'deny';
  priority: number;
  enabled: boolean;
}

// Supporting interfaces for the above
export interface UserExperienceMetrics {
  pageLoadTime: number;
  interactionDelay: number;
  errorRate: number;
  satisfactionScore: number;
}

export interface PerformanceBottleneck {
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendation: string;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CostTrend {
  period: string;
  amount: number;
  change: number;
  changePercentage: number;
}

export interface CostProjection {
  period: string;
  projectedCost: number;
  confidence: number;
  assumptions: string[];
}

export interface CostOptimization {
  opportunity: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface KeyManagementConfig {
  provider: 'aws_kms' | 'azure_keyvault' | 'gcp_kms' | 'hashicorp_vault' | 'custom';
  keyRotation: boolean;
  rotationFrequency: number;
  backupStrategy: string;
}

export interface ComplianceStandard {
  name: string;
  version: string;
  description: string;
  requirements: ComplianceRequirement[];
  enabled: boolean;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  enforcement: 'advisory' | 'warning' | 'blocking';
  scope: string[];
}

export interface ComplianceAuditing {
  enabled: boolean;
  frequency: string;
  scope: string[];
  auditors: string[];
  reportingRequirements: string[];
}

export interface ComplianceReporting {
  frequency: string;
  recipients: string[];
  format: string[];
  dashboard: boolean;
  automated: boolean;
}

export interface ComplianceCertification {
  name: string;
  status: 'certified' | 'pending' | 'expired' | 'not_applicable';
  validFrom?: Date;
  validTo?: Date;
  certifyingBody: string;
}

export interface SecurityThreshold {
  metric: string;
  threshold: number;
  condition: 'greater_than' | 'less_than' | 'equals';
  action: 'alert' | 'block' | 'escalate';
}

export interface IncidentResponseConfig {
  enabled: boolean;
  escalationMatrix: EscalationLevel[];
  responseTeam: string[];
  playbooks: IncidentPlaybook[];
  communicationChannels: string[];
}

export interface ThreatDetectionConfig {
  enabled: boolean;
  models: ThreatModel[];
  riskThreshold: number;
  actions: ThreatAction[];
  updateFrequency: string;
}

export interface ComplianceMonitoring {
  enabled: boolean;
  standards: string[];
  frequency: string;
  reporting: boolean;
  alerts: boolean;
}

export type SecurityIncidentType =
  | 'data_breach'
  | 'unauthorized_access'
  | 'malware'
  | 'phishing'
  | 'ddos'
  | 'insider_threat'
  | 'configuration_error'
  | 'compliance_violation';

export interface PermissionCondition {
  type: string;
  operator: string;
  value: unknown;
  resource?: string;
}

export interface AccessPolicyRule {
  id: string;
  condition: PolicyCondition;
  action: 'allow' | 'deny';
  resources: string[];
  principals: string[];
}

export interface PolicyRule {
  condition: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  mandatory: boolean;
  evidence: string[];
  status: 'compliant' | 'non_compliant' | 'not_assessed';
}

export interface EscalationLevel {
  level: number;
  threshold: number;
  contacts: string[];
  actions: string[];
}

export interface IncidentPlaybook {
  id: string;
  incidentType: string;
  steps: PlaybookStep[];
  roles: string[];
  timeouts: number[];
}

export interface ThreatModel {
  id: string;
  name: string;
  description: string;
  indicators: ThreatIndicator[];
  riskScore: number;
}

export interface ThreatAction {
  trigger: string;
  action: 'alert' | 'block' | 'isolate' | 'investigate';
  automated: boolean;
  escalation: boolean;
}

export interface PolicyCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface PlaybookStep {
  id: string;
  description: string;
  action: string;
  timeout: number;
  required: boolean;
}

export interface ThreatIndicator {
  type: string;
  value: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Supporting interfaces for conversation management
export interface ConversationCustomization {
  theme: string;
  language: string;
  personalizations: PersonalizationSetting[];
  preferences: ConversationPreference[];
}

export interface PersonalizationSetting {
  key: string;
  value: unknown;
  scope: 'user' | 'session' | 'global';
}

export interface ConversationPreference {
  name: string;
  value: unknown;
  type: 'boolean' | 'string' | 'number' | 'object';
}

// Supporting interfaces that were referenced but not defined
export interface AnalyticsManager {
  generateReport(tenantId: string, type: string, period: BillingPeriod): Promise<AnalyticsReport>;
  trackUsage(tenantId: string, usage: UsageData): Promise<void>;
  getInsights(tenantId: string): Promise<AnalyticsInsights>;
  exportData(tenantId: string, format: string): Promise<string>;
}

export interface SecurityManager {
  validateAccess(tenantId: string, userId: string, resource: string): Promise<boolean>;
  auditAction(tenantId: string, action: AuditAction): Promise<void>;
  detectThreats(tenantId: string, data: unknown): Promise<ThreatAssessment>;
  enforcePolicy(tenantId: string, policy: string): Promise<PolicyEnforcement>;
}

export interface AnalyticsReport {
  id: string;
  type: string;
  tenantId: string;
  period: BillingPeriod;
  data: AnalyticsData;
  insights: AnalyticsInsights;
  generatedAt: Date;
}

export interface UsageData {
  timestamp: Date;
  metric: string;
  value: number;
  metadata: Record<string, unknown>;
}

export interface AuditAction {
  action: string;
  resource: string;
  userId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface ThreatAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: DetectedThreat[];
  recommendations: string[];
  confidence: number;
}

export interface PolicyEnforcement {
  enforced: boolean;
  violations: PolicyViolation[];
  actions: EnforcementAction[];
  timestamp: Date;
}

export interface AnalyticsData {
  metrics: Record<string, number>;
  timeSeries: TimeSeriesData[];
  breakdowns: DataBreakdown[];
  comparisons: DataComparison[];
}

export interface DetectedThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: unknown[];
  mitigation: string;
}

export interface PolicyViolation {
  policy: string;
  violation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: unknown[];
}

export interface EnforcementAction {
  action: string;
  target: string;
  timestamp: Date;
  result: string;
}

export interface DataBreakdown {
  dimension: string;
  values: Record<string, number>;
}

export interface DataComparison {
  baseline: number;
  current: number;
  change: number;
  changePercentage: number;
  significance: 'low' | 'medium' | 'high';
}
