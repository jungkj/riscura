import { z } from 'zod';

/**
 * XSS Protection and Input Sanitization
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  public static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize plain text input
   */
  public static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[char] || char;
      })
      .trim();
  }

  /**
   * Validate and sanitize file names
   */
  public static sanitizeFileName(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';

    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }

  /**
   * Sanitize URL to prevent open redirects
   */
  public static sanitizeUrl(url: string, allowedDomains: string[] = []): string | null {
    if (!url || typeof url !== 'string') return null;

    try {
      const parsedUrl = new URL(url);

      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return null;
      }

      // Check against allowed domains if provided
      if (allowedDomains.length > 0) {
        if (!allowedDomains.some((domain) => parsedUrl.hostname.endsWith(domain))) {
          return null;
        }
      }

      return parsedUrl.toString();
    } catch {
      return null;
    }
  }
}

/**
 * Comprehensive API Input Validation Schemas
 */
export const ApiValidationSchemas = {
  // User Authentication
  loginSchema: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    rememberMe: z.boolean().optional(),
    csrfToken: z.string().optional(),
  }),

  // User Registration
  registerSchema: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    firstName: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z\s]+$/, 'Invalid first name'),
    lastName: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z\s]+$/, 'Invalid last name'),
    organizationName: z.string().min(1).max(100).optional(),
    csrfToken: z.string().optional(),
  }),

  // Risk Management
  riskSchema: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(2000),
    category: z.enum(['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY']),
    likelihood: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    owner: z.string().uuid().optional(),
    dateIdentified: z.string().datetime().optional(),
    nextReview: z.string().datetime().optional(),
  }),

  // Control Management
  controlSchema: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(2000),
    type: z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE', 'DIRECTIVE', 'COMPENSATING']),
    frequency: z.string().min(1).max(50),
    effectiveness: z.number().min(0).max(1),
    owner: z.string().uuid().optional(),
    lastTestDate: z.string().datetime().optional(),
    nextTestDate: z.string().datetime().optional(),
  }),

  // Search and Pagination
  searchSchema: z.object({
    query: z.string().max(500).optional(),
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

/**
 * Request Validator Middleware
 */
export class RequestValidator {
  /**
   * Validate request body against schema
   */
  public static validateBody<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      const _result = schema.safeParse(data);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        return { success: false, errors };
      }
    } catch (error) {
      return { success: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate and sanitize request
   */
  public static validateAndSanitize<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    sanitizeHtml: boolean = true
  ): { success: true; data: T } | { success: false; errors: string[] } {
    // First validate structure
    const validation = this.validateBody(schema, data);

    if (!validation.success) {
      return validation;
    }

    // Then sanitize string fields if requested
    if (sanitizeHtml && typeof validation.data === 'object' && validation.data !== null) {
      const sanitized = this.sanitizeObject(validation.data);
      return { success: true, data: sanitized as T };
    }

    return validation;
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return InputSanitizer.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * File Upload Security
 */
export class FileUploadValidator {
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/csv',
  ]);

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Validate file upload
   */
  public static validateFile(_file: {
    name: string;
    type: string;
    size: number;
    buffer?: Buffer;
  }): { valid: true } | { valid: false; errors: string[] } {
    const errors: string[] = [];

    // Check file name
    if (!file.name || file.name.length > 255) {
      errors.push('Invalid file name');
    }

    // Check file extension
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png', '.txt', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} not allowed`);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.has(file.type)) {
      errors.push(`MIME type ${file.type} not allowed`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }
}
