import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { riskAnalysisAIService } from '@/services/RiskAnalysisAIService';
import { controlEffectivenessService } from '@/services/ControlEffectivenessService';
import { cosoFrameworkService } from '@/lib/compliance/coso-framework';
import { iso31000FrameworkService } from '@/lib/compliance/iso31000-framework';
import { nistFrameworkService } from '@/lib/compliance/nist-framework';

export interface CreateAssessmentRequest {
  name: string;
  description: string;
  assessmentType: 'self' | 'third-party' | 'regulatory';
  framework: 'coso' | 'iso31000' | 'nist';
  scope: string;
  dueDate: string;
  stakeholders: string[];
  riskCategories: string[];
  complianceFrameworks: string[];
  documents?: {
    name: string;
    type: string;
    content: string;
  }[];
}

export interface AssessmentResponse {
  id: string;
  name: string;
  description: string;
  assessmentType: string;
  framework: string;
  scope: string;
  status: string;
  progress: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  createdBy: string;
  results?: {
    riskAssessment?: any;
    controlEffectiveness?: any;
    complianceGaps?: any;
    recommendations?: any[];
  };
  documents?: any[];
  auditTrail?: any[];
}

// GET /api/assessments - List assessments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const framework = searchParams.get('framework');
    const search = searchParams.get('search');

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      organizationId: user.organizationId
    };

    if (status) {
      where.status = status;
    }

    if (framework) {
      where.framework = framework;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get assessments with pagination
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          documents: {
            select: { id: true, name: true, type: true, uploadedAt: true }
          },
          _count: {
            select: { risks: true, controls: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.assessment.count({ where })
    ]);

    const response = {
      assessments: assessments.map(assessment => ({
        id: assessment.id,
        name: assessment.name,
        description: assessment.description,
        assessmentType: assessment.assessmentType,
        framework: assessment.framework,
        scope: assessment.scope,
        status: assessment.status,
        progress: assessment.progress,
        dueDate: assessment.dueDate?.toISOString(),
        createdAt: assessment.createdAt.toISOString(),
        updatedAt: assessment.updatedAt.toISOString(),
        organizationId: assessment.organizationId,
        createdBy: assessment.createdBy,
        creator: assessment.creator,
        documentCount: assessment.documents.length,
        riskCount: assessment._count.risks,
        controlCount: assessment._count.controls
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

// POST /api/assessments - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateAssessmentRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.framework || !body.assessmentType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, framework, assessmentType' },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create assessment in database
    const assessment = await prisma.assessment.create({
      data: {
        name: body.name,
        description: body.description,
        assessmentType: body.assessmentType,
        framework: body.framework,
        scope: body.scope || 'Organization-wide',
        status: 'DRAFT',
        progress: 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        organizationId: user.organizationId,
        createdBy: session.user.id,
        metadata: {
          stakeholders: body.stakeholders || [],
          riskCategories: body.riskCategories || [],
          complianceFrameworks: body.complianceFrameworks || []
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Process uploaded documents if any
    if (body.documents && body.documents.length > 0) {
      const documentPromises = body.documents.map(doc =>
        prisma.document.create({
          data: {
            name: doc.name,
            type: doc.type,
            content: doc.content,
            organizationId: user.organizationId,
            uploadedBy: session.user.id,
            assessmentId: assessment.id
          }
        })
      );

      await Promise.all(documentPromises);
    }

    // Create audit trail entry
    await prisma.activity.create({
      data: {
        type: 'ASSESSMENT_CREATED',
        description: `Assessment "${body.name}" created`,
        userId: session.user.id,
        organizationId: user.organizationId,
        metadata: {
          assessmentId: assessment.id,
          framework: body.framework,
          assessmentType: body.assessmentType
        }
      }
    });

    const response: AssessmentResponse = {
      id: assessment.id,
      name: assessment.name,
      description: assessment.description,
      assessmentType: assessment.assessmentType,
      framework: assessment.framework,
      scope: assessment.scope,
      status: assessment.status,
      progress: assessment.progress,
      dueDate: assessment.dueDate?.toISOString() || '',
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
      organizationId: assessment.organizationId,
      createdBy: assessment.createdBy
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

// PUT /api/assessments/[id] - Update assessment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('id');

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if assessment exists and user has access
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        organizationId: user.organizationId
      }
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        name: body.name || existingAssessment.name,
        description: body.description || existingAssessment.description,
        scope: body.scope || existingAssessment.scope,
        status: body.status || existingAssessment.status,
        progress: body.progress !== undefined ? body.progress : existingAssessment.progress,
        dueDate: body.dueDate ? new Date(body.dueDate) : existingAssessment.dueDate,
        results: body.results || existingAssessment.results,
        metadata: body.metadata || existingAssessment.metadata
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        documents: {
          select: { id: true, name: true, type: true, uploadedAt: true }
        }
      }
    });

    // Create audit trail entry
    await prisma.activity.create({
      data: {
        type: 'ASSESSMENT_UPDATED',
        description: `Assessment "${updatedAssessment.name}" updated`,
        userId: session.user.id,
        organizationId: user.organizationId,
        metadata: {
          assessmentId: assessmentId,
          changes: Object.keys(body)
        }
      }
    });

    const response: AssessmentResponse = {
      id: updatedAssessment.id,
      name: updatedAssessment.name,
      description: updatedAssessment.description,
      assessmentType: updatedAssessment.assessmentType,
      framework: updatedAssessment.framework,
      scope: updatedAssessment.scope,
      status: updatedAssessment.status,
      progress: updatedAssessment.progress,
      dueDate: updatedAssessment.dueDate?.toISOString() || '',
      createdAt: updatedAssessment.createdAt.toISOString(),
      updatedAt: updatedAssessment.updatedAt.toISOString(),
      organizationId: updatedAssessment.organizationId,
      createdBy: updatedAssessment.createdBy,
      results: updatedAssessment.results as any,
      documents: updatedAssessment.documents
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id] - Delete assessment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('id');

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if assessment exists and user has access
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        organizationId: user.organizationId
      }
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Delete assessment (cascade will handle related records)
    await prisma.assessment.delete({
      where: { id: assessmentId }
    });

    // Create audit trail entry
    await prisma.activity.create({
      data: {
        type: 'ASSESSMENT_DELETED',
        description: `Assessment "${existingAssessment.name}" deleted`,
        userId: session.user.id,
        organizationId: user.organizationId,
        metadata: {
          assessmentId: assessmentId,
          assessmentName: existingAssessment.name
        }
      }
    });

    return NextResponse.json({ message: 'Assessment deleted successfully' });

  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
} 