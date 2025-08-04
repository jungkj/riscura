export interface SecurityConfiguration {
  id: string;
  organizationId: string;
  encryptionConfig: EncryptionConfiguration;
  ssoConfig: SSOConfiguration;
  auditConfig: AuditConfiguration;
  dlpConfig: DLPConfiguration;
  threatConfig: ThreatDetectionConfiguration;
  complianceConfig: ComplianceConfiguration;
  accessConfig: AccessControlConfiguration;
  incidentConfig: IncidentResponseConfiguration;
  isActive: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

export interface EncryptionConfiguration {
  dataAtRest: {
    enabled: boolean;
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    keyRotationDays: number;
    keyManagement: 'internal' | 'hsm' | 'cloud_kms';
    backupEncryption: boolean;
  }
  dataInTransit: {
    enforceHTTPS: boolean;
    tlsVersion: '1.2' | '1.3';
    certificateValidation: boolean;
    hsts: boolean;
    cipherSuites: string[];
  }
  fieldLevelEncryption: {
    enabled: boolean;
    encryptedFields: string[];
    searchableEncryption: boolean;
  }
}

export interface SSOConfiguration {
  enabled: boolean;
  providers: SSOProvider[];
  defaultProvider?: string;
  autoProvisioning: boolean;
  attributeMapping: Record<string, string>;
  roleMapping: Record<string, string>;
  sessionTimeout: number;
  enforceSSO: boolean;
  fallbackToLocal: boolean;
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth2' | 'ldap';
  enabled: boolean;
  configuration: SAMLConfig | OIDCConfig | OAuth2Config | LDAPConfig;
  domainRestrictions?: string[];
  metadata?: Record<string, any>;
}

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  certificate: string;
  signatureAlgorithm: string;
  digestAlgorithm: string;
  nameIdFormat: string;
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
}

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  responseType: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
}

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export interface LDAPConfig {
  server: string;
  port: number;
  bindDN: string;
  bindPassword: string;
  baseDN: string;
  userFilter: string;
  groupFilter: string;
  attributes: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    groups: string;
  }
  ssl: boolean;
  startTLS: boolean;
}

export interface AuditConfiguration {
  enabled: boolean;
  retentionDays: number;
  logLevel: 'minimal' | 'standard' | 'comprehensive' | 'debug';
  eventTypes: AuditEventType[];
  destinations: AuditDestination[];
  realTimeAlerting: boolean;
  integrityProtection: boolean;
  siemIntegration: SIEMIntegration;
}

export interface AuditEventType {
  category:
    | 'authentication'
    | 'authorization'
    | 'data_access'
    | 'data_modification'
    | 'system_access'
    | 'configuration_change'
    | 'security_event';
  actions: string[];
  includeDetails: boolean;
  sensitive: boolean;
}

export interface AuditDestination {
  type: 'database' | 'file' | 'syslog' | 'webhook' | 'siem';
  configuration: Record<string, any>;
  enabled: boolean;
  format: 'json' | 'cef' | 'leef' | 'csv';
  encryption: boolean;
}

export interface SIEMIntegration {
  enabled: boolean;
  provider: 'splunk' | 'elastic' | 'qradar' | 'sentinel' | 'sumo_logic' | 'custom';
  endpoint: string;
  authentication: Record<string, any>;
  batchSize: number;
  flushInterval: number;
  filters: string[];
}

export interface DLPConfiguration {
  enabled: boolean;
  policies: DLPPolicy[];
  defaultAction: 'allow' | 'block' | 'warn' | 'quarantine';
  alertOnViolation: boolean;
  blockOnViolation: boolean;
  reportingEnabled: boolean;
}

export interface DLPPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  rules: DLPRule[];
  actions: DLPAction[];
  scope: DLPScope;
  exemptions: DLPExemption[];
}

export interface DLPRule {
  id: string;
  name: string;
  type:
    | 'pattern'
    | 'keyword'
    | 'document_classifier'
    | 'data_identifier'
    | 'file_type'
    | 'content_analysis';
  pattern?: string;
  keywords?: string[];
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  context?: string[];
}

export interface DLPAction {
  type:
    | 'log'
    | 'alert'
    | 'block'
    | 'encrypt'
    | 'watermark'
    | 'quarantine'
    | 'notify_admin'
    | 'notify_user';
  parameters?: Record<string, any>;
}

