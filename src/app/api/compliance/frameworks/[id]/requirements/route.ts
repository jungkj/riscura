import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { RequirementCriticality } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/compliance/frameworks/[id]/requirements - Get framework requirements
export const GET = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const requirements = await complianceService.getRequirements(params.id);

  return ApiResponseFormatter.success(requirements, 'Requirements retrieved successfully');
});

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

export const POST = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return ApiResponseFormatter.forbidden('Insufficient permissions');
  }

  const body = await req.json();
  
  // Handle bulk creation
  if (Array.isArray(body)) {
    const requirements = body.map(item => createRequirementSchema.parse(item));
    const count = await complianceService.bulkCreateRequirements(params.id, requirements);
    return ApiResponseFormatter.success({ count }, `${count} requirements created successfully`);
  }

  // Handle single creation
  const validatedData = createRequirementSchema.parse(body);
  const requirement = await complianceService.createRequirement({
    ...validatedData,
    frameworkId: params.id,
  });

  return ApiResponseFormatter.success(requirement, 'Requirement created successfully', 201);
});