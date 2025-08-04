import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import getEnhancedProboService from '@/services/EnhancedProboService';
import { z } from 'zod';

const querySchema = z.object({
  category: z.string().optional(),
  importance: z.enum(['MANDATORY', 'PREFERRED', 'ADVANCED']).optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
});

const importSchema = z.object({
  organizationId: z.string(),
  categories: z.array(z.string()).optional(),
  importance: z.array(z.string()).optional(),
});

const mapRisksSchema = z.object({
  organizationId: z.string(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const filters = querySchema.parse({
      category: searchParams.get('category') || undefined,
      importance: searchParams.get('importance') || undefined,
      status: searchParams.get('status') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
    });

    // TODO: Implement getEnhancedControls method in EnhancedProboService
    // For now, return empty array
    const controls: any[] = [];

    return NextResponse.json({
      success: true,
      data: controls,
      meta: {
        total: controls.length,
        filters: filters,
      },
    });
  } catch (error) {
    // console.error('Error fetching Probo controls:', error);
    return NextResponse.json({ error: 'Failed to fetch controls' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const proboService = getEnhancedProboService();

    switch (action) {
      case 'import':
        const importData = importSchema.parse(body);
        // TODO: Implement importProboControlsToOrganization in EnhancedProboService
        const importResult = {
          imported: 0,
          updated: 0,
        };

        return NextResponse.json({
          success: true,
          data: importResult,
          message: `Import functionality not yet implemented`,
        });

      case 'mapRisks':
        const mapData = mapRisksSchema.parse(body);
        // TODO: Implement mapControlsToRisks in EnhancedProboService
        const mappings: any[] = [];

        return NextResponse.json({
          success: true,
          data: mappings,
          message: `Mapping functionality not yet implemented`,
        });

      case 'createTasks':
        const { organizationId, controlId, assignedTo } = body;
        // TODO: Implement createImplementationTasks in EnhancedProboService
        const taskIds: string[] = [];

        return NextResponse.json({
          success: true,
          data: { taskIds },
          message: `Created ${taskIds.length} implementation tasks`,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    // console.error('Error processing Probo controls request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
