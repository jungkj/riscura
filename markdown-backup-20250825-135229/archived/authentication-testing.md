# Authentication Testing Guide

This guide explains how to test the authentication flow in the Riscura application after the recent fixes.

## Overview

The authentication system has been updated to properly integrate NextAuth sessions with API requests. This ensures that:

1. The RCSAApiClient automatically includes authentication headers
2. Session cookies are properly sent with all requests
3. Organization context is maintained across requests
4. 401/403 errors are properly handled

## Running Authentication Tests

### 1. Unit/Integration Tests

Run the authentication integration tests:

```bash
npm run test:auth-integration
```

This runs the Jest test suite that verifies:
- Authentication headers are included in requests
- Session management works correctly
- Error handling for 401/403 responses
- Organization isolation is maintained

### 2. Manual Authentication Flow Test

Run the manual test script:

```bash
npm run test:auth-flow
```

This script performs a series of real API calls to verify:
- Health check endpoints
- Unauthenticated request rejection
- Authenticated CRUD operations
- Error handling

### 3. Development Mode Testing

In development mode, the API middleware includes a mock authentication mechanism that creates a test user when no session is available. This allows testing without a full authentication setup.

## Key Changes Made

### 1. RCSAApiClient Updates

The client now:
- Fetches the NextAuth session before each request
- Includes organization ID in headers
- Adds request tracking IDs
- Sets `credentials: 'include'` for cookie handling

### 2. API Middleware Enhancement

The middleware now:
- Supports development mode mock authentication
- Properly validates NextAuth sessions
- Includes comprehensive error responses

### 3. Base ApiClient Updates

The base client:
- Always includes credentials
- Handles CSRF tokens when available
- Provides consistent error handling

## Testing Scenarios

### Authenticated Request Flow

1. User logs in via NextAuth
2. Session cookie is set
3. RCSAApiClient fetches session
4. Headers are added to request:
   - `organization-id`: From user session
   - `x-request-id`: For tracing
5. API validates session and processes request

### Error Handling

- **401 Unauthorized**: When no valid session exists
- **403 Forbidden**: When user lacks required permissions
- **404 Not Found**: When resource doesn't exist
- **500 Server Error**: For unexpected errors

## Troubleshooting

### Common Issues

1. **"Authentication required" errors**
   - Ensure you're logged in
   - Check that session cookies are being sent
   - Verify NextAuth is properly configured

2. **"Organization required" errors**
   - Ensure user has an organizationId in their session
   - Check database user record

3. **CORS errors**
   - Verify API URL configuration
   - Check CORS headers in middleware

### Debug Steps

1. Check browser DevTools Network tab:
   - Look for session cookies
   - Verify request headers
   - Check response status codes

2. Enable debug logging:
   ```javascript
   // In RCSAApiClient
   console.log('Session:', session);
   console.log('Headers:', headers);
   ```

3. Test with curl:
   ```bash
   # Test with session cookie
   curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
        http://localhost:3000/api/risks
   ```

## Next Steps

After verifying authentication works:

1. Test specific API endpoints
2. Verify organization data isolation
3. Test permission-based access control
4. Monitor for any edge cases

## Related Files

- `/src/lib/api/rcsa-client.ts` - Main API client
- `/src/lib/api/client.ts` - Base API client
- `/src/lib/api/middleware.ts` - API middleware
- `/src/lib/auth/middleware.ts` - Authentication middleware
- `/src/__tests__/integration/auth-api-test.ts` - Test suite
- `/scripts/test-auth-flow.ts` - Manual test script