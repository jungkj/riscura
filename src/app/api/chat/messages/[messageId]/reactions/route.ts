import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import ChatService from '@/services/ChatService';
import { z } from 'zod';

// POST /api/chat/messages/[messageId]/reactions - Add a reaction
const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export const POST = withApiMiddleware(async (
  req: NextRequest,
  { params }: { params: { messageId: string } }
) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = addReactionSchema.parse(body);

    const reaction = await ChatService.addReaction({
      messageId: params.messageId,
      userId: user.id,
      emoji: validatedData.emoji,
    });

    return Response.json({
      success: true,
      data: reaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to add reaction:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add reaction' },
      { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
    );
  }
});

// DELETE /api/chat/messages/[messageId]/reactions/[emoji] - Remove a reaction
export const DELETE = withApiMiddleware(async (
  req: NextRequest,
  { params }: { params: { messageId: string; emoji: string } }
) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await ChatService.removeReaction(params.messageId, user.id, params.emoji);

    return Response.json({
      success: true,
      data: { message: 'Reaction removed successfully' },
    });
  } catch (error) {
    console.error('Failed to remove reaction:', error);
    return Response.json(
      { success: false, error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
});