import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, FileMetadata } from '@/lib/storage/s3-client';
import { validateFile, performVirusScan } from '@/lib/storage/file-validator';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string || 'general';
    const tags = formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [];
    const linkedEntityType = formData.get('linkedEntityType') as string;
    const linkedEntityId = formData.get('linkedEntityId') as string;
    const description = formData.get('description') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Too many files. Maximum 10 files per upload.' },
        { status: 400 }
      );
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate file size
        if (buffer.length > MAX_FILE_SIZE) {
          errors.push(`File ${file.name} exceeds maximum size limit`);
          continue;
        }

        // Validate file
        const validationResult = await validateFile(
          buffer,
          file.name,
          file.type,
          {
            category,
            enforceSecurityChecks: true,
            maxSize: MAX_FILE_SIZE,
          }
        );

        if (!validationResult.isValid) {
          errors.push(`File ${file.name}: ${validationResult.errors.join(', ')}`);
          continue;
        }

        // Perform virus scan
        const virusScanResult = await performVirusScan(buffer);
        if (!virusScanResult.isClean) {
          errors.push(`File ${file.name} failed virus scan: ${virusScanResult.threat}`);
          continue;
        }

        // Upload file to storage
        const uploadResult = await uploadFile(
          buffer,
          file.name,
          file.type,
          {
            uploadedBy: session.user.id,
            category,
            tags,
          }
        );

        // Save document metadata to database
        const document = await prisma.document.create({
          data: {
            id: uploadResult.key,
            originalName: file.name,
            fileName: uploadResult.key,
            fileSize: uploadResult.size,
            mimeType: uploadResult.contentType,
            category,
            tags,
            description,
            uploadedBy: session.user.id,
            storageUrl: uploadResult.url,
            hash: validationResult.fileInfo.hash,
            detectedFileType: validationResult.fileInfo.detectedType,
            isImage: validationResult.fileInfo.isImage,
            isDocument: validationResult.fileInfo.isDocument,
            virusScanned: true,
            virusScanResult: 'clean',
            uploadedAt: new Date(),
            version: 1,
            status: 'active',
            // Link to entity if provided
            linkedEntityType: linkedEntityType || null,
            linkedEntityId: linkedEntityId || null,
          },
        });

        // Create audit log entry
        await prisma.auditLog.create({
          data: {
            action: 'DOCUMENT_UPLOAD',
            entityType: 'DOCUMENT',
            entityId: document.id,
            userId: session.user.id,
            details: {
              fileName: file.name,
              fileSize: uploadResult.size,
              category,
              linkedTo: linkedEntityType && linkedEntityId ? `${linkedEntityType}:${linkedEntityId}` : null,
            },
          },
        });

        uploadResults.push({
          id: document.id,
          originalName: file.name,
          fileName: uploadResult.key,
          size: uploadResult.size,
          url: uploadResult.url,
          category,
          tags,
          warnings: validationResult.warnings,
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    // Return results
    return NextResponse.json({
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadResults.length} file(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}

// Handle file upload progress (for large files)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle chunked upload for large files
    const { chunk, chunkIndex, totalChunks, uploadId, fileName } = await request.json();

    // TODO: Implement chunked upload logic
    // For now, return success
    return NextResponse.json({
      success: true,
      chunkIndex,
      uploadId,
      isComplete: chunkIndex + 1 === totalChunks,
    });

  } catch (error) {
    console.error('Chunked upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during chunked upload' },
      { status: 500 }
    );
  }
} 