# Audit Logging System Documentation

## Overview

The Riscura audit logging system provides comprehensive, enterprise-grade audit trails that meet compliance requirements for SOX, GDPR, SOC2, ISO27001, and other regulatory frameworks. The system automatically captures all user actions, data changes, and system events with detailed context and metadata.

## Features

### ✅ Comprehensive Event Tracking
- **User Actions**: Login, logout, data access, modifications
- **Data Changes**: Create, read, update, delete operations with before/after snapshots
- **System Events**: Configuration changes, maintenance, backups
- **API Calls**: All API requests with detailed context
- **Authentication Events**: Success, failures, permission changes

### ✅ Compliance Ready
- **Retention Policies**: Configurable retention periods by event type
- **Encryption**: Sensitive events automatically encrypted
- **Immutable Records**: Audit logs cannot be modified or deleted
- **Compliance Flags**: SOX, GDPR, SOC2, ISO27001, HIPAA, PCI-DSS
- **Data Residency**: Geographic data handling compliance

### ✅ Performance Optimized
- **Batch Processing**: High-throughput batch insertion
- **Caching Layer**: Recent events cached for quick access
- **Indexing**: Optimized database indexes for fast queries
- **Async Processing**: Non-blocking audit logging

### ✅ Rich Query Capabilities
- **Filtering**: By user, action, entity, time range, severity
- **Search**: Full-text search across events
- **Aggregation**: Statistical analysis and reporting
- **Export**: Multiple formats (JSON, CSV, PDF, Excel)

## Quick Start

### 1. Basic Audit Logging

```typescript
import { logAuditEvent } from '@/lib/audit/audit-logger';

// Log a simple event
await logAuditEvent(prisma, {
  userId: user.id,
  organizationId: organization.id,
  action: 'CREATE',
  entity: 'RISK',
  entityId: risk.id,
  resource: 'risk',
  method: 'POST',
  path: '/api/risks',
  severity: 'MEDIUM',
  status: 'SUCCESS',
  metadata: {
    riskScore: risk.riskScore,
    category: risk.category,
  },
});
```

### 2. Using Middleware Decorators

```typescript
import { withDataAudit } from '@/lib/audit/audit-middleware';

// Automatically audit all data operations
export const POST = withAPI(
  withDataAudit('RISK', 'CREATE')(handleCreateRisk),
  {
    auth: true,
    permissions: ['risk:write'],
  }
);
```

### 3. Authentication Audit Logging

```typescript
import { withAuthAudit } from '@/lib/audit/audit-middleware';

// Audit login attempts
export const POST = withAPI(
  withAuthAudit('LOGIN')(handleLogin),
  {
    auth: false,
    rateLimit: { requests: 5, window: '15m' },
  }
);
```

## Audit Event Types

### User Actions
- `LOGIN` / `LOGOUT` - User authentication
- `PASSWORD_CHANGE` / `PASSWORD_RESET` - Credential changes
- `MFA_ENABLE` / `MFA_DISABLE` - Multi-factor authentication
- `ACCOUNT_LOCK` / `SESSION_EXPIRE` - Account security

### Data Operations
- `CREATE` / `READ` / `UPDATE` / `DELETE` - CRUD operations
- `BULK_UPDATE` / `BULK_DELETE` - Bulk operations
- `EXPORT` / `IMPORT` - Data transfer
- `RESTORE` / `ARCHIVE` - Data lifecycle

### Permission Management
- `PERMISSION_GRANT` / `PERMISSION_REVOKE` - Access control
- `ROLE_ASSIGN` / `ROLE_REMOVE` - Role management
- `ACCESS_DENIED` - Unauthorized access attempts

### System Operations
- `SYSTEM_START` / `SYSTEM_STOP` - System lifecycle
- `CONFIG_CHANGE` - Configuration modifications
- `BACKUP_CREATE` / `BACKUP_RESTORE` - Data protection
- `MAINTENANCE_START` / `MAINTENANCE_END` - System maintenance

### Compliance Events
- `AUDIT_START` / `AUDIT_END` - Audit procedures
- `POLICY_UPDATE` - Policy changes
- `VIOLATION_DETECTED` - Compliance violations
- `COMPLIANCE_CHECK` - Compliance verification

## Audit Severity Levels

| Level | Description | Examples |
|-------|-------------|----------|
| **LOW** | Routine operations | Data reads, successful logins |
| **MEDIUM** | Normal modifications | Data updates, configuration changes |
| **HIGH** | Significant changes | Data deletions, permission changes |
| **CRITICAL** | Security/compliance events | Access violations, system failures |

## Middleware Integration

### Data Audit Decorator

```typescript
import { withDataAudit } from '@/lib/audit/audit-middleware';

// Audit all operations on the RISK entity
export const GET = withAPI(
  withDataAudit('RISK', 'READ')(handleGetRisk),
  { auth: true, permissions: ['risk:read'] }
);

export const PUT = withAPI(
  withDataAudit(
    'RISK', 
    'UPDATE',
    (req, context) => context.params.id // Extract entity ID
  )(handleUpdateRisk),
  { auth: true, permissions: ['risk:write'] }
);
```

