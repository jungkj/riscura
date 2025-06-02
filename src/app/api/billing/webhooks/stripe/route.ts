import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/billing/stripe';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify and construct webhook event
    const event = stripeService.constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the webhook event
    await stripeService.handleWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    
    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 