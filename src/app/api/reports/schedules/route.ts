import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/auth-middleware';
import ReportService from '@/services/ReportService';
import { z } from 'zod';

// GET /api/reports/schedules - List report schedules
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  const schedules = await ReportService.getReportSchedules(organization.id);

  return NextResponse.json({
    data: schedules,
    meta: {
      total: schedules.length,
    },
  });
});

// POST /api/reports/schedules - Create report schedule
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  const body = await req.json();

  const CreateScheduleSchema = z.object({
    reportTemplateId: z.string(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM']),
    scheduleConfig: z.record(z.any()),
    recipients: z.array(z.string().email()).default([]),
    isActive: z.boolean().default(true),
  });

  const validatedData = CreateScheduleSchema.parse(body);

  const schedule = await ReportService.createReportSchedule(
    validatedData,
    user.id,
    organization.id
  );

  return NextResponse.json({
    data: schedule,
    message: 'Report schedule created successfully',
  }, { status: 201 });
});