### Permission Audit Decorator

```typescript
import { withPermissionAudit } from '@/lib/audit/audit-middleware';

// Audit permission-protected endpoints
export const GET = withAPI(
  withPermissionAudit('admin:read', 'SYSTEM')(handleAdminAction),
  { auth: true, permissions: ['admin:read'] }
);
```

### System Audit Decorator

```typescript
import { withSystemAudit } from '@/lib/audit/audit-middleware';

// Audit system administration actions
export const POST = withAPI(
  withSystemAudit('CONFIG_CHANGE')(handleConfigUpdate),
  { auth: true, permissions: ['system:admin'] }
);
```

### Compliance Audit Decorator

```typescript
import { withComplianceAudit } from '@/lib/audit/audit-middleware';

// Audit compliance-related operations
export const POST = withAPI(
  withComplianceAudit('COMPLIANCE_CHECK', 'SOC2')(handleComplianceCheck),
  { auth: true, permissions: ['compliance:audit'] }
);
```

## Manual Change Tracking

For complex scenarios requiring detailed change tracking:

```typescript
import { logDataChangeEvent } from '@/lib/audit/audit-logger';

// Before updating
const originalRisk = await prisma.risk.findUnique({ where: { id } });

// Perform update
const updatedRisk = await prisma.risk.update({
  where: { id },
  data: updateData,
});

// Log detailed changes
await logDataChangeEvent(
  prisma,
  'UPDATE',
  'RISK',
  id,
  userId,
  organizationId,
  {
    before: originalRisk,
    after: updatedRisk,
    fields: ['title', 'severity', 'status'],
    changeType: 'UPDATE',
  },
  {
    significantChange: originalRisk.severity !== updatedRisk.severity,
    workflowTriggered: updatedRisk.status === 'APPROVED',
  }
);
```

## Querying Audit Logs

### Basic Query

```typescript
import { getAuditLogger } from '@/lib/audit/audit-logger';

const auditLogger = getAuditLogger(prisma);

const result = await auditLogger.query({
  organizationId: 'org_123',
  userId: 'user_456',
  action: 'UPDATE',
  entity: 'RISK',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  page: 1,
  limit: 50,
});

console.log(`Found ${result.totalCount} audit events`);
result.events.forEach(event => {
  console.log(`${event.timestamp}: ${event.action} on ${event.entity}`);
});
```

### Advanced Filtering

```typescript
// Complex query with multiple filters
const result = await auditLogger.query({
  organizationId: 'org_123',
  action: ['CREATE', 'UPDATE', 'DELETE'],
  entity: ['RISK', 'CONTROL'],
  severity: ['HIGH', 'CRITICAL'],
  status: 'FAILURE',
  search: 'database security',
  complianceFlags: ['SOX', 'SOC2'],
  includeMetadata: true,
  sortBy: 'timestamp',
  sortOrder: 'desc',
});
```

## Generating Audit Reports

### Compliance Report

```typescript
import { getAuditLogger } from '@/lib/audit/audit-logger';

const auditLogger = getAuditLogger(prisma);

const report = await auditLogger.generateReport(
  organizationId,
  'COMPLIANCE',
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    complianceFlags: ['SOC2'],
  },
  userId
);

console.log(`Compliance Score: ${report.summary.complianceScore}%`);
console.log(`Risk Score: ${report.summary.riskScore}%`);
console.log(`Total Events: ${report.summary.totalEvents}`);
```

### Security Report

```typescript
const securityReport = await auditLogger.generateReport(
  organizationId,
  'SECURITY',
  {
    startDate: lastMonth,
    endDate: now,
    severity: ['HIGH', 'CRITICAL'],
    action: ['LOGIN_FAILED', 'ACCESS_DENIED', 'PERMISSION_GRANT'],
  },
  userId
);
```

## API Endpoints

### GET /api/audit

Query audit logs with filtering and pagination.

**Parameters:**
- `userId` - Filter by user ID
- `action` - Filter by action type
- `entity` - Filter by entity type
- `severity` - Filter by severity (LOW/MEDIUM/HIGH/CRITICAL)
- `status` - Filter by status (SUCCESS/FAILURE/WARNING/INFO)
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `search` - Search term
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 1000)
- `sortBy` - Sort field (default: timestamp)
- `sortOrder` - Sort order (asc/desc, default: desc)
- `includeMetadata` - Include metadata (default: false)
- `complianceFlags` - Compliance frameworks (comma-separated)

**Example:**
```bash
GET /api/audit?action=UPDATE&entity=RISK&severity=HIGH&page=1&limit=25
```

### POST /api/audit/reports

Generate audit reports in various formats.

**Request Body:**
```json
{
  "reportType": "COMPLIANCE",
  "filters": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "complianceFlags": ["SOC2", "ISO27001"]
  },
  "format": "PDF",
  "includeDetailedEvents": true
}
```

**Response:** Report data or binary file for PDF/Excel formats.

## Compliance Features

### Retention Policies

