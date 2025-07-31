import { aiSecurityService, type AIAction } from './AISecurityService';
import type {
  SecurityContext,
  SecurityValidationResult,
  SecurityViolation,
  SecurityWarning,
} from '@/types/ai-security.types';
import { generateId } from '@/lib/utils';

/**
 * AI Security Middleware
 * Wraps AI service calls with comprehensive security checks
 */
export class AISecurityMiddleware {
  private static instance: AISecurityMiddleware;

  private constructor() {}

  public static getInstance(): AISecurityMiddleware {
    if (!AISecurityMiddleware.instance) {
      AISecurityMiddleware.instance = new AISecurityMiddleware();
    }
    return AISecurityMiddleware.instance;
  }

  /**
   * Secure wrapper for AI service calls
   */
  async secureAICall<T>(
    originalFunction: (...args: unknown[]) => Promise<T>,
    context: SecurityContext,
    request: {
      content: string;
      action: AIAction;
      metadata?: Record<string, unknown>;
    },
    ...args: unknown[]
  ): Promise<{
    result: T;
    securityMetadata: {
      auditLogId: string;
      riskScore: number;
      approved: boolean;
      warnings: string[];
    };
  }> {
    // 1. Pre-execution security validation
    const preValidation = await this.validatePreExecution(context, request);

    if (!preValidation.isValid) {
      throw new Error(
        `Security validation failed: ${preValidation.violations.map((v) => v.description).join(', ')}`
      );
    }

    // 2. Process request through security pipeline
    const securityResult = await aiSecurityService.processSecureAIRequest({
      content: request.content,
      userId: context.userId,
      sessionId: context.sessionId,
      action: request.action,
      metadata: request.metadata,
    });

    if (!securityResult.securityApproved) {
      throw new Error('Request blocked by security filters');
    }

    try {
      // 3. Execute the original AI function with sanitized content
      const modifiedArgs = this.sanitizeArguments(args, securityResult.sanitizedContent);
      const result = await originalFunction(...modifiedArgs);

      // 4. Process AI response through security pipeline
      const responseResult = await aiSecurityService.processSecureAIResponse(
        securityResult.auditLogId,
        JSON.stringify(result),
        0.85, // Default confidence
        ['ai_service']
      );

      // 5. Post-execution validation
      const postValidation = await this.validatePostExecution(context, result, responseResult);

      if (!postValidation.isValid) {
        // Log security violation but don't block (response already generated)
        console.warn('Post-execution security validation failed:', postValidation.violations);
      }

      return {
        result: this.sanitizeResponse(result, responseResult.filteredResponse) as T,
        securityMetadata: {
          auditLogId: securityResult.auditLogId,
          riskScore: await this.calculateResponseRiskScore(result, responseResult),
          approved: responseResult.approved,
          warnings: [
            ...securityResult.warnings,
            ...responseResult.warnings,
            ...postValidation.warnings.map((w) => w.message),
          ],
        },
      };
    } catch (error) {
      // Log security incident
      await this.logSecurityIncident(context, request, error);
      throw error;
    }
  }

