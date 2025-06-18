import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError, ValidationError, NotFoundError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Report validation schemas
const reportCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['RISK_ASSESSMENT', 'CONTROL_EFFECTIVENESS', 'COMPLIANCE', 'AUDIT', 'EXECUTIVE_DASHBOARD', 'CUSTOM']),
  category: z.string().optional(),
  template: z.string().optional(),
  parameters: z.object({
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
    filters: z.record(z.any()).optional(),
    groupBy: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional(),
    includeCharts: z.boolean().default(true),
    includeTables: z.boolean().default(true),
    includeExecutiveSummary: z.boolean().default(true),
    confidentialityLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  }).optional(),
  schedule: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().optional(), // HH:MM format
    timezone: z.string().default('UTC'),
    recipients: z.array(z.string().email()).default([]),
  }).optional(),
  exportFormats: z.array(z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'])).default(['PDF']),
  sharedWith: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

const reportUpdateSchema = reportCreateSchema.partial();

const reportQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).transform((data) => ({
  ...data,
  skip: (data.page - 1) * data.limit,
}));

const reportGenerateSchema = z.object({
  reportId: z.string().uuid().optional(),
  type: z.enum(['RISK_ASSESSMENT', 'CONTROL_EFFECTIVENESS', 'COMPLIANCE', 'AUDIT', 'EXECUTIVE_DASHBOARD', 'CUSTOM']),
  parameters: z.object({
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    filters: z.record(z.any()).optional(),
    groupBy: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional(),
    includeCharts: z.boolean().default(true),
    includeTables: z.boolean().default(true),
    includeExecutiveSummary: z.boolean().default(true),
  }),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML']).default('PDF'),
});

const reportBulkSchema = z.object({
  create: z.array(reportCreateSchema).optional(),
  update: z.array(z.object({
    id: z.string().uuid(),
  }).merge(reportUpdateSchema)).optional(),
  delete: z.array(z.string().uuid()).optional(),
});

