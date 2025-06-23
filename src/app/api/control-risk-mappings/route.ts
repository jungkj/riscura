import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const riskId = url.searchParams.get('riskId');
    const controlId = url.searchParams.get('controlId');

    const whereClause: any = {
      // Add organization isolation if needed
    };

    if (riskId) {
      whereClause.riskId = riskId;
    }

    if (controlId) {
      whereClause.controlId = controlId;
    }

    // For now, return mock data since the actual mapping table might not exist
    const mockMappings = [
      {
        id: '1',
        riskId: riskId || 'risk-1',
        controlId: controlId || 'control-1',
        effectiveness: 0.8,
        implementationStatus: 'IMPLEMENTED',
        lastTested: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json(mockMappings);
  } catch (error) {
    console.error('Control-risk mappings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch control-risk mappings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { riskId, controlId, effectiveness } = body;

    if (!riskId || !controlId) {
      return NextResponse.json(
        { error: 'Risk ID and Control ID are required' },
        { status: 400 }
      );
    }

    // Mock response for now
    const mapping = {
      id: `mapping-${Date.now()}`,
      riskId,
      controlId,
      effectiveness: effectiveness || 0.5,
      implementationStatus: 'PLANNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(mapping);
  } catch (error) {
    console.error('Control-risk mapping creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create control-risk mapping' },
      { status: 500 }
    );
  }
} 