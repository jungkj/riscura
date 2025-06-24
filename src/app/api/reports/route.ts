import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports - List reports (stub implementation)
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'List reports not implemented',
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20
        }
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create new report (stub implementation)
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'Create report not implemented'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/reports - Update report (stub implementation)
export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'Update report not implemented'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports - Delete report (stub implementation)
export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'Delete report not implemented'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 