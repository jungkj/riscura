import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import ReportService from '@/services/ReportService';
import { z } from 'zod';
import { ReportStatus } from '@prisma/client';

// GET /api/reports/[id] - Get single report
export async function GET(
  req: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;

    const report = await ReportService.getReportById(params.id, user.organizationId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: report });
  })(req);
},
  { requireAuth: true }
);

// PUT /api/reports/[id] - Update report
export async function PUT(
  req: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;

    const body = await req.json();

    // Validate request body
    const UpdateReportSchema = z.object({
      title: z.string().min(1, 'Title is required').optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ReportStatus).optional(),
      data: z.record(z.any()).optional(),
      parameters: z.record(z.any()).optional(),
    });

    const validatedData = UpdateReportSchema.parse(body);

    const report = await ReportService.updateReport(
      params.id,
      validatedData,
      user.organizationId
    );

    return NextResponse.json({
      data: report,
      message: 'Report updated successfully',
    });
  })(req);
},
  { requireAuth: true }
);

// DELETE /api/reports/[id] - Delete report
export async function DELETE(
  req: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;

    await ReportService.deleteReport(params.id, user.organizationId);

    return NextResponse.json({
      message: 'Report deleted successfully',
    });
  })(req);
},
  { requireAuth: true }
);

// POST /api/reports/[id]/generate - Generate report file
export async function POST(
  req: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;

    const body = await req.json();
    const { format = 'pdf' } = z.object({
      format: z.enum(['pdf', 'excel']).optional(),
    }).parse(body);

    const report = await ReportService.generateReport(
      params.id,
      format,
      user.organizationId
    );

    return NextResponse.json({
      data: report,
      message: `Report generated successfully as ${format.toUpperCase()}`,
    });
  })(req);
},
  { requireAuth: true }
);