export interface DLPScope {
  dataTypes: string[];
  locations: string[];
  users: string[];
  applications: string[];
  excludeLocations?: string[];
  excludeUsers?: string[];
}

export interface DLPExemption {
  type: 'user' | 'group' | 'application' | 'ip_range' | 'time_window';
  value: string;
  reason: string;
  expiresAt?: Date;
}

export interface ThreatDetectionConfiguration {
  enabled: boolean;
  anomalyDetection: AnomalyDetectionConfig;
  behaviorAnalysis: BehaviorAnalysisConfig;
  threatIntelligence: ThreatIntelligenceConfig;
  automatedResponse: AutomatedResponseConfig;
  monitoring: SecurityMonitoringConfig;
}

export interface AnomalyDetectionConfig {
  enabled: boolean;
  algorithms: (
    | 'isolation_forest'
    | 'one_class_svm'
    | 'local_outlier_factor'
    | 'gaussian_mixture'
  )[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  learningPeriodDays: number;
  alertThreshold: number;
  features: string[];
  excludeUsers?: string[];
}

export interface BehaviorAnalysisConfig {
  enabled: boolean;
  profileBuilding: {
    enabled: boolean;
    buildingPeriodDays: number;
    updateFrequency: 'daily' | 'weekly' | 'monthly';
  }
  riskScoring: {
    enabled: boolean;
    factors: BehaviorRiskFactor[];
    thresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    }
  }
  patterns: BehaviorPattern[];
}

export interface BehaviorRiskFactor {
  factor:
    | 'login_time'
    | 'login_location'
    | 'access_pattern'
    | 'data_volume'
    | 'failed_attempts'
    | 'privilege_escalation';
  weight: number;
  enabled: boolean;
}

export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
}

export interface ThreatIntelligenceConfig {
  enabled: boolean;
  feeds: ThreatIntelligenceFeed[];
  updateFrequency: number;
  iopReputationCheck: boolean;
  malwareDetection: boolean;
  phishingDetection: boolean;
}

export interface ThreatIntelligenceFeed {
  id: string;
  name: string;
  type:
    | 'ip_reputation'
    | 'domain_reputation'
    | 'malware_signatures'
    | 'phishing_urls'
    | 'threat_actors';
  url: string;
  format: 'stix' | 'misp' | 'json' | 'csv' | 'xml';
  authentication?: Record<string, any>;
  enabled: boolean;
  lastUpdated?: Date;
}

export interface AutomatedResponseConfig {
  enabled: boolean;
  rules: AutomatedResponseRule[];
  cooldownPeriod: number;
  maxActionsPerHour: number;
  requireApproval: boolean;
  notificationSettings: {
    immediateAlert: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
  }
}

export interface AutomatedResponseRule {
  id: string;
  name: string;
  triggerConditions: ResponseTrigger[];
  actions: ResponseAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  priority: number;
}

export interface ResponseTrigger {
  type:
    | 'threat_score'
    | 'anomaly_detected'
    | 'policy_violation'
    | 'failed_login_threshold'
    | 'suspicious_activity';
  condition: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches';
  value: any;
  timeWindow?: number;
}

export interface ResponseAction {
  type:
    | 'block_ip'
    | 'suspend_user'
    | 'force_logout'
    | 'require_mfa'
    | 'alert_admin'
    | 'quarantine_device'
    | 'increase_monitoring';
  parameters?: Record<string, any>;
  duration?: number;
  reversible: boolean;
}

export interface SecurityMonitoringConfig {
  enabled: boolean;
  dashboards: SecurityDashboard[];
  alerts: SecurityAlert[];
  reports: SecurityReport[];
  metrics: SecurityMetric[];
}

export interface SecurityDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  permissions: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'map' | 'gauge' | 'alert_summary';
  title: string;
  configuration: Record<string, any>;
  position: { x: number; y: number; width: number; height: number }
}

export interface SecurityAlert {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  suppressionRules?: SuppressionRule[];
}

export interface AlertCondition {
  metric: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  timeWindow: number;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'pagerduty' | 'jira';
  configuration: Record<string, any>;
  escalationDelay?: number;
}

export interface SuppressionRule {
  field: string;
  value: string;
  duration: number;
  reason: string;
}

