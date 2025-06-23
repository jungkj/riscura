import { NextRequest, NextResponse } from 'next/server';

// Mock authentication - replace with actual auth
const getCurrentUser = (request: NextRequest) => {
  // In production, extract from JWT token or session
  return {
    id: 'user_123',
    email: 'user@example.com',
    name: 'John Doe',
  };
};

// Mock report storage - replace with actual storage service
const getStoredReport = (reportId: string): { buffer: Buffer; filename: string; mimeType: string } | null => {
  // In production, retrieve from file system, S3, or database
  const storage = (global as any).reportStorage;
  if (!storage || !storage.has(reportId)) {
    return null;
  }

  const buffer = storage.get(reportId);
  
  // Determine file type from reportId or store metadata separately
  let mimeType = 'application/octet-stream';
  let filename = `report_${reportId}`;
  
  if (reportId.includes('pdf')) {
    mimeType = 'application/pdf';
    filename += '.pdf';
  } else if (reportId.includes('excel')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    filename += '.xlsx';
  } else if (reportId.includes('csv')) {
    mimeType = 'text/csv';
    filename += '.csv';
  }

  return { buffer, filename, mimeType };
};

// Check if user has access to the report
const hasReportAccess = (userId: string, reportId: string): boolean => {
  // In production, check database for report ownership or permissions
  // For now, allow access to all reports for demo purposes
  return true;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Check if user has access to this report
    if (!hasReportAccess(user.id, reportId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Retrieve the report file
    const reportData = getStoredReport(reportId);
    if (!reportData) {
      return NextResponse.json({ error: 'Report not found or expired' }, { status: 404 });
    }

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', reportData.mimeType);
    headers.set('Content-Disposition', `attachment; filename="${reportData.filename}"`);
    headers.set('Content-Length', reportData.buffer.length.toString());
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Return the file as a response
    return new NextResponse(reportData.buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}

// HEAD method to get file metadata without downloading
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const reportId = params.id;
    if (!reportId) {
      return new NextResponse(null, { status: 400 });
    }

    // Check if user has access to this report
    if (!hasReportAccess(user.id, reportId)) {
      return new NextResponse(null, { status: 403 });
    }

    // Retrieve the report metadata
    const reportData = getStoredReport(reportId);
    if (!reportData) {
      return new NextResponse(null, { status: 404 });
    }

    // Return headers without body
    const headers = new Headers();
    headers.set('Content-Type', reportData.mimeType);
    headers.set('Content-Length', reportData.buffer.length.toString());
    headers.set('Last-Modified', new Date().toUTCString());
    headers.set('Cache-Control', 'no-cache');

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error getting report metadata:', error);
    return new NextResponse(null, { status: 500 });
  }
} 