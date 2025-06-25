import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, parsePagination, parseFilters, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { createDocumentSchema, documentQuerySchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';
import { uploadFile, deleteFile } from '@/lib/storage/files';



// GET /api/documents - List documents with pagination and filtering
export const GET = withAPI(
  withValidation(documentQuerySchema)(async (req: NextRequest, query) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(searchParams, { maxLimit: 100 });

    // Parse sorting
    const orderBy = parseSorting(searchParams, {
      allowedFields: ['title', 'category', 'status', 'createdAt', 'updatedAt', 'version'],
      defaultField: 'updatedAt',
      defaultOrder: 'desc'
    });

    // Parse search
    const search = parseSearch(searchParams);

    // Parse filters
    const filters = parseFilters(searchParams);

    // Build where clause with organization isolation
    const where: any = {
      organizationId: user.organizationId,
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { extractedText: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add filters from query parameters
    if (filters.type) {
      where.type = Array.isArray(filters.type) 
        ? { in: filters.type }
        : filters.type;
    }

    if (filters.owner) {
      where.uploadedBy = filters.owner;
    }

    // Date range filtering
    if (filters.dateFrom || filters.dateTo) {
      where.uploadedAt = {};
      if (filters.dateFrom) where.uploadedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.uploadedAt.lte = new Date(filters.dateTo);
    }

    try {
      // Execute queries in parallel
      const [documents, total] = await Promise.all([
        db.client.document.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            riskEvidence: {
              select: {
                id: true,
                title: true,
                riskLevel: true,
              },
            },
            controlEvidence: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            _count: {
              select: {
                comments: true,
                activities: true,
              },
            },
          },
        }),
        db.client.document.count({ where }),
      ]);

      // Transform data for API response
      const transformedDocuments = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        content: doc.content,
        extractedText: doc.extractedText,
        aiAnalysis: doc.aiAnalysis,
        uploadedAt: doc.uploadedAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        uploader: doc.uploader,
        riskEvidence: doc.riskEvidence,
        controlEvidence: doc.controlEvidence,
        _count: doc._count,
      }));

      const paginationMeta = createPaginationMeta(page, limit, total);

      return createAPIResponse({
        data: transformedDocuments,
        meta: {
          pagination: paginationMeta,
          filters,
          search,
        },
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw new Error('Failed to retrieve documents');
    }
  })
);

// POST /api/documents - Create new document
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  // Check permissions
  if (!user.permissions.includes(PERMISSIONS.DOCUMENT_CREATE) && !user.permissions.includes('*')) {
    throw new ForbiddenError('Insufficient permissions to create documents');
  }

  try {
    // Handle multipart form data for file uploads
    const formData = await req.formData();
    
    // Extract document metadata
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const content = formData.get('content') as string;
    const extractedText = formData.get('extractedText') as string;

    // Validate required fields
    if (!name || !type) {
      throw new Error('Name and type are required');
    }

    // Create document record
    const document = await db.client.document.create({
      data: {
        name,
        type,
        size: content ? content.length : 0,
        content,
        extractedText,
        organizationId: user.organizationId,
        uploadedBy: user.id,
      },
    });

    // Handle file uploads (simplified for basic Document model)
    const files = formData.getAll('files') as File[];
    let fileContent = '';
    
    if (files.length > 0) {
      const file = files[0]; // Take first file only
      if (file.size > 0) {
        try {
          const buffer = await file.arrayBuffer();
          fileContent = Buffer.from(buffer).toString('base64');
          
          // Update document with file content
          await db.client.document.update({
            where: { id: document.id },
            data: {
              content: fileContent,
              size: file.size,
            },
          });
        } catch (uploadError) {
          console.error('File processing error:', uploadError);
        }
      }
    }

    // Create activity log
    await db.client.activity.create({
      data: {
        type: 'CREATED',
        description: `Document "${document.name}" was created`,
        entityType: 'DOCUMENT',
        entityId: document.id,
        userId: user.id,
        organizationId: user.organizationId,
      },
    });

    // Fetch complete document data
    const completeDocument = await db.client.document.findUnique({
      where: { id: document.id },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            activities: true,
          },
        },
      },
    });

    return createAPIResponse({
      data: {
        id: completeDocument!.id,
        name: completeDocument!.name,
        type: completeDocument!.type,
        size: completeDocument!.size,
        content: completeDocument!.content,
        extractedText: completeDocument!.extractedText,
        aiAnalysis: completeDocument!.aiAnalysis,
        uploadedAt: completeDocument!.uploadedAt,
        createdAt: completeDocument!.createdAt,
        updatedAt: completeDocument!.updatedAt,
        uploader: completeDocument!.uploader,
        _count: completeDocument!._count,
      },
      message: 'Document created successfully',
    });
  } catch (error) {
    console.error('Failed to create document:', error);
    throw new Error('Failed to create document');
  }
}); 