import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import ChatService from '@/services/ChatService';
import { z } from 'zod';
import { ChatMessageType } from '@prisma/client';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

// GET /api/chat/channels/[channelId]/messages - Get channel messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const { channelId } = await params;

    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const before = searchParams.get('before') || undefined;

      const messages = await ChatService.getChannelMessages(
        channelId,
        user.id,
        limit,
        before
      );

      return ApiResponseFormatter.success(messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return ApiResponseFormatter.error(
        'CHAT_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch messages',
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
  { params }: { params: Promise<{ channelId: string }> }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const { channelId } = await params;

    try {
      const body = await req.json();
      const validatedData = sendMessageSchema.parse(body);

      const message = await ChatService.sendMessage({
        channelId: channelId,
        userId: user.id,
        content: validatedData.content,
        type: validatedData.type,
        attachments: validatedData.attachments,
        parentId: validatedData.parentId,
      });

      return ApiResponseFormatter.success(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiResponseFormatter.error(
          'VALIDATION_ERROR',
          'Invalid request data',
          { status: 400, details: error.errors }
        );
      }
      
      console.error('Failed to send message:', error);
      return ApiResponseFormatter.error(
        'CHAT_ERROR',
        error instanceof Error ? error.message : 'Failed to send message',
        { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
      );
    }
  })(req);
}