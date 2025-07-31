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
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError('User not authenticated');
      }

      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get('status') as GapStatus | null;
      const severity = searchParams.get('severity') as GapSeverity | null;

      const filters = {
        ...(status && { status }),
        ...(severity && { severity }),
      };

      const gaps = await complianceService.getGaps(id, filters);

      return ApiResponseFormatter.success(gaps);
    },
    { requireAuth: true }
  )(req);
}

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError('User not authenticated');
      }

      const body = await request.json();
      const validatedData = createGapSchema.parse(body);

      const gap = await complianceService.createGap({
        assessmentId: id,
        requirementId: validatedData.requirementId,
        gapType: validatedData.gapType,
        severity: validatedData.severity,
        description: validatedData.description,
        impact: validatedData.impact,
        remediationPlan: validatedData.remediationPlan,
        estimatedEffort: validatedData.estimatedEffort,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined,
        assignedTo: validatedData.assignedTo,
      });

      return ApiResponseFormatter.success(gap);
    },
    { requireAuth: true }
  )(req);
}