// GET /api/reports - List reports with advanced filtering
export const GET = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = reportQuerySchema.parse(queryParams);

    // Build where clause
    const where: Prisma.ReportWhereInput = {
      organizationId: user.organizationId,
    };

    // Text search across multiple fields
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (validatedQuery.type) {
      where.type = validatedQuery.type as any;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status as any;
    }

    if (validatedQuery.createdBy) {
      where.createdBy = validatedQuery.createdBy;
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      where.OR = [
        ...(where.OR || []),
        { tags: { hasSome: validatedQuery.tags } },
      ];
    }

    // Date range filters
    if (validatedQuery.createdAfter || validatedQuery.createdBefore) {
      where.createdAt = {};
      if (validatedQuery.createdAfter) {
        where.createdAt.gte = new Date(validatedQuery.createdAfter);
      }
      if (validatedQuery.createdBefore) {
        where.createdAt.lte = new Date(validatedQuery.createdBefore);
      }
    }

    // Count total records
    const total = await db.client.report.count({ where });

    // Build orderBy
    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    if (validatedQuery.sortBy) {
      orderBy[validatedQuery.sortBy as keyof Prisma.ReportOrderByWithRelationInput] = validatedQuery.sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    // Execute query
    const reports = await db.client.report.findMany({
      where,
      orderBy,
      skip: validatedQuery.skip,
      take: validatedQuery.limit,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    // Enrich reports with additional metadata
    const enrichedReports = reports.map(report => {
      const parameters = report.parameters as any || {};
      const data = report.data as any || {};
      
      return {
        ...report,
        parameters,
        data: {
          ...data,
          generatedAt: data.generatedAt,
          executionTime: data.executionTime,
          recordCount: data.recordCount,
        },
        lastGenerated: data.generatedAt ? new Date(data.generatedAt) : null,
        isScheduled: parameters.schedule?.enabled || false,
        nextScheduledRun: calculateNextScheduledRun(parameters.schedule),
        canGenerate: true, // TODO: Add permission checking
        canEdit: report.createdBy === user.id || user.permissions.includes('reports:edit'),
        canDelete: report.createdBy === user.id || user.permissions.includes('reports:delete'),
      };
    });

    return createAPIResponse({
      data: enrichedReports,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        hasNextPage: validatedQuery.skip + validatedQuery.limit < total,
        hasPreviousPage: validatedQuery.skip > 0,
        totalPages: Math.ceil(total / validatedQuery.limit),
      },
      summary: {
        totalReports: total,
        publishedReports: reports.filter(r => r.status === 'PUBLISHED').length,
        scheduledReports: reports.filter(r => {
          const params = r.parameters as any;
          return params?.schedule?.enabled;
        }).length,
        recentReports: reports.filter(r => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return r.updatedAt > dayAgo;
        }).length,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw new Error('Failed to fetch reports');
  }
});

// POST /api/reports - Create new report
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = reportCreateSchema.parse(body);

    // Validate shared users exist
    if (validatedData.sharedWith && validatedData.sharedWith.length > 0) {
      const users = await db.client.user.findMany({
        where: {
          id: { in: validatedData.sharedWith },
          organizationId: user.organizationId,
        },
        select: { id: true },
      });

      if (users.length !== validatedData.sharedWith.length) {
        throw new ValidationError('One or more shared user IDs are invalid');
      }
    }

    // Create report
    const report = await db.client.report.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        status: 'DRAFT',
        parameters: validatedData.parameters || {},
        sharedWith: validatedData.sharedWith,
        exportFormats: validatedData.exportFormats,
        organizationId: user.organizationId,
        createdBy: user.id,
        data: {
          template: validatedData.template,
          category: validatedData.category,
          tags: validatedData.tags,
          metadata: validatedData.metadata,
          schedule: validatedData.schedule,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'REPORT_CREATED',
        description: `Report "${report.title}" created`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'REPORT',
        entityId: report.id,
        metadata: {
          reportType: report.type,
          sharedWith: validatedData.sharedWith?.length || 0,
          isScheduled: validatedData.schedule?.enabled || false,
        },
      },
    });

    return createAPIResponse({
      data: report,
      message: 'Report created successfully',
    });
  } catch (error) {
    console.error('Error creating report:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid report data', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create report');
  }
});

// POST /api/reports/generate - Generate report data
export const POST_GENERATE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = reportGenerateSchema.parse(body);

    const startTime = Date.now();

    // Generate report data based on type
    const reportData = await generateReportData(validatedData.type, validatedData.parameters, user.organizationId);
    
    const executionTime = Date.now() - startTime;

    // If reportId is provided, update the existing report
    if (validatedData.reportId) {
      const existingReport = await db.client.report.findFirst({
        where: {
          id: validatedData.reportId,
          organizationId: user.organizationId,
        },
      });

      if (!existingReport) {
        throw new NotFoundError('Report not found');
      }

      await db.client.report.update({
        where: { id: validatedData.reportId },
        data: {
          data: {
            ...reportData,
            generatedAt: new Date().toISOString(),
            executionTime,
            generatedBy: user.id,
          },
          status: 'PUBLISHED',
        },
      });
    }

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'REPORT_GENERATED',
        description: `Report generated: ${validatedData.type}`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'REPORT',
        entityId: validatedData.reportId || 'ad-hoc',
        metadata: {
          reportType: validatedData.type,
          executionTime,
          recordCount: reportData.summary?.totalRecords || 0,
          format: validatedData.format,
        },
      },
    });

    return createAPIResponse({
      data: {
        ...reportData,
        generatedAt: new Date().toISOString(),
        executionTime,
        format: validatedData.format,
      },
      message: 'Report generated successfully',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid report generation parameters', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to generate report');
  }
});

