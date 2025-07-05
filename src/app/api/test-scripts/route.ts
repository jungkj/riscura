import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { 
  ApiResponseFormatter,
  formatValidationErrors 
} from '@/lib/api/response-formatter';
import { z } from 'zod';
import { 
  TestScriptType, 
  TestFrequency,
  CreateTestScriptRequest,
  TestScriptQueryParams 
} from '@/types/rcsa.types';

// Validation schemas
const createTestScriptSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  steps: z.array(z.object({
    order: z.number().min(1),
    description: z.string().min(1),
    expectedResult: z.string().min(1),
    dataRequired: z.string().optional(),
    notes: z.string().optional()
  })).min(1),
  expectedResults: z.string().min(1),
  testType: z.nativeEnum(TestScriptType),
  frequency: z.nativeEnum(TestFrequency),
  estimatedDuration: z.number().min(1).optional(),
  automationCapable: z.boolean().optional().default(false),
  automationScript: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  controlIds: z.array(z.string()).optional()
});

const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  testType: z.union([
    z.nativeEnum(TestScriptType),
    z.array(z.nativeEnum(TestScriptType))
  ]).optional(),
  frequency: z.union([
    z.nativeEnum(TestFrequency),
    z.array(z.nativeEnum(TestFrequency))
  ]).optional(),
  automationCapable: z.coerce.boolean().optional(),
  controlId: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// GET /api/test-scripts - List test scripts with filtering
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const user = await getAuthenticatedUser(req);
  
  // Parse and validate query parameters
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  
  const validationResult = queryParamsSchema.safeParse(params);
  if (!validationResult.success) {
    return ApiResponseFormatter.error(
      'Invalid query parameters',
      400,
      'VALIDATION_ERROR',
      formatValidationErrors(validationResult.error)
    );
  }
  
  const query = validationResult.data as TestScriptQueryParams;
  const skip = (query.page! - 1) * query.limit!;
  
  // Build where clause
  const where: any = {
    organizationId: user.organizationId
  };
  
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { tags: { has: query.search } }
    ];
  }
  
  if (query.testType) {
    where.testType = Array.isArray(query.testType) 
      ? { in: query.testType }
      : query.testType;
  }
  
  if (query.frequency) {
    where.frequency = Array.isArray(query.frequency)
      ? { in: query.frequency }
      : query.frequency;
  }
  
  if (query.automationCapable !== undefined) {
    where.automationCapable = query.automationCapable;
  }
  
  if (query.controlId) {
    where.controls = {
      some: { controlId: query.controlId }
    };
  }
  
  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
    where.tags = { hasSome: tags };
  }
  
  // Execute query with pagination
  const [testScripts, total] = await Promise.all([
    db.testScript.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { [query.sortBy!]: query.sortOrder },
      include: {
        controls: {
          include: {
            control: {
              select: {
                id: true,
                title: true,
                type: true,
                status: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            testExecutions: true
          }
        }
      }
    }),
    db.testScript.count({ where })
  ]);
  
  return ApiResponseFormatter.success(
    testScripts,
    'Test scripts retrieved successfully',
    {
      pagination: {
        page: query.page!,
        limit: query.limit!,
        total,
        totalPages: Math.ceil(total / query.limit!)
      }
    }
  );
});

// POST /api/test-scripts - Create a new test script
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const user = await getAuthenticatedUser(req);
  
  // Parse and validate request body
  const body = await req.json();
  const validationResult = createTestScriptSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error(
      'Invalid request data',
      400,
      'VALIDATION_ERROR',
      formatValidationErrors(validationResult.error)
    );
  }
  
  const data = validationResult.data as CreateTestScriptRequest;
  
  // Validate control IDs if provided
  if (data.controlIds && data.controlIds.length > 0) {
    const controls = await db.control.findMany({
      where: {
        id: { in: data.controlIds },
        organizationId: user.organizationId
      },
      select: { id: true }
    });
    
    const foundControlIds = controls.map(c => c.id);
    const invalidControlIds = data.controlIds.filter(id => !foundControlIds.includes(id));
    
    if (invalidControlIds.length > 0) {
      return ApiResponseFormatter.error(
        'Invalid control IDs provided',
        400,
        'INVALID_CONTROLS',
        {
          invalidIds: invalidControlIds,
          message: 'Some control IDs do not exist or do not belong to your organization'
        }
      );
    }
  }
  
  // Create test script with control associations
  const testScript = await db.testScript.create({
    data: {
      title: data.title,
      description: data.description,
      steps: data.steps,
      expectedResults: data.expectedResults,
      testType: data.testType,
      frequency: data.frequency,
      estimatedDuration: data.estimatedDuration,
      automationCapable: data.automationCapable || false,
      automationScript: data.automationScript,
      tags: data.tags || [],
      organizationId: user.organizationId,
      createdBy: user.id,
      // Create control associations if provided
      controls: data.controlIds ? {
        create: data.controlIds.map(controlId => ({
          controlId,
          isMandatory: true
        }))
      } : undefined
    },
    include: {
      controls: {
        include: {
          control: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
  
  // Log activity
  await db.activity.create({
    data: {
      type: 'TEST_SCRIPT_CREATED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'TEST_SCRIPT',
      entityId: testScript.id,
      description: `Created test script: ${testScript.title}`,
      metadata: {
        testScriptId: testScript.id,
        title: testScript.title,
        testType: testScript.testType,
        controlCount: data.controlIds?.length || 0
      }
    }
  });
  
  return ApiResponseFormatter.success(
    testScript,
    'Test script created successfully',
    { id: testScript.id },
    201
  );
});