export interface SecurityReport {
  id: string;
  name: string;
  type:
    | 'compliance'
    | 'threat_summary'
    | 'user_activity'
    | 'incident_report'
    | 'vulnerability_assessment';
  schedule: ReportSchedule;
  format: 'pdf' | 'html' | 'json' | 'csv';
  recipients: string[];
  parameters: Record<string, any>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}

export interface SecurityMetric {
  id: string;
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  unit: string;
  tags: Record<string, string>;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface ComplianceConfiguration {
  frameworks: ComplianceFramework[];
  assessments: ComplianceAssessment[];
  certifications: ComplianceCertification[];
  auditPreparation: AuditPreparation;
  dataRetention: DataRetentionPolicy;
  privacySettings: PrivacyConfiguration;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  type: 'soc2' | 'iso27001' | 'gdpr' | 'hipaa' | 'pci_dss' | 'nist' | 'cis' | 'custom';
  enabled: boolean;
  controls: ComplianceControl[];
  requirements: ComplianceRequirement[];
  lastAssessment?: Date;
  nextAssessment?: Date;
  status: 'not_started' | 'in_progress' | 'compliant' | 'non_compliant' | 'partially_compliant';
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  implementation: ControlImplementation;
  evidence: ControlEvidence[];
  testing: ControlTesting;
  status: 'implemented' | 'partially_implemented' | 'not_implemented' | 'not_applicable';
}

export interface ControlImplementation {
  type: 'manual' | 'automated' | 'hybrid';
  responsible: string;
  implementation_date?: Date;
  review_frequency: 'monthly' | 'quarterly' | 'annually';
  next_review?: Date;
  procedures: string[];
  tools: string[];
}

export interface ControlEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log_file' | 'configuration' | 'test_result';
  name: string;
  description: string;
  file_path?: string;
  collected_date: Date;
  collected_by: string;
  retention_period: number;
}

export interface ControlTesting {
  frequency: 'monthly' | 'quarterly' | 'annually';
  method: 'automated' | 'manual' | 'sampling';
  last_test_date?: Date;
  next_test_date?: Date;
  test_results: TestResult[];
}

export interface TestResult {
  date: Date;
  tester: string;
  result: 'pass' | 'fail' | 'not_applicable' | 'inconclusive';
  findings: string[];
  recommendations: string[];
  evidence_collected: string[];
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
  controls: string[];
  evidence_required: string[];
  compliance_score: number;
}

export interface ComplianceAssessment {
  id: string;
  framework_id: string;
  name: string;
  type: 'self_assessment' | 'third_party' | 'certification_audit';
  status: 'planning' | 'in_progress' | 'completed' | 'remediation';
  start_date: Date;
  end_date?: Date;
  assessor: string;
  scope: string[];
  findings: AssessmentFinding[];
  overall_score: number;
  certification_status?: 'certified' | 'conditional' | 'not_certified';
}

