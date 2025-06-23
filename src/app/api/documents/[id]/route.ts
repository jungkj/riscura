import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, getFileMetadata } from '@/lib/storage/s3-client';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

interface Params {
  id: string;
}

// Validation schemas
const updateDocumentSchema = z.object({
  originalName: z.string().optional(),
  category: z.enum(['evidence', 'policy', 'control', 'risk', 'audit', 'general', 'template']).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  linkedEntityType: z.string().optional(),
  linkedEntityId: z.string().optional(),
});

// GET document metadata
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedByUser: {
          select: { id: true, name: true, email: true },
        },
        versions: {
          select: {
            id: true,
            version: true,
            fileName: true,
            fileSize: true,
            uploadedAt: true,
            changeLog: true,
          },
          orderBy: { version: 'desc' },
        },
        _count: {
          select: {
            comments: true,
            shares: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const hasAccess = await checkDocumentAccess(document, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Log access
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_ACCESS',
        entityType: 'DOCUMENT',
        entityId: document.id,
        userId: session.user.id,
        details: {
          fileName: document.originalName,
          action: 'view_metadata',
        },
      },
    });

    return NextResponse.json({
      id: document.id,
      originalName: document.originalName,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      category: document.category,
      tags: document.tags,
      description: document.description,
      uploadedBy: document.uploadedByUser,
      uploadedAt: document.uploadedAt,
      updatedAt: document.updatedAt,
      version: document.version,
      status: document.status,
      downloadCount: document.downloadCount,
      lastDownloadedAt: document.lastDownloadedAt,
      linkedEntityType: document.linkedEntityType,
      linkedEntityId: document.linkedEntityId,
      isImage: document.isImage,
      isDocument: document.isDocument,
      detectedFileType: document.detectedFileType,
      versions: document.versions,
      commentCount: document._count.comments,
      shareCount: document._count.shares,
      downloadUrl: `/api/documents/${document.id}/download`,
      previewUrl: document.isImage || document.mimeType === 'application/pdf' 
        ? `/api/documents/${document.id}/preview` 
        : null,
    });

  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE document metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get existing document
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions (owner or admin can edit)
    const canEdit = await checkDocumentEditAccess(existingDocument, session.user.id);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate input
    const { originalName, description, category, tags, linkedEntityType, linkedEntityId } = body;

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        originalName: originalName || existingDocument.originalName,
        description: description !== undefined ? description : existingDocument.description,
        category: category || existingDocument.category,
        tags: tags || existingDocument.tags,
        linkedEntityType: linkedEntityType !== undefined ? linkedEntityType : existingDocument.linkedEntityType,
        linkedEntityId: linkedEntityId !== undefined ? linkedEntityId : existingDocument.linkedEntityId,
        updatedAt: new Date(),
      },
      include: {
        uploadedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_UPDATE',
        entityType: 'DOCUMENT',
        entityId: id,
        userId: session.user.id,
        details: {
          changes: {
            originalName: originalName !== existingDocument.originalName ? { from: existingDocument.originalName, to: originalName } : undefined,
            description: description !== existingDocument.description ? { from: existingDocument.description, to: description } : undefined,
            category: category !== existingDocument.category ? { from: existingDocument.category, to: category } : undefined,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedDocument.id,
      originalName: updatedDocument.originalName,
      description: updatedDocument.description,
      category: updatedDocument.category,
      tags: updatedDocument.tags,
      linkedEntityType: updatedDocument.linkedEntityType,
      linkedEntityId: updatedDocument.linkedEntityId,
      updatedAt: updatedDocument.updatedAt,
    });

  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        versions: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions (owner or admin can delete)
    const canDelete = await checkDocumentDeleteAccess(document, session.user.id);
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if document is linked to any entities
    const linkedEntities = await checkLinkedEntities(id);
    if (linkedEntities.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete document that is linked to other entities',
          linkedEntities 
        },
        { status: 409 }
      );
    }

    // Soft delete in database first
    await prisma.document.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_DELETE',
        entityType: 'DOCUMENT',
        entityId: id,
        userId: session.user.id,
        details: {
          fileName: document.originalName,
          fileSize: document.fileSize,
        },
      },
    });

    // Delete file from storage (async)
    try {
      await deleteFile(document.fileName);
      
      // Delete all versions
      for (const version of document.versions) {
        await deleteFile(version.fileName);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Don't fail the request if storage deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to view the document
 */
async function checkDocumentAccess(document: any, userId: string): Promise<boolean> {
  // Document owner always has access
  if (document.uploadedBy === userId) {
    return true;
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Admins have access to all documents
  if (user?.role === 'ADMIN') {
    return true;
  }

  // Managers can view documents in their department
  if (user?.role === 'MANAGER') {
    const userDept = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });
    
    const uploaderDept = await prisma.user.findUnique({
      where: { id: document.uploadedBy },
      select: { department: true },
    });

    if (userDept?.department === uploaderDept?.department) {
      return true;
    }
  }

  // Check shared access
  const sharedAccess = await prisma.documentAccess.findFirst({
    where: {
      documentId: document.id,
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return !!sharedAccess;
}

/**
 * Check if user can edit the document
 */
async function checkDocumentEditAccess(document: any, userId: string): Promise<boolean> {
  // Document owner can edit
  if (document.uploadedBy === userId) {
    return true;
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Admins can edit all documents
  if (user?.role === 'ADMIN') {
    return true;
  }

  // Check shared access with edit permissions
  const sharedAccess = await prisma.documentAccess.findFirst({
    where: {
      documentId: document.id,
      userId,
      permission: 'EDIT',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return !!sharedAccess;
}

/**
 * Check if user can delete the document
 */
async function checkDocumentDeleteAccess(document: any, userId: string): Promise<boolean> {
  // Document owner can delete
  if (document.uploadedBy === userId) {
    return true;
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Only admins can delete documents they don't own
  return user?.role === 'ADMIN';
}

async function checkLinkedEntities(documentId: string): Promise<any[]> {
  // Check if document is linked to risks, controls, or assessments
  const linkedEntities = [];

  // Check risks
  const linkedRisks = await prisma.risk.findMany({
    where: {
      OR: [
        { documents: { some: { id: documentId } } },
        { evidenceDocuments: { some: { id: documentId } } },
      ],
    },
    select: { id: true, title: true },
  });

  if (linkedRisks.length > 0) {
    linkedEntities.push(...linkedRisks.map(r => ({ type: 'risk', id: r.id, title: r.title })));
  }

  // Check controls
  const linkedControls = await prisma.control.findMany({
    where: {
      documents: { some: { id: documentId } },
    },
    select: { id: true, title: true },
  });

  if (linkedControls.length > 0) {
    linkedEntities.push(...linkedControls.map(c => ({ type: 'control', id: c.id, title: c.title })));
  }

  return linkedEntities;
} 