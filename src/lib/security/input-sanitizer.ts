import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { productionGuard } from '@/lib/security/production-guard';

/**
 * Input Sanitization and Validation System
 * Implements comprehensive protection against XSS, SQL injection, and other attacks
 */

export interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  allowedSchemes: string[];
  maxLength: number;
  stripHtml: boolean;
  encodeEntities: boolean;
  allowDataAttributes: boolean;
  allowCustomElements: boolean;
}

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
  customValidator?: (value: string) => boolean;
}

export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  scanForMalware?: boolean;
  checkImageDimensions?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Default sanitization configurations for different contexts
 */
const SANITIZATION_CONFIGS: Record<string, SanitizationConfig> = {
  // Strict sanitization for user content
  strict: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    allowedAttributes: {
      '*': ['class']
    },
    allowedSchemes: [],
    maxLength: 10000,
    stripHtml: false,
    encodeEntities: true,
    allowDataAttributes: false,
    allowCustomElements: false
  },

  // Basic sanitization for comments and descriptions
  basic: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'blockquote'],
    allowedAttributes: {
      'a': ['href', 'title'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    maxLength: 50000,
    stripHtml: false,
    encodeEntities: true,
    allowDataAttributes: false,
    allowCustomElements: false
  },

  // Rich text for documents and reports
  rich: {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'img', 'span', 'div'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'width', 'height'],
      'table': ['class'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan'],
      '*': ['class', 'id']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    maxLength: 100000,
    stripHtml: false,
    encodeEntities: true,
    allowDataAttributes: true,
    allowCustomElements: false
  },

  // Plain text only
  text: {
    allowedTags: [],
    allowedAttributes: {},
    allowedSchemes: [],
    maxLength: 10000,
    stripHtml: true,
    encodeEntities: true,
    allowDataAttributes: false,
    allowCustomElements: false
  }
};

/**
 * Input Sanitizer class
 */
export class InputSanitizer {
  private static instance: InputSanitizer;

  private constructor() {}

  public static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(input: string, config: SanitizationConfig = SANITIZATION_CONFIGS.basic): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      // Check length limit
      if (input.length > config.maxLength) {
        productionGuard.logSecurityEvent('input_length_exceeded', {
          inputLength: input.length,
          maxLength: config.maxLength,
          truncated: true
        });
        input = input.substring(0, config.maxLength);
      }

      if (config.stripHtml) {
        // Strip all HTML tags
        return validator.stripLow(validator.escape(input));
      }

      // Configure DOMPurify
      const purifyConfig: any = {
        ALLOWED_TAGS: config.allowedTags,
        ALLOWED_ATTR: Object.keys(config.allowedAttributes).reduce((acc, tag) => {
          if (tag === '*') {
            acc.push(...config.allowedAttributes[tag]);
          } else {
            acc.push(...config.allowedAttributes[tag].map(attr => `${tag}:${attr}`));
          }
          return acc;
        }, [] as string[]),
        ALLOWED_URI_REGEXP: config.allowedSchemes.length > 0 
          ? new RegExp(`^(${config.allowedSchemes.join('|')}):|^(?!javascript:)`, 'i')
          : /^(?!javascript:)/i,
        ALLOW_DATA_ATTR: config.allowDataAttributes,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SANITIZE_DOM: true,
        KEEP_CONTENT: false,
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
        USE_PROFILES: { html: true }
      };

      // Custom hook to log blocked content
      DOMPurify.addHook('uponSanitizeElement', (node: any, data: any) => {
        if (data.tagName && !config.allowedTags.includes(data.tagName.toLowerCase())) {
          productionGuard.logSecurityEvent('html_tag_blocked', {
            tagName: data.tagName,
            context: 'sanitization'
          });
        }
      });

      DOMPurify.addHook('uponSanitizeAttribute', (node: any, data: any) => {
        if (data.attrName && data.attrName.startsWith('on')) {
          productionGuard.logSecurityEvent('event_handler_blocked', {
            attribute: data.attrName,
            value: data.attrValue,
            context: 'sanitization'
          });
        }
      });

      const sanitized = DOMPurify.sanitize(input, purifyConfig);

      // Encode entities if requested
      if (config.encodeEntities) {
        return validator.escape(sanitized);
      }

