# API Standardization System

This document describes the comprehensive API standardization system implemented
for the RCSA platform.

## Overview

The API standardization system provides:

- **Consistent Response Formats**: Standardized success/error response
  structures
- **Input Validation**: Zod-based validation schemas for all inputs
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Rate Limiting**: Configurable rate limiting per endpoint type
- **API Versioning**: Support for multiple API versions with deprecation
  warnings
- **Authentication & Authorization**: Integrated auth and role-based access
  control
- **CORS Support**: Configurable CORS handling
- **Request Logging**: Comprehensive request/response logging

## Components

### 1. Response Formatter (`response-formatter.ts`)

Provides standardized response formats for all API endpoints.

#### Success Response Format

```typescript
{
  success: true,
  data: T,
  meta: {
    total?: number,
    page?: number,
    limit?: number,
    timestamp: string,
    requestId: string,
    version: string
  }
}
```

#### Error Response Format

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any,
    timestamp: string,
    requestId: string,
    path?: string,
    version: string
  }
}
```

#### Usage Examples

```typescript
import {
  ApiResponseFormatter,
  successResponse,
  errorResponse,
} from '@/lib/api/response-formatter';

// Success response
const response = ApiResponseFormatter.success(data, {
  requestId: 'req-123',
  version: 'v1',
});

// Paginated response
const paginatedResponse = ApiResponseFormatter.paginated(
  items,
  { page: 1, limit: 10, total: 100 },
  { requestId: 'req-123' }
);

// Error response
const errorResponse = ApiResponseFormatter.error(
  'VALIDATION_ERROR',
  'Invalid input data',
  { status: 400 }
);

// Convenience functions
const success = successResponse(data);
const error = errorResponse('NOT_FOUND', 'Resource not found');
```

### 2. Validation Schemas (`validation-schemas.ts`)

Comprehensive Zod schemas for all API inputs.

#### Available Schemas

- **Authentication**: `LoginSchema`, `RegisterSchema`, `ChangePasswordSchema`
- **Risks**: `RiskCreateSchema`, `RiskUpdateSchema`, `RiskFilterSchema`
- **Controls**: `ControlCreateSchema`, `ControlUpdateSchema`,
  `ControlFilterSchema`
- **Assessments**: `AssessmentCreateSchema`, `AssessmentUpdateSchema`,
  `AssessmentExecuteSchema`
- **Documents**: `DocumentUploadSchema`, `DocumentAnalysisSchema`
- **Reports**: `ReportGenerateSchema`
- **Common**: `PaginationSchema`, `SearchSchema`, `IdSchema`

#### Usage Examples

```typescript
import {
  RiskCreateSchema,
  parseAndValidate,
  validateQueryParams,
} from '@/lib/api/validation-schemas';

// Validate request body
const bodyValidation = parseAndValidate(RiskCreateSchema, requestBody);
if (!bodyValidation.success) {
  return ApiResponseFormatter.validationError(
    formatValidationErrors(bodyValidation.errors)
  );
}

// Validate query parameters
const url = new URL(request.url);
const queryValidation = validateQueryParams(RiskQuerySchema, url.searchParams);
if (!queryValidation.success) {
  // Handle validation errors
}
```

### 3. Error Handling (`error-handler.ts`)

Centralized error handling with standardized error codes and proper HTTP status
mapping.

#### Error Codes

- **Authentication**: `AUTH_REQUIRED`, `AUTH_INVALID`, `FORBIDDEN`
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`
- **Resources**: `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`
- **Rate Limiting**: `RATE_LIMIT_EXCEEDED`, `TOO_MANY_REQUESTS`
- **Server**: `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `TIMEOUT`

#### Custom Error Classes

```typescript
import {
  ApiError,
  ValidationError,
  BusinessLogicError,
  createAuthError,
  createNotFoundError,
} from '@/lib/api/error-handler';

// Create custom errors
throw new ApiError('CUSTOM_ERROR', 'Custom error message', {
  severity: ErrorSeverity.HIGH,
  context: { userId: '123' },
  statusCode: 422,
});

