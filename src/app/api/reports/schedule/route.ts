import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { ReportingService, ReportType, ReportFormat } from '@/services/ReportingService';
import { db } from '@/lib/db';

export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await db.client.user.findUnique({
      where: { id: (session.user as any).id || 'unknown' },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
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
      return NextResponse.json({ error: 'recipients must be a non-empty array' }, { status: 400 });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Create scheduled report
    const reportingService = new ReportingService();
    const scheduledReport = await reportingService.scheduleReport({
      name,
      type: ReportType.RISK_ASSESSMENT,
      template: templateId,
      parameters: parameters || {},
      filters: {},
      format: [ReportFormat.PDF],
      organizationId: user.organizationId,
      createdBy: (session.user as any).id || 'unknown',
      isScheduled: true,
      schedule: {
        frequency,
        time: '00:00',
        timezone: 'UTC',
        enabled: true,
      },
      recipients,
    });

    return NextResponse.json({
      success: true,
      scheduledReport,
    });
  } catch (error) {
    // console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await db.client.user.findUnique({
      where: { id: (session.user as any).id || 'unknown' },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const scheduledReports = await db.client.reportSchedule.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      include: {
        reportTemplate: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      scheduledReports,
    });
  } catch (error) {
    // console.error('Error fetching scheduled reports:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled reports' }, { status: 500 });
  }
}

export async function PUT(_request: NextRequest) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await db.client.user.findUnique({
      where: { id: (session.user as any).id || 'unknown' },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const body = await request.json();
    const { id, name, frequency, recipients, parameters, status } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
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
      const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
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

    const updatedReport = await db.client.report.update({
      where: {
        id,
        organizationId: user.organizationId,
      },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled report updated successfully',
      scheduledReport: updatedReport,
    });
  } catch (error) {
    // console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await db.client.user.findUnique({
      where: { id: (session.user as any).id || 'unknown' },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
    }

    await db.client.report.delete({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    // console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}
