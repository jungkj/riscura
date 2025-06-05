import { z } from 'zod';

// Validation Service for comprehensive data validation
export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // Base schemas
  private baseSchemas = {
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    url: z.string().url('Invalid URL format'),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
    alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed'),
    nonEmpty: z.string().min(1, 'This field is required'),
    positiveNumber: z.number().positive('Must be a positive number'),
    percentage: z.number().min(0).max(100, 'Must be between 0 and 100')
  };

  // Questionnaire validation schemas
  public questionnaireSchemas = {
    basic: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
      description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
      category: z.enum(['risk_assessment', 'compliance_audit', 'control_testing', 'vendor_assessment', 'security_review']),
      type: z.enum(['static', 'adaptive', 'conditional']),
      version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y')
    }),

    section: z.object({
      id: z.string().min(1, 'Section ID is required'),
      title: z.string().min(1, 'Section title is required').max(150, 'Title too long'),
      description: z.string().max(500, 'Description too long').optional(),
      order: z.number().int().nonnegative('Order must be non-negative'),
      required: z.boolean().default(false)
    }),

    question: z.object({
      id: z.string().min(1, 'Question ID is required'),
      text: z.string().min(1, 'Question text is required').max(500, 'Question too long'),
      type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'number', 'date', 'file', 'rating', 'matrix', 'ranking']),
      required: z.boolean().default(false),
      options: z.array(z.object({
        label: z.string().min(1, 'Option label required'),
        value: z.string().min(1, 'Option value required'),
        description: z.string().optional()
      })).optional(),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
        customMessage: z.string().optional()
      }).optional(),
      conditionalLogic: z.object({
        dependsOn: z.string().optional(),
        condition: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']).optional(),
        value: z.any().optional()
      }).optional()
    }),

    config: z.object({
      allowPartialSave: z.boolean().default(true),
      requiresApproval: z.boolean().default(false),
      randomizeQuestions: z.boolean().default(false),
      showProgress: z.boolean().default(true),
      allowSkipping: z.boolean().default(false),
      requiredCompletion: z.number().min(0).max(100).default(100),
      timeLimit: z.number().positive().optional(),
      maxRetries: z.number().int().nonnegative().optional()
    })
  };

  // Risk validation schemas
  public riskSchemas = {
    basic: z.object({
      title: z.string().min(1, 'Risk title is required').max(200, 'Title too long'),
      description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
      category: z.enum(['operational', 'financial', 'strategic', 'compliance', 'technology', 'reputational']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      likelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain']),
      status: z.enum(['open', 'in_progress', 'mitigated', 'closed', 'monitoring'])
    }),

    assessment: z.object({
      impactScore: z.number().min(1).max(5, 'Impact score must be 1-5'),
      likelihoodScore: z.number().min(1).max(5, 'Likelihood score must be 1-5'),
      riskScore: z.number().min(1).max(25, 'Risk score must be 1-25'),
      inherentRisk: z.number().min(1).max(25).optional(),
      residualRisk: z.number().min(1).max(25).optional(),
      tolerance: z.enum(['low', 'medium', 'high']),
      appetite: z.enum(['averse', 'minimal', 'cautious', 'open', 'hungry'])
    }),

    mitigation: z.object({
      strategy: z.enum(['avoid', 'mitigate', 'transfer', 'accept']),
      controls: z.array(z.string()).min(1, 'At least one control required'),
      timeline: z.string().min(1, 'Timeline is required'),
      owner: z.string().min(1, 'Owner is required'),
      budget: z.number().nonnegative('Budget must be non-negative').optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical'])
    })
  };

  // Control validation schemas
  public controlSchemas = {
    basic: z.object({
      title: z.string().min(1, 'Control title is required').max(200, 'Title too long'),
      description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
      type: z.enum(['preventive', 'detective', 'corrective', 'compensating']),
      category: z.enum(['access', 'physical', 'technical', 'administrative', 'operational']),
      framework: z.enum(['iso27001', 'nist', 'sox', 'pci', 'gdpr', 'custom']),
      status: z.enum(['designed', 'implemented', 'operating', 'ineffective', 'not_applicable'])
    }),

    implementation: z.object({
      implementationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
      owner: z.string().min(1, 'Owner is required'),
      frequency: z.enum(['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
      automation: z.enum(['manual', 'semi_automated', 'fully_automated']),
      testingFrequency: z.enum(['monthly', 'quarterly', 'semi_annually', 'annually']),
      lastTested: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional()
    }),

    effectiveness: z.object({
      rating: z.enum(['effective', 'largely_effective', 'partially_effective', 'ineffective']),
      evidence: z.string().min(1, 'Evidence is required'),
      deficiencies: z.array(z.string()).optional(),
      recommendations: z.array(z.string()).optional(),
      nextReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    })
  };

  // User validation schemas
  public userSchemas = {
    registration: z.object({
      firstName: z.string().min(1, 'First name is required').max(50, 'Name too long'),
      lastName: z.string().min(1, 'Last name is required').max(50, 'Name too long'),
      email: this.baseSchemas.email,
      password: this.baseSchemas.password,
      confirmPassword: z.string(),
      organization: z.string().min(1, 'Organization is required').max(100, 'Organization name too long'),
      role: z.enum(['admin', 'manager', 'analyst', 'auditor', 'viewer']).optional(),
      department: z.string().max(100, 'Department name too long').optional()
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    }),

    profile: z.object({
      firstName: z.string().min(1, 'First name is required').max(50, 'Name too long'),
      lastName: z.string().min(1, 'Last name is required').max(50, 'Name too long'),
      email: this.baseSchemas.email,
      phone: this.baseSchemas.phone.optional(),
      organization: z.string().min(1, 'Organization is required').max(100, 'Organization name too long'),
      department: z.string().max(100, 'Department name too long').optional(),
      jobTitle: z.string().max(100, 'Job title too long').optional(),
      bio: z.string().max(500, 'Bio too long').optional()
    }),

    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      language: z.enum(['en', 'es', 'fr', 'de', 'ja']).default('en'),
      timezone: z.string().default('UTC'),
      emailNotifications: z.boolean().default(true),
      smsNotifications: z.boolean().default(false),
      weeklyDigest: z.boolean().default(true),
      autoSave: z.boolean().default(true),
      autoSaveInterval: z.number().min(30).max(300).default(60) // seconds
    })
  };

  // Generic validation methods
  public validateField<T>(value: T, schema: z.ZodSchema<T>): {
    isValid: boolean;
    error?: string;
    data?: T;
  } {
    try {
      const result = schema.parse(value);
      return { isValid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || 'Validation failed' };
      }
      return { isValid: false, error: 'Unknown validation error' };
    }
  }

  public validateObject<T>(data: unknown, schema: z.ZodSchema<T>): {
    isValid: boolean;
    errors?: Record<string, string>;
    data?: T;
  } {
    try {
      const result = schema.parse(data);
      return { isValid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Unknown validation error' } };
    }
  }

  // Real-time validation
  public createValidator<T>(schema: z.ZodSchema<T>) {
    return {
      validate: (data: unknown) => this.validateObject(data, schema),
      validateField: (fieldName: string, value: unknown) => {
        try {
          const fieldSchema = (schema as any).shape[fieldName];
          if (!fieldSchema) {
            return { isValid: false, error: 'Field not found' };
          }
          return this.validateField(value, fieldSchema);
        } catch (error) {
          return { isValid: false, error: 'Validation error' };
        }
      }
    };
  }

  // Custom validation rules
  public customValidators = {
    strongPassword: (password: string): boolean => {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    },

    uniqueEmail: async (email: string): Promise<boolean> => {
      // This would typically check against a database
      // For demo purposes, return true
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 500);
      });
    },

    validDateRange: (startDate: string, endDate: string): boolean => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return start < end;
    },

    fileSize: (file: File, maxSizeMB: number): boolean => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      return file.size <= maxBytes;
    },

    fileType: (file: File, allowedTypes: string[]): boolean => {
      return allowedTypes.includes(file.type);
    },

    riskScoreCalculation: (impact: number, likelihood: number): number => {
      return impact * likelihood;
    },

    percentageSum: (values: number[]): boolean => {
      const sum = values.reduce((acc, val) => acc + val, 0);
      return Math.abs(sum - 100) < 0.01; // Allow for floating point precision
    }
  };

  // Form validation utilities
  public createFormValidator<T extends Record<string, any>>(schema: z.ZodSchema<T>) {
    return {
      validateAll: (data: T) => this.validateObject(data, schema),
      
      validatePartial: (data: Partial<T>) => {
        // For partial validation, we'll validate each field that exists
        const errors: Record<string, string> = {};
        let isValid = true;
        
        Object.entries(data).forEach(([key, value]) => {
          try {
            const fieldSchema = (schema as any).shape[key];
            if (fieldSchema) {
              const result = this.validateField(value, fieldSchema);
              if (!result.isValid && result.error) {
                errors[key] = result.error;
                isValid = false;
              }
            }
          } catch {
            // Ignore validation errors for partial validation
          }
        });
        
        return { isValid, errors: isValid ? undefined : errors, data: isValid ? data as T : undefined };
      },

      getFieldError: (fieldName: keyof T, value: any) => {
        try {
          const fieldSchema = (schema as any).shape[fieldName];
          if (!fieldSchema) return null;
          
          const result = validationService.validateField(value, fieldSchema);
          return result.error || null;
        } catch {
          return null;
        }
      },

      isFieldValid: (fieldName: keyof T, value: any) => {
        try {
          const fieldSchema = (schema as any).shape[fieldName];
          if (!fieldSchema) return false;
          
          const result = validationService.validateField(value, fieldSchema);
          return result.isValid;
        } catch {
          return false;
        }
      }
    };
  }

  // Sanitization utilities
  public sanitize = {
    html: (input: string): string => {
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    },

    sql: (input: string): string => {
      return input.replace(/[';\\]/g, '');
    },

    filename: (input: string): string => {
      return input.replace(/[^a-zA-Z0-9.-]/g, '_');
    },

    alphanumeric: (input: string): string => {
      return input.replace(/[^a-zA-Z0-9]/g, '');
    },

    trim: (input: string): string => {
      return input.trim();
    },

    normalize: (input: string): string => {
      return input.toLowerCase().trim().replace(/\s+/g, ' ');
    }
  };

  // Error message formatting
  public formatErrors(errors: Record<string, string>): string[] {
    return Object.entries(errors).map(([field, message]) => {
      const fieldName = field.split('.').pop() || field;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${message}`;
    });
  }

  public getFirstError(errors: Record<string, string>): string | null {
    const firstKey = Object.keys(errors)[0];
    return firstKey ? errors[firstKey] : null;
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();

// Export commonly used schemas
export const schemas = validationService.questionnaireSchemas;
export const riskSchemas = validationService.riskSchemas;
export const controlSchemas = validationService.controlSchemas;
export const userSchemas = validationService.userSchemas; 