import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://riscura.app'}/`);
  
  // Clear session cookie
  response.cookies.delete('session-token');
  
  return response;
}