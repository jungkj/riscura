import { NextRequest, NextResponse } from 'next/server';
import { ProboService } from '@/services/ProboService';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proboService = new ProboService();
    const framework = await proboService.getSOC2Framework();
    
    return NextResponse.json(framework);
  } catch (error) {
    console.error('SOC 2 framework API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOC 2 framework' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const proboService = new ProboService();
    const framework = await proboService.getSOC2Framework();
    
    // Import SOC 2 framework into the organization
    const existingFramework = await db.client.complianceFramework.findFirst({
      where: {
        organizationId,
        name: framework.name,
        version: framework.version
      }
    });

    if (existingFramework) {
      return NextResponse.json(
        { error: 'SOC 2 framework already exists for this organization' },
        { status: 409 }
      );
    }

    // Create compliance framework
    const createdFramework = await db.client.complianceFramework.create({
      data: {
        name: framework.name,
        version: framework.version,
        description: 'SOC 2 Type II compliance framework imported from Probo',
        organizationId,
      }
    });

    // Create framework requirements
    for (const requirement of framework.requirements) {
      await db.client.frameworkRequirement.create({
        data: {
          frameworkId: createdFramework.id,
          title: requirement.title,
          description: requirement.description,
          category: 'SOC2',
          controls: requirement.controls,
          priority: 'HIGH'
        }
      });
    }

    // Link existing controls or create new ones
    for (const control of framework.controls) {
      // Check if control exists
      let existingControl = await db.client.control.findFirst({
        where: {
          organizationId,
          title: control.name
        }
      });

      // Create control if it doesn't exist
      if (!existingControl) {
        existingControl = await db.client.control.create({
          data: {
            title: control.name,
            description: control.description,
            type: 'PREVENTIVE',
            category: 'TECHNICAL',
            frequency: 'QUARTERLY',
            organizationId,
            createdBy: (session.user as any).id || 'system',
            status: 'PLANNED'
          }
        });
      }

      // Create framework control mapping
      await db.client.frameworkControl.create({
        data: {
          frameworkId: createdFramework.id,
          controlId: existingControl.id,
          requirement: control.requirement,
          description: control.description,
          category: control.category
        }
      });
    }

    const completeFramework = await db.client.complianceFramework.findUnique({
      where: { id: createdFramework.id },
      include: {
        controls: {
          include: {
            control: true
          }
        },
        requirements: true
      }
    });

    return NextResponse.json(completeFramework);
  } catch (error) {
    console.error('SOC 2 import error:', error);
    return NextResponse.json(
      { error: 'Failed to import SOC 2 framework' },
      { status: 500 }
    );
  }
} 