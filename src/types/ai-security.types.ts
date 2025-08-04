// Re-export all types from AISecurityService for external use
export type {
  AISecurityConfig,
  ComplianceStandard,
  AIAuditLog,
  AIAction,
  AIRequestData,
  AIResponseData,
  SecurityAnalysis,
  PIIEntity,
  PIIType,
  ContentFlag,
  ContentFlagType,
  ModerationResult,
  DataClassification,
  SecurityAnomaly,
  AccessControlCheck,
  DataIntegrityCheck,
  ModificationRecord,
  EncryptionStatus,
  GeoLocation,
  ComplianceFlag,
  ComplianceReport,
  ComplianceSummary,
  ComplianceFinding,
  ComplianceRecommendation,
} from '@/services/AISecurityService'

// Import types for type guards
import type { PIIEntity, ComplianceFlag } from '@/services/AISecurityService'

// Additional security utility types
export interface SecurityContext {
  userId: string
  sessionId: string;
  organizationId: string;
  permissions: string[];
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface SecurityValidationResult {
  isValid: boolean;
  violations: SecurityViolation[];
  warnings: SecurityWarning[];
  recommendations: string[];
  riskScore: number;
}

export interface SecurityViolation {
  type: 'access_denied' | 'data_leak' | 'policy_violation' | 'compliance_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: Record<string, unknown>;
  remediation: string;
  reportable: boolean;
}

export interface SecurityWarning {
  type: 'unusual_activity' | 'potential_risk' | 'policy_reminder' | 'best_practice';
  message: string;
  actionRequired: boolean;
  deadline?: Date;
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-128-GCM';
  keyDerivationFunction: 'PBKDF2' | 'Argon2' | 'scrypt';
  saltLength: number;
  iterations: number;
  keyRotationInterval: number; // days
}

export interface AuditTrailConfig {
  enabled: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  retentionPeriodDays: number;
  archivalEnabled: boolean;
  realTimeAlerts: boolean;
  exportFormats: ('json' | 'csv' | 'xml' | 'parquet')[];
}

export interface ComplianceFramework {
  name: string;
  version: string;
  applicableRegions: string[];
  requirements: ComplianceRequirement[];
  assessmentFrequency: 'monthly' | 'quarterly' | 'annually';
  certificationRequired: boolean;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  evidence: string[];
  validationMethod: 'automated' | 'manual' | 'hybrid';
  lastAssessed?: Date;
  status: 'compliant' | 'non_compliant' | 'not_assessed' | 'in_progress';
}

export interface DataGovernancePolicy {
  id: string;
  name: string;
  scope: string[];
  dataTypes: string[];
  accessControls: AccessControl[];
  retentionRules: RetentionRule[];
  processingRestrictions: ProcessingRestriction[];
  transferRestrictions: TransferRestriction[];
  breachNotificationRules: BreachNotificationRule[];
}

export interface AccessControl {
  role: string;
  permissions: string[];
  conditions: AccessCondition[];
  timeRestrictions?: TimeRestriction;
  locationRestrictions?: LocationRestriction[];
}

export interface AccessCondition {
  type: 'user_attribute' | 'context' | 'data_classification' | 'time_based';
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface TimeRestriction {
  allowedHours: { start: number; end: number }[]; // 24-hour format
  allowedDays: number[]; // 0-6, Sunday-Saturday
  timezone: string;
}

export interface LocationRestriction {
  type: 'country' | 'region' | 'ip_range' | 'geofence';
  value: string;
  allowed: boolean;
}

export interface RetentionRule {
  dataType: string;
  retentionPeriodDays: number;
  deleteAfterRetention: boolean;
  archiveBeforeDelete: boolean;
  legalHoldExemption: boolean;
}

export interface ProcessingRestriction {
  purpose: string;
  allowedProcessing: string[];
  prohibitedProcessing: string[];
  consentRequired: boolean;
  legitimateInterestBasis?: string;
}

export interface TransferRestriction {
  destinationCountries: string[];
  adequacyDecisionRequired: boolean;
  safeguardsRequired: string[];
  dataSubjectConsent: boolean;
}

export interface BreachNotificationRule {
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationTimelineHours: number;
  recipientRoles: string[];
  externalNotificationRequired: boolean;
  regulatoryReportingRequired: boolean;
}

export interface PrivacyImpactAssessment {
  id: string;
  title: string;
  description: string;
  scope: string;
  dataTypes: string[];
  processingPurposes: string[];
  legalBasis: string[];
  riskAssessment: PrivacyRiskAssessment;
  safeguards: PrivacySafeguard[];
  consultationRequired: boolean;
  approvalRequired: boolean;
  reviewDate: Date;
  status: 'draft' | 'under_review' | 'approved' | 'rejected';
}

export interface PrivacyRiskAssessment {
  identifiedRisks: PrivacyRisk[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskMitigationMeasures: string[];
  residualRiskLevel: 'low' | 'medium' | 'high' | 'very_high';
}

export interface PrivacyRisk {
  id: string;
  description: string;
  category:
    | 'unlawful_processing'
    | 'excessive_collection'
    | 'unauthorized_access'
    | 'data_quality'
    | 'transparency';
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  affectedDataSubjects: string[];
}

export interface PrivacySafeguard {
  id: string;
  type: 'technical' | 'organizational' | 'legal';
  description: string;
  implementation: string;
  effectiveness: 'low' | 'medium' | 'high';
  verificationMethod: string;
}

// Security event types for real-time monitoring
export interface SecurityEvent {
  id: string
  timestamp: Date;
  type: SecurityEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export type SecurityEventType =
  | 'authentication_failure'
  | 'authorization_violation'
  | 'data_access_anomaly'
  | 'pii_exposure'
  | 'encryption_failure'
  | 'audit_log_tampering'
  | 'compliance_violation'
  | 'security_policy_violation'
  | 'suspicious_activity'
  | 'data_exfiltration_attempt';

// Configuration for security monitoring
export interface SecurityMonitoringConfig {
  realTimeMonitoring: boolean
  anomalyDetection: boolean;
  alertThresholds: SecurityAlertThresholds;
  notificationChannels: NotificationChannel[];
  responseActions: ResponseAction[];
  escalationRules: EscalationRule[];
}

export interface SecurityAlertThresholds {
  failedAuthenticationAttempts: number;
  unusualDataAccess: number;
  piiExposureInstances: number;
  complianceViolations: number;
  suspiciousActivityScore: number;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  configuration: Record<string, string>;
  enabled: boolean;
  severity: ('info' | 'warning' | 'error' | 'critical')[];
}

export interface ResponseAction {
  trigger: SecurityEventType;
  action: 'log' | 'alert' | 'block' | 'quarantine' | 'escalate';
  automatic: boolean;
  configuration: Record<string, unknown>;
}

export interface EscalationRule {
  condition: string;
  escalationLevel: number;
  timeoutMinutes: number;
  recipients: string[];
  automaticActions: string[];
}

// Utility types for security operations
export interface SecureDataContainer<T> {
  data: T
  encrypted: boolean;
  encryptionMetadata?: {
    algorithm: string;
    keyId: string;
    timestamp: Date;
  }
  integrity: {
    hash: string;
    algorithm: string;
    verified: boolean;
    lastVerified: Date;
  }
  access: {
    lastAccessed: Date;
    accessCount: number;
    accessedBy: string[];
  }
}

export interface SecurityValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  configuration: Record<string, unknown>;
  lastUpdated: Date;
  validationFunction: (_data: unknown, context: SecurityContext) => SecurityValidationResult;
}

// Type guards for runtime validation
export const isSecurityEvent = (obj: unknown): obj is SecurityEvent => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'timestamp' in obj &&
    'type' in obj &&
    'severity' in obj
  )
}

export const isPIIEntity = (obj: unknown): obj is PIIEntity => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'value' in obj &&
    'confidence' in obj
  );
}

export const isComplianceFlag = (obj: unknown): obj is ComplianceFlag => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'standard' in obj &&
    'requirement' in obj &&
    'status' in obj
  );
}
