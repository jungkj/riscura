import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import ChatService from '@/services/ChatService';
import { z } from 'zod';
import { ChannelType } from '@prisma/client';

// GET /api/chat/channels - Get user's channels
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const channels = await ChatService.getUserChannels(user.id, user.organizationId);
    
    return Response.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
});

// POST /api/chat/channels - Create a new channel
const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.nativeEnum(ChannelType),
  members: z.array(z.string()).optional(),
});

export const POST = withApiMiddleware(async (req: NextRequest) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = createChannelSchema.parse(body);

    const channel = await ChatService.createChannel({
      ...validatedData,
      organizationId: user.organizationId,
      createdBy: user.id,
    });

    return Response.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to create channel:', error);
    return Response.json(
      { success: false, error: 'Failed to create channel' },
      { status: 500 }
    );
  }
});