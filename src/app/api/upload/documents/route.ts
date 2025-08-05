import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { uploadFile, validateFile, generateSecurePath } from '@/lib/storage/files';
import { z } from 'zod';

// File upload validation schema
const fileUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum([
    'POLICY',
    'PROCEDURE',
    'GUIDELINE',
    'FRAMEWORK',
    'STANDARD',
    'TEMPLATE',
    'REPORT',
    'EVIDENCE',
    'CONTRACT',
    'OTHER',
  ]),
  tags: z.array(z.string()).optional().default([]),
  confidentiality: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  linkedRiskIds: z.array(z.string().uuid()).optional().default([]),
  linkedControlIds: z.array(z.string().uuid()).optional().default([]),
  reviewDate: z.string().datetime().optional(),
  retentionDate: z.string().datetime().optional(),
})

// POST /api/upload/documents - Upload one or more documents
export const POST = withAPI(async (req: NextRequest): Promise<NextResponse> => {
  const authReq = req as AuthenticatedRequest
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const metadataStr = formData.get('metadata') as string;

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    if (!metadataStr) {
      throw new Error('Document metadata is required');
    }

    const metadata = JSON.parse(metadataStr);
    const validatedMetadata = fileUploadSchema.parse(metadata);

    const uploadedDocuments: Array<{ document: any }> = [];

    for (const file of files) {
      // Validate file
      const validation = await validateFile(file)
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate secure file path
      const filePath = generateSecurePath(user.organizationId, 'documents', file.name)

      // Upload file to storage
      const uploadResult = await uploadFile(file, filePath, {
        organizationId: user.organizationId,
        uploadedBy: user.id,
        category: validatedMetadata.category,
        metadata: {
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      })

      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      // Create document record in database
      const document = await db.client.document.create({
        data: {
          name: file.name,
          type: file.type,
          size: file.size,
          content: uploadResult.path,
          extractedText: null,
          uploadedAt: new Date(),
          organizationId: user.organizationId,
          uploadedBy: user.id,
        },
      })

      // Link to risks and controls
      if (validatedMetadata.linkedRiskIds.length > 0) {
        await db.client.document.update({
          where: { id: document.id },
          data: {
            riskEvidence: {
              connect: validatedMetadata.linkedRiskIds.map((riskId: string) => ({ id: riskId })),
            },
          },
        })
      }

      if (validatedMetadata.linkedControlIds.length > 0) {
        await db.client.document.update({
          where: { id: document.id },
          data: {
            controlEvidence: {
              connect: validatedMetadata.linkedControlIds.map((controlId: string) => ({
                id: controlId,
              })),
            },
          },
        });
      }

      // Log activity
      await db.client.activity.create({
        data: {
          type: 'UPLOADED',
          description: `Document "${document.name}" uploaded`,
          userId: user.id,
          organizationId: user.organizationId,
          entityType: 'DOCUMENT',
          entityId: document.id,
          metadata: {
            filename: file.name,
            size: file.size,
            type: file.type,
          },
        },
      })

      uploadedDocuments.push({
        document,
      });
    }

    return createAPIResponse({
      data: uploadedDocuments,
      message: `${uploadedDocuments.length} document(s) uploaded successfully`,
    });
  } catch (error) {
    // console.error('Document upload error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to upload documents');
  }
});

// GET /api/upload/documents - Get upload progress (when uploadId is provided as query param)
export const GET = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const url = new URL(req.url);
    const uploadId = url.searchParams.get('uploadId');

    if (!uploadId) {
      throw new Error('Upload ID is required');
    }

    // Get upload progress from cache/database
    // This would typically be stored in Redis for real-time updates
    const progress = await getUploadProgressFromCache(uploadId, user.organizationId)

    return createAPIResponse({
      data: progress,
    });
  } catch (error) {
    // console.error('Error getting upload progress:', error)
    throw new Error('Failed to get upload progress');
  }
});

// Helper function to get upload progress (would use Redis in production)
async function getUploadProgressFromCache(uploadId: string, organizationId: string) {
  // Mock implementation - in production this would query Redis
  return {
    uploadId,
    status: 'completed',
    progress: 100,
    uploadedBytes: 1024000,
    totalBytes: 1024000,
    filesProcessed: 1,
    totalFiles: 1,
    errors: [] as any[],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }
}

