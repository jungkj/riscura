import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { ReportingService, ReportConfig, ReportFormat, ReportType } from '@/services/ReportingService';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const {
      name,
      type,
      template,
      format,
      filters = {},
      parameters = {},
      recipients = [],
    } = body;

    if (!name || !type || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, format' },
        { status: 400 }
      );
    }

    // Validate report type
    if (!Object.values(ReportType).includes(type)) {
      return NextResponse.json(
        { error: `Invalid report type: ${type}` },
        { status: 400 }
      );
    }

    // Validate formats
    const validFormats = Array.isArray(format) ? format : [format];
    const invalidFormats = validFormats.filter(f => !Object.values(ReportFormat).includes(f));
    if (invalidFormats.length > 0) {
      return NextResponse.json(
        { error: `Invalid format(s): ${invalidFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await db.client.user.findUnique({
      where: { id: (session.user as any).id || 'unknown' },
      select: { organizationId: true, role: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 400 }
      );
    }

    // Check permissions for sensitive report types
    const sensitiveReports = [ReportType.AUDIT_TRAIL, ReportType.EXECUTIVE_SUMMARY];
    if (sensitiveReports.includes(type) && !['ADMIN', 'OWNER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this report type' },
        { status: 403 }
      );
    }

    // Create report configuration
    const reportConfig: ReportConfig = {
      name,
      type,
      template: template || `${type}_standard`,
      parameters,
      filters: {
        ...filters,
        // Ensure date filters are Date objects
        dateRange: filters.dateRange ? {
          from: new Date(filters.dateRange.from),
          to: new Date(filters.dateRange.to),
        } : undefined,
      },
      format: validFormats,
      organizationId: user.organizationId,
      createdBy: (session.user as any).id || 'unknown',
      recipients,
    };

    // Initialize reporting service
    const reportingService = new ReportingService();

    // Generate report
    const reports = await reportingService.generateReport(reportConfig);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      reports: reports.map(report => ({
        id: report.id,
        name: report.name,
        type: report.type,
        format: report.format,
        fileSize: report.fileSize,
        generatedAt: report.generatedAt,
        downloadUrl: report.downloadUrl,
      })),
    });

  } catch (error) {
    console.error('Report generation error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Missing required configuration')) {
      return NextResponse.json(
        { error: 'Invalid report configuration', details: errorMessage },
        { status: 400 }
      );
    }

    if (errorMessage.includes('Invalid date range')) {
      return NextResponse.json(
        { error: 'Invalid date range specified', details: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Report generation failed', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const user = await db.client.user.findUnique({
      where: { id: (session.user as any).id || 'unknown' },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 400 }
      );
    }

    // Initialize reporting service
    const reportingService = new ReportingService();

    // Get available templates
    const templates = await reportingService.getReportTemplates(user.organizationId);

    return NextResponse.json({
      success: true,
      templates,
      reportTypes: Object.values(ReportType),
      formats: Object.values(ReportFormat),
    });

  } catch (error) {
    console.error('Error fetching report templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
      { status: 500 }
    );
  }
} 