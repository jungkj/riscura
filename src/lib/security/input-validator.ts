// Advanced Input Validation and Sanitization System
import DOMPurify from 'dompurify';
import { z } from 'zod';

export interface ValidationRule {
  id: string;
  name: string;
  pattern: RegExp;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: any;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  threatLevel: 'safe' | 'suspicious' | 'dangerous' | 'critical';
  bytesSanitized: number;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  originalValue: any;
  suggestedValue?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: 'encoding' | 'format' | 'length' | 'content';
}

export interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  allowedSchemes: string[];
  maxLength: number;
  stripComments: boolean;
  stripScripts: boolean;
  stripStyles: boolean;
  normalizeWhitespace: boolean;
  enableContentFiltering: boolean;
  customRules: ValidationRule[];
}

export interface ContentFilterRule {
  id: string;
  pattern: RegExp;
  action: 'block' | 'sanitize' | 'flag';
  category: 'profanity' | 'spam' | 'malicious' | 'pii' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  replacement?: string;
}

class InputValidator {
  private validationRules: Map<string, ValidationRule> = new Map();
  private contentFilterRules: Map<string, ContentFilterRule> = new Map();
  private sanitizationStats = {
    totalValidations: 0,
    totalSanitizations: 0,
    threatsBlocked: 0,
    bytesSanitized: 0,
  };

  constructor() {
    this.setupDefaultRules();
    this.setupContentFilters();
  }

