import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import CloudStorageService from '@/services/CloudStorageService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get params
    const resolvedParams = await params;
    
    // Reconstruct file path
    const filePath = `/api/files/${resolvedParams.path.join('/')}`;

    // Check if file exists
    const exists = await CloudStorageService.fileExists(filePath);
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file metadata
    const metadata = await CloudStorageService.getFileMetadata(filePath);
    if (!metadata) {
      return NextResponse.json({ error: 'Failed to get file metadata' }, { status: 500 });
    }

    // Download file
    const buffer = await CloudStorageService.downloadFile(filePath);

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Content-Length': metadata.size.toString(),
        'Content-Disposition': `inline; filename="${params.path[params.path.length - 1]}"`,
        'Last-Modified': metadata.lastModified.toUTCString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}