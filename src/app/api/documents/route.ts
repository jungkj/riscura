import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateDocumentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  tags: z.array(z.string()).optional()
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
      const documents = await db.client.document.findMany({
        where: { organizationId: user.organizationId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Get documents error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
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
      const validatedData = CreateDocumentSchema.parse(body);

      const document = await db.client.document.create({
        data: {
          ...validatedData,
          organizationId: user.organizationId,
          uploadedById: user.id,
          status: 'ACTIVE'
        }
      });

      return NextResponse.json({
        success: true,
        data: document
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Create document error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create document' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    validateBody: CreateDocumentSchema 
  }
);