// Use error factories
throw createAuthError('Invalid credentials');
throw createNotFoundError('User');

// Business logic errors
throw new BusinessLogicError('Risk score cannot exceed maximum value');
```

#### Global Error Handler

```typescript
import { globalErrorHandler } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Your API logic here
  } catch (error) {
    return globalErrorHandler.handleError(error, request, {
      endpoint: 'POST /api/v1/risks',
      action: 'create_risk',
    });
  }
}
```

### 4. Rate Limiting (`rate-limiter.ts`)

Flexible rate limiting system with different limits for different endpoint
types.

#### Pre-configured Rate Limiters

- **Standard**: 1000 requests per 15 minutes
- **Auth**: 5 attempts per 15 minutes
- **File Upload**: 50 uploads per hour
- **Expensive Operations**: 10 operations per hour
- **Bulk Operations**: 5 operations per 10 minutes
- **Report Generation**: 20 reports per 30 minutes

#### Usage Examples

```typescript
import {
  applyRateLimit,
  rateLimiterManager,
  createStandardRateLimiter,
} from '@/lib/api/rate-limiter';

// Apply automatic rate limiting
const rateLimitResult = await applyRateLimit(request);
if (!rateLimitResult.success) {
  throw rateLimitResult.error;
}

// Custom rate limiter
const customLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (request) => `custom:${getUserId(request)}`,
});

// Apply multiple rate limiters
const result = await rateLimiterManager.handleRequest(request, [
  'standard',
  'auth',
]);
```

### 5. API Versioning (`versioning.ts`)

Support for API versioning with deprecation warnings and migration support.

#### Version Extraction

Versions can be specified via:

- URL path: `/api/v1/risks`
- Headers: `X-API-Version: v1`
- Query parameters: `?version=v1`
- Accept header: `Accept: application/vnd.riscura.v1+json`

#### Usage Examples

```typescript
import {
  getApiVersionFromRequest,
  VersionedResponseFormatter,
  isVersionDeprecated,
} from '@/lib/api/versioning';

// Get version from request
const version = getApiVersionFromRequest(request);

// Create versioned response
const response = VersionedResponseFormatter.success(data, version);

// Check deprecation
if (isVersionDeprecated(version)) {
  // Handle deprecated version
}
```

### 6. Middleware (`middleware.ts`)

Comprehensive middleware that automatically handles all standardization
concerns.

#### Configuration Options

```typescript
interface ApiMiddlewareConfig {
  // Authentication
  requireAuth?: boolean;
  allowedRoles?: string[];
  requireOrganization?: boolean;

  // Rate limiting
  rateLimiters?: string[];
  skipRateLimit?: boolean;

  // Validation
  bodySchema?: ZodSchema<any>;
  querySchema?: ZodSchema<any>;
  skipValidation?: boolean;

  // Versioning
  supportedVersions?: ApiVersion[];
  skipVersioning?: boolean;

  // CORS
  corsEnabled?: boolean;
  corsOptions?: CorsOptions;
}
```

#### Usage Examples

```typescript
import {
  withApiMiddleware,
  authApiMiddleware,
  riskManagerApiMiddleware,
} from '@/lib/api/middleware';

// Simple usage with middleware decorator
export const GET = withApiMiddleware({
  requireAuth: true,
  allowedRoles: ['ADMIN', 'RISK_MANAGER'],
  querySchema: RiskQuerySchema,
  rateLimiters: ['standard'],
})(async (context, validatedData) => {
  // Your handler logic here
  const { user, version, requestId } = context;
  const { page, limit, search } = validatedData.query;

  // Return data (middleware handles response formatting)
  return { data: results, pagination: { page, limit, total } };
});

// Pre-configured middleware
export const POST = riskManagerApiMiddleware.execute(
  async (context, validatedData) => {
    // Handler logic
  }
);
```

## Implementation Examples

### Basic API Route

```typescript
// src/app/api/v1/example/route.ts
import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { ExampleSchema } from '@/lib/api/validation-schemas';