  private setupDefaultRules(): void {
    // XSS Detection Rules
    this.addValidationRule({
      id: 'xss-script-tag',
      name: 'Script Tag Detection',
      pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      message: 'Script tags are not allowed',
      severity: 'critical',
      enabled: true,
    });

    this.addValidationRule({
      id: 'xss-javascript-protocol',
      name: 'JavaScript Protocol Detection',
      pattern: /javascript:/gi,
      message: 'JavaScript protocol is not allowed',
      severity: 'critical',
      enabled: true,
    });

    this.addValidationRule({
      id: 'xss-event-handlers',
      name: 'Event Handler Detection',
      pattern: /on\w+\s*=/gi,
      message: 'Event handlers are not allowed',
      severity: 'high',
      enabled: true,
    });

    this.addValidationRule({
      id: 'xss-data-uri',
      name: 'Suspicious Data URI',
      pattern: /data:(?!image\/[a-z]+;base64,)[^;]+/gi,
      message: 'Suspicious data URI detected',
      severity: 'medium',
      enabled: true,
    });

    // SQL Injection Detection Rules
    this.addValidationRule({
      id: 'sql-injection-union',
      name: 'SQL Union Injection',
      pattern: /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/gi,
      message: 'SQL injection attempt detected (UNION)',
      severity: 'critical',
      enabled: true,
    });

    this.addValidationRule({
      id: 'sql-injection-comment',
      name: 'SQL Comment Injection',
      pattern: /(--|\#|\/\*|\*\/)/g,
      message: 'SQL comment injection attempt detected',
      severity: 'high',
      enabled: true,
    });

    this.addValidationRule({
      id: 'sql-injection-keywords',
      name: 'SQL Keyword Injection',
      pattern:
        /(\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b|\bexec\b|\bexecute\b).*(\btable\b|\bfrom\b|\binto\b|\bvalues\b)/gi,
      message: 'SQL injection keywords detected',
      severity: 'critical',
      enabled: true,
    });

    // Path Traversal Detection
    this.addValidationRule({
      id: 'path-traversal',
      name: 'Path Traversal Detection',
      pattern: /(\.\.[\/\\])|([\/\\]\.\.[\/\\])|(\.\.[\/\\].*[\/\\])/g,
      message: 'Path traversal attempt detected',
      severity: 'high',
      enabled: true,
    });

    // Command Injection Detection
    this.addValidationRule({
      id: 'command-injection',
      name: 'Command Injection Detection',
      pattern: /[;&|`$(){}[\]]/g,
      message: 'Command injection characters detected',
      severity: 'high',
      enabled: true,
    });

    // Email Validation
    this.addValidationRule({
      id: 'email-format',
      name: 'Email Format Validation',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format',
      severity: 'medium',
      enabled: true,
    });

    // Phone Number Validation
    this.addValidationRule({
      id: 'phone-format',
      name: 'Phone Number Format',
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Invalid phone number format',
      severity: 'low',
      enabled: true,
    });

    // URL Validation
    this.addValidationRule({
      id: 'url-format',
      name: 'URL Format Validation',
      pattern:
        /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
      message: 'Invalid URL format',
      severity: 'medium',
      enabled: true,
    });
  }

  private setupContentFilters(): void {
    // Profanity Filter
    this.addContentFilterRule({
      id: 'profanity-basic',
      pattern: /\b(damn|hell|crap|shit|fuck|bitch|asshole)\b/gi,
      action: 'sanitize',
      category: 'profanity',
      severity: 'low',
      replacement: '***',
    });

    // PII Detection
    this.addContentFilterRule({
      id: 'ssn-detection',
      pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      action: 'flag',
      category: 'pii',
      severity: 'high',
    });

    this.addContentFilterRule({
      id: 'credit-card-detection',
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      action: 'block',
      category: 'pii',
      severity: 'critical',
    });

    // Spam Detection
    this.addContentFilterRule({
      id: 'spam-keywords',
      pattern: /\b(buy now|click here|free money|guaranteed|limited time|act now)\b/gi,
      action: 'flag',
      category: 'spam',
      severity: 'medium',
    });

    // Malicious Content
    this.addContentFilterRule({
      id: 'malicious-links',
      pattern: /\b(bit\.ly|tinyurl|t\.co|goo\.gl)\/\w+/gi,
      action: 'flag',
      category: 'malicious',
      severity: 'medium',
    });
  }

  // Main validation function
  public validate(
    input: any,
    schema?: z.ZodSchema,
    config?: Partial<SanitizationConfig>
  ): ValidationResult {
    this.sanitizationStats.totalValidations++;

    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: input,
      errors: [],
      warnings: [],
      threatLevel: 'safe',
      bytesSanitized: 0,
    };

    try {
      // Schema validation first
      if (schema) {
        const schemaResult = schema.safeParse(input);
        if (!schemaResult.success) {
          result.isValid = false;
          schemaResult.error.errors.forEach((error) => {
            result.errors.push({
              field: error.path.join('.'),
              rule: 'schema-validation',
              message: error.message,
              severity: 'medium',
              originalValue: input,
            });
          });
        }
      }

      // Process based on input type
      if (typeof input === 'string') {
        const stringResult = this.validateString(input, config);
        this.mergeResults(result, stringResult);
      } else if (typeof input === 'object' && input !== null) {
        const objectResult = this.validateObject(input, config);
        this.mergeResults(result, objectResult);
      } else if (Array.isArray(input)) {
        const arrayResult = this.validateArray(input, config);
        this.mergeResults(result, arrayResult);
      }

      // Determine overall threat level
      result.threatLevel = this.determineThreatLevel(result.errors);

      // Update statistics
      if (result.bytesSanitized > 0) {
        this.sanitizationStats.totalSanitizations++;
        this.sanitizationStats.bytesSanitized += result.bytesSanitized;
      }

      if (result.threatLevel === 'dangerous' || result.threatLevel === 'critical') {
        this.sanitizationStats.threatsBlocked++;
      }
    } catch (error) {
      console.error('Validation error:', error);
      result.isValid = false;
      result.errors.push({
        field: 'root',
        rule: 'validation-error',
        message: 'Internal validation error occurred',
        severity: 'high',
        originalValue: input,
      });
    }

    return result;
  }

  // String validation and sanitization
  private validateString(input: string, config?: Partial<SanitizationConfig>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: input,
      errors: [],
      warnings: [],
      threatLevel: 'safe',
      bytesSanitized: 0,
    };

    const originalLength = input.length;
    let sanitizedValue = input;

    // Apply validation rules
    for (const rule of this.validationRules.values()) {
      if (!rule.enabled) continue;

      if (rule.pattern.test(input)) {
        result.errors.push({
          field: 'string',
          rule: rule.id,
          message: rule.message,
          severity: rule.severity,
          originalValue: input,
        });

        if (rule.severity === 'critical' || rule.severity === 'high') {
          result.isValid = false;
        }
      }
    }

    // Apply content filters
    for (const filter of this.contentFilterRules.values()) {
      if (filter.pattern.test(sanitizedValue)) {
        switch (filter.action) {
          case 'block':
            result.isValid = false;
            result.errors.push({
              field: 'string',
              rule: filter.id,
              message: `Content blocked: ${filter.category}`,
              severity: filter.severity,
              originalValue: input,
            });
            break;

          case 'sanitize':
            if (filter.replacement) {
              sanitizedValue = sanitizedValue.replace(filter.pattern, filter.replacement);
            }
            break;

          case 'flag':
            result.warnings.push({
              field: 'string',
              message: `Flagged content: ${filter.category}`,
              type: 'content',
            });
            break;
        }
      }
    }

    // HTML sanitization
    if (this.containsHTML(sanitizedValue)) {
      const sanitizedHTML = this.sanitizeHTML(sanitizedValue, config);
      sanitizedValue = sanitizedHTML;

      result.warnings.push({
        field: 'string',
        message: 'HTML content was sanitized',
        type: 'content',
      });
    }

    // Length validation
    const maxLength = config?.maxLength || 10000;
    if (sanitizedValue.length > maxLength) {
      sanitizedValue = sanitizedValue.substring(0, maxLength);
      result.warnings.push({
        field: 'string',
        message: `Content truncated to ${maxLength} characters`,
        type: 'length',
      });
    }

    // Normalize whitespace
    if (config?.normalizeWhitespace !== false) {
      const normalized = sanitizedValue.replace(/\s+/g, ' ').trim();
      if (normalized !== sanitizedValue) {
        sanitizedValue = normalized;
        result.warnings.push({
          field: 'string',
          message: 'Whitespace was normalized',
          type: 'format',
        });
      }
    }

    result.sanitizedValue = sanitizedValue;
    result.bytesSanitized = originalLength - sanitizedValue.length;

    return result;
  }

  // Object validation
  private validateObject(
    input: Record<string, any>,
    config?: Partial<SanitizationConfig>
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: {},
      errors: [],
      warnings: [],
      threatLevel: 'safe',
      bytesSanitized: 0,
    };

    for (const [key, value] of Object.entries(input)) {
      // Validate key
      const keyResult = this.validateString(key, config);
      if (!keyResult.isValid) {
        result.isValid = false;
        keyResult.errors.forEach((error) => {
          result.errors.push({
            ...error,
            field: `key:${key}`,
          });
        });
        continue;
      }

      // Validate value
      const valueResult = this.validate(value, undefined, config);
      result.sanitizedValue[keyResult.sanitizedValue] = valueResult.sanitizedValue;

      if (!valueResult.isValid) {
        result.isValid = false;
      }

      // Merge errors and warnings with field prefixes
      valueResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `${key}.${error.field}`,
        });
      });

      valueResult.warnings.forEach((warning) => {
        result.warnings.push({
          ...warning,
          field: `${key}.${warning.field}`,
        });
      });

      result.bytesSanitized += valueResult.bytesSanitized;
    }

    return result;
  }

  // Array validation
  private validateArray(input: any[], config?: Partial<SanitizationConfig>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: [],
      errors: [],
      warnings: [],
      threatLevel: 'safe',
      bytesSanitized: 0,
    };

    input.forEach((item, index) => {
      const itemResult = this.validate(item, undefined, config);
      result.sanitizedValue.push(itemResult.sanitizedValue);

      if (!itemResult.isValid) {
        result.isValid = false;
      }

      // Merge errors and warnings with array index
      itemResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `[${index}].${error.field}`,
        });
      });

      itemResult.warnings.forEach((warning) => {
        result.warnings.push({
          ...warning,
          field: `[${index}].${warning.field}`,
        });
      });

      result.bytesSanitized += itemResult.bytesSanitized;
    });

    return result;
  }

  // HTML sanitization using DOMPurify
  private sanitizeHTML(input: string, config?: Partial<SanitizationConfig>): string {
    const defaultConfig: SanitizationConfig = {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      allowedAttributes: {
        a: ['href', 'title'],
        '*': ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      maxLength: 10000,
      stripComments: true,
      stripScripts: true,
      stripStyles: true,
      normalizeWhitespace: true,
      enableContentFiltering: true,
      customRules: [],
    };

    const mergedConfig = { ...defaultConfig, ...config };

    try {
      // Configure DOMPurify
      const purifyConfig: any = {
        ALLOWED_TAGS: mergedConfig.allowedTags,
        ALLOWED_ATTR: Object.values(mergedConfig.allowedAttributes).flat(),
        ALLOWED_URI_REGEXP: new RegExp(`^(?:(?:${mergedConfig.allowedSchemes.join('|')}):)`),
      };

      if (mergedConfig.stripComments) {
        purifyConfig.REMOVE_COMMENTS = true;
      }

      if (mergedConfig.stripScripts) {
        purifyConfig.FORBID_TAGS = ['script', 'object', 'embed', 'iframe'];
      }

      if (mergedConfig.stripStyles) {
        purifyConfig.FORBID_ATTR = ['style', 'onload', 'onerror'];
      }

      const sanitized = DOMPurify.sanitize(input, purifyConfig);
      return typeof sanitized === 'string' ? sanitized : sanitized.toString();
    } catch (error) {
      console.error('HTML sanitization error:', error);
      // Fallback: strip all HTML tags
      return input.replace(/<[^>]*>/g, '');
    }
  }

  // Helper methods
  private containsHTML(input: string): boolean {
    return /<[^>]*>/g.test(input);
  }

  private mergeResults(target: ValidationResult, source: ValidationResult): void {
    target.sanitizedValue = source.sanitizedValue;
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);
    target.bytesSanitized += source.bytesSanitized;

    if (!source.isValid) {
      target.isValid = false;
    }
  }

  private determineThreatLevel(
    errors: ValidationError[]
  ): 'safe' | 'suspicious' | 'dangerous' | 'critical' {
    const criticalErrors = errors.filter((e) => e.severity === 'critical');
    const highErrors = errors.filter((e) => e.severity === 'high');
    const mediumErrors = errors.filter((e) => e.severity === 'medium');

    if (criticalErrors.length > 0) return 'critical';
    if (highErrors.length > 2) return 'dangerous';
    if (highErrors.length > 0 || mediumErrors.length > 3) return 'suspicious';
    return 'safe';
  }

  // Management methods
  public addValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  public removeValidationRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
  }

  public addContentFilterRule(rule: ContentFilterRule): void {
    this.contentFilterRules.set(rule.id, rule);
  }

  public removeContentFilterRule(ruleId: string): void {
    this.contentFilterRules.delete(ruleId);
  }

  public getValidationRules(): ValidationRule[] {
    return Array.from(this.validationRules.values());
  }

  public getContentFilterRules(): ContentFilterRule[] {
    return Array.from(this.contentFilterRules.values());
  }

  public getStatistics() {
    return { ...this.sanitizationStats };
  }

  public clearStatistics(): void {
    this.sanitizationStats = {
      totalValidations: 0,
      totalSanitizations: 0,
      threatsBlocked: 0,
      bytesSanitized: 0,
    };
  }
}

// Predefined schemas for common use cases
export const commonSchemas = {
  email: z.string().email(),
  url: z.string().url(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/),
  description: z.string().max(1000),
  id: z.string().uuid(),
  positiveInteger: z.number().int().positive(),
  date: z.string().datetime(),
};

// Create singleton instance
export const inputValidator = new InputValidator();

// Convenience functions
export function validateEmail(email: string): ValidationResult {
  return inputValidator.validate(email, commonSchemas.email);
}

export function validatePassword(password: string): ValidationResult {
  return inputValidator.validate(password, commonSchemas.password);
}

export function validateURL(url: string): ValidationResult {
  return inputValidator.validate(url, commonSchemas.url);
}

export function sanitizeHTML(html: string, config?: Partial<SanitizationConfig>): string {
  const result = inputValidator.validate(html, undefined, config);
  return result.sanitizedValue;
}

// Export class for custom instances
export { InputValidator };
