import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, parsePagination, parseFilters, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { createDocumentSchema, documentQuerySchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { storage, validateFile, formatFileSize } from '@/lib/storage';
import { storageConfig } from '@/config/env';
import { documentProcessor } from '@/lib/documents/processor';
import { PERMISSIONS } from '@/lib/auth';

// GET /api/documents - List documents with pagination and filtering
export const GET = withAPI(
  async (req: NextRequest) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(searchParams, { maxLimit: 100 });

    // Parse filters
    const filters = parseFilters(searchParams);

    // Parse sorting
    const orderBy = parseSorting(searchParams);

    // Parse search
    const search = parseSearch(searchParams);

    // Build where clause
    let where: any = {
      organizationId: user.organizationId, // Organization isolation
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { extractedText: { contains: search, mode: 'insensitive' } },
        { aiSummary: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add filters from query parameters
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const businessUnit = searchParams.get('businessUnit');
    const department = searchParams.get('department');
    const confidentiality = searchParams.get('confidentiality');
    const tags = searchParams.get('tags');
    const riskId = searchParams.get('riskId');
    const controlId = searchParams.get('controlId');

    if (category) where.category = category;
    if (type) where.type = type;
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (businessUnit) where.businessUnit = { contains: businessUnit, mode: 'insensitive' };
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (confidentiality) where.confidentiality = confidentiality;
    if (riskId) where.riskIds = { has: riskId };
    if (controlId) where.controlIds = { has: controlId };

    if (tags) {
      const tagList = tags.split(',').map((tag: string) => tag.trim());
      where.tags = { hasSome: tagList };
    }

    // Date range filters
    const expiryFrom = searchParams.get('expiryFrom');
    const expiryTo = searchParams.get('expiryTo');
    
    if (expiryFrom || expiryTo) {
      where.expiryDate = {};
      if (expiryFrom) where.expiryDate.gte = new Date(expiryFrom);
      if (expiryTo) where.expiryDate.lte = new Date(expiryTo);
    }

    // Execute queries
    const [documents, total] = await Promise.all([
      db.client.document.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedBy: {
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
            },
          },
          risks: {
            select: {
              id: true,
              title: true,
              severity: true,
            },
            take: 5,
          },
          controls: {
            select: {
              id: true,
              title: true,
              status: true,
            },
            take: 5,
          },
          versions: {
            select: {
              id: true,
              version: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              risks: true,
              controls: true,
              versions: true,
            },
          },
        },
      }),
      db.client.document.count({ where }),
    ]);

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'READ',
        entityType: 'DOCUMENT',
        entityId: 'list',
        description: `Retrieved ${documents.length} documents`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          resultCount: documents.length,
          filters: Object.keys(filters),
          search: search || undefined,
        },
        isPublic: false,
      },
    });

    return createAPIResponse(documents, {
      pagination: createPaginationMeta(page, limit, total),
    });
  },
  {
    requiredPermissions: [PERMISSIONS.DOCUMENTS_READ],
    rateLimit: { limit: 100, windowMs: 15 * 60 * 1000 },
  }
);

// POST /api/documents - Create new document with file upload
export const POST = withAPI(
  async (req: NextRequest) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    try {
      const formData = await req.formData();
      
      // Extract document metadata
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const type = formData.get('type') as string;
      const confidentiality = formData.get('confidentiality') as string || 'internal';
      const businessUnit = formData.get('businessUnit') as string;
      const department = formData.get('department') as string;
      const tags = formData.get('tags') as string;
      const riskIds = formData.get('riskIds') as string;
      const controlIds = formData.get('controlIds') as string;

      // Validate required fields
      if (!title || !category || !type) {
        throw new Error('Title, category, and type are required');
      }

      // Parse array fields
      const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];
      const parsedRiskIds = riskIds ? riskIds.split(',').map(id => id.trim()) : [];
      const parsedControlIds = controlIds ? controlIds.split(',').map(id => id.trim()) : [];

      // Validate owner if specified
      const ownerId = formData.get('ownerId') as string;
      if (ownerId && ownerId !== user.id) {
        const owner = await db.client.user.findFirst({
          where: {
            id: ownerId,
            organizationId: user.organizationId,
            isActive: true,
          },
        });

        if (!owner) {
          throw new NotFoundError('Specified owner not found in organization');
        }
      }

      // Validate linked risks and controls
      if (parsedRiskIds.length > 0) {
        const risks = await db.client.risk.findMany({
          where: {
            id: { in: parsedRiskIds },
            organizationId: user.organizationId,
          },
          select: { id: true },
        });

        if (risks.length !== parsedRiskIds.length) {
          throw new NotFoundError('One or more specified risks not found in organization');
        }
      }

      if (parsedControlIds.length > 0) {
        const controls = await db.client.control.findMany({
          where: {
            id: { in: parsedControlIds },
            organizationId: user.organizationId,
          },
          select: { id: true },
        });

        if (controls.length !== parsedControlIds.length) {
          throw new NotFoundError('One or more specified controls not found in organization');
        }
      }

      // Create document
      const document = await db.client.document.create({
        data: {
          title,
          description,
          category,
          type,
          status: 'draft',
          version: '1.0',
          ownerId: ownerId || user.id,
          organizationId: user.organizationId,
          createdById: user.id,
          confidentiality,
          businessUnit,
          department,
          tags: parsedTags,
          riskIds: parsedRiskIds,
          controlIds: parsedControlIds,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Process file uploads
      const files = formData.getAll('files') as File[];
      const uploadedFiles = [];

      for (const file of files) {
        if (file && file.size > 0) {
          // Validate file
          const validation = validateFile(file, {
            maxSize: storageConfig.maxSize,
            allowedTypes: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/plain',
              'image/png',
              'image/jpeg',
              'image/gif',
            ],
          });

          if (!validation.valid) {
            throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
          }

          // Upload file to storage
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const storageFile = await storage.upload(fileBuffer, {
            filename: file.name,
            metadata: {
              documentId: document.id,
              uploadedBy: user.id,
              originalName: file.name,
            },
          });

          // Create file record in database
          const dbFile = await db.client.documentFile.create({
            data: {
              filename: file.name,
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
              storageId: storageFile.id,
              storagePath: storageFile.path,
              checksum: storageFile.checksum,
              documentId: document.id,
              uploadedById: user.id,
              organizationId: user.organizationId,
            },
          });

          uploadedFiles.push(dbFile);
        }
      }

      // Start AI analysis if files were uploaded
      if (uploadedFiles.length > 0) {
        // Run document analysis in background
        documentProcessor.analyzeDocument(document.id).catch(error => {
          console.error('Document analysis failed:', error);
        });
      }

      // Log activity
      await db.client.activity.create({
        data: {
          type: 'CREATED',
          entityType: 'DOCUMENT',
          entityId: document.id,
          description: `Created document: ${document.title}`,
          userId: user.id,
          organizationId: user.organizationId,
          metadata: {
            documentId: document.id,
            category: document.category,
            type: document.type,
            filesUploaded: uploadedFiles.length,
            linkedRisks: parsedRiskIds.length,
            linkedControls: parsedControlIds.length,
          },
          isPublic: false,
        },
      });

      return createAPIResponse(
        {
          ...document,
          files: uploadedFiles,
        },
        { statusCode: 201 }
      );

    } catch (error) {
      console.error('Document creation failed:', error);
      throw new Error(`Document creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    requiredPermissions: [PERMISSIONS.DOCUMENTS_WRITE],
    rateLimit: { limit: 20, windowMs: 15 * 60 * 1000 },
  }
); 