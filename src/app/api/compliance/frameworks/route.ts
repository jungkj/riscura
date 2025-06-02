import { NextRequest, NextResponse } from 'next/server';
import { complianceFrameworkManager } from '@/lib/compliance/frameworks';
import { validateRequest } from '@/lib/auth/validate';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const industry = searchParams.get('industry')?.split(',') || [];
    const geography = searchParams.get('geography')?.split(',') || [];
    const mandatory = searchParams.get('mandatory') === 'true' ? true : 
                     searchParams.get('mandatory') === 'false' ? false : undefined;

    const filters = {
      type: type || undefined,
      industry: industry.length > 0 ? industry : undefined,
      geography: geography.length > 0 ? geography : undefined,
      mandatory,
    };

    const frameworks = await complianceFrameworkManager.getFrameworks(filters);

    return NextResponse.json({
      success: true,
      data: frameworks,
      count: frameworks.length,
    });

  } catch (error) {
    console.error('Error fetching compliance frameworks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance frameworks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'initialize') {
      // Initialize pre-built frameworks
      await complianceFrameworkManager.initializeFrameworks();
      
      return NextResponse.json({
        success: true,
        message: 'Compliance frameworks initialized successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error managing compliance frameworks:', error);
    return NextResponse.json(
      { error: 'Failed to manage compliance frameworks' },
      { status: 500 }
    );
  }
} 