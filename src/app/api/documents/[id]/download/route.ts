import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { getFile, generateSignedUrl } from '@/lib/storage/s3-client';

interface Params {
  id: string;
}

// GET /api/documents/[id]/download - Secure file download
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const inline = url.searchParams.get('inline') === 'true';

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
      select: {
        id: true,
        originalName: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        uploadedBy: true,
        status: true,
        isImage: true,
        isDocument: true,
        downloadCount: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document is active
    if (document.status === 'deleted') {
      return NextResponse.json(
        { error: 'Document has been deleted' },
        { status: 410 }
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

    try {
      // Get file from storage
      const { buffer, metadata } = await getFile(document.fileName);

      // Update download count and last download time
      await prisma.document.update({
        where: { id },
        data: {
          downloadCount: (document.downloadCount || 0) + 1,
          lastDownloadedAt: new Date(),
        },
      });

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'DOCUMENT_DOWNLOAD',
          entityType: 'DOCUMENT',
          entityId: document.id,
          userId: session.user.id,
          details: {
            fileName: document.originalName,
            fileSize: document.fileSize,
            downloadMethod: 'direct',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        },
      });

      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', document.mimeType || 'application/octet-stream');
      headers.set('Content-Length', buffer.length.toString());
      
      if (inline && (document.isImage || document.mimeType === 'application/pdf')) {
        // Display inline for images and PDFs
        headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
      } else {
        // Force download for other file types
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
      }

      // Security headers
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });

    } catch (storageError) {
      console.error('Storage error:', storageError);
      
      // Try to generate a signed URL as fallback (for S3)
      try {
        const signedUrl = await generateSignedUrl(document.fileName, 300); // 5 minutes
        
        // Log the signed URL access
        await prisma.auditLog.create({
          data: {
            action: 'DOCUMENT_DOWNLOAD',
            entityType: 'DOCUMENT',
            entityId: document.id,
            userId: session.user.id,
            details: {
              fileName: document.originalName,
              downloadMethod: 'signed_url',
              expiresIn: 300,
            },
          },
        });

        return NextResponse.redirect(signedUrl);
      } catch (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        return NextResponse.json(
          { error: 'File temporarily unavailable' },
          { status: 503 }
        );
      }
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check document access
async function checkDocumentAccess(document: any, userId: string): Promise<boolean> {
  // Owner can always access
  if (document.uploadedBy === userId) return true;

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
  });

  if (!user) return false;

  // Admins and managers can access all documents in their organization
  if (user.role === 'admin' || user.role === 'manager') return true;

  // Check if document is shared with user or their team
  // This would be implemented based on your specific sharing model
  
  // For now, allow access to all users in the same organization for non-sensitive documents
  const documentWithOrg = await prisma.document.findUnique({
    where: { id: document.id },
    select: { 
      organizationId: true, 
      category: true,
      confidentiality: true,
    },
  });

  if (documentWithOrg?.organizationId === user.organizationId) {
    // Allow access unless it's confidential
    return documentWithOrg.confidentiality !== 'CONFIDENTIAL';
  }

  return false;
} 