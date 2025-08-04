import { NextRequest, NextResponse } from 'next/server';

// POST /api/questionnaires/responses - Submit questionnaire response (stub implementation)
export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: 'Questionnaire response submission not implemented',
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Submit questionnaire response error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/questionnaires/responses - List questionnaire responses (stub implementation)
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: 'List questionnaire responses not implemented',
        data: [],
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Get questionnaire responses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