  /**
   * Validate security before AI execution
   */
  private async validatePreExecution(
    context: SecurityContext,
    request: { content: string; action: AIAction }
  ): Promise<SecurityValidationResult> {
    const violations: SecurityViolation[] = [];
    const warnings: SecurityWarning[] = [];
    const recommendations: string[] = [];

    // Check authentication and authorization
    if (!context.userId || context.userId.length === 0) {
      violations.push({
        type: 'access_denied' as const,
        severity: 'critical' as const,
        description: 'Invalid user authentication',
        evidence: { context },
        remediation: 'Provide valid user credentials',
        reportable: true,
      });
    }

    // Check rate limiting
    if (await this.checkRateLimit(context.userId)) {
      violations.push({
        type: 'policy_violation' as const,
        severity: 'high' as const,
        description: 'Rate limit exceeded',
        evidence: { userId: context.userId },
        remediation: 'Reduce request frequency',
        reportable: true,
      });
    }

    // Check for suspicious patterns
    if (await this.detectSuspiciousActivity(context, request)) {
      warnings.push({
        type: 'unusual_activity' as const,
        message: 'Unusual activity pattern detected',
        actionRequired: true,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    // Security level compliance
    if (context.securityLevel === 'maximum' && !this.isHighSecurityCompliant(request)) {
      violations.push({
        type: 'compliance_breach' as const,
        severity: 'high' as const,
        description: 'Request does not meet maximum security requirements',
        evidence: { securityLevel: context.securityLevel, request },
        remediation: 'Upgrade request security parameters',
        reportable: true,
      });
    }

    const riskScore = this.calculatePreExecutionRiskScore(context, request, violations, warnings);

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      recommendations,
      riskScore,
    };
  }

  /**
   * Validate security after AI execution
   */
  private async validatePostExecution(
    context: SecurityContext,
    result: unknown,
    responseResult: { filteredResponse: string; approved: boolean; warnings: string[] }
  ): Promise<SecurityValidationResult> {
    const violations: SecurityViolation[] = [];
    const warnings: SecurityWarning[] = [];
    const recommendations: string[] = [];

    // Check for data leakage in response
    if (await this.detectDataLeakage(result)) {
      violations.push({
        type: 'data_leak' as const,
        severity: 'critical' as const,
        description: 'Potential data leakage detected in AI response',
        evidence: { response: result },
        remediation: 'Review and sanitize response content',
        reportable: true,
      });
    }

    // Check response quality and safety
    if (!responseResult.approved) {
      warnings.push({
        type: 'potential_risk' as const,
        message: 'AI response flagged by content filters',
        actionRequired: false,
      });
    }

    // Compliance validation
    const complianceIssues = await this.validateResponseCompliance(result, context);
    violations.push(...complianceIssues);

    const riskScore = await this.calculatePostExecutionRiskScore(
      result,
      responseResult,
      violations,
      warnings
    );

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      recommendations,
      riskScore,
    };
  }

  /**
   * Sanitize function arguments
   */
  private sanitizeArguments(args: unknown[], sanitizedContent: string): unknown[] {
    // Replace the first string argument with sanitized content
    return args.map((arg, index) => {
      if (index === 0 && typeof arg === 'string') {
        return sanitizedContent;
      }
      return arg;
    });
  }

  /**
   * Sanitize AI response
   */
  private sanitizeResponse(originalResult: unknown, filteredResponse: string): unknown {
    // If result is a string, use filtered response
    if (typeof originalResult === 'string') {
      return filteredResponse;
    }

    // If result is an object with content property, sanitize it
    if (
      typeof originalResult === 'object' &&
      originalResult !== null &&
      'content' in originalResult
    ) {
      return {
        ...originalResult,
        content: filteredResponse,
      };
    }

    return originalResult;
  }

  /**
   * Check rate limiting for user
   */
  private async checkRateLimit(userId: string): Promise<boolean> {
    // Simple rate limiting check (in production, use Redis or similar)
    const key = `rate_limit_${userId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      localStorage.setItem(
        key,
        JSON.stringify({
          count: 1,
          resetTime: Date.now() + 60 * 1000, // 1 minute
        })
      );
      return false;
    }

    const rateData = JSON.parse(stored);

    if (Date.now() > rateData.resetTime) {
      localStorage.setItem(
        key,
        JSON.stringify({
          count: 1,
          resetTime: Date.now() + 60 * 1000,
        })
      );
      return false;
    }

    if (rateData.count >= 10) {
      // 10 requests per minute
      return true;
    }

    rateData.count++;
    localStorage.setItem(key, JSON.stringify(rateData));
    return false;
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(
    context: SecurityContext,
    request: { content: string; action: AIAction }
  ): Promise<boolean> {
    // Check for unusual request patterns
    const suspiciousPatterns = [
      /system\s*prompt/i,
      /ignore\s*previous/i,
      /jailbreak/i,
      /bypass\s*filter/i,
      /admin\s*access/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(request.content));
  }

  /**
   * Check high security compliance
   */
  private isHighSecurityCompliant(request: { content: string; action: AIAction }): boolean {
    // For maximum security, require specific conditions
    return (
      request.content.length < 5000 && // Limit content length
      !this.containsSensitiveKeywords(request.content) &&
      request.action.type !== 'assistance' // No interactive assistance at max security
    );
  }

  /**
   * Check for sensitive keywords
   */
  private containsSensitiveKeywords(content: string): boolean {
    const sensitiveKeywords = [
      'password',
      'secret',
      'token',
      'api_key',
      'private_key',
      'ssn',
      'credit_card',
      'bank_account',
      'social_security',
    ];

    const lowerContent = content.toLowerCase();
    return sensitiveKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Detect potential data leakage
   */
  private async detectDataLeakage(result: unknown): Promise<boolean> {
    const resultString = JSON.stringify(result);

    // Check for patterns that might indicate data leakage
    const leakagePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/, // IP address
    ];

    return leakagePatterns.some((pattern) => pattern.test(resultString));
  }

  /**
   * Validate response compliance
   */
  private async validateResponseCompliance(
    result: unknown,
    context: SecurityContext
  ): Promise<
    Array<{
      type: 'compliance_breach';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      evidence: Record<string, unknown>;
      remediation: string;
      reportable: boolean;
    }>
  > {
    const violations: Array<{
      type: 'compliance_breach';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      evidence: Record<string, unknown>;
      remediation: string;
      reportable: boolean;
    }> = [];
    const resultString = JSON.stringify(result);

    // GDPR compliance check
    if (this.containsPersonalData(resultString)) {
      violations.push({
        type: 'compliance_breach' as const,
        severity: 'high' as const,
        description: 'Response may contain personal data without proper consent',
        evidence: { result, standard: 'GDPR' },
        remediation: 'Remove or anonymize personal data in response',
        reportable: true,
      });
    }

    // Check for classification level compliance
    if (context.securityLevel === 'maximum' && this.containsClassifiedInfo(resultString)) {
      violations.push({
        type: 'compliance_breach' as const,
        severity: 'critical' as const,
        description: 'Response contains classified information at maximum security level',
        evidence: { result, securityLevel: context.securityLevel },
        remediation: 'Remove classified information from response',
        reportable: true,
      });
    }

    return violations;
  }

  /**
   * Check if content contains personal data
   */
  private containsPersonalData(content: string): boolean {
    const personalDataPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Names
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
    ];

    return personalDataPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Check if content contains classified information
   */
  private containsClassifiedInfo(content: string): boolean {
    const classifiedKeywords = [
      'confidential',
      'secret',
      'top secret',
      'classified',
      'restricted',
      'internal only',
      'proprietary',
    ];

    const lowerContent = content.toLowerCase();
    return classifiedKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Calculate pre-execution risk score
   */
  private calculatePreExecutionRiskScore(
    context: SecurityContext,
    request: { content: string; action: AIAction },
    violations: SecurityViolation[],
    warnings: SecurityWarning[]
  ): number {
    let score = 0;

    // Base score from violations and warnings
    score += violations.length * 25;
    score += warnings.length * 10;

    // Content-based risk factors
    if (request.content.length > 10000) score += 10;
    if (this.containsSensitiveKeywords(request.content)) score += 15;

    // Context-based risk factors
    if (context.securityLevel === 'basic') score += 5;
    if (!context.ipAddress || context.ipAddress === 'unknown') score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate post-execution risk score
   */
  private async calculatePostExecutionRiskScore(
    result: unknown,
    responseResult: { approved: boolean; warnings: string[] },
    violations: SecurityViolation[],
    warnings: SecurityWarning[]
  ): Promise<number> {
    let score = 0;

    // Base score from violations and warnings
    score += violations.length * 30;
    score += warnings.length * 15;

    // Response-based risk factors
    if (!responseResult.approved) score += 20;
    score += responseResult.warnings.length * 5;

    // Content analysis
    const resultString = JSON.stringify(result);
    if (this.containsPersonalData(resultString)) score += 25;
    if (this.containsClassifiedInfo(resultString)) score += 35;

    return Math.min(score, 100);
  }

  /**
   * Calculate response risk score
   */
  private async calculateResponseRiskScore(
    result: unknown,
    responseResult: { approved: boolean; warnings: string[] }
  ): Promise<number> {
    let score = 0;

    if (!responseResult.approved) score += 30;
    score += responseResult.warnings.length * 10;

    const resultString = JSON.stringify(result);
    if (await this.detectDataLeakage(resultString)) score += 40;
    if (this.containsClassifiedInfo(resultString)) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Log security incident
   */
  private async logSecurityIncident(
    context: SecurityContext,
    request: { content: string; action: AIAction },
    error: unknown
  ): Promise<void> {
    const incident = {
      id: generateId('incident'),
      timestamp: new Date(),
      type: 'ai_execution_failure' as const,
      severity: 'error' as const,
      context,
      request,
      error: error instanceof Error ? error.message : String(error),
      resolved: false,
    };

    console.error('Security incident logged:', incident);

    // In production, send to security monitoring system
    // await securityMonitoringService.reportIncident(incident);
  }

  /**
   * Create security context from request data
   */
  public createSecurityContext(
    userId: string,
    sessionId: string,
    organizationId: string,
    permissions: string[],
    securityLevel: 'basic' | 'enhanced' | 'maximum' = 'enhanced',
    ipAddress = 'unknown',
    userAgent = 'unknown'
  ): SecurityContext {
    return {
      userId,
      sessionId,
      organizationId,
      permissions,
      securityLevel,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };
  }

  /**
   * Wrap an AI service method with security middleware
   */
  public wrapAIService<T extends Record<string, (...args: unknown[]) => Promise<unknown>>>(
    service: T,
    defaultContext: SecurityContext
  ): T {
    const wrappedService = {} as T;

    for (const [methodName, method] of Object.entries(service)) {
      if (typeof method === 'function') {
        wrappedService[methodName as keyof T] = (async (...args: unknown[]) => {
          // Extract content from first argument if it's a string or has content property
          let content = '';
          if (args.length > 0) {
            if (typeof args[0] === 'string') {
              content = args[0];
            } else if (typeof args[0] === 'object' && args[0] !== null && 'content' in args[0]) {
              content = String((args[0] as { content: unknown }).content);
            }
          }

          const request = {
            content,
            action: {
              type: 'query' as const,
              source: service.constructor.name,
              method: methodName,
              ipAddress: defaultContext.ipAddress,
              userAgent: defaultContext.userAgent,
            },
          };

          const secureResult = await this.secureAICall(
            method.bind(service),
            defaultContext,
            request,
            ...args
          );

          return secureResult.result;
        }) as T[keyof T];
      }
    }

    return wrappedService;
  }
}

// Export singleton instance
export const aiSecurityMiddleware = AISecurityMiddleware.getInstance();
