import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { AssessmentStatus } from '@prisma/client';

// GET /api/compliance/assessments - Get assessments
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user) {
    return ApiResponseFormatter.authError('User not authenticated');
  }

  const searchParams = req.nextUrl.searchParams;
  const frameworkId = searchParams.get('frameworkId');
  const status = searchParams.get('status') as AssessmentStatus | null;

  const filters = {
    ...(frameworkId && { frameworkId }),
    ...(status && { status }),
  };

  const assessments = await complianceService.getAssessments(user.organizationId, filters);

  return ApiResponseFormatter.success(assessments);
});

// POST /api/compliance/assessments - Create assessment
const createAssessmentSchema = z.object({
  frameworkId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assessorId: z.string().optional(),
});

export const POST = withApiMiddleware(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return ApiResponseFormatter.forbiddenError('Insufficient permissions');
  }

  const body = await req.json();
  const validatedData = createAssessmentSchema.parse(body);

  const assessment = await complianceService.createAssessment({
    frameworkId: validatedData.frameworkId,
    name: validatedData.name,
    description: validatedData.description,
    dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    organizationId: user.organizationId,
    assessorId: validatedData.assessorId
  });

  return ApiResponseFormatter.success(assessment, { status: 201 });
});