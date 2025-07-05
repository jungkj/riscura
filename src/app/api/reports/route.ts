import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/auth-middleware';
import ReportService, { ReportFilters } from '@/services/ReportService';
import { z } from 'zod';
import { ReportType, ReportStatus } from '@prisma/client';

// GET /api/reports - List reports
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

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
    organization.id,
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
});

// POST /api/reports - Create new report
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  const body = await req.json();
  
  // Validate request body
  const CreateReportSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    type: z.nativeEnum(ReportType),
    templateId: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  });

  const validatedData = CreateReportSchema.parse(body);

  const report = await ReportService.createReport(
    validatedData,
    user.id,
    organization.id
  );

  return NextResponse.json({
    data: report,
    message: 'Report created successfully',
  }, { status: 201 });
});

// PUT /api/reports - Bulk update reports (not commonly used)
export const PUT = withApiMiddleware(async (req: NextRequest) => {
  return NextResponse.json(
    { error: 'Bulk update not supported. Use /api/reports/[id] for individual updates.' },
    { status: 400 }
  );
});

// DELETE /api/reports - Bulk delete reports (requires admin)
export const DELETE = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

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
    reportIds.map(id => ReportService.deleteReport(id, organization.id))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return NextResponse.json({
    message: `Deleted ${successful} reports, ${failed} failed`,
    successful,
    failed,
  });
}); 