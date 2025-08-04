import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { storageService } from '@/lib/storage/supabase-storage';

// POST /api/upload - Upload files to Supabase Storage
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'attachments';
    const metadata = formData.get('metadata');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const uploadedFile = await storageService.uploadFile({
      bucket: bucket as any,
      file,
      organizationId: user.organizationId,
      userId: user.id,
      metadata: metadata ? JSON.parse(metadata as string) : undefined,
    });

    // Get signed URL for immediate access
    const signedUrl = await storageService.getSignedUrl(
      uploadedFile.bucket,
      uploadedFile.path,
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      data: {
        ...uploadedFile,
        signedUrl,
      },
    });
  } catch (error) {
    // console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
});

// GET /api/upload/stats - Get storage usage statistics
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const _stats = await storageService.getStorageStats(user.organizationId);

    // Add usage percentage (1GB = 1073741824 bytes)
    const usagePercentage = (stats.totalSize / 1073741824) * 100;

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        usagePercentage: usagePercentage.toFixed(2),
        remainingBytes: 1073741824 - stats.totalSize,
        limit: '1GB',
      },
    });
  } catch (error) {
    // console.error('Failed to get storage stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get storage statistics' },
      { status: 500 }
    );
  }
});
