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
  { params }: RouteParams
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const body = await req.json();
    const validatedData = assessRequirementSchema.parse(body);

    const item = await complianceService.assessRequirement({
      ...validatedData,
      assessmentId: resolvedParams.id,
      assessedBy: user.id,
    });

    return ApiResponseFormatter.success(item, 'Requirement assessed successfully');
  })(req);
}