export interface AssessmentFinding {
  id: string;
  control_id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  remediation_plan?: RemediationPlan;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

export interface RemediationPlan {
  owner: string;
  target_date: Date;
  steps: RemediationStep[];
  cost_estimate?: number;
  risk_if_not_remediated: string;
}

export interface RemediationStep {
  step_number: number;
  description: string;
  responsible: string;
  target_date: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  evidence?: string[];
}

export interface ComplianceCertification {
  id: string;
  framework_id: string;
  certification_body: string;
  certificate_number?: string;
  issue_date?: Date;
  expiry_date?: Date;
  scope: string;
  status: 'pursuing' | 'certified' | 'expired' | 'suspended' | 'withdrawn';
  renewal_process?: RenewalProcess;
  surveillance_audits: SurveillanceAudit[];
}

export interface RenewalProcess {
  start_date: Date;
  submission_deadline: Date;
  audit_scheduled?: Date;
  status:
    | 'not_started'
    | 'documentation'
    | 'audit_scheduled'
    | 'audit_complete'
    | 'decision_pending';
  tasks: RenewalTask[];
}

export interface RenewalTask {
  id: string;
  name: string;
  description: string;
  responsible: string;
  due_date: Date;
  status: 'pending' | 'in_progress' | 'completed';
  dependencies: string[];
}

export interface SurveillanceAudit {
  id: string;
  scheduled_date: Date;
  actual_date?: Date;
  auditor: string;
  scope: string[];
  findings: AssessmentFinding[];
  outcome:
    | 'satisfactory'
    | 'minor_nonconformities'
    | 'major_nonconformities'
    | 'certificate_suspended';
}

export interface AuditPreparation {
  enabled: boolean;
  automated_evidence_collection: boolean;
  control_testing_automation: boolean;
  document_management: {
    central_repository: boolean;
    version_control: boolean;
    access_controls: boolean;
    retention_policies: boolean;
  }
  audit_trails: {
    comprehensive_logging: boolean;
    tamper_evidence: boolean;
    long_term_retention: boolean;
    search_capabilities: boolean;
  }
}

export interface DataRetentionPolicy {
  enabled: boolean;
  default_retention_period: number;
  category_policies: CategoryRetentionPolicy[];
  legal_holds: LegalHold[];
  purging_schedule: PurgingSchedule;
  exceptions: RetentionException[];
}

export interface CategoryRetentionPolicy {
  category:
    | 'audit_logs'
    | 'user_data'
    | 'financial_records'
    | 'communication'
    | 'system_logs'
    | 'backups'
    | 'session_data';
  retention_period: number;
  archive_after: number;
  purge_method: 'secure_delete' | 'cryptographic_erasure' | 'physical_destruction';
  legal_requirements: string[];
  business_justification: string;
}

export interface LegalHold {
  id: string;
  name: string;
  description: string;
  matter: string;
  custodians: string[];
  data_sources: string[];
  keywords: string[];
  date_range: { start: Date; end?: Date }
  status: 'active' | 'released' | 'expired';
  created_by: string;
  created_date: Date;
  released_date?: Date;
}

export interface PurgingSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  batch_size: number;
  verification_required: boolean;
  notification_settings: {
    before_purge: boolean;
    after_purge: boolean;
    failure_alert: boolean;
  }
}

export interface RetentionException {
  id: string;
  type: 'extend' | 'exempt' | 'immediate_purge';
  reason: string;
  applies_to: string[];
  approved_by: string;
  approval_date: Date;
  expiry_date?: Date;
}

export interface PrivacyConfiguration {
  enabled: boolean;
  data_classification: DataClassification;
  consent_management: ConsentManagement;
  subject_rights: SubjectRights;
  privacy_by_design: boolean;
  impact_assessments: PrivacyImpactAssessment[];
  breach_notification: BreachNotificationSettings;
}

export interface DataClassification {
  enabled: boolean;
  classification_levels: ClassificationLevel[];
  auto_classification: boolean;
  user_classification: boolean;
  review_frequency: 'monthly' | 'quarterly' | 'annually';
}

export interface ClassificationLevel {
  level: 'public' | 'internal' | 'confidential' | 'restricted' | 'personal' | 'sensitive_personal';
  label: string;
  description: string;
  handling_requirements: string[];
  access_restrictions: string[];
  retention_period?: number;
}

export interface ConsentManagement {
  enabled: boolean;
  granular_consent: boolean;
  consent_withdrawal: boolean;
  consent_history: boolean;
  double_opt_in: boolean;
  age_verification: boolean;
  parental_consent: boolean;
}

export interface SubjectRights {
  access_request: boolean;
  rectification: boolean;
  erasure: boolean;
  portability: boolean;
  restriction: boolean;
  objection: boolean;
  automated_processing_opt_out: boolean;
  response_time_days: number;
  identity_verification: boolean;
}

export interface PrivacyImpactAssessment {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conducted_by: string;
  date_conducted: Date;
  review_date: Date;
  risk_score: number;
  mitigations: string[];
  approval_status: 'approved' | 'pending' | 'rejected' | 'needs_revision';
  dpo_review: boolean;
}

export interface BreachNotificationSettings {
  enabled: boolean;
  detection_automation: boolean;
  notification_timeline: {
    internal_notification_hours: number;
    regulator_notification_hours: number;
    subject_notification_hours: number;
  }
  notification_templates: NotificationTemplate[];
  escalation_procedures: EscalationProcedure[];
}

export interface NotificationTemplate {
  type: 'internal' | 'regulator' | 'data_subject' | 'media';
  subject: string;
  content: string;
  required_fields: string[];
  approval_required: boolean;
}

export interface EscalationProcedure {
  trigger: string;
  level: number;
  responsible: string;
  timeline: number;
  actions: string[];
}

