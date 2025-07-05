import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/auth-middleware';
import ReportService from '@/services/ReportService';
import CloudStorageService from '@/services/CloudStorageService';

// GET /api/reports/[id]/download - Download report file
export const GET = withApiMiddleware(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, organization } = await getAuthenticatedUser(req);

  // Get report details
  const report = await ReportService.getReportById(params.id, organization.id);

  if (!report) {
    return NextResponse.json(
      { error: 'Report not found' },
      { status: 404 }
    );
  }

  if (!report.fileUrl) {
    return NextResponse.json(
      { error: 'Report file not available. Please generate the report first.' },
      { status: 404 }
    );
  }

  try {
    // Download file from storage
    const buffer = await CloudStorageService.downloadFile(report.fileUrl);
    const metadata = await CloudStorageService.getFileMetadata(report.fileUrl);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to get file metadata' },
        { status: 500 }
      );
    }

    // Determine filename
    const filename = report.fileUrl.split('/').pop() || `report_${report.id}.${report.format || 'pdf'}`;

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Content-Length': metadata.size.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Last-Modified': metadata.lastModified.toUTCString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Failed to download report file' },
      { status: 500 }
    );
  }
});

// POST /api/reports/[id]/download - Generate and download report
export const POST = withApiMiddleware(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, organization } = await getAuthenticatedUser(req);

  const body = await req.json();
  const { format = 'pdf' } = body;

  // Generate report if not already generated
  const report = await ReportService.generateReport(
    params.id,
    format,
    organization.id
  );

  if (!report.fileUrl) {
    return NextResponse.json(
      { error: 'Failed to generate report file' },
      { status: 500 }
    );
  }

  // Return download URL
  return NextResponse.json({
    data: {
      downloadUrl: report.fileUrl,
      format: report.format,
      generatedAt: report.generatedAt,
    },
    message: 'Report ready for download',
  });
}); 