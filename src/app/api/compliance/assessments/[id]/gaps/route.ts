import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { GapType, GapSeverity, GapStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/compliance/assessments/[id]/gaps - Get assessment gaps
export const GET = withApiMiddleware(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as GapStatus | null;
    const severity = searchParams.get('severity') as GapSeverity | null;

    const filters = {
      ...(status && { status }),
      ...(severity && { severity })
    };

    const gaps = await complianceService.getAssessmentGaps((await params).id, filters);

    return ApiResponseFormatter.success(gaps, "Gaps retrieved successfully");
  },
  { requireAuth: true }
);

// POST /api/compliance/assessments/[id]/gaps - Create gap
const createGapSchema = z.object({
  requirementId: z.string().min(1),
  gapType: z.nativeEnum(GapType),
  severity: z.nativeEnum(GapSeverity),
  description: z.string().min(1),
  impact: z.string().optional(),
  remediationPlan: z.string().optional(),
  estimatedEffort: z.number().optional(),
  targetDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
});

export const POST = withApiMiddleware(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

    
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const body = await req.json();
    const validatedData = createGapSchema.parse(body);

    const gap = await complianceService.createGap({
      ...validatedData,
      assessmentId: (await params).id,
      targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined
    });

    return ApiResponseFormatter.success(gap, "Gap created successfully");
  },
  { requireAuth: true }
);