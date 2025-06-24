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
  category: z.enum(['POLICY', 'PROCEDURE', 'GUIDELINE', 'FRAMEWORK', 'STANDARD', 'TEMPLATE', 'REPORT', 'EVIDENCE', 'CONTRACT', 'OTHER']),
  tags: z.array(z.string()).optional().default([]),
  confidentiality: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  linkedRiskIds: z.array(z.string().uuid()).optional().default([]),
  linkedControlIds: z.array(z.string().uuid()).optional().default([]),
  reviewDate: z.string().datetime().optional(),
  retentionDate: z.string().datetime().optional(),
});

// POST /api/upload/documents - Upload document files
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
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

    const uploadedDocuments: Array<{ document: any; file: any }> = [];

    for (const file of files) {
      // Validate file
      const validation = await validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate secure file path
      const filePath = generateSecurePath(user.organizationId, 'documents', file.name);

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
      });

      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      // Create document record in database
      const document = await db.client.document.create({
        data: {
          title: validatedMetadata.title,
          description: validatedMetadata.description,
          category: validatedMetadata.category,
          status: 'DRAFT',
          version: '1.0',
          tags: validatedMetadata.tags,
          confidentiality: validatedMetadata.confidentiality,
          reviewDate: validatedMetadata.reviewDate ? new Date(validatedMetadata.reviewDate) : null,
          retentionDate: validatedMetadata.retentionDate ? new Date(validatedMetadata.retentionDate) : null,
          organizationId: user.organizationId,
          createdBy: user.id,
        },
      });

      // Create file record
      const fileRecord = await db.client.documentFile.create({
        data: {
          documentId: document.id,
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          path: uploadResult.path,
          url: uploadResult.url,
          checksum: uploadResult.checksum,
          uploadedBy: user.id,
          organizationId: user.organizationId,
        },
      });

      // Link to risks and controls
      if (validatedMetadata.linkedRiskIds.length > 0) {
        await db.client.documentRiskLink.createMany({
          data: validatedMetadata.linkedRiskIds.map((riskId: string) => ({
            documentId: document.id,
            riskId,
            organizationId: user.organizationId,
          })),
        });
      }

      if (validatedMetadata.linkedControlIds.length > 0) {
        await db.client.documentControlLink.createMany({
          data: validatedMetadata.linkedControlIds.map((controlId: string) => ({
            documentId: document.id,
            controlId,
            organizationId: user.organizationId,
          })),
        });
      }

      // Log activity
      await db.client.activity.create({
        data: {
          type: 'DOCUMENT_UPLOADED',
          description: `Document "${document.title}" uploaded`,
          userId: user.id,
          organizationId: user.organizationId,
          entityType: 'DOCUMENT',
          entityId: document.id,
          metadata: {
            filename: file.name,
            size: file.size,
            category: document.category,
          },
        },
      });

      uploadedDocuments.push({
        document,
        file: fileRecord,
      });
    }

    return createAPIResponse({
      data: uploadedDocuments,
      message: `${uploadedDocuments.length} document(s) uploaded successfully`,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload documents');
  }
});

// GET /api/upload/documents - Get upload progress (when uploadId is provided as query param)
export const GET = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
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
    const progress = await getUploadProgressFromCache(uploadId, user.organizationId);

    return createAPIResponse({
      data: progress,
    });
  } catch (error) {
    console.error('Error getting upload progress:', error);
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
    errors: [],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

// POST /api/upload/documents/bulk - Bulk document upload with ZIP support
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
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
      throw new Error('Only ZIP files are supported for bulk upload');
    }

    if (zipFile.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('ZIP file too large (max 100MB)');
    }

    // Extract and process ZIP file
    const extractedFiles = await extractZipFile(zipFile);
    const uploadedDocuments: Array<{ document: any; file: any }> = [];

    for (const extractedFile of extractedFiles) {
      // Validate each extracted file
      const validation = await validateFile(extractedFile.file);
      if (!validation.isValid) {
        console.warn(`Skipping invalid file ${extractedFile.name}: ${validation.errors.join(', ')}`);
        continue;
      }

      // Generate secure file path
      const filePath = generateSecurePath(user.organizationId, 'documents', extractedFile.name);

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
      });

      if (!uploadResult.success) {
        console.warn(`Failed to upload ${extractedFile.name}: ${uploadResult.error}`);
        continue;
      }

      // Create document record
      const document = await db.client.document.create({
        data: {
          title: extractedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: `Bulk uploaded from ${zipFile.name}`,
          category: metadata.defaultCategory || 'OTHER',
          status: 'DRAFT',
          version: '1.0',
          tags: metadata.defaultTags || [],
          confidentiality: metadata.defaultConfidentiality || 'INTERNAL',
          organizationId: user.organizationId,
          createdBy: user.id,
        },
      });

      // Create file record
      const fileRecord = await db.client.documentFile.create({
        data: {
          documentId: document.id,
          filename: extractedFile.name,
          originalName: extractedFile.name,
          mimeType: extractedFile.file.type,
          size: extractedFile.file.size,
          path: uploadResult.path,
          url: uploadResult.url,
          checksum: uploadResult.checksum,
          uploadedBy: user.id,
          organizationId: user.organizationId,
        },
      });

      uploadedDocuments.push({
        document,
        file: fileRecord,
      });
    }

    // Log bulk upload activity
    await db.client.activity.create({
      data: {
        type: 'BULK_DOCUMENT_UPLOAD',
        description: `Bulk upload: ${uploadedDocuments.length} documents from ${zipFile.name}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          zipFilename: zipFile.name,
          zipSize: zipFile.size,
          documentsUploaded: uploadedDocuments.length,
          totalFilesInZip: extractedFiles.length,
        },
      },
    });

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
    console.error('Bulk document upload error:', error);
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
  });

  return files;
}

// DELETE /api/upload/documents/[id] - Delete uploaded document
export const DELETE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
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

    // Get document with files
    const document = await db.client.document.findUnique({
      where: {
        id: documentId,
        organizationId: user.organizationId,
      },
      include: {
        files: true,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete files from storage
    for (const file of document.files) {
      try {
        await deleteFileFromStorage(file.path);
      } catch (error) {
        console.warn(`Failed to delete file from storage: ${file.path}`, error);
      }
    }

    // Delete document and related records (cascade)
    await db.client.document.delete({
      where: { id: documentId },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'DOCUMENT_DELETED',
        description: `Document "${document.title}" deleted`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          documentTitle: document.title,
          filesDeleted: document.files.length,
        },
      },
    });

    return createAPIResponse({
      data: { deleted: true },
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete document');
  }
});

// Helper function to delete file from storage
async function deleteFileFromStorage(filePath: string): Promise<void> {
  // Implementation would depend on storage provider (AWS S3, Azure Blob, etc.)
  // For now, this is a placeholder
  console.log(`Deleting file from storage: ${filePath}`);
} 