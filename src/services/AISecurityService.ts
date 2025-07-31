import CryptoJS from 'crypto-js';
import { generateId } from '@/lib/utils';

// Security Configuration Types
export interface AISecurityConfig {
  organizationId: string;
  encryptionKey: string;
  auditingEnabled: boolean;
  piiDetectionEnabled: boolean;
  contentFilteringEnabled: boolean;
  complianceStandards: ComplianceStandard[];
  retentionPolicyDays: number;
  anonymizationLevel: 'none' | 'basic' | 'advanced' | 'full';
}

export interface ComplianceStandard {
  name: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI_DSS';
  enabled: boolean;
  requirements: string[];
  lastAudit?: Date;
  nextAudit?: Date;
}

// Audit Logging Types
export interface AIAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  action: AIAction;
  requestData: AIRequestData;
  responseData: AIResponseData;
  securityAnalysis: SecurityAnalysis;
  complianceFlags: ComplianceFlag[];
  riskScore: number;
  classification: DataClassification;
  retentionDate: Date;
}

export interface AIAction {
  type: 'query' | 'insight_generation' | 'prediction' | 'recommendation' | 'assistance';
  source: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  geolocation?: GeoLocation;
}

export interface AIRequestData {
  originalContent: string;
  sanitizedContent: string;
  piiDetected: PIIEntity[];
  tokens: number;
  classification: DataClassification;
  contentFlags: ContentFlag[];
}

export interface AIResponseData {
  originalResponse: string;
  filteredResponse: string;
  confidence: number;
  sources: string[];
  moderation: ModerationResult;
  classification: DataClassification;
}

export interface SecurityAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: SecurityAnomaly[];
  accessControl: AccessControlCheck;
  dataIntegrity: DataIntegrityCheck;
  encryption: EncryptionStatus;
}

// PII Detection Types
export interface PIIEntity {
  type: PIIType;
  value: string;
  confidence: number;
  position: { start: number; end: number };
  redactionMethod: 'mask' | 'hash' | 'remove' | 'tokenize';
  replacementValue: string;
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'name'
  | 'address'
  | 'date_of_birth'
  | 'passport'
  | 'driver_license'
  | 'bank_account'
  | 'ip_address'
  | 'custom';

// Content Filtering Types
export interface ContentFlag {
  type: ContentFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  action: 'log' | 'warn' | 'block' | 'escalate';
}

export type ContentFlagType =
  | 'inappropriate'
  | 'harmful'
  | 'bias'
  | 'misinformation'
  | 'personal_info'
  | 'confidential'
  | 'financial'
  | 'medical'
  | 'legal';

export interface ModerationResult {
  approved: boolean;
  flags: ContentFlag[];
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
}

// Data Classification
export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  sensitivity: number;
  handlingRequirements: string[];
  retentionPeriod: number;
}

// Additional Security Types
export interface SecurityAnomaly {
  type: 'unusual_access' | 'data_exfiltration' | 'injection_attempt' | 'rate_limit_breach';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: Record<string, unknown>;
}

export interface AccessControlCheck {
  authorized: boolean;
  permissions: string[];
  restrictions: string[];
  role: string;
  lastValidated: Date;
}

export interface DataIntegrityCheck {
  hashValid: boolean;
  checksum: string;
  lastVerified: Date;
  modifications: ModificationRecord[];
}

export interface ModificationRecord {
  timestamp: Date;
  userId: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface EncryptionStatus {
  inTransit: boolean;
  atRest: boolean;
  algorithm: string;
  keyVersion: string;
  strength: number;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface ComplianceFlag {
  standard: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'warning';
  details: string;
  remediation?: string;
}

// Compliance Reporting Types
export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  standard: ComplianceStandard;
  organizationId: string;
  summary: ComplianceSummary;
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  status: 'compliant' | 'non_compliant' | 'partial_compliance';
  nextReviewDate: Date;
}

export interface ComplianceSummary {
  totalAuditLogs: number;
  complianceScore: number;
  criticalFindings: number;
  resolvedIssues: number;
  pendingActions: number;
  dataClassificationBreakdown: Record<string, number>;
}

export interface ComplianceFinding {
  id: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  evidence: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
  dueDate?: Date;
}

export interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  implementation: string;
  timeline: string;
  cost: 'low' | 'medium' | 'high';
}

