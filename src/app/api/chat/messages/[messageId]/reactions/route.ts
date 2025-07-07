import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import ChatService from '@/services/ChatService';
import { z } from 'zod';

// POST /api/chat/messages/[messageId]/reactions - Add a reaction
const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { messageId } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError();
      }

      try {
        const body = await request.json();
        const validatedData = addReactionSchema.parse(body);

        const reaction = await ChatService.addReaction({
          messageId,
          userId: user.id,
          emoji: validatedData.emoji,
        });

        return ApiResponseFormatter.success(reaction);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiResponseFormatter.validationError(error.errors);
        }
        
        console.error('Failed to add reaction:', error);
        return ApiResponseFormatter.error(
          error instanceof Error && error.message === 'Access denied' ? 'ACCESS_DENIED' : 'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to add reaction',
          { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
        );
      }
    },
    { requireAuth: true }
  )(req);
}

// DELETE /api/chat/messages/[messageId]/reactions - Remove a reaction
// Note: emoji should be passed as a query parameter
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { messageId } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError();
      }

      try {
        // Get emoji from query params since it's not in the route path
        const { searchParams } = new URL(request.url);
        const emoji = searchParams.get('emoji');
        
        if (!emoji) {
          return ApiResponseFormatter.validationError([
            { field: 'emoji', message: 'Emoji parameter is required' }
          ]);
        }

        await ChatService.removeReaction(messageId, user.id, emoji);

        return ApiResponseFormatter.success({ message: 'Reaction removed successfully' });
      } catch (error) {
        console.error('Failed to remove reaction:', error);
        return ApiResponseFormatter.error(
          'INTERNAL_ERROR',
          'Failed to remove reaction',
          { status: 500 }
        );
      }
    },
    { requireAuth: true }
  )(req);
}