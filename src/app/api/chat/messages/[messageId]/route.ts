import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import ChatService from '@/services/ChatService';
import { z } from 'zod';

// PATCH /api/chat/messages/[messageId] - Update a message
const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function PATCH(
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
        const validatedData = updateMessageSchema.parse(body);

        const message = await ChatService.updateMessage({
          messageId,
          userId: user.id,
          content: validatedData.content,
        });

        return ApiResponseFormatter.success(message);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiResponseFormatter.validationError(error.errors);
        }
        
        console.error('Failed to update message:', error);
        return ApiResponseFormatter.error(
          error instanceof Error && error.message === 'Access denied' ? 'ACCESS_DENIED' : 'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to update message',
          { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
        );
      }
    },
    { requireAuth: true }
  )(req);
}

// DELETE /api/chat/messages/[messageId] - Delete a message
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
        await ChatService.deleteMessage(messageId, user.id);

        return ApiResponseFormatter.success({ message: 'Message deleted successfully' });
      } catch (error) {
        console.error('Failed to delete message:', error);
        return ApiResponseFormatter.error(
          error instanceof Error && error.message === 'Access denied' ? 'ACCESS_DENIED' : 'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to delete message',
          { status: error instanceof Error && error.message === 'Access denied' ? 403 : 500 }
        );
      }
    },
    { requireAuth: true }
  )(req);
}