// POST /api/upload/documents/bulk - Bulk document upload with ZIP support
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const formData = await req.formData();
    const zipFile = formData.get('zipFile') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!zipFile) {
      throw new Error('ZIP file is required');
    }

    if (!metadataStr) {
      throw new Error('Bulk upload metadata is required');
    }

    const metadata = JSON.parse(metadataStr);

    // Validate ZIP file
    if (!zipFile.name.endsWith('.zip')) {
      throw new Error('Only ZIP files are supported for bulk upload')
    }

    if (zipFile.size > 100 * 1024 * 1024) {
      // 100MB limit
      throw new Error('ZIP file too large (max 100MB)')
    }

    // Extract and process ZIP file
    const extractedFiles = await extractZipFile(zipFile)
    const uploadedDocuments: Array<{ document: any }> = [];

    for (const extractedFile of extractedFiles) {
      // Validate each extracted file
      const validation = await validateFile(extractedFile.file)
      if (!validation.isValid) {
        // console.warn(
        //   `Skipping invalid file ${extractedFile.name}: ${validation.errors.join(', ')}`
        // )
        continue;
      }

      // Generate secure file path
      const filePath = generateSecurePath(user.organizationId, 'documents', extractedFile.name)

      // Upload file to storage
      const uploadResult = await uploadFile(extractedFile.file, filePath, {
        organizationId: user.organizationId,
        uploadedBy: user.id,
        category: metadata.defaultCategory || 'OTHER',
        metadata: {
          originalName: extractedFile.name,
          size: extractedFile.file.size,
          type: extractedFile.file.type,
          uploadedAt: new Date().toISOString(),
          bulkUpload: true,
        },
      })

      if (!uploadResult.success) {
        // console.warn(`Failed to upload ${extractedFile.name}: ${uploadResult.error}`)
        continue;
      }

      // Create document record
      const document = await db.client.document.create({
        data: {
          name: extractedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
          type: extractedFile.file.type,
          size: extractedFile.file.size,
          content: uploadResult.path,
          extractedText: null,
          uploadedAt: new Date(),
          organizationId: user.organizationId,
          uploadedBy: user.id,
        },
      })

      uploadedDocuments.push({
        document,
      });
    }

    // Log bulk upload activity
    await db.client.activity.create({
      data: {
        type: 'UPLOADED',
        description: `Bulk upload: ${uploadedDocuments.length} documents from ${zipFile.name}`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'DOCUMENT',
        entityId: uploadedDocuments[0].document.id,
        metadata: {
          filename: zipFile.name,
          size: zipFile.size,
          documentCount: uploadedDocuments.length,
        },
      },
    })

    return createAPIResponse({
      data: {
        uploadedDocuments,
        summary: {
          totalFiles: extractedFiles.length,
          successfulUploads: uploadedDocuments.length,
          failedUploads: extractedFiles.length - uploadedDocuments.length,
        },
      },
      message: `Bulk upload completed: ${uploadedDocuments.length}/${extractedFiles.length} documents uploaded successfully`,
    });
  } catch (error) {
    // console.error('Bulk document upload error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to upload documents');
  }
});

// Helper function to extract ZIP file
async function extractZipFile(zipFile: File): Promise<Array<{ name: string; file: File }>> {
  // Mock implementation - in production would use a ZIP library like JSZip
  const files: Array<{ name: string; file: File }> = [];

  // For now, return the ZIP file itself as a single file
  // In production, this would extract all files from the ZIP
  files.push({
    name: zipFile.name,
    file: zipFile,
  })

  return files;
}

// DELETE /api/upload/documents/[id] - Delete uploaded document
export const DELETE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const url = new URL(req.url);
    const documentId = url.pathname.split('/').pop();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    // Get document details
    const document = await db.client.document.findUnique({
      where: {
        id: documentId,
      },
    })

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from storage
    if (document.content) {
      try {
        await deleteFileFromStorage(document.content)
      } catch (error) {
        // console.warn(`Failed to delete file from storage: ${document.content}`, error)
      }
    }

    // Delete document and related records (cascade)
    await db.client.document.delete({
      where: { id: documentId },
    })

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'DELETED',
        description: `Document "${document.name}" deleted`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'DOCUMENT',
        entityId: document.id,
        metadata: {
          documentName: document.name,
        },
      },
    })

    return createAPIResponse({
      data: { deleted: true },
      message: 'Document deleted successfully',
    });
  } catch (error) {
    // console.error('Document deletion error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete document');
  }
});

// Helper function to delete file from storage
async function deleteFileFromStorage(filePath: string): Promise<void> {
  // Implementation would depend on storage provider (AWS S3, Azure Blob, etc.)
  // For now, this is a placeholder
  // console.log(`Deleting file from storage: ${filePath}`)
}