export interface AccessControlConfiguration {
  enabled: boolean;
  ipWhitelisting: IPWhitelistingConfig;
  geoRestrictions: GeoRestrictionConfig;
  deviceTrust: DeviceTrustConfig;
  sessionManagement: SessionManagementConfig;
  privilegedAccess: PrivilegedAccessConfig;
}

export interface IPWhitelistingConfig {
  enabled: boolean;
  mode: 'allow_list' | 'block_list' | 'hybrid';
  rules: IPRule[];
  defaultAction: 'allow' | 'deny';
  logViolations: boolean;
  alertOnViolation: boolean;
}

export interface IPRule {
  id: string;
  name: string;
  ipRange: string;
  action: 'allow' | 'deny';
  priority: number;
  comment?: string;
  expiresAt?: Date;
  appliesTo: 'all' | 'users' | 'admins' | 'api';
}

export interface GeoRestrictionConfig {
  enabled: boolean;
  mode: 'allow_countries' | 'block_countries';
  countries: string[];
  vpnDetection: boolean;
  torDetection: boolean;
  proxyDetection: boolean;
  actions: {
    block: boolean;
    requireAdditionalAuth: boolean;
    logOnly: boolean;
    alertAdmin: boolean;
  }
}

export interface DeviceTrustConfig {
  enabled: boolean;
  deviceRegistration: boolean;
  deviceFingerprinting: boolean;
  trustedDeviceExpiry: number;
  mobileDeviceManagement: boolean;
  jailbreakDetection: boolean;
  complianceChecks: string[];
}

export interface SessionManagementConfig {
  maxConcurrentSessions: number;
  sessionTimeout: number;
  idleTimeout: number;
  absoluteTimeout: number;
  forceLogoutOnSuspiciousActivity: boolean;
  sessionBinding: boolean;
  tokenRotation: boolean;
}

export interface PrivilegedAccessConfig {
  enabled: boolean;
  justInTimeAccess: boolean;
  sessionRecording: boolean;
  commandLogging: boolean;
  approvalRequired: boolean;
  maxSessionDuration: number;
  emergencyAccess: EmergencyAccessConfig;
}

export interface EmergencyAccessConfig {
  enabled: boolean;
  breakGlassUsers: string[];
  approvalRequired: boolean;
  auditingLevel: 'comprehensive';
  autoRevocation: number;
  reasonRequired: boolean;
}

export interface IncidentResponseConfiguration {
  enabled: boolean;
  playbooks: IncidentPlaybook[];
  automationRules: IncidentAutomationRule[];
  escalationMatrix: EscalationMatrix;
  communication: IncidentCommunicationConfig;
  forensics: ForensicsConfig;
}

export interface IncidentPlaybook {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: PlaybookStep[];
  roles: string[];
  estimatedDuration: number;
  lastUpdated: Date;
}

export interface PlaybookStep {
  stepNumber: number;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'decision';
  responsible: string;
  maxDuration: number;
  automationScript?: string;
  successCriteria: string[];
  failureHandling: string;
}

export interface IncidentAutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cooldownPeriod: number;
}

