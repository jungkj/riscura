import { NextRequest, NextResponse } from 'next/server';

// GET /api/documents/[id]/download - Secure file download (stub implementation)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return NextResponse.json(
      {
        error: 'Document download not implemented',
        documentId: id,
      },
      { status: 501 }
    );
  } catch (error) {
    // console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
