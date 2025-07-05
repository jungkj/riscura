import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/auth-middleware';
import ReportService from '@/services/ReportService';
import { z } from 'zod';
import { ReportType } from '@prisma/client';

// GET /api/reports/templates - List report templates
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as ReportType | undefined;

  const templates = await ReportService.getReportTemplates(organization.id, type);

  return NextResponse.json({
    data: templates,
    meta: {
      total: templates.length,
    },
  });
});

// POST /api/reports/templates - Create report template
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  // Check if user has admin permissions
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
    return NextResponse.json(
      { error: 'Insufficient permissions to create templates' },
      { status: 403 }
    );
  }

  const body = await req.json();

  const CreateTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.nativeEnum(ReportType),
    templateConfig: z.record(z.any()),
    defaultParameters: z.record(z.any()).optional(),
  });

  const validatedData = CreateTemplateSchema.parse(body);

  const template = await ReportService.createReportTemplate(
    validatedData,
    user.id,
    organization.id
  );

  return NextResponse.json({
    data: template,
    message: 'Report template created successfully',
  }, { status: 201 });
});