export const GET = withApiMiddleware({
  requireAuth: true,
  querySchema: ExampleSchema,
  rateLimiters: ['standard'],
})(async (context, validatedData) => {
  const { user } = context;
  const { page, limit } = validatedData.query;

  // Your business logic
  const results = await fetchData(user.organizationId, page, limit);

  return {
    data: results,
    pagination: { page, limit, total: results.length },
  };
});
```

### Manual Implementation

```typescript
// src/app/api/v1/manual/route.ts
import { NextRequest } from 'next/server';
import { globalErrorHandler } from '@/lib/api/error-handler';
import { applyRateLimit } from '@/lib/api/rate-limiter';
import { VersionedResponseFormatter } from '@/lib/api/response-formatter';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (!rateLimitResult.success) {
      throw rateLimitResult.error;
    }

    // 2. Authentication (manual)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createAuthError();
    }

    // 3. Your business logic
    const data = await processRequest();

    // 4. Return standardized response
    const response = VersionedResponseFormatter.success(
      data,
      getApiVersionFromRequest(request)
    );

    // 5. Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return globalErrorHandler.handleError(error, request);
  }
}
```

## Best Practices

### 1. Use Middleware for New Endpoints

Always use the middleware system for new API endpoints to ensure consistency:

```typescript
export const GET = withApiMiddleware({
  requireAuth: true,
  querySchema: MyQuerySchema,
})(async (context, validatedData) => {
  // Handler logic
});
```

### 2. Define Validation Schemas

Create Zod schemas for all inputs:

```typescript
export const CreateResourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});
```

### 3. Use Appropriate Rate Limiters

Choose rate limiters based on endpoint type:

```typescript
// Standard endpoints
rateLimiters: ['standard'];

// Authentication endpoints
rateLimiters: ['auth'];

// File uploads
rateLimiters: ['standard', 'upload'];

// Expensive operations
rateLimiters: ['standard', 'expensive'];
```

### 4. Handle Errors Properly

Use the error handling system:

```typescript
// Business logic errors
if (invalidCondition) {
  throw new BusinessLogicError('Custom business rule violation');
}

// Not found errors
const resource = await findResource(id);
if (!resource) {
  throw createNotFoundError('Resource');
}
```

### 5. Return Consistent Data

Structure your response data consistently:

```typescript
return {
  data: transformedData,
  pagination: { page, limit, total }, // For paginated responses
  status: 201, // For creation endpoints
};
```

## Response Headers

All API responses include standard headers:

- `X-Request-ID`: Unique request identifier
- `X-API-Version`: API version used
- `X-Timestamp`: Response timestamp
- `X-RateLimit-Limit`: Rate limit maximum
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Rate limit reset time

## Error Response Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "code": "invalid_string"
        }
      ]
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123"
  }
}
```

### Rate Limit Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123"
  }
}
```

### Business Logic Error

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Risk score cannot exceed maximum threshold",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123"
  }
}
```

## Migration Guide

### Updating Existing Endpoints

1. **Add validation schemas** for your endpoint
2. **Wrap handlers** with `withApiMiddleware()`
3. **Update response format** to return data objects
4. **Remove manual error handling** (middleware handles it)
5. **Remove manual rate limiting** (middleware handles it)

### Before (Old Pattern)

```typescript
export async function GET(request: NextRequest) {
  try {
    // Manual auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Manual validation
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;

    // Business logic
    const data = await fetchData();

    // Manual response
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### After (Standardized Pattern)

```typescript
export const GET = withApiMiddleware({
  requireAuth: true,
  querySchema: PaginationSchema,
})(async (context, validatedData) => {
  const { user } = context;
  const { page, limit } = validatedData.query;

  const data = await fetchData();

  return { data, pagination: { page, limit, total: data.length } };
});
```

This standardization system ensures all your APIs are consistent, secure, and
maintainable while reducing boilerplate code significantly.
