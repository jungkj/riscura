import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiResponseFormatter, ResponseOptions } from './response-formatter';

// Error types and codes
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // File & Upload
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  ASSESSMENT_IN_PROGRESS = 'ASSESSMENT_IN_PROGRESS',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Base error interface
export interface BaseError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  cause?: Error;
  retryable?: boolean;
  userMessage?: string;
}

// Specific error classes
export class ApiError extends Error implements BaseError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, any>;
  public readonly cause?: Error;
  public readonly retryable: boolean;
  public readonly userMessage?: string;
  public readonly statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      cause?: Error;
      retryable?: boolean;
      userMessage?: string;
      statusCode?: number;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.context = options.context;
    this.cause = options.cause;
    this.retryable = options.retryable || false;
    this.userMessage = options.userMessage;
    this.statusCode = options.statusCode || this.getDefaultStatusCode(code);
  }

  private getDefaultStatusCode(code: ErrorCode): number {
    const statusMap: Record<ErrorCode, number> = {
      [ErrorCode.AUTH_REQUIRED]: 401,
      [ErrorCode.AUTH_INVALID]: 401,
      [ErrorCode.AUTH_EXPIRED]: 401,
      [ErrorCode.FORBIDDEN]: 403,
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
      [ErrorCode.VALIDATION_ERROR]: 400,
      [ErrorCode.INVALID_INPUT]: 400,
      [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
      [ErrorCode.INVALID_FORMAT]: 400,
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.ALREADY_EXISTS]: 409,
      [ErrorCode.CONFLICT]: 409,
      [ErrorCode.RESOURCE_LOCKED]: 423,
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
      [ErrorCode.TOO_MANY_REQUESTS]: 429,
      [ErrorCode.FILE_TOO_LARGE]: 413,
      [ErrorCode.INVALID_FILE_TYPE]: 415,
      [ErrorCode.UPLOAD_FAILED]: 422,
      [ErrorCode.DATABASE_ERROR]: 500,
      [ErrorCode.CONNECTION_ERROR]: 503,
      [ErrorCode.TRANSACTION_FAILED]: 500,
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
      [ErrorCode.AI_SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.EMAIL_SERVICE_ERROR]: 502,
      [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
      [ErrorCode.ASSESSMENT_IN_PROGRESS]: 409,
      [ErrorCode.INVALID_STATE_TRANSITION]: 422,
      [ErrorCode.INTERNAL_ERROR]: 500,
      [ErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.TIMEOUT]: 504,
      [ErrorCode.MAINTENANCE_MODE]: 503
    };

    return statusMap[code] || 500;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      statusCode: this.statusCode,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

// Validation error class
export class ValidationError extends ApiError {
  public readonly validationErrors: Array<{ field: string; message: string; code: string }>;

  constructor(
    errors: Array<{ field: string; message: string; code: string }>,
    message: string = 'Request validation failed'
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, {
      severity: ErrorSeverity.LOW,
      context: { validationErrors: errors },
      statusCode: 400
    });
    this.validationErrors = errors;
  }
}

// Business logic error class
export class BusinessLogicError extends ApiError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, {
      severity: ErrorSeverity.MEDIUM,
      context,
      statusCode: 422,
      userMessage: message
    });
  }
}

// External service error class
export class ExternalServiceError extends ApiError {
  public readonly serviceName: string;

  constructor(
    serviceName: string,
    message: string,
    cause?: Error
  ) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, message, {
      severity: ErrorSeverity.HIGH,
      context: { serviceName },
      cause,
      retryable: true,
      statusCode: 502
    });
    this.serviceName = serviceName;
  }
}

// Rate limit error class
export class RateLimitError extends ApiError {
  public readonly retryAfter: number;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(
    retryAfter: number,
    limit: number,
    remaining: number = 0
  ) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', {
      severity: ErrorSeverity.LOW,
      context: { retryAfter, limit, remaining },
      statusCode: 429,
      userMessage: `Too many requests. Please wait ${retryAfter} seconds before trying again.`
    });
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

// Error logger interface
export interface ErrorLogger {
  log(error: BaseError, request?: NextRequest, context?: Record<string, any>): Promise<void>;
}

