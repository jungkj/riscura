import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config/env';

// GET /api/risks - List risks (demo mode)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Mock risks data
    const mockRisks = [
      {
        id: 'risk_cyber_security',
        title: 'Cybersecurity Threat',
        description: 'Potential data breach due to inadequate cybersecurity measures',
        category: 'Operational',
        type: 'Technology',
        severity: 'High',
        likelihood: 'Medium',
        impact: 'High',
        riskScore: 85,
        riskLevel: 'High',
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
        _count: {
          controls: 2,
          assessments: 1,
        },
      },
      {
        id: 'risk_regulatory_compliance',
        title: 'GDPR Compliance Gap',
        description: 'Non-compliance with GDPR data protection requirements',
        category: 'Compliance',
        type: 'Regulatory',
        severity: 'Critical',
        likelihood: 'High',
        impact: 'Critical',
        riskScore: 95,
        riskLevel: 'Critical',
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
        _count: {
          controls: 3,
          assessments: 2,
        },
      },
      {
        id: 'risk_financial_fraud',
        title: 'Financial Fraud Risk',
        description: 'Risk of internal financial fraud and embezzlement',
        category: 'Financial',
        type: 'Fraud',
        severity: 'Medium',
        likelihood: 'Low',
        impact: 'High',
        riskScore: 60,
        riskLevel: 'Medium',
        status: 'Mitigated',
        ownerId: 'user_analyst_demo',
        department: 'Finance',
        businessUnit: 'Finance',
        tags: ['fraud', 'financial', 'internal-controls'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        owner: {
          id: 'user_analyst_demo',
          firstName: 'Riley',
          lastName: 'Analyst',
          email: 'analyst@riscura.demo',
        },
        _count: {
          controls: 4,
          assessments: 3,
        },
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockRisks,
      meta: {
        total: mockRisks.length,
        page: 1,
        limit: 50,
        demoMode: true,
      },
    });

  } catch (error) {
    console.error('Risks API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve risks' },
      { status: 500 }
    );
  }
}

// POST /api/risks - Create new risk (demo mode)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!appConfig.isDevelopment) {
      return NextResponse.json(
        { error: 'Risk creation only available in development mode' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Simulate creating a risk
    const newRisk = {
      id: `risk_${Date.now()}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: 'Risk created successfully (demo mode)',
      data: newRisk,
    });

  } catch (error) {
    console.error('Risk creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create risk' },
      { status: 500 }
    );
  }
} 