// PUT /api/reports/bulk - Bulk operations on reports
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = reportBulkSchema.parse(body);

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[],
    };

    // Handle bulk create
    if (validatedData.create && validatedData.create.length > 0) {
      for (const reportData of validatedData.create) {
        try {
          const validatedReport = reportCreateSchema.parse(reportData);
          
          await db.client.report.create({
            data: {
              title: validatedReport.title,
              description: validatedReport.description,
              type: validatedReport.type,
              status: 'DRAFT',
              parameters: validatedReport.parameters || {},
              sharedWith: validatedReport.sharedWith,
              exportFormats: validatedReport.exportFormats,
              organizationId: user.organizationId,
              createdBy: user.id,
              data: {
                template: validatedReport.template,
                category: validatedReport.category,
                tags: validatedReport.tags,
                metadata: validatedReport.metadata,
                schedule: validatedReport.schedule,
              },
            },
          });

          results.created++;
        } catch (error) {
          results.errors.push(`Failed to create report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk update
    if (validatedData.update && validatedData.update.length > 0) {
      for (const updateData of validatedData.update) {
        try {
          const { id, ...reportData } = updateData;
          const validatedReport = reportUpdateSchema.parse(reportData);

          const existing = await db.client.report.findFirst({
            where: {
              id,
              organizationId: user.organizationId,
            },
          });

          if (!existing) {
            results.errors.push(`Report with ID ${id} not found`);
            continue;
          }

          const updateFields: any = {};
          
          if (validatedReport.title) updateFields.title = validatedReport.title;
          if (validatedReport.description !== undefined) updateFields.description = validatedReport.description;
          if (validatedReport.type) updateFields.type = validatedReport.type;
          if (validatedReport.parameters) updateFields.parameters = validatedReport.parameters;
          if (validatedReport.sharedWith) updateFields.sharedWith = validatedReport.sharedWith;
          if (validatedReport.exportFormats) updateFields.exportFormats = validatedReport.exportFormats;

          if (Object.keys(updateFields).length > 0) {
            await db.client.report.update({
              where: { id },
              data: updateFields,
            });
          }

          results.updated++;
        } catch (error) {
          results.errors.push(`Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk delete
    if (validatedData.delete && validatedData.delete.length > 0) {
      for (const reportId of validatedData.delete) {
        try {
          const existing = await db.client.report.findFirst({
            where: {
              id: reportId,
              organizationId: user.organizationId,
            },
          });

          if (!existing) {
            results.errors.push(`Report with ID ${reportId} not found`);
            continue;
          }

          await db.client.report.delete({
            where: { id: reportId },
          });

          results.deleted++;
        } catch (error) {
          results.errors.push(`Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Log bulk activity
    await db.client.activity.create({
      data: {
        type: 'REPORT_BULK_OPERATION',
        description: `Bulk report operation: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          created: results.created,
          updated: results.updated,
          deleted: results.deleted,
          errors: results.errors.length,
        },
      },
    });

    return createAPIResponse({
      data: results,
      message: `Bulk operation completed: ${results.created + results.updated + results.deleted} reports processed`,
    });
  } catch (error) {
    console.error('Error in bulk reports operation:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid bulk operation data', error.errors);
    }
    throw new Error('Failed to perform bulk operation');
  }
});

// Helper function to generate report data based on type
async function generateReportData(type: string, parameters: any, organizationId: string): Promise<any> {
  const { dateRange, filters = {}, groupBy = [], metrics = [] } = parameters;
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  switch (type) {
    case 'RISK_ASSESSMENT':
      return await generateRiskAssessmentReport(organizationId, startDate, endDate, filters, groupBy, metrics);
    
    case 'CONTROL_EFFECTIVENESS':
      return await generateControlEffectivenessReport(organizationId, startDate, endDate, filters, groupBy, metrics);
    
    case 'COMPLIANCE':
      return await generateComplianceReport(organizationId, startDate, endDate, filters, groupBy, metrics);
    
    case 'AUDIT':
      return await generateAuditReport(organizationId, startDate, endDate, filters, groupBy, metrics);
    
    case 'EXECUTIVE_DASHBOARD':
      return await generateExecutiveDashboardReport(organizationId, startDate, endDate, filters, groupBy, metrics);
    
    default:
      throw new ValidationError(`Unsupported report type: ${type}`);
  }
}

