# Riscura API Documentation

## Overview

The Riscura API provides comprehensive access to risk management, compliance, and security control functionality. This RESTful API follows OpenAPI 3.0 specifications and includes features for authentication, data management, reporting, and AI-powered insights.

## Quick Start

### 1. Authentication

All API requests require authentication using either:

**Bearer Token Authentication:**
```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Organization-ID: your-org-id" \
     https://api.riscura.com/api/v1/risks
```

**Session Authentication:**
```bash
# Login first to get session cookie
curl -X POST https://api.riscura.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
```

### 2. Organization Context

Most API calls require an `Organization-ID` header to specify which organization's data to access:

```bash
-H "Organization-ID: org_abc123"
```

### 3. Base URLs

- **Production:** `https://api.riscura.com`
- **Staging:** `https://staging-api.riscura.com`
- **Local Development:** `http://localhost:3000`

## Interactive Documentation

Visit our interactive API documentation:

- **Swagger UI:** [/api/docs/ui](/api/docs/ui)
- **OpenAPI Spec:** [/api/docs](/api/docs)

## Core Concepts

### Standard Response Format

All API responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-abc123",
    "version": "1.0"
  },
  "pagination": {  // For paginated responses
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Pagination

List endpoints support pagination using query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort direction (asc/desc)

Example:
```bash
GET /api/v1/risks?page=2&limit=25&sortBy=createdAt&sortOrder=desc
```

### Filtering and Search

Many endpoints support filtering and search:

```bash
# Search risks
GET /api/v1/risks?search=database&status=IDENTIFIED&severity=HIGH

# Filter controls by framework
GET /api/controls?framework=SOC2&status=IMPLEMENTED
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/session-check` | Validate session |

### Risk Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/risks` | List risks |
| POST | `/api/v1/risks` | Create risk |
| GET | `/api/v1/risks/{id}` | Get risk details |
| PUT | `/api/v1/risks/{id}` | Update risk |
| DELETE | `/api/v1/risks/{id}` | Delete risk |

### Controls

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/controls` | List controls |
| POST | `/api/controls` | Create control |
| PUT | `/api/controls/{id}` | Update control |
| DELETE | `/api/controls/{id}` | Delete control |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance/frameworks` | List frameworks |
| GET | `/api/compliance/gap-analysis` | Gap analysis |
| POST | `/api/compliance/mapping` | Create mapping |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Upload document |
| GET | `/api/documents/{id}` | Get document |
| DELETE | `/api/documents/{id}` | Delete document |

### Reporting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List reports |
| POST | `/api/reports/generate` | Generate report |
| GET | `/api/reports/{id}/download` | Download report |

### AI Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/proxy` | AI service proxy |
| POST | `/api/probo/generate-controls` | Generate controls |
| POST | `/api/probo/mitigations` | Risk mitigations |

### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/plans` | List plans |
| GET | `/api/billing/subscriptions` | Get subscription |
| POST | `/api/stripe/checkout` | Create checkout |

## Rate Limits

Rate limits apply per organization and endpoint type:

| Endpoint Type | Standard Plan | Premium Plan | Enterprise |
|---------------|---------------|--------------|------------|
| Authentication | 5/15min | 10/15min | Custom |
| Data Operations | 1000/hour | 5000/hour | Custom |
| File Upload | 100/hour | 500/hour | Custom |
| AI Services | 50/hour | 200/hour | Custom |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Codes

Common error codes you may encounter:

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SUBSCRIPTION_REQUIRED` | 402 | Premium feature requires subscription |

## Security

### HTTPS Only
All API requests must use HTTPS. HTTP requests are automatically redirected.

### CSRF Protection
CSRF tokens are required for state-changing operations when using session authentication.

### Input Validation
All inputs are validated using strict schemas. Invalid data returns detailed error messages.

### Data Isolation
Multi-tenant architecture ensures complete data isolation between organizations.

## SDKs and Libraries

Official SDKs are available for:

- **Node.js/TypeScript** - `npm install @riscura/api-client`
- **Python** - `pip install riscura-api`
- **C#/.NET** - `dotnet add package Riscura.ApiClient`

Unofficial community libraries:
- **Go** - `github.com/community/riscura-go`
- **Ruby** - `gem install riscura-ruby`

## Webhooks

Riscura supports webhooks for real-time notifications:

### Available Events

- `risk.created` - New risk created
- `risk.updated` - Risk updated
- `risk.status_changed` - Risk status changed
- `control.implemented` - Control implemented
- `assessment.completed` - Assessment completed
- `subscription.updated` - Subscription changed

### Webhook Configuration

Configure webhooks in your organization settings or via API:

```bash
POST /api/webhooks
{
  "url": "https://your-app.com/webhooks/riscura",
  "events": ["risk.created", "risk.updated"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "risk.created",
  "data": {
    "id": "risk_123",
    "title": "New security risk",
    // ... risk data
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "organizationId": "org_abc123"
}
```

## Examples

### Create a Risk

```bash
curl -X POST https://api.riscura.com/api/v1/risks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Organization-ID: org_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database vulnerability",
    "description": "Potential SQL injection vulnerability in customer database",
    "category": "TECHNOLOGY",
    "likelihood": 3,
    "impact": 4,
    "owner": "user_123",
    "tags": ["database", "security", "high-priority"]
  }'
```

### List Risks with Filtering

```bash
curl -X GET "https://api.riscura.com/api/v1/risks?status=IDENTIFIED&severity=HIGH&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Organization-ID: org_abc123"
```

### Upload a Document

```bash
curl -X POST https://api.riscura.com/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Organization-ID: org_abc123" \
  -F "file=@document.pdf" \
  -F "title=Risk Assessment Report" \
  -F "type=RISK_ASSESSMENT"
```

### Generate a Report

```bash
curl -X POST https://api.riscura.com/api/reports/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Organization-ID: org_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RISK_SUMMARY",
    "format": "PDF",
    "filters": {
      "dateRange": "last-30-days",
      "status": ["IDENTIFIED", "ASSESSED"]
    }
  }'
```

## Support

- **Documentation:** [docs.riscura.com](https://docs.riscura.com)
- **Email Support:** [support@riscura.com](mailto:support@riscura.com)
- **Status Page:** [status.riscura.com](https://status.riscura.com)
- **Community:** [community.riscura.com](https://community.riscura.com)

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Core risk management endpoints
- Authentication and authorization
- Document management
- Basic reporting

### Upcoming Features
- GraphQL endpoint
- Real-time subscriptions
- Advanced analytics API
- Bulk operations
- API versioning

---

For the most up-to-date information, visit our [interactive API documentation](/api/docs/ui).