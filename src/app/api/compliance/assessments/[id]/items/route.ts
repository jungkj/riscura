import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { ComplianceStatus } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/compliance/assessments/[id]/items - Assess requirement
const assessRequirementSchema = z.object({
  requirementId: z.string().min(1),
  status: z.nativeEnum(ComplianceStatus),
  score: z.number().min(0).max(100).optional(),
  evidence: z.array(z.any()).optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

export const POST = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const body = await req.json();
  const validatedData = assessRequirementSchema.parse(body);

  const item = await complianceService.assessRequirement({
    ...validatedData,
    assessmentId: params.id,
    assessedBy: user.id,
  });

  return ApiResponseFormatter.success(item, 'Requirement assessed successfully');
});