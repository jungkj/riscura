import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { ComplianceStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const body = await request.json();
    const validatedData = assessRequirementSchema.parse(body);

    const item = await complianceService.assessRequirement({
      assessmentId: id,
      requirementId: validatedData.requirementId,
      status: validatedData.status,
      score: validatedData.score,
      evidence: validatedData.evidence,
      findings: validatedData.findings,
      recommendations: validatedData.recommendations,
      assessedBy: user.id
    });

    return ApiResponseFormatter.success(item);
    },
    { requireAuth: true }
  )(req);
}
