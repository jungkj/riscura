import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { db } from '@/lib/db';

// Define metadata type for RCSA tracking
interface RCSAMetadata {
  includedInRCSA?: boolean;
  lastRCSASync?: string;
  [key: string]: any; // Allow other metadata fields
}

const syncBodySchema = z.object({
  riskId: z.string(),
  action: z.enum(['add', 'update', 'remove']),
});

export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization context required',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = syncBodySchema.parse(body);
    const { riskId, action } = validatedData;

    try {
      // Verify risk exists and belongs to organization
      const risk = await db.client.risk.findFirst({
        where: {
          id: riskId,
          organizationId,
        },
        include: {
          controls: {
            include: {
              control: true,
            },
          },
        },
      });

      if (!risk) {
        return NextResponse.json(
          {
            success: false,
            error: 'Risk not found',
          },
          { status: 404 }
        );
      }

      // For RCSA sync, we just need to ensure the risk is properly linked
      // The spreadsheet will automatically pick up the changes through the context

      if (action === 'add' || action === 'update') {
        // Mark risk as included in RCSA if not already
        const existingMetadata = (risk.metadata as RCSAMetadata) || {};
        await db.client.risk.update({
          where: { id: riskId },
          data: {
            metadata: {
              ...existingMetadata,
              includedInRCSA: true,
              lastRCSASync: new Date().toISOString(),
            },
          },
        });

        // Create activity log
        await db.client.activity.create({
          data: {
            type: action === 'add' ? 'CREATED' : 'UPDATED',
            entityType: 'RISK',
            entityId: riskId,
            description: `Risk ${action === 'add' ? 'added to' : 'updated in'} RCSA`,
            userId: user.id,
            organizationId,
          },
        });
      } else if (action === 'remove') {
        // Mark risk as excluded from RCSA
        const existingMetadata = (risk.metadata as RCSAMetadata) || {};
        await db.client.risk.update({
          where: { id: riskId },
          data: {
            metadata: {
              ...existingMetadata,
              includedInRCSA: false,
              lastRCSASync: new Date().toISOString(),
            },
          },
        });

        // Create activity log
        await db.client.activity.create({
          data: {
            type: 'DELETED',
            entityType: 'RISK',
            entityId: riskId,
            description: 'Risk removed from RCSA',
            userId: user.id,
            organizationId,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          riskId,
          action,
          message: `Risk successfully ${action === 'add' ? 'added to' : action === 'update' ? 'updated in' : 'removed from'} RCSA`,
        },
      });
    } catch (error) {
      console.error('RCSA sync error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync risk to RCSA',
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
