import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import ReportService from '@/services/ReportService';
import CloudStorageService from '@/services/CloudStorageService';
import { z } from 'zod';

// GET /api/reports/[id]/download - Download report file
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiMiddleware(
    async (_request: NextRequest) => {
      const user = (request as any).user;
      const { id } = await params;

      // Get report details
      const report = await ReportService.getReportById(id, user.organizationId);

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
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
          return NextResponse.json({ error: 'Failed to get file metadata' }, { status: 500 });
        }

        // Determine filename
        const filename =
          report.fileUrl.split('/').pop() || `report_${report.id}.${report.format || 'pdf'}`;

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
        // console.error('Error downloading report:', error)
        return NextResponse.json({ error: 'Failed to download report file' }, { status: 500 });
      }
    },
    { requireAuth: true }
  )(req);
}

// Validation schema for POST request
const downloadReportSchema = z.object({
  format: z.enum(['pdf', 'excel']).default('pdf'),
});

// POST /api/reports/[id]/download - Generate and download report
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiMiddleware(
    async (_request: NextRequest) => {
      const user = (request as any).user;
      const { id } = await params;

      try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = downloadReportSchema.parse(body);

        // Sanitize the format parameter
        const format = validatedData.format;

        // Generate report if not already generated
        const report = await ReportService.generateReport(id, format, user.organizationId);

        if (!report.fileUrl) {
          return NextResponse.json({ error: 'Failed to generate report file' }, { status: 500 });
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Invalid request format',
              details: error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
              })),
            },
            { status: 400 }
          );
        }

        // console.error('Error generating report:', error)
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
      }
    },
    { requireAuth: true }
  )(req);
}
