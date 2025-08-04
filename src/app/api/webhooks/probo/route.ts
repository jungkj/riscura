import { NextRequest, NextResponse } from 'next/server';
import getEnhancedProboService from '@/services/EnhancedProboService';
import { db } from '@/lib/db';

const prisma = db.client;

// POST /api/webhooks/probo - Handle Probo webhook events
export async function POST(_request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-probo-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    // Get organization ID from query params or headers
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('org') || request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    // Parse webhook data
    const webhookData = await request.json();

    // Handle webhook
    await getEnhancedProboService().handleWebhook(organizationId, webhookData, signature);

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('Probo webhook error:', error)

    if (error instanceof Error && error.message === 'Invalid webhook signature') {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
