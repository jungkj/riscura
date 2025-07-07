import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import ChatService from '@/services/ChatService';
import { z } from 'zod';

// PATCH /api/chat/messages/[messageId] - Update a message
const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const PATCH = withApiMiddleware(async (
  req: NextRequest,
  { params }: { params: { messageId: string } }
) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = updateMessageSchema.parse(body);

    const message = await ChatService.updateMessage({
      messageId: params.messageId,
      userId: user.id,
      content: validatedData.content,
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
    
    console.error('Failed to update message:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update message' },
      { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
    );
  }
});

// DELETE /api/chat/messages/[messageId] - Delete a message
export const DELETE = withApiMiddleware(async (
  req: NextRequest,
  { params }: { params: { messageId: string } }
) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await ChatService.deleteMessage(params.messageId, user.id);

    return Response.json({
      success: true,
      data: { message: 'Message deleted successfully' },
    });
  } catch (error) {
    console.error('Failed to delete message:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete message' },
      { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
    );
  }
});