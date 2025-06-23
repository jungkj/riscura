import { NextRequest, NextResponse } from 'next/server';
import { reportingService } from '@/services/ReportingService';

// Mock authentication - replace with actual auth
const getCurrentUser = (request: NextRequest) => {
  // In production, extract from JWT token or session
  return {
    id: 'user_123',
    email: 'user@example.com',
    name: 'John Doe',
  };
};

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, name, frequency, recipients, parameters } = body;

    // Validate required fields
    if (!templateId || !name || !frequency || !recipients) {
      return NextResponse.json(
        { error: 'templateId, name, frequency, and recipients are required' },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'frequency must be daily, weekly, monthly, or quarterly' },
        { status: 400 }
      );
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Create scheduled report
    const scheduledReport = await reportingService.scheduleReport({
      templateId,
      name,
      frequency,
      recipients,
      parameters: parameters || {},
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      scheduledReport: {
        id: scheduledReport.id,
        templateId: scheduledReport.templateId,
        name: scheduledReport.name,
        frequency: scheduledReport.frequency,
        recipients: scheduledReport.recipients,
        parameters: scheduledReport.parameters,
        nextRun: scheduledReport.nextRun,
        status: scheduledReport.status,
        createdAt: scheduledReport.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduledReports = await reportingService.getScheduledReports(user.id);

    // Enrich with template information
    const templates = await reportingService.getReportTemplates();
    const enrichedReports = scheduledReports.map(report => {
      const template = templates.find(t => t.id === report.templateId);
      return {
        ...report,
        templateName: template?.name || 'Unknown Template',
        templateDescription: template?.description || '',
      };
    });

    return NextResponse.json({
      success: true,
      scheduledReports: enrichedReports,
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, frequency, recipients, parameters, status } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Validate frequency if provided
    if (frequency && !['daily', 'weekly', 'monthly', 'quarterly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'frequency must be daily, weekly, monthly, or quarterly' },
        { status: 400 }
      );
    }

    // Validate recipients if provided
    if (recipients) {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json(
          { error: 'recipients must be a non-empty array' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status && !['active', 'paused', 'error'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be active, paused, or error' },
        { status: 400 }
      );
    }

    // Update scheduled report
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (frequency !== undefined) updates.frequency = frequency;
    if (recipients !== undefined) updates.recipients = recipients;
    if (parameters !== undefined) updates.parameters = parameters;
    if (status !== undefined) updates.status = status;

    // Note: This would need to be implemented in the ReportingService
    // For now, we'll return a mock response
    return NextResponse.json({
      success: true,
      message: 'Scheduled report updated successfully',
      scheduledReport: {
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    // Note: This would need to be implemented in the ReportingService
    // For now, we'll return a mock response
    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
} 