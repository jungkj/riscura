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
  { params }: RouteParams
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const requirements = await complianceService.getRequirements(resolvedParams.id);

    return ApiResponseFormatter.success(requirements, 'Requirements retrieved successfully');
  })(req);
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
  { params }: RouteParams
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser();
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return ApiResponseFormatter.forbiddenError('Insufficient permissions');
    }

    const body = await req.json();
    
    // Handle bulk creation
    if (Array.isArray(body)) {
      const requirements = body.map(item => createRequirementSchema.parse(item));
      const count = await complianceService.bulkCreateRequirements(resolvedParams.id, requirements);
      return ApiResponseFormatter.success({ count }, `${count} requirements created successfully`);
    }

    // Handle single creation
    const validatedData = createRequirementSchema.parse(body);
    const requirement = await complianceService.createRequirement({
      ...validatedData,
      frameworkId: resolvedParams.id,
    });

    return ApiResponseFormatter.success(requirement, 'Requirement created successfully', 201);
  })(req);
}