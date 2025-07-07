import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { AuthenticatedRequest } from '@/types/api';

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
    const { user } = req as AuthenticatedRequest;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      // Parse and validate pagination parameters from query string
      const { searchParams } = new URL(req.url);
      const pageParam = parseInt(searchParams.get('page') || '1');
      const limitParam = parseInt(searchParams.get('limit') || '50');
      
      // Validate pagination parameters
      const page = Math.max(1, pageParam || 1);
      const MAX_LIMIT = 100;
      const limit = Math.min(MAX_LIMIT, Math.max(1, limitParam || 50));
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await db.document.count({
        where: { organizationId: user.organizationId }
      });

      const documents = await db.document.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      return NextResponse.json({
        success: true,
        data: documents,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
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
  async (req: NextRequest, validatedBody?: z.infer<typeof CreateDocumentSchema>) => {
    const { user } = req as AuthenticatedRequest;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    if (!validatedBody) {
      return NextResponse.json(
        { success: false, error: 'Request body is required' },
        { status: 400 }
      );
    }

    try {
      const document = await db.document.create({
        data: {
          ...validatedBody,
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