      return sanitized;

    } catch (error) {
      productionGuard.logSecurityEvent('sanitization_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        inputLength: input?.length || 0
      });

      // Fallback to basic escaping
      return validator.escape(input.substring(0, 1000));
    }
  }

  /**
   * Sanitize text input (no HTML allowed)
   */
  sanitizeText(input: string, options: ValidationOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      let sanitized = input;

      // Trim whitespace
      sanitized = sanitized.trim();

      // Check required field
      if (options.required && !sanitized) {
        throw new Error('Required field cannot be empty');
      }

      // Check length constraints
      if (options.minLength && sanitized.length < options.minLength) {
        throw new Error(`Input must be at least ${options.minLength} characters`);
      }

      if (options.maxLength && sanitized.length > options.maxLength) {
        productionGuard.logSecurityEvent('text_length_exceeded', {
          inputLength: sanitized.length,
          maxLength: options.maxLength
        });
        sanitized = sanitized.substring(0, options.maxLength);
      }

      // Apply pattern validation
      if (options.pattern && !options.pattern.test(sanitized)) {
        throw new Error('Input does not match required pattern');
      }

      // Custom validation
      if (options.customValidator && !options.customValidator(sanitized)) {
        throw new Error('Input failed custom validation');
      }

      // Remove null bytes and control characters
      sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      // Escape HTML entities
      sanitized = validator.escape(sanitized);

      // Remove potentially dangerous sequences
      sanitized = this.removeDangerousPatterns(sanitized);

      return sanitized;

    } catch (error) {
      productionGuard.logSecurityEvent('text_sanitization_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        inputLength: input?.length || 0
      });
      throw error;
    }
  }

  /**
   * Sanitize email address
   */
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Email address is required');
    }

    const sanitized = email.toLowerCase().trim();

    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email address format');
    }

    // Additional security checks
    if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
      productionGuard.logSecurityEvent('malicious_email_blocked', {
        email: sanitized.substring(0, 20) + '...'
      });
      throw new Error('Invalid email address');
    }

    return sanitized;
  }

  /**
   * Sanitize URL
   */
  sanitizeUrl(url: string, allowedSchemes: string[] = ['http', 'https']): string {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required');
    }

    const trimmed = url.trim();

    // Basic URL validation
    if (!validator.isURL(trimmed, {
      protocols: allowedSchemes,
      require_protocol: true,
      allow_underscores: false
    })) {
      throw new Error('Invalid URL format');
    }

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    const lowerUrl = trimmed.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        productionGuard.logSecurityEvent('dangerous_url_blocked', {
          url: trimmed.substring(0, 50) + '...',
          protocol
        });
        throw new Error('URL protocol not allowed');
      }
    }

    return trimmed;
  }

  /**
   * Sanitize file upload
   */
  validateFile(file: File, options: FileValidationOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check file size
      if (file.size > options.maxSize) {
        errors.push(`File size ${file.size} exceeds maximum allowed size ${options.maxSize}`);
      }

      // Check file type
      if (options.allowedTypes.length > 0 && !options.allowedTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed`);
        productionGuard.logSecurityEvent('file_type_blocked', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
      }

      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && options.allowedExtensions.length > 0 && !options.allowedExtensions.includes(extension)) {
        errors.push(`File extension .${extension} is not allowed`);
      }

      // Check for dangerous file names
      if (this.isDangerousFileName(file.name)) {
        errors.push('File name contains dangerous characters');
        productionGuard.logSecurityEvent('dangerous_filename_blocked', {
          fileName: file.name
        });
      }

      // Basic malware scanning (check for suspicious patterns)
      if (options.scanForMalware) {
        // This is a basic implementation - in production, use a proper malware scanner
        const suspiciousPatterns = [
          /eval\s*\(/i,
          /document\.write/i,
          /\.exe$/i,
          /\.bat$/i,
          /\.cmd$/i,
          /\.scr$/i,
          /\.com$/i,
          /\.pif$/i,
          /\.vbs$/i,
          /\.js$/i,
          /\.jar$/i
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(file.name)) {
            errors.push('File appears to contain suspicious content');
            productionGuard.logSecurityEvent('suspicious_file_blocked', {
              fileName: file.name,
              pattern: pattern.toString()
            });
            break;
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      productionGuard.logSecurityEvent('file_validation_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name
      });

      return {
        isValid: false,
        errors: ['File validation failed']
      };
    }
  }

  /**
   * Remove dangerous patterns from text
   */
  private removeDangerousPatterns(input: string): string {
    const dangerousPatterns = [
      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      // Script injection patterns
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      // Expression injection patterns
      /\$\{.*?\}/g,
      /<%.*?%>/g,
      // Path traversal patterns
      /\.\.\//g,
      /\.\.\\/g,
      // Null byte injection
      /\0/g,
      // LDAP injection patterns
      /[()&|!]/g
    ];

    let sanitized = input;
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        productionGuard.logSecurityEvent('dangerous_pattern_removed', {
          pattern: pattern.toString(),
          originalLength: sanitized.length
        });
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return sanitized;
  }

  /**
   * Check if filename is dangerous
   */
  private isDangerousFileName(filename: string): boolean {
    const dangerousPatterns = [
      /\.\./,  // Path traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,  // Windows reserved names
      /^\./,  // Hidden files starting with dot
      /\s+$/,  // Trailing whitespace
      /\0/,  // Null bytes
      /[\x00-\x1f\x7f]/  // Control characters
    ];

    return dangerousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Sanitize JSON object recursively
   */
  sanitizeObject(obj: any, config: SanitizationConfig = SANITIZATION_CONFIGS.basic): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, config));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeHtml(value, config);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value, config);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize search query
   */
  sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Remove dangerous SQL and regex patterns
    let sanitized = query
      .replace(/['"`;\\]/g, '') // Remove quotes and SQL terminators
      .replace(/\$\{.*?\}/g, '') // Remove expression injection
      .replace(/\.\*/g, '') // Remove regex wildcards
      .trim();

    // Limit length
    sanitized = sanitized.substring(0, 200);

    // Escape special characters for safe database queries
    sanitized = validator.escape(sanitized);

    productionGuard.logSecurityEvent('search_query_sanitized', {
      originalLength: query.length,
      sanitizedLength: sanitized.length,
      containedSpecialChars: query !== sanitized
    });

    return sanitized;
  }

  /**
   * Batch sanitize multiple inputs
   */
  sanitizeBatch(inputs: Record<string, any>, config: SanitizationConfig = SANITIZATION_CONFIGS.basic): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(inputs)) {
      try {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeHtml(value, config);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value, config);
        } else {
          sanitized[key] = value;
        }
      } catch (error) {
        productionGuard.logSecurityEvent('batch_sanitization_error', {
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Skip invalid inputs
        continue;
      }
    }

    return sanitized;
  }

  /**
   * Get sanitization statistics
   */
  getStats(): {
    totalSanitized: number;
    blockedPatterns: number;
    errorCount: number;
  } {
    // This would integrate with a metrics system in production
    return {
      totalSanitized: 0,
      blockedPatterns: 0,
      errorCount: 0
    };
  }
}

