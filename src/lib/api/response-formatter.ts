import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
    requestId: string;
    version?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
    path?: string;
    version?: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ResponseOptions {
  requestId?: string;
  version?: string;
  headers?: Record<string, string>;
  status?: number;
}

export class ApiResponseFormatter {
  /**
   * Create standardized success response
   */
  static success<T>(_data: T,
    options: ResponseOptions & {
      pagination?: Partial<PaginationMeta>;
    } = {}
  ): NextResponse<ApiSuccessResponse<T>> {
    const requestId = options.requestId || uuidv4();
    const timestamp = new Date().toISOString();

    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp,
        requestId,
        version: options.version || 'v1',
        ...(options.pagination && {
          total: options.pagination.total,
          page: options.pagination.page,
          limit: options.pagination.limit,
          pages: options.pagination.pages,
          hasNext: options.pagination.hasNext,
          hasPrevious: options.pagination.hasPrevious,
        }),
      },
    };

    const nextResponse = NextResponse.json(response, {
      status: options.status || 200,
    });

    // Add standard headers
    nextResponse.headers.set('X-Request-ID', requestId);
    nextResponse.headers.set('X-API-Version', options.version || 'v1');
    nextResponse.headers.set('X-Timestamp', timestamp);

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        nextResponse.headers.set(key, value);
      });
    }

    return nextResponse;
  }

  /**
   * Create standardized error response
   */
  static error(
    code: string,
    message: string,
    options: ResponseOptions & {
      details?: any;
      path?: string;
      status?: number;
    } = {}
  ): NextResponse<ApiErrorResponse> {
    const requestId = options.requestId || uuidv4();
    const timestamp = new Date().toISOString();

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp,
        requestId,
        version: options.version || 'v1',
        ...(options.details && { details: options.details }),
        ...(options.path && { path: options.path }),
      },
    };

    const status = options.status || this.getStatusFromErrorCode(code);

    const nextResponse = NextResponse.json(response, { status });

    // Add standard headers
    nextResponse.headers.set('X-Request-ID', requestId);
    nextResponse.headers.set('X-API-Version', options.version || 'v1');
    nextResponse.headers.set('X-Timestamp', timestamp);

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        nextResponse.headers.set(key, value);
      });
    }

    return nextResponse;
  }

  /**
   * Create paginated success response
   */
  static paginated<T>(_data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    options: ResponseOptions = {}
  ): NextResponse<ApiSuccessResponse<T[]>> {
    const pages = Math.ceil(pagination.total / pagination.limit);
    const hasNext = pagination.page < pages;
    const hasPrevious = pagination.page > 1;

    return this.success(data, {
      ...options,
      pagination: {
        ...pagination,
        pages,
        hasNext,
        hasPrevious,
      },
    });
  }

  /**
   * Create validation error response
   */
  static validationError(
    errors: any[],
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('VALIDATION_ERROR', 'Request validation failed', {
      ...options,
      details: { errors },
      status: 400,
    });
  }

  /**
   * Create authentication error response
   */
  static authError(
    message: string = 'Authentication required',
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('AUTH_ERROR', message, {
      ...options,
      status: 401,
    });
  }

  /**
   * Create authorization error response
   */
  static forbiddenError(
    message: string = 'Access denied',
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('FORBIDDEN', message, {
      ...options,
      status: 403,
    });
  }

  /**
   * Create not found error response
   */
  static notFoundError(
    resource: string = 'Resource',
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('NOT_FOUND', `${resource} not found`, {
      ...options,
      status: 404,
    });
  }

  /**
   * Create rate limit error response
   */
  static rateLimitError(
    retryAfter: number,
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', {
      ...options,
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
      },
    });
  }

  /**
   * Create server error response
   */
  static serverError(
    message: string = 'Internal server error',
    options: ResponseOptions & { details?: any } = {}
  ): NextResponse<ApiErrorResponse> {
    // Don't expose internal details in production
    const details = process.env.NODE_ENV === 'development' ? options.details : undefined;

    return this.error('SERVER_ERROR', message, {
      ...options,
      details,
      status: 500,
    });
  }

  /**
   * Create conflict error response
   */
  static conflictError(
    message: string,
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('CONFLICT', message, {
      ...options,
      status: 409,
    });
  }

  /**
   * Create too large error response
   */
  static tooLargeError(
    message: string = 'Request payload too large',
    options: ResponseOptions = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('PAYLOAD_TOO_LARGE', message, {
      ...options,
      status: 413,
    });
  }

  /**
   * Create unprocessable entity error response
   */
  static unprocessableError(
    message: string,
    options: ResponseOptions & { details?: any } = {}
  ): NextResponse<ApiErrorResponse> {
    return this.error('UNPROCESSABLE_ENTITY', message, {
      ...options,
      status: 422,
    });
  }

  /**
   * Map error codes to HTTP status codes
   */
  private static getStatusFromErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      BAD_REQUEST: 400,
      AUTH_ERROR: 401,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      METHOD_NOT_ALLOWED: 405,
      CONFLICT: 409,
      PAYLOAD_TOO_LARGE: 413,
      UNPROCESSABLE_ENTITY: 422,
      RATE_LIMIT_EXCEEDED: 429,
      SERVER_ERROR: 500,
      SERVICE_UNAVAILABLE: 503,
    };

    return statusMap[code] || 500;
  }

  /**
   * Extract request ID from headers or generate new one
   */
  static getOrCreateRequestId(_request: Request): string {
    return request.headers.get('X-Request-ID') || uuidv4();
  }

  /**
   * Extract API version from headers
   */
  static getApiVersion(_request: Request): string {
    return request.headers.get('X-API-Version') || request.headers.get('Accept-Version') || 'v1';
  }

  /**
   * Create standardized response options from request
   */
  static createResponseOptions(_request: Request): ResponseOptions {
    return {
      requestId: this.getOrCreateRequestId(request),
      version: this.getApiVersion(request),
    };
  }
}

/**
 * Helper function for creating success responses
 */
export function successResponse<T>(_data: T,
  options?: ResponseOptions & { pagination?: Partial<PaginationMeta> }
): NextResponse<ApiSuccessResponse<T>> {
  return ApiResponseFormatter.success(data, options);
}

/**
 * Helper function for creating error responses
 */
export function errorResponse(
  code: string,
  message: string,
  options?: ResponseOptions & { details?: any; status?: number }
): NextResponse<ApiErrorResponse> {
  return ApiResponseFormatter.error(code, message, options);
}

/**
 * Helper function for creating paginated responses
 */
export function paginatedResponse<T>(_data: T[],
  pagination: { page: number; limit: number; total: number },
  options?: ResponseOptions
): NextResponse<ApiSuccessResponse<T[]>> {
  return ApiResponseFormatter.paginated(data, pagination, options);
}

/**
 * Type guard to check if response is success
 */
export function isSuccessResponse<T>(_response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is error
 */
export function isErrorResponse(_response: ApiSuccessResponse<any> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

// TODO: Implement real versioned response formatting
export function VersionedResponseFormatter(_data: any) {
  return data;
}

/**
 * Format validation errors for consistent API response
 */
export function formatValidationErrors(
  errors: any[]
): Array<{ field: string; message: string; code: string }> {
  return errors.map((error) => ({
    field: error.path?.join('.') || 'unknown',
    message: error.message || 'Validation error',
    code: error.code || 'VALIDATION_ERROR',
  }));
}
