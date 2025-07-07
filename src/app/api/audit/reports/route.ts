/**
 * Audit Report Generation API
 * Generates compliance and security audit reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';
import { getAuditLogger, AuditReport } from '@/lib/audit/audit-logger';
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

async function handlePost(req: NextRequest, context: { user: any; organization: any }) {
  const organizationId = context.organization.id;
  const userId = context.user.id;

  try {
    const body = await req.json();
    const validatedData = AuditReportRequestSchema.parse(body);

    // Convert date strings to Date objects
    const filters = {
      ...validatedData.filters,
      organizationId,
      startDate: new Date(validatedData.filters.startDate),
      endDate: new Date(validatedData.filters.endDate),
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
    console.error('Audit report generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid report request',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
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

  const rows = report.events.map(event => [
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
    .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
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
    ${report.summary.topActions.map(item => `- ${item.action}: ${item.count}`).join('\n')}
    
    Events:
    ${report.events.slice(0, 100).map(event => 
      `${event.timestamp.toISOString()} - ${event.action} - ${event.entity} - ${event.status}`
    ).join('\n')}
  `;

  return Buffer.from(pdfContent, 'utf-8');
}

async function convertReportToXLSX(report: AuditReport): Promise<Buffer> {
  // This is a placeholder - in a real implementation, you would use a library
  // like xlsx or exceljs to generate a proper Excel file
  const xlsxContent = JSON.stringify({
    summary: report.summary,
    events: report.events.map(event => ({
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

export const POST = withAPI(
  withComplianceAudit('AUDIT_START')(handlePost),
  {
    auth: true,
    permissions: ['audit:read', 'reports:generate'],
    rateLimit: {
      requests: 10,
      window: '1h',
    },
    tags: ['Audit', 'Reports'],
    summary: 'Generate Audit Report',
    description: 'Generate comprehensive audit reports in various formats with compliance scoring',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['reportType', 'filters'],
            properties: {
              reportType: {
                type: 'string',
                enum: ['COMPLIANCE', 'SECURITY', 'ACCESS', 'DATA_CHANGES', 'SYSTEM', 'CUSTOM'],
                description: 'Type of audit report to generate',
              },
              title: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
                description: 'Custom title for the report',
              },
              description: {
                type: 'string',
                maxLength: 1000,
                description: 'Custom description for the report',
              },
              filters: {
                type: 'object',
                required: ['startDate', 'endDate'],
                properties: {
                  userId: { type: 'string', description: 'Filter by user ID' },
                  action: { type: 'string', description: 'Filter by action type' },
                  entity: { type: 'string', description: 'Filter by entity type' },
                  severity: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                    description: 'Filter by severity level',
                  },
                  status: {
                    type: 'string',
                    enum: ['SUCCESS', 'FAILURE', 'WARNING', 'INFO'],
                    description: 'Filter by operation status',
                  },
                  startDate: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Start date for the report period',
                  },
                  endDate: {
                    type: 'string',
                    format: 'date-time',
                    description: 'End date for the report period',
                  },
                  search: { type: 'string', description: 'Search term' },
                  complianceFlags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by compliance frameworks',
                  },
                },
              },
              format: {
                type: 'string',
                enum: ['JSON', 'CSV', 'PDF', 'XLSX'],
                default: 'JSON',
                description: 'Output format for the report',
              },
              includeDetailedEvents: {
                type: 'boolean',
                default: true,
                description: 'Include detailed event data in the report',
              },
              includeStatistics: {
                type: 'boolean',
                default: true,
                description: 'Include statistical analysis',
              },
              includeComplianceScore: {
                type: 'boolean',
                default: true,
                description: 'Include compliance scoring',
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Audit report generated successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    reportType: { type: 'string' },
                    title: { type: 'string' },
                    summary: {
                      type: 'object',
                      properties: {
                        totalEvents: { type: 'integer' },
                        successRate: { type: 'number' },
                        failureRate: { type: 'number' },
                        complianceScore: { type: 'number' },
                        riskScore: { type: 'number' },
                        topActions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              action: { type: 'string' },
                              count: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                    events: {
                      type: 'array',
                      description: 'Detailed audit events (if includeDetailedEvents is true)',
                    },
                    generatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          'text/csv': {
            schema: {
              type: 'string',
              description: 'CSV formatted audit report',
            },
          },
          'application/pdf': {
            schema: {
              type: 'string',
              format: 'binary',
              description: 'PDF formatted audit report',
            },
          },
        },
      },
      '400': { $ref: '#/components/responses/ValidationError' },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
    },
  }
);