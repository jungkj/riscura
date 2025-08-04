import { NextRequest, NextResponse } from 'next/server';

// GET document metadata (stub implementation)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return NextResponse.json(
      {
        error: 'Get document not implemented',
        documentId: id,
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Get document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE document metadata (stub implementation)
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return NextResponse.json(
      {
        error: 'Update document not implemented',
        documentId: id,
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Update document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE document (stub implementation)
export async function DELETE(_request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return NextResponse.json(
      {
        error: 'Delete document not implemented',
        documentId: id,
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
