import { NextResponse } from 'next/server';

export const GET = async () => {
  return NextResponse.json({
    success: true,
    message: 'Simple API route working',
    timestamp: new Date().toISOString(),
  });
}; 