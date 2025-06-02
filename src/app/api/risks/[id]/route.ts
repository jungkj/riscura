import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config/env';

// GET /api/risks/[id] - Get risk by ID (demo mode)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Mock risk data
    const mockRisks: Record<string, any> = {
      'risk_cyber_security': {
        id: 'risk_cyber_security',
        title: 'Cybersecurity Threat',
        description: 'Potential data breach due to inadequate cybersecurity measures',
        category: 'Operational',
        type: 'Technology',
        severity: 'High',
        likelihood: 'Medium',
        impact: 'High',
        riskScore: 85,
        status: 'Open',
        ownerId: 'user_manager_demo',
        department: 'IT',
        businessUnit: 'Technology',
        tags: ['cybersecurity', 'data-protection', 'IT'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        owner: {
          id: 'user_manager_demo',
          firstName: 'Maria',
          lastName: 'Manager',
          email: 'manager@riscura.demo',
        },
        controls: [
          {
            id: 'control_access_management',
            title: 'Access Control Management',
            category: 'Preventive',
            type: 'Technical',
            status: 'Implemented',
          },
        ],
        assessments: [
          {
            id: 'assessment_1',
            type: 'Qualitative',
            likelihood: 3,
            impact: 4,
            score: 85,
            notes: 'High-impact risk requiring immediate attention',
            assessedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            assessedBy: {
              id: 'user_manager_demo',
              firstName: 'Maria',
              lastName: 'Manager',
            },
          },
        ],
        activities: [
          {
            id: 'activity_1',
            type: 'UPDATED',
            description: 'Risk severity updated to High',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            user: {
              firstName: 'Maria',
              lastName: 'Manager',
            },
          },
        ],
        _count: {
          controls: 1,
          assessments: 1,
          mitigations: 2,
        },
      },
      'risk_regulatory_compliance': {
        id: 'risk_regulatory_compliance',
        title: 'GDPR Compliance Gap',
        description: 'Non-compliance with GDPR data protection requirements',
        category: 'Compliance',
        type: 'Regulatory',
        severity: 'Critical',
        likelihood: 'High',
        impact: 'Critical',
        riskScore: 95,
        status: 'In Progress',
        ownerId: 'user_admin_demo',
        department: 'Legal',
        businessUnit: 'Compliance',
        tags: ['gdpr', 'compliance', 'legal'],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        owner: {
          id: 'user_admin_demo',
          firstName: 'Alex',
          lastName: 'Administrator',
          email: 'admin@riscura.demo',
        },
        controls: [
          {
            id: 'control_data_encryption',
            title: 'Data Encryption Standard',
            category: 'Preventive',
            type: 'Technical',
            status: 'Planned',
          },
        ],
        assessments: [
          {
            id: 'assessment_2',
            type: 'Quantitative',
            likelihood: 4,
            impact: 5,
            score: 95,
            notes: 'Critical compliance gap requiring immediate action',
            assessedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            assessedBy: {
              id: 'user_admin_demo',
              firstName: 'Alex',
              lastName: 'Administrator',
            },
          },
        ],
        activities: [
          {
            id: 'activity_2',
            type: 'CREATED',
            description: 'GDPR compliance gap identified',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            user: {
              firstName: 'Alex',
              lastName: 'Administrator',
            },
          },
        ],
        _count: {
          controls: 1,
          assessments: 1,
          mitigations: 3,
        },
      },
    };

    const risk = mockRisks[id];

    if (!risk) {
      return NextResponse.json(
        { error: 'Risk not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: risk,
      meta: {
        demoMode: true,
      },
    });

  } catch (error) {
    console.error('Risk detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve risk' },
      { status: 500 }
    );
  }
}

// PUT /api/risks/[id] - Update risk (demo mode)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    if (!appConfig.isDevelopment) {
      return NextResponse.json(
        { error: 'Risk updates only available in development mode' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Simulate update
    const updatedRisk = {
      id,
      ...body,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: 'Risk updated successfully (demo mode)',
      data: updatedRisk,
    });

  } catch (error) {
    console.error('Risk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update risk' },
      { status: 500 }
    );
  }
}

// DELETE /api/risks/[id] - Delete risk (demo mode)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    if (!appConfig.isDevelopment) {
      return NextResponse.json(
        { error: 'Risk deletion only available in development mode' },
        { status: 403 }
      );
    }

    const { id } = await params;

    return NextResponse.json({
      success: true,
      message: 'Risk deleted successfully (demo mode)',
      deletedId: id,
    });

  } catch (error) {
    console.error('Risk deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete risk' },
      { status: 500 }
    );
  }
} 