Audit events have different retention periods based on regulatory requirements:

- **Financial Events** (SOX): 7 years
- **Personal Data** (GDPR): 3 years or until deletion request
- **Security Events**: 3 years
- **General Operations**: 1 year

### Encryption

Sensitive events are automatically encrypted:
- Authentication events
- Personal data operations
- Payment transactions
- API key operations

### Compliance Scoring

The system automatically calculates compliance scores based on:
- Success/failure rates
- Security event frequency
- Policy adherence
- Access control effectiveness

### Geographic Compliance

Audit logs respect data residency requirements:
- EU data stays in EU regions (GDPR)
- US financial data handled per SOX requirements
- Industry-specific geographic restrictions

## Performance Considerations

### Batch Processing

The audit system uses batch processing for high performance:
- Events are queued and processed in batches of 50
- Batch interval: 5 seconds
- Critical events processed immediately

### Caching

Recent audit events are cached for quick access:
- Last 100 events per organization cached for 1 hour
- Query results cached based on filters
- Statistics cached for 24 hours

### Database Optimization

- Comprehensive indexing for fast queries
- Partitioning by time for large datasets
- Automated cleanup of old logs based on retention policies

## Best Practices

### 1. Use Decorators for Automatic Logging

```typescript
// ✅ Good - Automatic logging
export const POST = withAPI(
  withDataAudit('RISK', 'CREATE')(handleCreate),
  { auth: true }
);

// ❌ Avoid - Manual logging everywhere
export const POST = withAPI(async (req, context) => {
  await logAuditEvent(/* ... */);
  const result = await handleCreate(req, context);
  await logAuditEvent(/* ... */);
  return result;
});
```

### 2. Include Meaningful Metadata

```typescript
// ✅ Good - Rich context
await logAuditEvent(prisma, {
  // ... base fields
  metadata: {
    riskScore: risk.riskScore,
    category: risk.category,
    workflowTriggered: true,
    automatedAction: false,
    clientVersion: '1.2.3',
  },
});
```

### 3. Use Appropriate Severity Levels

```typescript
// ✅ Good - Appropriate severity
const severity = action === 'DELETE' ? 'HIGH' : 
                action === 'UPDATE' ? 'MEDIUM' : 'LOW';
```

### 4. Implement Error Logging

```typescript
try {
  // Operation
} catch (error) {
  await logAuditEvent(prisma, {
    // ... base fields
    status: 'FAILURE',
    errorMessage: error.message,
    severity: 'HIGH',
  });
  throw error;
}
```

### 5. Regular Report Generation

```typescript
// Generate monthly compliance reports
const generateMonthlyReport = async () => {
  const report = await auditLogger.generateReport(
    organizationId,
    'COMPLIANCE',
    {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    },
    'system'
  );
  
  // Store or email report
  await storeComplianceReport(report);
};
```

## Configuration

### Environment Variables

```bash
# Audit logging configuration
AUDIT_BATCH_SIZE=50
AUDIT_BATCH_INTERVAL=5000
AUDIT_CACHE_TTL=3600
AUDIT_ENCRYPTION_KEY=your-encryption-key
AUDIT_RETENTION_DEFAULT=365
AUDIT_RETENTION_FINANCIAL=2555
AUDIT_RETENTION_SECURITY=1095
```

### Database Settings

Ensure your database is configured for audit logging:

```sql
-- Enable row-level security (optional)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create retention policy (PostgreSQL)
SELECT cron.schedule('audit-cleanup', '0 2 * * *', 
  'DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL ''1 year'' AND compliance_flags !~ ''SOX|GDPR'''
);
```

## Security Considerations

### Access Control

- Audit log access requires specific permissions
- Logs cannot be modified or deleted by users
- Admin access is itself audited
- Separation of duties for audit review

### Data Protection

- Sensitive fields automatically encrypted
- PII handled according to privacy regulations
- Secure key management for encryption
- Regular security audits of audit system

### Monitoring

- Monitor audit system health
- Alert on audit failures
- Track audit log storage usage
- Monitor for suspicious access patterns

## Troubleshooting

### Common Issues

**Audit logs not appearing:**
- Check batch processing interval
- Verify database connectivity
- Check for errors in application logs
- Ensure proper permissions

**Performance issues:**
- Review batch size configuration
- Check database indexes
- Monitor cache hit rates
- Consider database partitioning

**Compliance failures:**
- Verify retention policies
- Check encryption configuration
- Review compliance flag settings
- Validate geographic data handling

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const auditLogger = getAuditLogger(prisma);
auditLogger.enableDebug(true);
```

## Migration and Backup

### Data Migration

When migrating audit data:
- Preserve all metadata
- Maintain chronological order
- Verify data integrity
- Update retention schedules

### Backup Strategy

- Daily incremental backups
- Weekly full backups
- Geographic backup distribution
- Regular restoration testing

---

For more information, see:
- [API Documentation](/api/docs/ui)
- [Compliance Guide](/docs/compliance/)
- [Security Best Practices](/docs/security/)
- [Performance Tuning](/docs/performance/)