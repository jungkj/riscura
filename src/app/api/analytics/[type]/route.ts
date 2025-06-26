import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';

interface AnalyticsParams {
  type: string;
}

// GET /api/analytics/[type] - Get specific analytics data
export async function GET(req: NextRequest, { params }: { params: AnalyticsParams }) {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const { type } = params;
    const { searchParams } = new URL(req.url);
    
    // Forward the request to the main analytics endpoint with type parameter
    const url = new URL('/api/analytics', req.url);
    url.searchParams.set('type', type);
    
    // Copy all other search params
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: req.headers as any,
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error(`Error fetching ${params.type} analytics:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.type} analytics data` },
      { status: 500 }
    );
  }
} 