export interface AutomationTrigger {
  type: 'alert' | 'threshold' | 'pattern' | 'time_based' | 'external_event';
  configuration: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationAction {
  type:
    | 'isolate_system'
    | 'block_user'
    | 'collect_evidence'
    | 'notify_team'
    | 'create_ticket'
    | 'run_script';
  parameters: Record<string, any>;
  timeout: number;
  retryAttempts: number;
}

export interface EscalationMatrix {
  levels: EscalationLevel[];
  timeouts: number[];
  notificationMethods: string[];
  overrideContacts: EscalationContact[];
}

export interface EscalationLevel {
  level: number;
  name: string;
  contacts: EscalationContact[];
  timeout: number;
  autoEscalate: boolean;
}

export interface EscalationContact {
  type: 'user' | 'group' | 'external';
  identifier: string;
  methods: ('email' | 'sms' | 'phone' | 'slack' | 'teams')[];
  priority: number;
}

export interface IncidentCommunicationConfig {
  statusPageIntegration: boolean;
  customerNotification: boolean;
  mediaResponse: boolean;
  regulatoryNotification: boolean;
  internalCommunication: {
    channels: string[];
    updateFrequency: number;
    escalationCriteria: string[];
  }
}

export interface ForensicsConfig {
  enabled: boolean;
  automaticEvidence: boolean;
  evidenceTypes: string[];
  chainOfCustody: boolean;
  forensicTools: string[];
  expertContacts: string[];
  legalConsiderations: string[];
}

// Event and Audit Types
export interface SecurityAuditEvent {
  id: string
  timestamp: Date;
  organizationId: string;
  userId?: string;
  sessionId?: string;
  eventType: string;
  category:
    | 'authentication'
    | 'authorization'
    | 'data_access'
    | 'data_modification'
    | 'system_access'
    | 'configuration_change'
    | 'security_event';
  action: string;
  resource?: string;
  resourceId?: string;
  source: {
    ip: string;
    userAgent?: string;
    location?: GeoLocation;
    device?: DeviceInfo;
  }
  outcome: 'success' | 'failure' | 'partial';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  risk_score?: number;
  correlationId?: string;
  tags: string[];
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  vpn: boolean;
  tor: boolean;
  proxy: boolean;
}

export interface DeviceInfo {
  deviceId?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'server' | 'unknown';
  os: string;
  browser?: string;
  trusted: boolean;
  managed: boolean;
  compliant: boolean;
  fingerprint?: string;
}

export interface SecurityIncident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type:
    | 'data_breach'
    | 'unauthorized_access'
    | 'malware'
    | 'phishing'
    | 'ddos'
    | 'insider_threat'
    | 'policy_violation'
    | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status:
    | 'new'
    | 'investigating'
    | 'contained'
    | 'eradicated'
    | 'recovery'
    | 'closed'
    | 'false_positive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  reportedBy: string;
  discoveredAt: Date;
  reportedAt: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  impact: IncidentImpact;
  timeline: IncidentTimelineEntry[];
  evidence: IncidentEvidence[];
  artifacts: IncidentArtifact[];
  indicators: ThreatIndicator[];
  playbook?: string;
  lessons_learned?: string;
  post_incident_actions?: string[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface IncidentImpact {
  confidentiality: 'none' | 'low' | 'medium' | 'high';
  integrity: 'none' | 'low' | 'medium' | 'high';
  availability: 'none' | 'low' | 'medium' | 'high';
  affectedUsers: number;
  affectedSystems: string[];
  dataTypes: string[];
  businessImpact: string;
  financialImpact?: number;
  reputationalImpact: 'none' | 'low' | 'medium' | 'high';
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  description: string;
  evidence?: string[];
  automated: boolean;
}

export interface IncidentEvidence {
  id: string;
  type:
    | 'log'
    | 'screenshot'
    | 'file'
    | 'network_capture'
    | 'memory_dump'
    | 'disk_image'
    | 'witness_statement';
  name: string;
  description: string;
  collectedBy: string;
  collectedAt: Date;
  hash?: string;
  size?: number;
  location: string;
  chainOfCustody: ChainOfCustodyEntry[];
}

export interface ChainOfCustodyEntry {
  timestamp: Date;
  action: 'collected' | 'transferred' | 'analyzed' | 'stored' | 'returned' | 'destroyed';
  person: string;
  location: string;
  reason: string;
  hash?: string;
}

export interface IncidentArtifact {
  id: string;
  type: 'ioc' | 'ttp' | 'tool' | 'vulnerability' | 'malware_sample';
  value: string;
  description: string;
  confidence: number;
  tlp: 'white' | 'green' | 'amber' | 'red';
  source: string;
  tags: string[];
}

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'registry_key' | 'mutex' | 'user_agent';
  value: string;
  description: string;
  confidence: number;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  first_seen: Date;
  last_seen: Date;
  source: string;
  tags: string[];
  kill_chain_phases: string[];
  mitre_tactics: string[];
  mitre_techniques: string[];
}

export interface ThreatHunting {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  techniques: string[];
  data_sources: string[];
  queries: HuntingQuery[];
  findings: HuntingFinding[];
  status: 'planning' | 'active' | 'completed' | 'paused';
  hunter: string;
  started_at: Date;
  completed_at?: Date;
  tags: string[];
}

export interface HuntingQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  query_language: 'sql' | 'kql' | 'spl' | 'sigma' | 'yara';
  data_source: string;
  expected_results: string;
  execution_time?: Date;
  results_count?: number;
}