async function generateRiskAssessmentReport(
  organizationId: string, 
  startDate: Date, 
  endDate: Date, 
  filters: any, 
  groupBy: string[], 
  metrics: string[]
): Promise<any> {
  // Get risks within date range
  const risks = await db.client.risk.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
      ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
    },
    include: {
      creator: {
        select: { firstName: true, lastName: true },
      },
      assignedUser: {
        select: { firstName: true, lastName: true },
      },
      controls: {
        include: {
          control: {
            select: { title: true, status: true, type: true },
          },
        },
      },
    },
  });

  // Calculate metrics
  const totalRisks = risks.length;
  const risksByLevel = risks.reduce((acc, risk) => {
    const level = risk.riskLevel || 'UNKNOWN';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const risksByCategory = risks.reduce((acc, risk) => {
    acc[risk.category] = (acc[risk.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const risksByStatus = risks.reduce((acc, risk) => {
    acc[risk.status] = (acc[risk.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageRiskScore = totalRisks > 0 
    ? risks.reduce((sum, risk) => sum + risk.riskScore, 0) / totalRisks 
    : 0;

  const controlsCount = risks.reduce((sum, risk) => sum + risk.controls.length, 0);
  const averageControlsPerRisk = totalRisks > 0 ? controlsCount / totalRisks : 0;

  return {
    summary: {
      totalRecords: totalRisks,
      dateRange: { start: startDate, end: endDate },
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      averageControlsPerRisk: Math.round(averageControlsPerRisk * 100) / 100,
    },
    metrics: {
      risksByLevel,
      risksByCategory,
      risksByStatus,
      totalControls: controlsCount,
    },
    data: risks.map(risk => ({
      id: risk.id,
      title: risk.title,
      category: risk.category,
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      status: risk.status,
      owner: risk.assignedUser 
        ? `${risk.assignedUser.firstName} ${risk.assignedUser.lastName}` 
        : 'Unassigned',
      controlsCount: risk.controls.length,
      dateIdentified: risk.dateIdentified,
      lastAssessed: risk.lastAssessed,
      nextReview: risk.nextReview,
    })),
    charts: [
      {
        type: 'pie',
        title: 'Risks by Level',
        data: Object.entries(risksByLevel).map(([level, count]) => ({ label: level, value: count })),
      },
      {
        type: 'bar',
        title: 'Risks by Category',
        data: Object.entries(risksByCategory).map(([category, count]) => ({ label: category, value: count })),
      },
      {
        type: 'doughnut',
        title: 'Risks by Status',
        data: Object.entries(risksByStatus).map(([status, count]) => ({ label: status, value: count })),
      },
    ],
  };
}

async function generateControlEffectivenessReport(
  organizationId: string, 
  startDate: Date, 
  endDate: Date, 
  filters: any, 
  groupBy: string[], 
  metrics: string[]
): Promise<any> {
  const controls = await db.client.control.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
    },
    include: {
      creator: {
        select: { firstName: true, lastName: true },
      },
      assignedUser: {
        select: { firstName: true, lastName: true },
      },
      risks: {
        include: {
          risk: {
            select: { title: true, riskLevel: true, status: true },
          },
        },
      },
    },
  });

  const totalControls = controls.length;
  const controlsByStatus = controls.reduce((acc, control) => {
    acc[control.status] = (acc[control.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const controlsByType = controls.reduce((acc, control) => {
    acc[control.type] = (acc[control.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const controlsByCategory = controls.reduce((acc, control) => {
    acc[control.category] = (acc[control.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageEffectiveness = controls.length > 0 
    ? controls.reduce((sum, control) => sum + (control.effectiveness || 0), 0) / controls.length 
    : 0;

  return {
    summary: {
      totalRecords: totalControls,
      dateRange: { start: startDate, end: endDate },
      averageEffectiveness: Math.round(averageEffectiveness * 100) / 100,
      implementedControls: controlsByStatus['IMPLEMENTED'] || 0,
      operationalControls: controlsByStatus['OPERATIONAL'] || 0,
    },
    metrics: {
      controlsByStatus,
      controlsByType,
      controlsByCategory,
    },
    data: controls.map(control => ({
      id: control.id,
      title: control.title,
      category: control.category,
      type: control.type,
      status: control.status,
      effectiveness: control.effectiveness,
      owner: control.assignedUser 
        ? `${control.assignedUser.firstName} ${control.assignedUser.lastName}` 
        : 'Unassigned',
      risksCount: control.risks.length,
      implementationDate: control.implementationDate,
      lastTested: control.lastTestedDate,
      nextTest: control.nextTestDate,
    })),
    charts: [
      {
        type: 'bar',
        title: 'Controls by Status',
        data: Object.entries(controlsByStatus).map(([status, count]) => ({ label: status, value: count })),
      },
      {
        type: 'pie',
        title: 'Controls by Type',
        data: Object.entries(controlsByType).map(([type, count]) => ({ label: type, value: count })),
      },
    ],
  };
}

async function generateComplianceReport(
  organizationId: string, 
  startDate: Date, 
  endDate: Date, 
  filters: any, 
  groupBy: string[], 
  metrics: string[]
): Promise<any> {
  // Get compliance-related data (questionnaires, controls, risks)
  const [questionnaires, controls, risks] = await Promise.all([
    db.client.questionnaire.findMany({
      where: {
        organizationId,
        type: 'COMPLIANCE_CHECK',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        responses: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    }),
    db.client.control.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
        category: 'COMPLIANCE',
      },
    }),
    db.client.risk.findMany({
      where: {
        organizationId,
        category: 'COMPLIANCE',
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const totalQuestionnaires = questionnaires.length;
  const totalResponses = questionnaires.reduce((sum, q) => sum + q.responses.length, 0);
  const averageCompletionRate = totalQuestionnaires > 0 
    ? questionnaires.reduce((sum, q) => sum + (q.responses.length > 0 ? 100 : 0), 0) / totalQuestionnaires 
    : 0;

  const complianceScore = controls.length > 0 
    ? (controls.filter(c => c.status === 'OPERATIONAL').length / controls.length) * 100 
    : 0;

  return {
    summary: {
      totalRecords: totalQuestionnaires + controls.length + risks.length,
      dateRange: { start: startDate, end: endDate },
      complianceScore: Math.round(complianceScore * 100) / 100,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
    },
    metrics: {
      questionnaires: totalQuestionnaires,
      responses: totalResponses,
      controls: controls.length,
      risks: risks.length,
      operationalControls: controls.filter(c => c.status === 'OPERATIONAL').length,
      mitigatedRisks: risks.filter(r => r.status === 'MITIGATED').length,
    },
    data: {
      questionnaires: questionnaires.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        responsesCount: q.responses.length,
        completionRate: q.responses.length > 0 ? 100 : 0,
      })),
      controls: controls.slice(0, 10), // Limit for summary
      risks: risks.slice(0, 10), // Limit for summary
    },
    charts: [
      {
        type: 'gauge',
        title: 'Overall Compliance Score',
        data: [{ label: 'Compliance', value: complianceScore }],
      },
    ],
  };
}

async function generateAuditReport(
  organizationId: string, 
  startDate: Date, 
  endDate: Date, 
  filters: any, 
  groupBy: string[], 
  metrics: string[]
): Promise<any> {
  // Get audit trail data
  const activities = await db.client.activity.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters.type && { type: filters.type }),
      ...(filters.userId && { userId: filters.userId }),
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalActivities = activities.length;
  const activitiesByType = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activitiesByUser = activities.reduce((acc, activity) => {
    const userName = activity.user 
      ? `${activity.user.firstName} ${activity.user.lastName}` 
      : 'System';
    acc[userName] = (acc[userName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    summary: {
      totalRecords: totalActivities,
      dateRange: { start: startDate, end: endDate },
      uniqueUsers: Object.keys(activitiesByUser).length,
      mostActiveUser: Object.entries(activitiesByUser).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
    },
    metrics: {
      activitiesByType,
      activitiesByUser,
    },
    data: activities.slice(0, 100).map(activity => ({ // Limit to first 100 for performance
      id: activity.id,
      type: activity.type,
      description: activity.description,
      user: activity.user 
        ? `${activity.user.firstName} ${activity.user.lastName}` 
        : 'System',
      entityType: activity.entityType,
      entityId: activity.entityId,
      createdAt: activity.createdAt,
      metadata: activity.metadata,
    })),
    charts: [
      {
        type: 'line',
        title: 'Activity Over Time',
        data: [], // TODO: Implement time series data
      },
      {
        type: 'bar',
        title: 'Activities by Type',
        data: Object.entries(activitiesByType).map(([type, count]) => ({ label: type, value: count })),
      },
    ],
  };
}

async function generateExecutiveDashboardReport(
  organizationId: string, 
  startDate: Date, 
  endDate: Date, 
  filters: any, 
  groupBy: string[], 
  metrics: string[]
): Promise<any> {
  // Get high-level summary data
  const [risks, controls, questionnaires, activities] = await Promise.all([
    db.client.risk.findMany({
      where: { organizationId, createdAt: { gte: startDate, lte: endDate } },
    }),
    db.client.control.findMany({
      where: { organizationId, createdAt: { gte: startDate, lte: endDate } },
    }),
    db.client.questionnaire.findMany({
      where: { organizationId, createdAt: { gte: startDate, lte: endDate } },
      include: { responses: true },
    }),
    db.client.activity.findMany({
      where: { organizationId, createdAt: { gte: startDate, lte: endDate } },
    }),
  ]);

  const riskScore = risks.length > 0 
    ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length 
    : 0;

  const controlEffectiveness = controls.length > 0 
    ? (controls.filter(c => c.status === 'OPERATIONAL').length / controls.length) * 100 
    : 0;

  const complianceRate = questionnaires.length > 0 
    ? (questionnaires.filter(q => q.responses.length > 0).length / questionnaires.length) * 100 
    : 0;

  return {
    summary: {
      totalRecords: risks.length + controls.length + questionnaires.length,
      dateRange: { start: startDate, end: endDate },
      riskScore: Math.round(riskScore * 100) / 100,
      controlEffectiveness: Math.round(controlEffectiveness * 100) / 100,
      complianceRate: Math.round(complianceRate * 100) / 100,
    },
    kpis: [
      { label: 'Total Risks', value: risks.length, trend: 'stable' },
      { label: 'Active Controls', value: controls.filter(c => c.status === 'OPERATIONAL').length, trend: 'up' },
      { label: 'Compliance Rate', value: `${Math.round(complianceRate)}%`, trend: 'up' },
      { label: 'Recent Activities', value: activities.length, trend: 'stable' },
    ],
    metrics: {
      risksByLevel: risks.reduce((acc, r) => {
        const level = r.riskLevel || 'UNKNOWN';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      controlsByStatus: controls.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    charts: [
      {
        type: 'gauge',
        title: 'Risk Score',
        data: [{ label: 'Risk', value: riskScore }],
      },
      {
        type: 'gauge',
        title: 'Control Effectiveness',
        data: [{ label: 'Effectiveness', value: controlEffectiveness }],
      },
      {
        type: 'gauge',
        title: 'Compliance Rate',
        data: [{ label: 'Compliance', value: complianceRate }],
      },
    ],
  };
}

// Helper function to calculate next scheduled run
function calculateNextScheduledRun(schedule: any): Date | null {
  if (!schedule?.enabled || !schedule.frequency) {
    return null;
  }

  const now = new Date();
  const nextRun = new Date(now);

  switch (schedule.frequency) {
    case 'DAILY':
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'WEEKLY':
      const daysUntilNextWeek = 7 - now.getDay() + (schedule.dayOfWeek || 0);
      nextRun.setDate(now.getDate() + daysUntilNextWeek);
      break;
    case 'MONTHLY':
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(schedule.dayOfMonth || 1);
      break;
    case 'QUARTERLY':
      nextRun.setMonth(now.getMonth() + 3);
      nextRun.setDate(1);
      break;
    case 'ANNUALLY':
      nextRun.setFullYear(now.getFullYear() + 1);
      nextRun.setMonth(0);
      nextRun.setDate(1);
      break;
    default:
      return null;
  }

  // Set time if specified
  if (schedule.time) {
    const [hours, minutes] = schedule.time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);
  }

  return nextRun;
} 