// Console error logger implementation
export class ConsoleErrorLogger implements ErrorLogger {
  async log(error: BaseError, request?: NextRequest, context?: Record<string, any>): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        context: error.context
      },
      request: request ? {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        requestId: request.headers.get('x-request-id')
      } : undefined,
      context,
      stack: process.env.NODE_ENV === 'development' && error.cause ? error.cause.stack : undefined
    };

    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.error('API Error:', JSON.stringify(logEntry, null, 2));
    } else {
      console.warn('API Warning:', JSON.stringify(logEntry, null, 2));
    }
  }
}

// Error handler class
export class ApiErrorHandler {
  private logger: ErrorLogger;

  constructor(logger?: ErrorLogger) {
    this.logger = logger || new ConsoleErrorLogger();
  }

  /**
   * Handle and format any error for API response
   */
  async handleError(
    error: unknown,
    request?: NextRequest,
    context?: Record<string, any>
  ) {
    const responseOptions = request 
      ? ApiResponseFormatter.createResponseOptions(request)
      : {};

    // Handle ApiError instances
    if (error instanceof ApiError) {
      await this.logger.log(error, request, context);
      return this.formatApiError(error, responseOptions);
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = this.handleZodError(error);
      await this.logger.log(validationError, request, context);
      return this.formatApiError(validationError, responseOptions);
    }

    // Handle Prisma errors
    if (this.isPrismaError(error)) {
      const prismaError = this.handlePrismaError(error);
      await this.logger.log(prismaError, request, context);
      return this.formatApiError(prismaError, responseOptions);
    }

    // Handle generic errors
    const genericError = this.handleGenericError(error);
    await this.logger.log(genericError, request, context);
    return this.formatApiError(genericError, responseOptions);
  }

  /**
   * Handle Zod validation errors
   */
  private handleZodError(error: ZodError): ValidationError {
    const validationErrors = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    return new ValidationError(validationErrors);
  }

  /**
   * Handle Prisma database errors
   */
  private handlePrismaError(error: any): ApiError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return new ApiError(ErrorCode.ALREADY_EXISTS, 'Resource already exists', {
            severity: ErrorSeverity.LOW,
            context: { prismaCode: error.code, meta: error.meta },
            statusCode: 409,
            userMessage: 'A record with this information already exists'
          });
        
        case 'P2025':
          return new ApiError(ErrorCode.NOT_FOUND, 'Resource not found', {
            severity: ErrorSeverity.LOW,
            context: { prismaCode: error.code, meta: error.meta },
            statusCode: 404,
            userMessage: 'The requested resource could not be found'
          });
        
        case 'P2003':
          return new ApiError(ErrorCode.CONFLICT, 'Foreign key constraint failed', {
            severity: ErrorSeverity.MEDIUM,
            context: { prismaCode: error.code, meta: error.meta },
            statusCode: 409,
            userMessage: 'This operation conflicts with existing data'
          });
        
