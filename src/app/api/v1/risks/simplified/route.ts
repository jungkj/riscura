import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';

/**
 * GET /api/v1/risks/simplified
 * List risks with basic functionality
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Basic authentication check
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from database
    const user = await db.client.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.isActive || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search') || '';

    // Build database query
    const where: any = {
      organizationId: user.organizationId,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute database queries
    const [risks, total] = await Promise.all([
      db.client.risk.findMany({
        where,
        include: {
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          controls: {
            include: {
              control: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  effectiveness: true,
                },
              },
            },
          },
          _count: {
            select: { controls: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.client.risk.count({ where }),
    ])

    // Transform data
    const transformedRisks = risks.map((risk) => ({
      id: risk.id,
      title: risk.title,
      description: risk.description,
      category: risk.category,
      likelihood: risk.likelihood,
      impact: risk.impact,
      riskScore: risk.likelihood * risk.impact,
      riskLevel: risk.riskLevel,
      status: risk.status,
      owner: risk.assignedUser
        ? {
            id: risk.assignedUser.id,
            name: `${risk.assignedUser.firstName} ${risk.assignedUser.lastName}`,
            email: risk.assignedUser.email,
          }
        : null,
      controls: risk.controls.map((c) => c.control),
      controlCount: risk._count.controls,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: transformedRisks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    // console.error('Error fetching risks:', error)
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

/**
 * POST /api/v1/risks/simplified
 * Create a new risk
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    // Basic authentication check
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from database
    const user = await db.client.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.isActive || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, likelihood, impact, riskOwnerId, tags, dueDate } = body;

    // Basic validation
    if (!title || !description || !category || !likelihood || !impact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate risk metrics
    const riskScore = likelihood * impact
    const riskLevel = calculateRiskLevel(riskScore);

    // Create risk
    const risk = await db.client.risk.create({
      data: {
        title,
        description,
        category,
        likelihood,
        impact,
        riskScore,
        riskLevel,
        owner: riskOwnerId || null,
        organizationId: user.organizationId,
        createdBy: user.id,
      },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: risk,
        message: 'Risk created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    // console.error('Error creating risk:', error)
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 });
  }
}

const calculateRiskLevel = (riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskScore <= 6) return 'LOW';
  if (riskScore <= 12) return 'MEDIUM';
  if (riskScore <= 20) return 'HIGH';
  return 'CRITICAL';
}
