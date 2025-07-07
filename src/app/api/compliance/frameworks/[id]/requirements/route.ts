import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { RequirementCriticality } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/compliance/frameworks/[id]/requirements - Get framework requirements
export async function GET(
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

    const requirements = await complianceService.getRequirements(id);

    return ApiResponseFormatter.success(requirements);
    },
    { requireAuth: true }
  )(req);
}

// POST /api/compliance/frameworks/[id]/requirements - Create requirement
const createRequirementSchema = z.object({
  requirementId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  criticality: z.nativeEnum(RequirementCriticality),
  parentId: z.string().optional(),
  order: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return ApiResponseFormatter.forbiddenError('Insufficient permissions');
    }

    const body = await request.json();
    
    // Handle bulk creation
    if (Array.isArray(body)) {
      const parsedRequirements = body.map(item => createRequirementSchema.parse(item));
      const requirements = parsedRequirements.map(req => ({
        requirementId: req.requirementId,
        title: req.title,
        description: req.description,
        category: req.category,
        criticality: req.criticality,
        parentId: req.parentId,
        order: req.order
      }));
      const count = await complianceService.bulkCreateRequirements(id, requirements);
      return ApiResponseFormatter.success({ count });
    }

    // Handle single creation
    const validatedData = createRequirementSchema.parse(body);
    const requirement = await complianceService.createRequirement({
      frameworkId: id,
      requirementId: validatedData.requirementId,
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      criticality: validatedData.criticality,
      parentId: validatedData.parentId,
      order: validatedData.order
    });

    return ApiResponseFormatter.success(requirement);
    },
    { requireAuth: true }
  )(req);
}
