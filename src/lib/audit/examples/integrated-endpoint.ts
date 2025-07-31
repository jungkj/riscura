/**
 * Example: Risk Management API with Integrated Audit Logging
 * Demonstrates how to use audit logging decorators and middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';
import { withDataAudit, withAuthAudit } from '@/lib/audit/audit-middleware';
import { logDataChangeEvent } from '@/lib/audit/audit-logger';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateRiskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  category: z.enum(['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY']),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  owner: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const UpdateRiskSchema = CreateRiskSchema.partial();

// ============================================================================
// EXAMPLE: GET /api/risks - List Risks with Access Logging
// ============================================================================

async function handleGetRisks(
  req: NextRequest,
  context: { user: any; organization: any; prisma: any }
) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');

  try {
    // Build query filters
    const where: any = {
      organizationId: context.organization.id,
    };

    if (status) {
      where.status = status;
    }

    // Fetch risks with pagination
    const [risks, totalCount] = await Promise.all([
      context.prisma.risk.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      context.prisma.risk.count({ where }),
    ]);

    // Note: Access logging is automatically handled by the @withDataAudit decorator

    return NextResponse.json({
      success: true,
      data: risks,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Risk list error:', error);
    // Error logging is automatically handled by the audit middleware
    throw error;
  }
}

// Apply audit logging decorator that automatically logs access attempts
export const GET = withAPI(
  withDataAudit(
    'RISK', // Entity type
    'READ', // Action
    // Entity ID extractor function (optional for list endpoints)
    undefined
  )(handleGetRisks),
  {
    auth: true,
    permissions: ['risk:read'],
    tags: ['Risk Management'],
    summary: 'List Risks',
    description: 'Retrieve paginated list of risks with access logging',
  }
);

// ============================================================================
// EXAMPLE: POST /api/risks - Create Risk with Change Logging
// ============================================================================

async function handleCreateRisk(
  req: NextRequest,
  context: { user: any; organization: any; prisma: any }
) {
  try {
    const body = await req.json();
    const validatedData = CreateRiskSchema.parse(body);

    // Create the risk
    const risk = await context.prisma.risk.create({
      data: {
        ...validatedData,
        organizationId: context.organization.id,
        createdById: context.user.id,
        assignedToId: validatedData.owner || context.user.id,
        status: 'IDENTIFIED',
        riskScore: validatedData.likelihood * validatedData.impact,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Manual audit logging for complex change tracking
    await logDataChangeEvent(
      context.prisma,
      'CREATE',
      'RISK',
      risk.id,
      context.user.id,
      context.organization.id,
      {
        before: undefined,
        after: risk,
        fields: Object.keys(validatedData),
        changeType: 'CREATE',
      },
      {
        initialRiskScore: risk.riskScore,
        createdViaAPI: true,
        riskCategory: validatedData.category,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: risk,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Risk creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid risk data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

// Apply audit logging decorator for create operations
export const POST = withAPI(
  withDataAudit(
    'RISK', // Entity type
    'CREATE', // Action
    // Entity ID extractor - for create operations, extract from response
    (req, context) => context?.createdId || 'unknown'
  )(handleCreateRisk),
  {
    auth: true,
    permissions: ['risk:write'],
    tags: ['Risk Management'],
    summary: 'Create Risk',
    description: 'Create new risk with comprehensive audit logging',
  }
);

// ============================================================================
// EXAMPLE: PUT /api/risks/[id] - Update Risk with Change Tracking
// ============================================================================

async function handleUpdateRisk(
  req: NextRequest,
  context: { params: { id: string }; user: any; organization: any; prisma: any }
) {
  const riskId = context.params.id;

  try {
    const body = await req.json();
    const validatedData = UpdateRiskSchema.parse(body);

    // Get current risk for change tracking
    const currentRisk = await context.prisma.risk.findFirst({
      where: {
        id: riskId,
        organizationId: context.organization.id,
      },
    });

    if (!currentRisk) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Risk not found',
          },
        },
        { status: 404 }
      );
    }

    // Calculate new risk score if likelihood or impact changed
    const updateData: any = { ...validatedData };
    if (validatedData.likelihood || validatedData.impact) {
      const likelihood = validatedData.likelihood || currentRisk.likelihood;
      const impact = validatedData.impact || currentRisk.impact;
      updateData.riskScore = likelihood * impact;
    }

    // Update the risk
    const updatedRisk = await context.prisma.risk.update({
      where: { id: riskId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Track detailed changes for audit
    const changedFields = Object.keys(validatedData).filter(
      (key) =>
        JSON.stringify(currentRisk[key as keyof typeof currentRisk]) !==
        JSON.stringify(validatedData[key as keyof typeof validatedData])
    );

    if (changedFields.length > 0) {
      await logDataChangeEvent(
        context.prisma,
        'UPDATE',
        'RISK',
        riskId,
        context.user.id,
        context.organization.id,
        {
          before: Object.fromEntries(
            changedFields.map((field) => [field, currentRisk[field as keyof typeof currentRisk]])
          ),
          after: Object.fromEntries(
            changedFields.map((field) => [field, updatedRisk[field as keyof typeof updatedRisk]])
          ),
          fields: changedFields,
          changeType: 'UPDATE',
        },
        {
          significantChange:
            changedFields.includes('likelihood') || changedFields.includes('impact'),
          riskScoreChanged: currentRisk.riskScore !== updatedRisk.riskScore,
          previousRiskScore: currentRisk.riskScore,
          newRiskScore: updatedRisk.riskScore,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRisk,
    });
  } catch (error) {
    console.error('Risk update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid risk data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

// Apply audit logging decorator for update operations
export const PUT = withAPI(
  withDataAudit(
    'RISK', // Entity type
    'UPDATE', // Action
    // Entity ID extractor from URL parameters
    (req, context) => context?.params?.id || 'unknown'
  )(handleUpdateRisk),
  {
    auth: true,
    permissions: ['risk:write'],
    tags: ['Risk Management'],
    summary: 'Update Risk',
    description: 'Update existing risk with detailed change tracking',
  }
);

// ============================================================================
// EXAMPLE: DELETE /api/risks/[id] - Delete Risk with Audit Trail
// ============================================================================

async function handleDeleteRisk(
  req: NextRequest,
  context: { params: { id: string }; user: any; organization: any; prisma: any }
) {
  const riskId = context.params.id;

  try {
    // Get risk for audit trail before deletion
    const risk = await context.prisma.risk.findFirst({
      where: {
        id: riskId,
        organizationId: context.organization.id,
      },
    });

    if (!risk) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Risk not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete or hard delete based on business rules
    await context.prisma.risk.delete({
      where: { id: riskId },
    });

    // Log the deletion with full risk data for compliance
    await logDataChangeEvent(
      context.prisma,
      'DELETE',
      'RISK',
      riskId,
      context.user.id,
      context.organization.id,
      {
        before: risk,
        after: undefined,
        fields: Object.keys(risk),
        changeType: 'DELETE',
      },
      {
        deletionReason: 'USER_REQUEST',
        originalRiskScore: risk.riskScore,
        cascadeDeletes: true, // If related data is also deleted
        complianceRetention: true, // Mark for extended retention
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Risk deleted successfully',
    });
  } catch (error) {
    console.error('Risk deletion error:', error);
    throw error;
  }
}

// Apply audit logging decorator for delete operations (high severity)
export const DELETE = withAPI(
  withDataAudit(
    'RISK', // Entity type
    'DELETE', // Action
    // Entity ID extractor from URL parameters
    (req, context) => context?.params?.id || 'unknown'
  )(handleDeleteRisk),
  {
    auth: true,
    permissions: ['risk:delete'],
    tags: ['Risk Management'],
    summary: 'Delete Risk',
    description: 'Delete risk with comprehensive audit trail for compliance',
  }
);

// ============================================================================
// EXAMPLE: Authentication Endpoint with Audit Logging
// ============================================================================

async function handleLogin(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate credentials (simplified)
    const user = await context.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      // Log failed login attempt
      await logAuthEvent(
        context.prisma,
        'LOGIN_FAILED',
        null, // No user ID for failed attempts
        user?.organizationId || 'unknown',
        req,
        {
          attemptedEmail: email,
          failureReason: 'INVALID_CREDENTIALS',
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Generate session/token
    const token = generateAuthToken(user);

    // Log successful login
    await logAuthEvent(context.prisma, 'LOGIN', user.id, user.organizationId, req, {
      loginMethod: 'PASSWORD',
      sessionDuration: '24h',
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Apply authentication audit logging
export const POST_LOGIN = withAPI(withAuthAudit('LOGIN')(handleLogin), {
  auth: false, // This IS the auth endpoint
  rateLimit: {
    requests: 5,
    window: '15m',
  },
  tags: ['Authentication'],
  summary: 'User Login',
  description: 'Authenticate user with comprehensive audit logging',
});

// ============================================================================
// UTILITY FUNCTIONS (would be in separate files in real implementation)
// ============================================================================

function verifyPassword(password: string, hash: string): boolean {
  // Implementation would use bcrypt or similar
  return true; // Simplified for example
}

function generateAuthToken(user: any): string {
  // Implementation would use JWT or similar
  return 'example-token'; // Simplified for example
}

// ============================================================================
// EXPORTS AND DOCUMENTATION
// ============================================================================

/**
 * This example demonstrates:
 *
 * 1. **Automatic Audit Logging**: Using decorators for transparent audit logging
 * 2. **Manual Audit Logging**: For complex scenarios requiring detailed change tracking
 * 3. **Different Audit Types**: Data operations, authentication, access control
 * 4. **Change Tracking**: Before/after state capture for compliance
 * 5. **Error Logging**: Automatic capture of failures and exceptions
 * 6. **Compliance Features**: Retention periods, encryption flags, compliance tags
 *
 * Key Benefits:
 * - Non-intrusive: Audit logging doesn't clutter business logic
 * - Comprehensive: Captures all necessary data for compliance
 * - Flexible: Manual logging available for complex scenarios
 * - Performance: Batch processing and caching for high-throughput systems
 * - Compliance: Built-in support for SOX, GDPR, SOC2, ISO27001
 */

export default {
  GET,
  POST,
  PUT,
  DELETE,
  POST_LOGIN,
};
