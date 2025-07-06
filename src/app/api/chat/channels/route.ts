import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import ChatService from '@/services/ChatService';
import { z } from 'zod';
import { ChannelType } from '@prisma/client';

const CreateChannelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(ChannelType),
  members: z.array(z.string()).optional()
});

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const channels = await ChatService.getUserChannels(
        user.id,
        user.organizationId
      );

      return NextResponse.json({
        success: true,
        data: channels
      });
    } catch (error) {
      console.error('Get channels error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch channels' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const validatedData = CreateChannelSchema.parse(body);

      const channel = await ChatService.createChannel({
        ...validatedData,
        organizationId: user.organizationId,
        createdBy: user.id,
        members: validatedData.members || []
      });

      return NextResponse.json({
        success: true,
        data: channel
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Create channel error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create channel' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    validateBody: CreateChannelSchema 
  }
);
