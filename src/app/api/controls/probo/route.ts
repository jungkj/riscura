import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { EnhancedProboService } from '@/services/EnhancedProboService';
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
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

    const proboService = EnhancedProboService.getInstance();
    const controls = await proboService.getEnhancedControls(organizationId, filters);

    return NextResponse.json({
      success: true,
      data: controls,
      meta: {
        total: controls.length,
        filters: filters,
      }
    });

  } catch (error) {
    console.error('Error fetching Probo controls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch controls' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const proboService = EnhancedProboService.getInstance();

    switch (action) {
      case 'import':
        const importData = importSchema.parse(body);
        const importResult = await proboService.importProboControlsToOrganization(
          importData.organizationId
        );
        
        return NextResponse.json({
          success: true,
          data: importResult,
          message: `Successfully imported ${importResult.imported} controls, updated ${importResult.updated} controls`
        });

      case 'mapRisks':
        const mapData = mapRisksSchema.parse(body);
        const mappings = await proboService.mapControlsToRisks(mapData.organizationId);
        
        return NextResponse.json({
          success: true,
          data: mappings,
          message: `Generated ${mappings.length} risk-control mappings`
        });

      case 'createTasks':
        const { organizationId, controlId, assignedTo } = body;
        const taskIds = await proboService.createImplementationTasks(
          organizationId,
          controlId,
          assignedTo
        );
        
        return NextResponse.json({
          success: true,
          data: { taskIds },
          message: `Created ${taskIds.length} implementation tasks`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing Probo controls request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 