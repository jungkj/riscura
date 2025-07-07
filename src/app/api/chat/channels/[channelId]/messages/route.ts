import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import ChatService from '@/services/ChatService';
import { z } from 'zod';
import { ChatMessageType } from '@prisma/client';

// GET /api/chat/channels/[channelId]/messages - Get channel messages
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const before = searchParams.get('before') || undefined;

      const messages = await ChatService.getChannelMessages(
        params.channelId,
        user.id,
        limit,
        before
      );

      return Response.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return Response.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to fetch messages' },
        { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
      );
    }
  })(req);
}

// POST /api/chat/channels/[channelId]/messages - Send a message
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.nativeEnum(ChatMessageType).optional(),
  attachments: z.array(z.any()).optional(),
  parentId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const body = await req.json();
      const validatedData = sendMessageSchema.parse(body);

      const message = await ChatService.sendMessage({
        channelId: params.channelId,
        userId: user.id,
        ...validatedData,
      });

      return Response.json({
        success: true,
        data: message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          { success: false, error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      
      console.error('Failed to send message:', error);
      return Response.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to send message' },
        { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
      );
    }
  })(req);
}