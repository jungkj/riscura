# Getting Started with the Riscura API

This guide will help you get up and running with the Riscura API in minutes.

## Prerequisites

- A Riscura account (sign up at [riscura.com](https://riscura.com))
- An API key or authentication credentials
- Basic knowledge of REST APIs and HTTP requests

## Step 1: Authentication

### Option A: API Key Authentication (Recommended)

1. **Generate an API Key:**
   - Log into your Riscura dashboard
   - Navigate to Settings → API Keys
   - Click "Generate New Key"
   - Copy and securely store your API key

2. **Use the API Key:**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        -H "Organization-ID: your-org-id" \
        https://api.riscura.com/api/v1/risks
   ```

### Option B: Session Authentication

1. **Login to get session:**
   ```bash
   curl -X POST https://api.riscura.com/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
          "email": "your-email@example.com",
          "password": "your-password"
        }'
   ```

2. **Use session cookie in subsequent requests:**
   ```bash
   curl -b cookies.txt \
        -H "Organization-ID: your-org-id" \
        https://api.riscura.com/api/v1/risks
   ```

## Step 2: Find Your Organization ID

Your Organization ID is required for most API calls:

1. **Via Dashboard:**
   - Settings → Organization → Copy Organization ID

2. **Via API:**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.riscura.com/api/users/me
   ```

## Step 3: Make Your First API Call

Let's retrieve your organization's risks:

```bash
curl -X GET "https://api.riscura.com/api/v1/risks" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id" \
     -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "risk_123456",
      "title": "Database Security Vulnerability",
      "description": "Potential SQL injection vulnerability...",
      "category": "TECHNOLOGY",
      "likelihood": 3,
      "impact": 4,
      "riskScore": 12,
      "status": "IDENTIFIED",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

## Step 4: Create Your First Risk

Now let's create a new risk:

```bash
curl -X POST "https://api.riscura.com/api/v1/risks" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "API Security Risk",
       "description": "Potential security vulnerability in our API endpoints",
       "category": "TECHNOLOGY", 
       "likelihood": 2,
       "impact": 3,
       "owner": "user_123",
       "tags": ["api", "security"]
     }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "risk_789012",
    "title": "API Security Risk",
    "description": "Potential security vulnerability in our API endpoints",
    "category": "TECHNOLOGY",
    "likelihood": 2,
    "impact": 3,
    "riskScore": 6,
    "status": "IDENTIFIED",
    "owner": "user_123",
    "tags": ["api", "security"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Step 5: Explore Additional Endpoints

### List Security Controls
```bash
curl -X GET "https://api.riscura.com/api/controls" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id"
```

### Upload a Document
```bash
curl -X POST "https://api.riscura.com/api/documents" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id" \
     -F "file=@risk-assessment.pdf" \
     -F "title=Q1 Risk Assessment" \
     -F "type=RISK_ASSESSMENT"
```

### Generate a Report
```bash
curl -X POST "https://api.riscura.com/api/reports/generate" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "RISK_SUMMARY",
       "format": "PDF",
       "filters": {
         "dateRange": "last-30-days"
       }
     }'
```

## Common Patterns

### Pagination
```bash
# Get page 2 with 25 items per page
curl -X GET "https://api.riscura.com/api/v1/risks?page=2&limit=25" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id"
```

### Filtering
```bash
# Get high-severity risks that are identified
curl -X GET "https://api.riscura.com/api/v1/risks?severity=HIGH&status=IDENTIFIED" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id"
```

### Sorting
```bash
# Sort by creation date, newest first
curl -X GET "https://api.riscura.com/api/v1/risks?sortBy=createdAt&sortOrder=desc" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id"
```

### Search
```bash
# Search for risks containing "database"
curl -X GET "https://api.riscura.com/api/v1/risks?search=database" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Organization-ID: your-org-id"
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error information:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "likelihood",
        "message": "Likelihood must be between 1 and 5"
      }
    ]
  }
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limits

Be aware of rate limits:
- **Authentication:** 5 attempts per 15 minutes
- **Data Operations:** 1000 requests per hour (standard plan)
- **File Uploads:** 100 uploads per hour

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Best Practices

### 1. Use HTTPS Always
```bash
# ✅ Good
curl https://api.riscura.com/api/v1/risks

# ❌ Bad
curl http://api.riscura.com/api/v1/risks
```

### 2. Include Organization-ID Header
```bash
# ✅ Required for most endpoints
curl -H "Organization-ID: your-org-id" \
     https://api.riscura.com/api/v1/risks
```

### 3. Handle Errors Gracefully
```javascript
const response = await fetch('/api/v1/risks', {
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Organization-ID': orgId
  }
});

if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error.error.message);
  // Handle error appropriately
}
```

### 4. Implement Retry Logic for Rate Limits
```javascript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status !== 429) {
      return response;
    }
    
    const retryAfter = response.headers.get('Retry-After');
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }
}
```

### 5. Use Pagination for Large Datasets
```bash
# Don't try to get all data at once
curl "https://api.riscura.com/api/v1/risks?limit=100"

# Use pagination instead
curl "https://api.riscura.com/api/v1/risks?page=1&limit=25"
```

## Next Steps

1. **Explore the Interactive Documentation:**
   Visit [/api/docs/ui](/api/docs/ui) to explore all available endpoints

2. **Set Up Webhooks:**
   Configure real-time notifications for important events

3. **Use Official SDKs:**
   - Node.js: `npm install @riscura/api-client`
   - Python: `pip install riscura-api`

4. **Join the Community:**
   Connect with other developers at [community.riscura.com](https://community.riscura.com)

## Need Help?

- **Documentation:** [docs.riscura.com](https://docs.riscura.com)
- **Support:** [support@riscura.com](mailto:support@riscura.com)
- **Status:** [status.riscura.com](https://status.riscura.com)

---

Ready to build something amazing? Check out our [full API reference](/api/docs/ui) for complete endpoint documentation.