import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, parsePagination, parseFilters, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { createDocumentSchema, documentQuerySchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';
import { uploadFile, deleteFile } from '@/lib/storage/files';
import { DocumentCategory, DocumentStatus } from '@prisma/client';

// Enum mapping functions
const mapDocumentCategory = (apiCategory: string): DocumentCategory => {
  const mapping: Record<string, DocumentCategory> = {
    'policy': 'POLICY',
    'procedure': 'PROCEDURE',
    'guideline': 'GUIDELINE',
    'framework': 'FRAMEWORK',
    'standard': 'STANDARD',
    'template': 'TEMPLATE',
    'report': 'REPORT',
    'evidence': 'EVIDENCE',
    'contract': 'CONTRACT',
    'other': 'OTHER',
  };
  return mapping[apiCategory] || 'OTHER';
};

const mapDocumentStatus = (apiStatus: string): DocumentStatus => {
  const mapping: Record<string, DocumentStatus> = {
    'draft': 'DRAFT',
    'review': 'REVIEW',
    'approved': 'APPROVED',
    'published': 'PUBLISHED',
    'archived': 'ARCHIVED',
    'expired': 'EXPIRED',
  };
  return mapping[apiStatus] || 'DRAFT';
};

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
      defaultSort: 'updatedAt',
      defaultOrder: 'desc',
      allowedFields: ['title', 'category', 'status', 'createdAt', 'updatedAt', 'version'],
    });

    // Parse search
    const search = parseSearch(searchParams);

    // Build where clause with organization isolation
    const where: any = {
      organizationId: user.organizationId,
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Add filters from query parameters
    if (query.category) {
      where.category = Array.isArray(query.category) 
        ? { in: query.category.map(mapDocumentCategory) }
        : mapDocumentCategory(query.category);
    }

    if (query.status) {
      where.status = Array.isArray(query.status)
        ? { in: query.status.map(mapDocumentStatus) }
        : mapDocumentStatus(query.status);
    }

    if (query.owner) {
      where.createdBy = query.owner;
    }

    if (query.tags) {
      const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
      where.tags = { hasSome: tags };
    }

    // Date range filtering
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
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
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            files: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                size: true,
                uploadedAt: true,
                url: true,
              },
            },
            linkedRisks: {
              include: {
                risk: {
                  select: {
                    id: true,
                    title: true,
                    riskLevel: true,
                  },
                },
              },
            },
            linkedControls: {
              include: {
                control: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
            _count: {
              select: {
                versions: true,
                comments: true,
                files: true,
              },
            },
          },
        }),
        db.client.document.count({ where }),
      ]);

      // Transform data for API response
      const transformedDocuments = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        status: doc.status,
        version: doc.version,
        tags: doc.tags,
        confidentiality: doc.confidentiality,
        retentionDate: doc.retentionDate,
        reviewDate: doc.reviewDate,
        approvedAt: doc.approvedAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        creator: doc.creator,
        files: doc.files,
        linkedRisks: doc.linkedRisks.map(lr => lr.risk),
        linkedControls: doc.linkedControls.map(lc => lc.control),
        _count: doc._count,
      }));

      const paginationMeta = createPaginationMeta({
        page,
        limit,
        total,
        itemCount: documents.length,
      });

      return createAPIResponse({
        data: transformedDocuments,
        meta: {
          pagination: paginationMeta,
          filters: query,
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
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const status = formData.get('status') as string || 'draft';
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    const confidentiality = formData.get('confidentiality') as string || 'internal';
    const version = formData.get('version') as string || '1.0';
    const reviewDate = formData.get('reviewDate') ? new Date(formData.get('reviewDate') as string) : null;
    const linkedRiskIds = formData.get('linkedRiskIds') ? JSON.parse(formData.get('linkedRiskIds') as string) : [];
    const linkedControlIds = formData.get('linkedControlIds') ? JSON.parse(formData.get('linkedControlIds') as string) : [];

    // Validate required fields
    if (!title || !description || !category) {
      throw new Error('Title, description, and category are required');
    }

    // Create document record
    const document = await db.client.document.create({
      data: {
        title,
        description,
        category: mapDocumentCategory(category),
        status: mapDocumentStatus(status),
        version,
        tags,
        confidentiality,
        reviewDate,
        organizationId: user.organizationId,
        createdBy: user.id,
      },
    });

    // Handle file uploads
    const uploadedFiles = [];
    const files = formData.getAll('files') as File[];
    
    for (const file of files) {
      if (file.size > 0) {
        try {
          // Upload file to storage
          const uploadResult = await uploadFile(file, {
            organizationId: user.organizationId,
            documentId: document.id,
            userId: user.id,
          });

          // Create file record
          const fileRecord = await db.client.documentFile.create({
            data: {
              filename: file.name,
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
              url: uploadResult.url,
              path: uploadResult.path,
              documentId: document.id,
              uploadedBy: user.id,
            },
          });

          uploadedFiles.push(fileRecord);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue with other files, but log the error
        }
      }
    }

    // Link to risks
    if (linkedRiskIds.length > 0) {
      await db.client.documentRisk.createMany({
        data: linkedRiskIds.map((riskId: string) => ({
          documentId: document.id,
          riskId,
        })),
        skipDuplicates: true,
      });
    }

    // Link to controls
    if (linkedControlIds.length > 0) {
      await db.client.documentControl.createMany({
        data: linkedControlIds.map((controlId: string) => ({
          documentId: document.id,
          controlId,
        })),
        skipDuplicates: true,
      });
    }

    // Create activity log
    await db.client.activity.create({
      data: {
        type: 'DOCUMENT_CREATED',
        description: `Document "${document.title}" was created`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          documentId: document.id,
          documentTitle: document.title,
          category: document.category,
          filesCount: uploadedFiles.length,
        },
      },
    });

    // Fetch complete document data
    const completeDocument = await db.client.document.findUnique({
      where: { id: document.id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            uploadedAt: true,
            url: true,
          },
        },
        linkedRisks: {
          include: {
            risk: {
              select: {
                id: true,
                title: true,
                riskLevel: true,
              },
            },
          },
        },
        linkedControls: {
          include: {
            control: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            versions: true,
            comments: true,
            files: true,
          },
        },
      },
    });

    return createAPIResponse({
      data: {
        id: completeDocument!.id,
        title: completeDocument!.title,
        description: completeDocument!.description,
        category: completeDocument!.category,
        status: completeDocument!.status,
        version: completeDocument!.version,
        tags: completeDocument!.tags,
        confidentiality: completeDocument!.confidentiality,
        reviewDate: completeDocument!.reviewDate,
        createdAt: completeDocument!.createdAt,
        updatedAt: completeDocument!.updatedAt,
        creator: completeDocument!.creator,
        files: completeDocument!.files,
        linkedRisks: completeDocument!.linkedRisks.map(lr => lr.risk),
        linkedControls: completeDocument!.linkedControls.map(lc => lc.control),
        _count: completeDocument!._count,
      },
      message: 'Document created successfully',
    });
  } catch (error) {
    console.error('Failed to create document:', error);
    throw new Error('Failed to create document');
  }
}); 