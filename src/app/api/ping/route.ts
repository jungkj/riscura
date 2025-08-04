// Simple ping endpoint for network performance testing
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    server: 'riscura-api',
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Length': '0',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    echo: 'pong',
  });
}