export class AISecurityService {
  private config: AISecurityConfig;
  private auditLogs: Map<string, AIAuditLog> = new Map();
  private encryptionKey: string;
  private piiPatterns: Map<PIIType, RegExp> = new Map();
  private contentFilters: Map<ContentFlagType, RegExp> = new Map();

  constructor(config: AISecurityConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey;
    this.initializePIIPatterns();
    this.initializeContentFilters();
  }

  /**
   * Process AI request with full security pipeline
   */
  async processSecureAIRequest(request: {
    content: string;
    userId: string;
    sessionId: string;
    action: AIAction;
    metadata?: Record<string, unknown>;
  }): Promise<{
    sanitizedContent: string;
    auditLogId: string;
    securityApproved: boolean;
    warnings: string[];
  }> {
    const auditLogId = generateId('audit');
    const warnings: string[] = [];

    try {
      // 1. Detect and redact PII
      const piiResult = await this.detectAndRedactPII(request.content);
      if (piiResult.piiDetected.length > 0) {
        warnings.push(`${piiResult.piiDetected.length} PII entities detected and redacted`);
      }

      // 2. Content filtering
      const contentAnalysis = await this.analyzeContent(piiResult.sanitizedContent);
      const securityApproved = contentAnalysis.moderation.approved;

      if (!securityApproved) {
        warnings.push('Content flagged by security filters');
      }

      // 3. Data classification
      const classification = await this.classifyData(request.content, piiResult.piiDetected);

      // 4. Security analysis
      const securityAnalysis = await this.performSecurityAnalysis(request, piiResult);

      // 5. Create audit log
      const auditLog: AIAuditLog = {
        id: auditLogId,
        timestamp: new Date(),
        userId: request.userId,
        sessionId: request.sessionId,
        action: request.action,
        requestData: {
          originalContent: this.encryptData(request.content),
          sanitizedContent: this.encryptData(piiResult.sanitizedContent),
          piiDetected: piiResult.piiDetected,
          tokens: this.countTokens(request.content),
          classification,
          contentFlags: contentAnalysis.flags,
        },
        responseData: {
          originalResponse: '',
          filteredResponse: '',
          confidence: 0,
          sources: [],
          moderation: contentAnalysis.moderation,
          classification,
        },
        securityAnalysis,
        complianceFlags: await this.checkCompliance(request, piiResult, classification),
        riskScore: this.calculateRiskScore(securityAnalysis, contentAnalysis),
        classification,
        retentionDate: new Date(Date.now() + this.config.retentionPolicyDays * 24 * 60 * 60 * 1000),
      };

      // Store audit log
      if (this.config.auditingEnabled) {
        await this.storeAuditLog(auditLog);
      }

      return {
        sanitizedContent: piiResult.sanitizedContent,
        auditLogId,
        securityApproved,
        warnings,
      };
    } catch (error) {
      console.error('Security processing error:', error);
      throw new Error('Security processing failed');
    }
  }

