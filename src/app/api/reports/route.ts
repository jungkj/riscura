import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import ReportService, { ReportFilters } from '@/services/ReportService';
import { z } from 'zod';
import { ReportType, ReportStatus } from '@prisma/client';

// GET /api/reports - List reports
export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    // Get user from request (added by middleware)
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const filters: ReportFilters = {
      type: searchParams.get('type') as ReportType | undefined,
      status: searchParams.get('status') as ReportStatus | undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Parse date filters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    const result = await ReportService.getReports(
      user.organizationId,
      filters,
      page,
      limit
    );

    return NextResponse.json({
      data: result.reports,
      meta: {
        total: result.total,
        page,
        limit,
        pages: result.pages,
      },
    });
  },
  { requireAuth: true }
);

// Schema for creating reports
const CreateReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(ReportType),
  templateId: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

// POST /api/reports - Create new report
export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    // Get user from request (added by middleware)
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = CreateReportSchema.parse(body);

    const report = await ReportService.createReport(
      validatedData,
      user.id,
      user.organizationId
    );

    return NextResponse.json({
      data: report,
      message: 'Report created successfully',
    }, { status: 201 });
  },
  { 
    requireAuth: true,
    validateBody: CreateReportSchema 
  }
);

// PUT /api/reports - Bulk update reports (not commonly used)
export const PUT = withApiMiddleware(
  async (req: NextRequest) => {
    return NextResponse.json(
      { error: 'Bulk update not supported. Use /api/reports/[id] for individual updates.' },
      { status: 400 }
    );
  },
  { requireAuth: true }
);

// DELETE /api/reports - Bulk delete reports (requires admin)
export const DELETE = withApiMiddleware(
  async (req: NextRequest) => {
    // Get user from request (added by middleware)
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Check if user has admin permissions
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reportIds } = z.object({
      reportIds: z.array(z.string()).min(1),
    }).parse(body);

    // Delete reports one by one
    const results = await Promise.allSettled(
      reportIds.map(id => ReportService.deleteReport(id, user.organizationId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Deleted ${successful} reports, ${failed} failed`,
      successful,
      failed,
    });
  },
  { 
    requireAuth: true,
    requiredPermissions: ['reports.delete'] 
  }
);