// Export singleton instance
export const inputSanitizer = InputSanitizer.getInstance();

// Utility functions
export function sanitizeHtml(input: string, configName: keyof typeof SANITIZATION_CONFIGS = 'basic'): string {
  return inputSanitizer.sanitizeHtml(input, SANITIZATION_CONFIGS[configName]);
}

export function sanitizeText(input: string, options?: ValidationOptions): string {
  return inputSanitizer.sanitizeText(input, options);
}

export function sanitizeEmail(email: string): string {
  return inputSanitizer.sanitizeEmail(email);
}

export function sanitizeUrl(url: string, allowedSchemes?: string[]): string {
  return inputSanitizer.sanitizeUrl(url, allowedSchemes);
}

export function validateFile(file: File, options: FileValidationOptions): { isValid: boolean; errors: string[] } {
  return inputSanitizer.validateFile(file, options);
}

export function sanitizeObject(obj: any, configName: keyof typeof SANITIZATION_CONFIGS = 'basic'): any {
  return inputSanitizer.sanitizeObject(obj, SANITIZATION_CONFIGS[configName]);
}

export function sanitizeSearchQuery(query: string): string {
  return inputSanitizer.sanitizeSearchQuery(query);
}

// Export configurations for customization
export { SANITIZATION_CONFIGS }; 