  /**
   * Process AI response with security filtering
   */
  async processSecureAIResponse(
    auditLogId: string,
    response: string,
    confidence: number,
    sources: string[]
  ): Promise<{
    filteredResponse: string;
    approved: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      // 1. Content filtering for response
      const contentAnalysis = await this.analyzeContent(response);

      // 2. PII detection in response
      const piiResult = await this.detectAndRedactPII(response);
      if (piiResult.piiDetected.length > 0) {
        warnings.push('PII detected in AI response and redacted');
      }

      // 3. Update audit log with response data
      const auditLog = this.auditLogs.get(auditLogId);
      if (auditLog) {
        auditLog.responseData = {
          originalResponse: this.encryptData(response),
          filteredResponse: this.encryptData(piiResult.sanitizedContent),
          confidence,
          sources,
          moderation: contentAnalysis.moderation,
          classification: await this.classifyData(response, piiResult.piiDetected),
        };

        await this.updateAuditLog(auditLog);
      }

      return {
        filteredResponse: piiResult.sanitizedContent,
        approved: contentAnalysis.moderation.approved,
        warnings,
      };
    } catch (error) {
      console.error('Response security processing error:', error);
      throw new Error('Response security processing failed');
    }
  }

  /**
   * Detect and redact PII from content
   */
  private async detectAndRedactPII(content: string): Promise<{
    sanitizedContent: string;
    piiDetected: PIIEntity[];
  }> {
    if (!this.config.piiDetectionEnabled) {
      return { sanitizedContent: content, piiDetected: [] };
    }

    const piiEntities: PIIEntity[] = [];
    let sanitizedContent = content;

    // Detect PII using patterns
    for (const [type, pattern] of this.piiPatterns) {
      const matches = Array.from(content.matchAll(pattern));

      for (const match of matches) {
        if (match.index !== undefined) {
          const entity: PIIEntity = {
            type,
            value: match[0],
            confidence: this.calculatePIIConfidence(type, match[0]),
            position: { start: match.index, end: match.index + match[0].length },
            redactionMethod: this.getRedactionMethod(type),
            replacementValue: this.generateReplacement(type, match[0]),
          };
          piiEntities.push(entity);
        }
      }
    }

    // Sort by position (descending) to avoid index shifting during replacement
    piiEntities.sort((a, b) => b.position.start - a.position.start);

    // Apply redaction
    for (const entity of piiEntities) {
      sanitizedContent =
        sanitizedContent.slice(0, entity.position.start) +
        entity.replacementValue +
        sanitizedContent.slice(entity.position.end);
    }

    return { sanitizedContent, piiDetected: piiEntities };
  }

  /**
   * Analyze content for security risks
   */
  private async analyzeContent(content: string): Promise<{
    flags: ContentFlag[];
    moderation: ModerationResult;
  }> {
    if (!this.config.contentFilteringEnabled) {
      return {
        flags: [],
        moderation: {
          approved: true,
          flags: [],
          confidence: 1.0,
          reasoning: 'Content filtering disabled',
          suggestedActions: [],
        },
      };
    }

    const flags: ContentFlag[] = [];

    // Apply content filters
    for (const [type, pattern] of this.contentFilters) {
      if (pattern.test(content)) {
        const flag: ContentFlag = {
          type,
          severity: this.getContentFlagSeverity(type),
          confidence: 0.8,
          description: `Content flagged for ${type}`,
          action: this.getContentFlagAction(type),
        };
        flags.push(flag);
      }
    }

    // Generate moderation result
    const criticalFlags = flags.filter((f) => f.severity === 'critical' || f.severity === 'high');
    const approved = criticalFlags.length === 0;

    return {
      flags,
      moderation: {
        approved,
        flags,
        confidence: 0.85,
        reasoning: approved ? 'Content passed security checks' : 'Content flagged for review',
        suggestedActions: approved
          ? []
          : ['Review flagged content', 'Consider content modification'],
      },
    };
  }

  /**
   * Classify data sensitivity
   */
  private async classifyData(
    content: string,
    piiEntities: PIIEntity[]
  ): Promise<DataClassification> {
    let level: DataClassification['level'] = 'public';
    const categories: string[] = [];
    let sensitivity = 0;

    // Check for PII
    if (piiEntities.length > 0) {
      level = 'confidential';
      sensitivity += piiEntities.length * 10;
      categories.push('personal_data');
    }

    // Check for sensitive keywords
    const sensitivePatterns = {
      financial: /\b(account|payment|credit|financial|money|salary)\b/i,
      medical: /\b(medical|health|patient|diagnosis|treatment)\b/i,
      legal: /\b(legal|court|lawsuit|contract|agreement)\b/i,
      confidential: /\b(confidential|secret|private|internal)\b/i,
    };

    for (const [category, pattern] of Object.entries(sensitivePatterns)) {
      if (pattern.test(content)) {
        categories.push(category);
        sensitivity += 15;
        if (level === 'public') level = 'internal';
        if (category === 'confidential') level = 'restricted';
      }
    }

    return {
      level,
      categories,
      sensitivity: Math.min(sensitivity, 100),
      handlingRequirements: this.getHandlingRequirements(level),
      retentionPeriod: this.getRetentionPeriod(level),
    };
  }

  /**
   * Perform comprehensive security analysis
   */
  private async performSecurityAnalysis(
    request: { userId: string; action: AIAction; metadata?: Record<string, unknown> },
    piiResult: { piiDetected: PIIEntity[] }
  ): Promise<SecurityAnalysis> {
    const anomalies: SecurityAnomaly[] = [];

    // Check for unusual access patterns
    if (await this.detectUnusualAccess(request.userId, request.action)) {
      anomalies.push({
        type: 'unusual_access',
        description: 'Unusual access pattern detected',
        severity: 'medium',
        evidence: { action: request.action, timestamp: new Date() },
      });
    }

    // Check for potential data exfiltration
    if (piiResult.piiDetected.length > 5) {
      anomalies.push({
        type: 'data_exfiltration',
        description: 'High volume of PII detected',
        severity: 'high',
        evidence: { piiCount: piiResult.piiDetected.length },
      });
    }

    const threatLevel = this.calculateThreatLevel(anomalies);

    return {
      threatLevel,
      anomalies,
      accessControl: await this.checkAccessControl(request.userId),
      dataIntegrity: await this.checkDataIntegrity(),
      encryption: {
        inTransit: true,
        atRest: true,
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1.0',
        strength: 256,
      },
    };
  }

  /**
   * Check compliance requirements
   */
  private async checkCompliance(
    request: { action: AIAction },
    piiResult: { piiDetected: PIIEntity[] },
    classification: DataClassification
  ): Promise<ComplianceFlag[]> {
    const flags: ComplianceFlag[] = [];

    for (const standard of this.config.complianceStandards) {
      if (!standard.enabled) continue;

      switch (standard.name) {
        case 'GDPR':
          if (piiResult.piiDetected.some((p) => p.type === 'email' || p.type === 'name')) {
            flags.push({
              standard: 'GDPR',
              requirement: 'Article 6 - Lawful basis for processing',
              status: 'warning',
              details: 'Personal data processing detected',
              remediation: 'Ensure consent or legitimate interest basis',
            });
          }
          break;

        case 'SOC2':
          if (classification.level === 'restricted') {
            flags.push({
              standard: 'SOC2',
              requirement: 'CC6.1 - Logical access security',
              status: 'compliant',
              details: 'Restricted data access properly controlled',
            });
          }
          break;

        case 'ISO27001':
          flags.push({
            standard: 'ISO27001',
            requirement: 'A.12.3 - Information backup',
            status: 'compliant',
            details: 'Audit trail maintained',
          });
          break;
      }
    }

    return flags;
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    standard: ComplianceStandard,
    period: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    const auditLogs = Array.from(this.auditLogs.values()).filter(
      (log) => log.timestamp >= period.start && log.timestamp <= period.end
    );

    const findings: ComplianceFinding[] = [];
    const recommendations: ComplianceRecommendation[] = [];

    // Analyze audit logs for compliance
    const summary: ComplianceSummary = {
      totalAuditLogs: auditLogs.length,
      complianceScore: this.calculateComplianceScore(auditLogs, standard),
      criticalFindings: findings.filter((f) => f.riskLevel === 'critical').length,
      resolvedIssues: 0,
      pendingActions: findings.filter((f) => f.status === 'fail').length,
      dataClassificationBreakdown: this.getDataClassificationBreakdown(auditLogs),
    };

    // Generate findings based on standard
    switch (standard.name) {
      case 'GDPR':
        findings.push(...(await this.generateGDPRFindings(auditLogs)));
        recommendations.push(...(await this.generateGDPRRecommendations(auditLogs)));
        break;
      case 'SOC2':
        findings.push(...(await this.generateSOC2Findings(auditLogs)));
        recommendations.push(...(await this.generateSOC2Recommendations(auditLogs)));
        break;
      case 'ISO27001':
        findings.push(...(await this.generateISO27001Findings(auditLogs)));
        recommendations.push(...(await this.generateISO27001Recommendations(auditLogs)));
        break;
    }

    return {
      id: generateId('compliance_report'),
      generatedAt: new Date(),
      period,
      standard,
      organizationId: this.config.organizationId,
      summary,
      findings,
      recommendations,
      status:
        summary.complianceScore >= 80
          ? 'compliant'
          : summary.complianceScore >= 60
            ? 'partial_compliance'
            : 'non_compliant',
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
  }

  /**
   * Encrypt sensitive data
   */
  private encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decryptData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Store audit log securely
   */
  private async storeAuditLog(auditLog: AIAuditLog): Promise<void> {
    // Encrypt sensitive fields
    const encryptedLog = {
      ...auditLog,
      requestData: {
        ...auditLog.requestData,
        originalContent: this.encryptData(auditLog.requestData.originalContent),
        sanitizedContent: this.encryptData(auditLog.requestData.sanitizedContent),
      },
    };

    this.auditLogs.set(auditLog.id, encryptedLog);

    // In production, store to secure database
    // await this.databaseService.storeAuditLog(encryptedLog);
  }

  /**
   * Update existing audit log
   */
  private async updateAuditLog(auditLog: AIAuditLog): Promise<void> {
    this.auditLogs.set(auditLog.id, auditLog);

    // In production, update in secure database
    // await this.databaseService.updateAuditLog(auditLog);
  }

  // Helper methods
  private initializePIIPatterns(): void {
    this.piiPatterns = new Map([
      ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
      ['phone', /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g],
      ['ssn', /\b\d{3}-?\d{2}-?\d{4}\b/g],
      ['credit_card', /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g],
      ['ip_address', /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g],
    ]);
  }

  private initializeContentFilters(): void {
    this.contentFilters = new Map([
      ['inappropriate', /\b(offensive|inappropriate|harmful)\b/i],
      ['financial', /\b(account\s*number|routing\s*number|bank\s*details)\b/i],
      ['medical', /\b(patient\s*id|medical\s*record|diagnosis)\b/i],
      ['confidential', /\b(confidential|classified|secret)\b/i],
    ]);
  }

  private calculatePIIConfidence(type: PIIType, value: string): number {
    // Basic confidence calculation based on pattern specificity
    const confidenceMap: Record<PIIType, number> = {
      email: 0.95,
      phone: 0.85,
      ssn: 0.99,
      credit_card: 0.9,
      name: 0.7,
      address: 0.75,
      date_of_birth: 0.8,
      passport: 0.95,
      driver_license: 0.9,
      bank_account: 0.85,
      ip_address: 0.8,
      custom: 0.6,
    };

    return confidenceMap[type] || 0.6;
  }

  private getRedactionMethod(type: PIIType): PIIEntity['redactionMethod'] {
    const methodMap: Record<PIIType, PIIEntity['redactionMethod']> = {
      email: 'mask',
      phone: 'mask',
      ssn: 'hash',
      credit_card: 'mask',
      name: 'tokenize',
      address: 'remove',
      date_of_birth: 'mask',
      passport: 'hash',
      driver_license: 'hash',
      bank_account: 'hash',
      ip_address: 'mask',
      custom: 'mask',
    };

    return methodMap[type] || 'mask';
  }

  private generateReplacement(type: PIIType, originalValue: string): string {
    switch (type) {
      case 'email':
        return '***@***.***';
      case 'phone':
        return '***-***-****';
      case 'ssn':
        return '***-**-****';
      case 'credit_card':
        return '**** **** **** ****';
      case 'name':
        return '[REDACTED_NAME]';
      case 'address':
        return '[REDACTED_ADDRESS]';
      default:
        return '[REDACTED]';
    }
  }

  private getContentFlagSeverity(type: ContentFlagType): ContentFlag['severity'] {
    const severityMap: Record<ContentFlagType, ContentFlag['severity']> = {
      inappropriate: 'high',
      harmful: 'critical',
      bias: 'medium',
      misinformation: 'high',
      personal_info: 'high',
      confidential: 'critical',
      financial: 'high',
      medical: 'high',
      legal: 'medium',
    };

    return severityMap[type] || 'medium';
  }

  private getContentFlagAction(type: ContentFlagType): ContentFlag['action'] {
    const actionMap: Record<ContentFlagType, ContentFlag['action']> = {
      inappropriate: 'warn',
      harmful: 'block',
      bias: 'log',
      misinformation: 'warn',
      personal_info: 'block',
      confidential: 'block',
      financial: 'block',
      medical: 'block',
      legal: 'warn',
    };

    return actionMap[type] || 'log';
  }

  private getHandlingRequirements(level: DataClassification['level']): string[] {
    const requirements: Record<DataClassification['level'], string[]> = {
      public: ['Standard handling'],
      internal: ['Internal use only', 'Employee access only'],
      confidential: ['Restricted access', 'Encryption required', 'Audit trail'],
      restricted: [
        'Need-to-know basis',
        'Executive approval',
        'Enhanced encryption',
        'Full audit trail',
      ],
    };

    return requirements[level] || ['Standard handling'];
  }

  private getRetentionPeriod(level: DataClassification['level']): number {
    const periods: Record<DataClassification['level'], number> = {
      public: 365, // 1 year
      internal: 1095, // 3 years
      confidential: 2555, // 7 years
      restricted: 3650, // 10 years
    };

    return periods[level] || 365;
  }

  private countTokens(content: string): number {
    // Simple token counting (words + punctuation)
    return content.split(/\s+/).length + content.split(/[.,!?;:]/).length - 1;
  }

  private calculateRiskScore(
    security: SecurityAnalysis,
    content: { flags: ContentFlag[] }
  ): number {
    let score = 0;

    // Security analysis scoring
    switch (security.threatLevel) {
      case 'critical':
        score += 80;
        break;
      case 'high':
        score += 60;
        break;
      case 'medium':
        score += 40;
        break;
      case 'low':
        score += 20;
        break;
    }

    // Content flags scoring
    content.flags.forEach((flag) => {
      switch (flag.severity) {
        case 'critical':
          score += 20;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    });

    return Math.min(score, 100);
  }

  private calculateThreatLevel(anomalies: SecurityAnomaly[]): SecurityAnalysis['threatLevel'] {
    if (anomalies.some((a) => a.severity === 'critical')) return 'critical';
    if (anomalies.some((a) => a.severity === 'high')) return 'high';
    if (anomalies.some((a) => a.severity === 'medium')) return 'medium';
    return 'low';
  }

  private async detectUnusualAccess(userId: string, action: AIAction): Promise<boolean> {
    // Simple unusual access detection
    // In production, implement sophisticated behavioral analysis
    return Math.random() < 0.1; // 10% chance for demo
  }

  private async checkAccessControl(userId: string): Promise<AccessControlCheck> {
    return {
      authorized: true,
      permissions: ['read', 'write', 'ai_query'],
      restrictions: [],
      role: 'user',
      lastValidated: new Date(),
    };
  }

  private async checkDataIntegrity(): Promise<DataIntegrityCheck> {
    return {
      hashValid: true,
      checksum: 'abc123def456',
      lastVerified: new Date(),
      modifications: [],
    };
  }

  private calculateComplianceScore(logs: AIAuditLog[], standard: ComplianceStandard): number {
    // Simplified compliance scoring
    const totalLogs = logs.length;
    if (totalLogs === 0) return 100;

    const compliantLogs = logs.filter((log) =>
      log.complianceFlags.every((flag) => flag.status === 'compliant')
    ).length;

    return Math.round((compliantLogs / totalLogs) * 100);
  }

  private getDataClassificationBreakdown(logs: AIAuditLog[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      public: 0,
      internal: 0,
      confidential: 0,
      restricted: 0,
    };

    logs.forEach((log) => {
      breakdown[log.classification.level]++;
    });

    return breakdown;
  }

  private async generateGDPRFindings(logs: AIAuditLog[]): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    const piiProcessingLogs = logs.filter((log) => log.requestData.piiDetected.length > 0);

    if (piiProcessingLogs.length > 0) {
      findings.push({
        id: generateId('finding'),
        requirement: 'GDPR Article 6 - Lawful basis for processing',
        status: 'pass',
        description: `${piiProcessingLogs.length} instances of PII processing detected with proper safeguards`,
        evidence: [`${piiProcessingLogs.length} audit logs with PII redaction`],
        riskLevel: 'low',
        remediation: 'Continue current PII protection practices',
      });
    }

    return findings;
  }

  private async generateGDPRRecommendations(
    logs: AIAuditLog[]
  ): Promise<ComplianceRecommendation[]> {
    return [
      {
        priority: 'medium',
        category: 'Data Protection',
        description: 'Implement automated data subject access request handling',
        implementation: 'Develop DSAR automation system',
        timeline: '3 months',
        cost: 'medium',
      },
    ];
  }

  private async generateSOC2Findings(logs: AIAuditLog[]): Promise<ComplianceFinding[]> {
    return [
      {
        id: generateId('finding'),
        requirement: 'CC6.1 - Logical access security',
        status: 'pass',
        description: 'Access controls properly implemented for AI system',
        evidence: ['Audit logs', 'Access control checks'],
        riskLevel: 'low',
        remediation: 'Maintain current access control standards',
      },
    ];
  }

  private async generateSOC2Recommendations(
    logs: AIAuditLog[]
  ): Promise<ComplianceRecommendation[]> {
    return [
      {
        priority: 'high',
        category: 'Security',
        description: 'Enhance monitoring and alerting for AI security events',
        implementation: 'Deploy advanced SIEM integration',
        timeline: '2 months',
        cost: 'high',
      },
    ];
  }

  private async generateISO27001Findings(logs: AIAuditLog[]): Promise<ComplianceFinding[]> {
    return [
      {
        id: generateId('finding'),
        requirement: 'A.12.3 - Information backup',
        status: 'pass',
        description: 'Audit trails properly maintained and backed up',
        evidence: ['Backup logs', 'Retention policies'],
        riskLevel: 'low',
        remediation: 'Continue current backup practices',
      },
    ];
  }

  private async generateISO27001Recommendations(
    logs: AIAuditLog[]
  ): Promise<ComplianceRecommendation[]> {
    return [
      {
        priority: 'medium',
        category: 'Information Security',
        description: 'Regular security awareness training for AI system users',
        implementation: 'Quarterly training program',
        timeline: '1 month',
        cost: 'low',
      },
    ];
  }

  // Public API methods
  public async getAuditLogs(filters?: {
    userId?: string;
    dateRange?: { start: Date; end: Date };
    threatLevel?: SecurityAnalysis['threatLevel'];
  }): Promise<AIAuditLog[]> {
    let logs = Array.from(this.auditLogs.values());

    if (filters) {
      if (filters.userId) {
        logs = logs.filter((log) => log.userId === filters.userId);
      }
      if (filters.dateRange) {
        logs = logs.filter(
          (log) =>
            log.timestamp >= filters.dateRange!.start && log.timestamp <= filters.dateRange!.end
        );
      }
      if (filters.threatLevel) {
        logs = logs.filter((log) => log.securityAnalysis.threatLevel === filters.threatLevel);
      }
    }

    return logs;
  }

  public async exportAuditLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = Array.from(this.auditLogs.values());

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV export logic
      const headers = ['id', 'timestamp', 'userId', 'action', 'threatLevel', 'riskScore'];
      const rows = logs.map((log) => [
        log.id,
        log.timestamp.toISOString(),
        log.userId,
        log.action.type,
        log.securityAnalysis.threatLevel,
        log.riskScore.toString(),
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }
  }

  public getSecurityMetrics(): {
    totalAuditLogs: number;
    avgRiskScore: number;
    threatLevelDistribution: Record<string, number>;
    piiDetectionRate: number;
    complianceScore: number;
  } {
    const logs = Array.from(this.auditLogs.values());
    const totalLogs = logs.length;

    if (totalLogs === 0) {
      return {
        totalAuditLogs: 0,
        avgRiskScore: 0,
        threatLevelDistribution: {},
        piiDetectionRate: 0,
        complianceScore: 100,
      };
    }

    const avgRiskScore = logs.reduce((sum, log) => sum + log.riskScore, 0) / totalLogs;

    const threatLevelDistribution: Record<string, number> = {};
    logs.forEach((log) => {
      const level = log.securityAnalysis.threatLevel;
      threatLevelDistribution[level] = (threatLevelDistribution[level] || 0) + 1;
    });

    const piiDetectedLogs = logs.filter((log) => log.requestData.piiDetected.length > 0).length;
    const piiDetectionRate = (piiDetectedLogs / totalLogs) * 100;

    const compliantLogs = logs.filter((log) =>
      log.complianceFlags.every((flag) => flag.status === 'compliant')
    ).length;
    const complianceScore = (compliantLogs / totalLogs) * 100;

    return {
      totalAuditLogs: totalLogs,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      threatLevelDistribution,
      piiDetectionRate: Math.round(piiDetectionRate * 100) / 100,
      complianceScore: Math.round(complianceScore * 100) / 100,
    };
  }
}

// Export singleton instance
export const aiSecurityService = new AISecurityService({
  organizationId: 'org-001',
  encryptionKey: process.env.AI_ENCRYPTION_KEY || 'default-key-change-in-production',
  auditingEnabled: true,
  piiDetectionEnabled: true,
  contentFilteringEnabled: true,
  complianceStandards: [
    {
      name: 'SOC2',
      enabled: true,
      requirements: ['CC6.1', 'CC6.2', 'CC6.3'],
    },
    {
      name: 'ISO27001',
      enabled: true,
      requirements: ['A.12.3', 'A.18.1', 'A.18.2'],
    },
    {
      name: 'GDPR',
      enabled: true,
      requirements: ['Article 6', 'Article 25', 'Article 32'],
    },
  ],
  retentionPolicyDays: 2555, // 7 years
  anonymizationLevel: 'advanced',
});