        default:
          return new ApiError(ErrorCode.DATABASE_ERROR, 'Database operation failed', {
            severity: ErrorSeverity.HIGH,
            context: { prismaCode: error.code, meta: error.meta },
            cause: error,
            statusCode: 500
          });
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new ApiError(ErrorCode.DATABASE_ERROR, 'Unknown database error', {
        severity: ErrorSeverity.HIGH,
        context: { prismaError: true },
        cause: error,
        statusCode: 500
      });
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new ApiError(ErrorCode.DATABASE_ERROR, 'Database engine error', {
        severity: ErrorSeverity.CRITICAL,
        context: { prismaError: true },
        cause: error,
        statusCode: 500
      });
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new ApiError(ErrorCode.CONNECTION_ERROR, 'Database connection failed', {
        severity: ErrorSeverity.CRITICAL,
        context: { prismaError: true },
        cause: error,
        retryable: true,
        statusCode: 503
      });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new ApiError(ErrorCode.VALIDATION_ERROR, 'Database validation error', {
        severity: ErrorSeverity.MEDIUM,
        context: { prismaError: true },
        cause: error,
        statusCode: 400
      });
    }

    return new ApiError(ErrorCode.DATABASE_ERROR, 'Database error', {
      severity: ErrorSeverity.HIGH,
      context: { prismaError: true },
      cause: error,
      statusCode: 500
    });
  }

  /**
   * Handle generic JavaScript errors
   */
  private handleGenericError(error: unknown): ApiError {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return new ApiError(ErrorCode.TIMEOUT, 'Request timeout', {
          severity: ErrorSeverity.MEDIUM,
          cause: error,
          retryable: true,
          statusCode: 504
        });
      }

      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return new ApiError(ErrorCode.CONNECTION_ERROR, 'Connection error', {
          severity: ErrorSeverity.HIGH,
          cause: error,
          retryable: true,
          statusCode: 503
        });
      }

      if (error.message.includes('fetch')) {
        return new ApiError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'External service error', {
          severity: ErrorSeverity.MEDIUM,
          cause: error,
          retryable: true,
          statusCode: 502
        });
      }

      return new ApiError(ErrorCode.INTERNAL_ERROR, error.message, {
        severity: ErrorSeverity.HIGH,
        cause: error,
        statusCode: 500
      });
    }

    return new ApiError(ErrorCode.INTERNAL_ERROR, 'Unknown error occurred', {
      severity: ErrorSeverity.HIGH,
      context: { originalError: String(error) },
      statusCode: 500
    });
  }

  /**
   * Format ApiError for response
   */
  private formatApiError(error: ApiError, responseOptions: ResponseOptions) {
    if (error instanceof ValidationError) {
      return ApiResponseFormatter.validationError(
        error.validationErrors,
        responseOptions
      );
    }

    if (error instanceof RateLimitError) {
      return ApiResponseFormatter.rateLimitError(
        error.retryAfter,
        {
          ...responseOptions,
          headers: {
            'X-RateLimit-Limit': error.limit.toString(),
            'X-RateLimit-Remaining': error.remaining.toString(),
            'X-RateLimit-Reset': new Date(Date.now() + error.retryAfter * 1000).toISOString()
          }
        }
      );
    }

    return ApiResponseFormatter.error(
      error.code,
      error.userMessage || error.message,
      {
        ...responseOptions,
        details: process.env.NODE_ENV === 'development' ? error.context : undefined,
        status: error.statusCode
      }
    );
  }

  /**
   * Check if error is a Prisma error
   */
  private isPrismaError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError ||
           error instanceof Prisma.PrismaClientUnknownRequestError ||
           error instanceof Prisma.PrismaClientRustPanicError ||
           error instanceof Prisma.PrismaClientInitializationError ||
           error instanceof Prisma.PrismaClientValidationError;
  }
}

// Global error handler instance
export const globalErrorHandler = new ApiErrorHandler();

// Error factory functions
export const createAuthError = (message?: string) => 
  new ApiError(ErrorCode.AUTH_REQUIRED, message || 'Authentication required', {
    severity: ErrorSeverity.LOW,
    statusCode: 401,
    userMessage: 'Please log in to access this resource'
  });

export const createForbiddenError = (message?: string) => 
  new ApiError(ErrorCode.FORBIDDEN, message || 'Access denied', {
    severity: ErrorSeverity.LOW,
    statusCode: 403,
    userMessage: 'You do not have permission to access this resource'
  });

export const createNotFoundError = (resource?: string) => 
  new ApiError(ErrorCode.NOT_FOUND, `${resource || 'Resource'} not found`, {
    severity: ErrorSeverity.LOW,
    statusCode: 404,
    userMessage: `The requested ${resource?.toLowerCase() || 'resource'} could not be found`
  });

export const createValidationError = (errors: Array<{ field: string; message: string; code: string }>) =>
  new ValidationError(errors);

export const createBusinessLogicError = (message: string, context?: Record<string, any>) =>
  new BusinessLogicError(message, context);

export const createExternalServiceError = (serviceName: string, message: string, cause?: Error) =>
  new ExternalServiceError(serviceName, message, cause);

export const createRateLimitError = (retryAfter: number, limit: number, remaining: number = 0) =>
  new RateLimitError(retryAfter, limit, remaining);

// Error handling middleware
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      // If the error is already an ApiError, re-throw it
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Convert other errors to ApiError
      throw await globalErrorHandler.handleError(error);
    }
  };
} 