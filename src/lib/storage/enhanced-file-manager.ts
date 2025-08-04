import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import path from 'path';
import { uploadFile, getFile, deleteFile, generateSignedUrl } from './s3-client';
import {
  validateFile,
  generateThumbnail,
  extractTextContent,
  performVirusScan,
} from './file-validator';
import { prisma } from '@/lib/db';

export interface FileUploadResult {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  extractedText?: string;
  hash: string;
  warnings: string[];
}

export interface DocumentMetadata {
  category?: string;
  tags?: string[];
  description?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  confidentiality?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  retentionPeriod?: number; // days
}

export interface BulkUploadOptions {
  maxFiles?: number;
  maxTotalSize?: number;
  allowedTypes?: string[];
  category?: string;
  onProgress?: (progress: number) => void;
  onFileComplete?: (result: FileUploadResult) => void;
  onFileError?: (fileName: string, error: string) => void;
}

export class EnhancedFileManager {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_FILES_PER_UPLOAD = 10;
  private readonly SUPPORTED_PREVIEW_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
  ];

  /**
   * Upload a single file with comprehensive validation and processing
   */
  async uploadFile(
    _file: File | Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
    organizationId: string,
    metadata: DocumentMetadata = {}
  ): Promise<FileUploadResult> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const fileHash = createHash('sha256').update(buffer).digest('hex');
    const warnings: string[] = [];

    // Validate file
    const validationResult = await validateFile(buffer, fileName, mimeType, {
      category: metadata.category,
      enforceSecurityChecks: true,
      maxSize: this.MAX_FILE_SIZE,
    });

    if (!validationResult.isValid) {
      throw new Error(`File validation failed: ${validationResult.errors.join(', ')}`);
    }

    warnings.push(...validationResult.warnings);

    // Perform virus scan
    const virusScanResult = await performVirusScan(buffer);
    if (!virusScanResult.isClean) {
      throw new Error(`File failed virus scan: ${virusScanResult.threat}`);
    }

    // Check for duplicate files
    const existingDocument = await this.findDuplicateDocument(fileHash, organizationId);
    if (existingDocument) {
      warnings.push('File already exists in the system');
    }

    // Upload to storage
    const uploadResult = await uploadFile(buffer, fileName, mimeType, {
      uploadedBy: userId,
      category: metadata.category,
      tags: metadata.tags,
    });

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (validationResult.fileInfo.isImage) {
      try {
        const thumbnail = await generateThumbnail(buffer, validationResult.fileInfo.detectedType);
        if (thumbnail) {
          const thumbnailResult = await uploadFile(thumbnail, `thumb_${fileName}`, 'image/jpeg', {
            uploadedBy: userId,
            category: 'thumbnail',
          });
          thumbnailUrl = thumbnailResult.url;
        }
      } catch (error) {
        // console.warn('Thumbnail generation failed:', error)
        warnings.push('Thumbnail generation failed');
      }
    }

    // Extract text content for searchable documents
    let extractedText: string | undefined;
    if (validationResult.fileInfo.isDocument) {
      try {
        extractedText = await extractTextContent(buffer, validationResult.fileInfo.detectedType);
      } catch (error) {
        // console.warn('Text extraction failed:', error)
        warnings.push('Text extraction failed');
      }
    }

    // Save document metadata to database
    if (!prisma) {
      throw new Error('Database connection not available');
    }

    const document = await prisma.document.create({
      data: {
        id: uuidv4(),
        name: fileName,
        type: mimeType,
        size: buffer.length,
        content: uploadResult.url,
        extractedText,
        aiAnalysis: {
          fileType: validationResult.fileInfo.detectedType,
          hash: fileHash,
          isImage: validationResult.fileInfo.isImage,
          isDocument: validationResult.fileInfo.isDocument,
          virusScanResult: 'clean',
          thumbnailUrl,
          warnings,
          uploadedAt: new Date().toISOString(),
        },
        organizationId,
        uploadedBy: userId,
      },
    });

    // Create audit log
    await this.createAuditLog('DOCUMENT_UPLOAD', document.id, userId, {
      fileName,
      fileSize: buffer.length,
      fileType: mimeType,
      category: metadata.category,
      warnings,
    });

    return {
      id: document.id,
      name: fileName,
      type: mimeType,
      size: buffer.length,
      url: uploadResult.url,
      thumbnailUrl,
      extractedText,
      hash: fileHash,
      warnings,
    };
  }

  /**
   * Bulk upload multiple files with progress tracking
   */
  async bulkUpload(
    files: File[],
    userId: string,
    organizationId: string,
    metadata: DocumentMetadata = {},
    options: BulkUploadOptions = {}
  ): Promise<{
    successful: FileUploadResult[];
    failed: { fileName: string; error: string }[];
    warnings: string[];
  }> {
    const {
      maxFiles = this.MAX_FILES_PER_UPLOAD,
      maxTotalSize = this.MAX_FILE_SIZE * 5,
      onProgress,
      onFileComplete,
      onFileError,
    } = options;

    if (files.length > maxFiles) {
      throw new Error(`Too many files. Maximum ${maxFiles} files allowed.`);
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxTotalSize) {
      throw new Error(`Total file size exceeds limit of ${this.formatFileSize(maxTotalSize)}`);
    }

    const successful: FileUploadResult[] = [];
    const failed: { fileName: string; error: string }[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const _result = await this.uploadFile(
          file,
          file.name,
          file.type,
          userId,
          organizationId,
          metadata
        );

        successful.push(result);
        warnings.push(...result.warnings);
        onFileComplete?.(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ fileName: file.name, error: errorMessage });
        onFileError?.(file.name, errorMessage);
      }

      // Update progress
      const progress = ((i + 1) / files.length) * 100;
      onProgress?.(progress);
    }

    return { successful, failed, warnings };
  }

  /**
   * Create a new version of an existing document
   */
  async createDocumentVersion(
    documentId: string,
    file: File | Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
    changeLog?: string
  ): Promise<FileUploadResult> {
    // Get existing document
    if (!prisma) {
      throw new Error('Database connection not available');
    }

    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      throw new Error('Document not found');
    }

    // Upload new version
    const _result = await this.uploadFile(
      file,
      fileName,
      mimeType,
      userId,
      existingDocument.organizationId,
      { category: 'version' }
    );

    // Update document with new version
    await prisma!.document.update({
      where: { id: documentId },
      data: {
        name: fileName,
        type: mimeType,
        size: result.size,
        content: result.url,
        extractedText: result.extractedText,
        aiAnalysis: {
          ...(existingDocument.aiAnalysis as any),
          versions: [
            ...((existingDocument.aiAnalysis as any)?.versions || []),
            {
              version: ((existingDocument.aiAnalysis as any)?.versions?.length || 0) + 1,
              uploadedAt: new Date().toISOString(),
              changeLog,
              url: result.url,
              size: result.size,
            },
          ],
        },
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('DOCUMENT_VERSION_CREATE', documentId, userId, {
      fileName,
      changeLog,
      version: ((existingDocument.aiAnalysis as any)?.versions?.length || 0) + 1,
    });

    return result;
  }

  /**
   * Search documents with full-text search
   */
  async searchDocuments(
    _query: string,
    organizationId: string,
    filters: {
      type?: string[];
      category?: string[];
      dateFrom?: Date;
      dateTo?: Date;
      uploadedBy?: string;
    } = {},
    pagination: { skip: number; take: number } = { skip: 0, take: 20 }
  ): Promise<{
    documents: any[];
    total: number;
  }> {
    const whereClause: any = {
      organizationId,
    };

    // Add search functionality
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { extractedText: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Add filters
    if (filters.type?.length) {
      whereClause.type = { in: filters.type };
    }

    if (filters.uploadedBy) {
      whereClause.uploadedBy = filters.uploadedBy;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.uploadedAt = {};
      if (filters.dateFrom) whereClause.uploadedAt.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.uploadedAt.lte = filters.dateTo;
    }

    if (!prisma) {
      throw new Error('Database connection not available');
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma!.document.count({ where: whereClause }),
    ]);

    return { documents, total };
  }

  /**
   * Get document with access control
   */
  async getDocument(documentId: string, userId: string): Promise<any> {
    if (!prisma) {
      throw new Error('Database connection not available');
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check access permissions
    const hasAccess = await this.checkDocumentAccess(document, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Log access
    await this.createAuditLog('DOCUMENT_ACCESS', documentId, userId, {
      fileName: document.name,
      action: 'view',
    });

    return {
      ...document,
      downloadUrl: `/api/documents/${document.id}/download`,
      previewUrl: this.canPreview(document.type) ? `/api/documents/${document.id}/preview` : null,
      thumbnailUrl: (document.aiAnalysis as any)?.thumbnailUrl,
    };
  }

  /**
   * Delete document with proper cleanup
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    if (!prisma) {
      throw new Error('Database connection not available');
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check delete permissions
    const canDelete = await this.checkDeletePermission(document, userId);
    if (!canDelete) {
      throw new Error('Insufficient permissions to delete document');
    }

    // Delete from storage
    if (document.content) {
      try {
        // Extract filename from URL or use document ID
        const fileName = document.content.includes('/')
          ? document.content.split('/').pop() || document.id
          : document.id;
        await deleteFile(fileName);
      } catch (error) {
        // console.warn('Storage deletion failed:', error)
      }
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    await this.createAuditLog('DOCUMENT_DELETE', documentId, userId, {
      fileName: document.name,
      fileSize: document.size,
    });
  }

  /**
   * Generate secure download URL
   */
  async generateDownloadUrl(
    documentId: string,
    userId: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const document = await this.getDocument(documentId, userId);

    if (document.content?.startsWith('http')) {
      // For S3 URLs, generate signed URL
      const fileName = document.content.split('/').pop();
      return await generateSignedUrl(fileName, expiresIn);
    } else {
      // For local storage, return API endpoint
      return `/api/documents/${documentId}/download`;
    }
  }

  // Helper methods
  private async findDuplicateDocument(hash: string, organizationId: string): Promise<any> {
    if (!prisma) {
      throw new Error('Database connection not available');
    }

    return await prisma.document.findFirst({
      where: {
        organizationId,
        aiAnalysis: {
          path: ['hash'],
          equals: hash,
        },
      },
    });
  }

  private async checkDocumentAccess(document: any, userId: string): Promise<boolean> {
    // Owner can always access
    if (document.uploadedBy === userId) return true;

    if (!prisma) {
      throw new Error('Database connection not available');
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });

    if (!user) return false;
    if (user.organizationId !== document.organizationId) return false;

    // Admins can access all documents
    if (user.role === 'ADMIN') return true;

    // For now, allow access to all users in the same organization
    return true;
  }

  private async checkDeletePermission(document: any, userId: string): Promise<boolean> {
    // Only owner or admin can delete
    if (document.uploadedBy === userId) return true;

    if (!prisma) {
      throw new Error('Database connection not available');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  }

  private canPreview(mimeType: string): boolean {
    return this.SUPPORTED_PREVIEW_TYPES.includes(mimeType);
  }

  private async createAuditLog(
    _action: string,
    entityId: string,
    userId: string,
    details: any
  ): Promise<void> {
    // Since there's no audit log model in the schema, we'll skip this for now
    // In a real implementation, you would create an audit log entry
    // console.log('Audit log:', { action, entityId, userId, details })
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
