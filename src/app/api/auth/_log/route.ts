import { NextRequest, NextResponse } from 'next/server';

// NextAuth client-side logging endpoint
// This is called by NextAuth's client-side code to log errors
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[NextAuth Client Log]:', body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}

// Return empty response for other methods
export async function GET() {
  return NextResponse.json({ ok: true });
}