export interface HuntingFinding {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  false_positive_probability: number;
  evidence: string[];
  recommendations: string[];
  indicators: ThreatIndicator[];
  mitre_mappings: string[];
}

// AI Security Types
export interface AISecurityConfiguration {
  enabled: boolean
  modelSecurity: ModelSecurityConfig;
  dataGovernance: DataGovernanceConfig;
  privacyPreserving: PrivacyPreservingConfig;
  biasDetection: BiasDetectionConfig;
  explainability: ExplainabilityConfig;
  adversarialProtection: AdversarialProtectionConfig;
}

export interface ModelSecurityConfig {
  modelValidation: boolean;
  inputValidation: boolean;
  outputSanitization: boolean;
  modelVersioning: boolean;
  modelEncryption: boolean;
  accessControls: ModelAccessControl[];
  auditLogging: boolean;
}

export interface ModelAccessControl {
  modelId: string;
  permissions: string[];
  users: string[];
  groups: string[];
  conditions: AccessCondition[];
}

export interface AccessCondition {
  type: 'time_window' | 'ip_range' | 'usage_quota' | 'purpose_limitation';
  value: any;
}

export interface DataGovernanceConfig {
  dataLineage: boolean;
  dataQuality: DataQualityConfig;
  dataClassification: boolean;
  consentTracking: boolean;
  retentionPolicies: DataRetentionRule[];
  accessLogging: boolean;
}

export interface DataQualityConfig {
  qualityChecks: QualityCheck[];
  automatedValidation: boolean;
  qualityMetrics: string[];
  alertThresholds: Record<string, number>;
}

export interface QualityCheck {
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness';
  rule: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
}

export interface DataRetentionRule {
  dataType: string;
  retentionPeriod: number;
  purgeMethod: string;
  exceptions: string[];
}

export interface PrivacyPreservingConfig {
  differentialPrivacy: DifferentialPrivacyConfig;
  federatedLearning: FederatedLearningConfig;
  homomorphicEncryption: boolean;
  secureMultipartyComputation: boolean;
  dataMinimization: boolean;
}

export interface DifferentialPrivacyConfig {
  enabled: boolean;
  epsilon: number;
  delta: number;
  mechanism: 'laplace' | 'gaussian' | 'exponential';
  sensitivity: number;
  budget_management: boolean;
}

export interface FederatedLearningConfig {
  enabled: boolean;
  aggregation_method: 'fedavg' | 'fedprox' | 'scaffold';
  differential_privacy: boolean;
  secure_aggregation: boolean;
  client_selection: string;
  rounds: number;
}

export interface BiasDetectionConfig {
  enabled: boolean;
  metrics: BiasMetric[];
  thresholds: Record<string, number>;
  monitoring_frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  fairness_constraints: FairnessConstraint[];
}

export interface BiasMetric {
  name: string;
  type: 'demographic_parity' | 'equal_opportunity' | 'calibration' | 'individual_fairness';
  protected_attributes: string[];
  calculation_method: string;
}

export interface FairnessConstraint {
  metric: string;
  threshold: number;
  enforcement: 'hard' | 'soft';
  remediation: string;
}

export interface ExplainabilityConfig {
  enabled: boolean;
  methods: ExplainabilityMethod[];
  global_explanations: boolean;
  local_explanations: boolean;
  counterfactual_explanations: boolean;
  explanation_storage: boolean;
}

export interface ExplainabilityMethod {
  name: string;
  type: 'lime' | 'shap' | 'grad_cam' | 'attention' | 'anchors';
  applicable_models: string[];
  configuration: Record<string, any>;
}

export interface AdversarialProtectionConfig {
  enabled: boolean;
  detection_methods: AdversarialDetectionMethod[];
  defense_mechanisms: AdversarialDefense[];
  robustness_testing: boolean;
  attack_simulation: boolean;
}

export interface AdversarialDetectionMethod {
  name: string;
  type: 'statistical' | 'reconstruction' | 'neural_network' | 'feature_squeezing';
  threshold: number;
  confidence: number;
}

export interface AdversarialDefense {
  name: string;
  type: 'adversarial_training' | 'input_transformation' | 'ensemble' | 'detection_and_rejection';
  parameters: Record<string, any>;
  effectiveness_score: number;
}
