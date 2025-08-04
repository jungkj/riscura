/**
 * Audit Report Generation API
 * Generates compliance and security audit reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';
import { getAuditLogger, AuditReport, AuditAction, AuditEntity } from '@/lib/audit/audit-logger';
import { withComplianceAudit } from '@/lib/audit/audit-middleware';
import { z } from 'zod';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AuditReportRequestSchema = z.object({
  reportType: z.enum(['COMPLIANCE', 'SECURITY', 'ACCESS', 'DATA_CHANGES', 'SYSTEM', 'CUSTOM']),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  filters: z.object({
    userId: z.string().optional(),
    action: z.string().optional(),
    entity: z.string().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'WARNING', 'INFO']).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    search: z.string().optional(),
    complianceFlags: z.array(z.string()).optional(),
  }),
  format: z.enum(['JSON', 'CSV', 'PDF', 'XLSX']).default('JSON'),
  includeDetailedEvents: z.boolean().default(true),
  includeStatistics: z.boolean().default(true),
  includeComplianceScore: z.boolean().default(true),
});

// ============================================================================
// POST /api/audit/reports - Generate Audit Report
// ============================================================================

async function handlePost(req: NextRequest) {
  const user = (req as any).user;

  if (!user || !user.organizationId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Organization context required',
        },
      },
      { status: 403 }
    );
  }

  const organizationId = user.organizationId;
  const userId = user.id;

  try {
    const body = await req.json();
    const validatedData = AuditReportRequestSchema.parse(body);

    // Convert date strings to Date objects and ensure action/entity are typed correctly
    const filters = {
      ...validatedData.filters,
      organizationId,
      startDate: new Date(validatedData.filters.startDate),
      endDate: new Date(validatedData.filters.endDate),
      action: validatedData.filters.action as AuditAction | undefined,
      entity: validatedData.filters.entity as AuditEntity | undefined,
    };

    // Validate date range
    if (filters.startDate >= filters.endDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'Start date must be before end date',
          },
        },
        { status: 400 }
      );
    }

    // Check if date range is reasonable (not more than 1 year)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (filters.endDate.getTime() - filters.startDate.getTime() > maxRangeMs) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATE_RANGE_TOO_LARGE',
            message: 'Date range cannot exceed 1 year',
          },
        },
        { status: 400 }
      );
    }

    // Generate the report
    const auditLogger = getAuditLogger(db.client);

    // Log audit start event
    await auditLogger.log({
      action: 'AUDIT_START',
      entity: 'COMPLIANCE_FRAMEWORK',
      entityId: validatedData.reportType,
      userId,
      organizationId,
      resource: 'compliance',
      method: req.method,
      path: req.nextUrl.pathname,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      status: 'SUCCESS',
      severity: 'HIGH',
      complianceFlags: ['SOC2', 'ISO27001', 'SOX'],
      metadata: {
        complianceAction: true,
        auditTrail: true,
        regulatoryImplications: true,
        reportType: validatedData.reportType,
      },
    });

    const report = await auditLogger.generateReport(
      organizationId,
      validatedData.reportType,
      filters,
      userId
    );

    // Apply format-specific processing
    let responseData: any = report;
    let contentType = 'application/json';

    switch (validatedData.format) {
      case 'CSV':
        responseData = await convertReportToCSV(report);
        contentType = 'text/csv';
        break;
      case 'PDF':
        responseData = await convertReportToPDF(report);
        contentType = 'application/pdf';
        break;
      case 'XLSX':
        responseData = await convertReportToXLSX(report);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        // JSON format - filter data based on options
        if (!validatedData.includeDetailedEvents) {
          responseData = {
            ...report,
            events: [], // Remove detailed events
          };
        }
        break;
    }

    // For binary formats, return as blob
    if (validatedData.format !== 'JSON') {
      return new NextResponse(responseData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="audit-report-${report.id}.${validatedData.format.toLowerCase()}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers.get('x-request-id'),
        reportGenerated: true,
      },
    });
  } catch (error) {
    // console.error('Audit report generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid report request',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate audit report',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FORMAT CONVERSION FUNCTIONS
// ============================================================================

async function convertReportToCSV(report: AuditReport): Promise<string> {
  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Entity',
    'Entity ID',
    'Resource',
    'Method',
    'Path',
    'Status',
    'Severity',
    'Duration (ms)',
    'IP Address',
    'User Agent',
    'Error Message',
  ];

  const rows = report.events.map((event) => [
    event.timestamp.toISOString(),
    event.userId || '',
    event.action,
    event.entity,
    event.entityId || '',
    event.resource,
    event.method,
    event.path,
    event.status,
    event.severity,
    event.duration?.toString() || '',
    event.ipAddress || '',
    event.userAgent || '',
    event.errorMessage || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

async function convertReportToPDF(report: AuditReport): Promise<Buffer> {
  // This is a placeholder - in a real implementation, you would use a PDF library
  // like puppeteer, jsPDF, or PDFKit to generate a proper PDF
  const pdfContent = `
    Audit Report: ${report.title}
    Generated: ${report.generatedAt.toISOString()}
    Organization: ${report.organizationId}
    
    Summary:
    - Total Events: ${report.summary.totalEvents}
    - Success Rate: ${report.summary.successRate.toFixed(2)}%
    - Failure Rate: ${report.summary.failureRate.toFixed(2)}%
    - Compliance Score: ${report.summary.complianceScore?.toFixed(2) || 'N/A'}%
    - Risk Score: ${report.summary.riskScore?.toFixed(2) || 'N/A'}%
    
    Top Actions:
    ${report.summary.topActions.map((item) => `- ${item.action}: ${item.count}`).join('\n')}
    
    Events:
    ${report.events
      .slice(0, 100)
      .map(
        (event) =>
          `${event.timestamp.toISOString()} - ${event.action} - ${event.entity} - ${event.status}`
      )
      .join('\n')}
  `;

  return Buffer.from(pdfContent, 'utf-8');
}

async function convertReportToXLSX(report: AuditReport): Promise<Buffer> {
  // This is a placeholder - in a real implementation, you would use a library
  // like xlsx or exceljs to generate a proper Excel file
  const xlsxContent = JSON.stringify({
    summary: report.summary,
    events: report.events.map((event) => ({
      timestamp: event.timestamp.toISOString(),
      userId: event.userId,
      action: event.action,
      entity: event.entity,
      status: event.status,
      severity: event.severity,
    })),
  });

  return Buffer.from(xlsxContent, 'utf-8');
}

// ============================================================================
// EXPORT HANDLERS
// ============================================================================

export const POST = withAPI(handlePost, {
  requireAuth: true,
  requiredPermissions: ['audit:read', 'reports:generate'],
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  validateBody: AuditReportRequestSchema,
});
