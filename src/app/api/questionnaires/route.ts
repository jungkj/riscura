import { NextRequest, NextResponse } from 'next/server';

// GET /api/questionnaires - List questionnaires (stub implementation)
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: 'List questionnaires not implemented',
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
        },
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Get questionnaires error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/questionnaires - Create new questionnaire (stub implementation)
export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: 'Create questionnaire not implemented',
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Create questionnaire error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/questionnaires - Update questionnaire (stub implementation)
export async function PUT(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: 'Update questionnaire not implemented',
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Update questionnaire error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/questionnaires - Delete questionnaire (stub implementation)
export async function DELETE(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: 'Delete questionnaire not implemented',
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Delete questionnaire error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
