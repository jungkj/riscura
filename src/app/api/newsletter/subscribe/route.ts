import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiMiddleware } from '@/lib/api/middleware';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const POST = withApiMiddleware({
  requireAuth: false,
  bodySchema: subscribeSchema,
  rateLimiters: ['standard'],
})(async (context, data) => {
  const { email } = data;

  try {
    // Here you would integrate with your email service provider
    // For example: SendGrid, Mailchimp, ConvertKit, etc.

    // For now, we'll just simulate the subscription
    // console.log(`Newsletter subscription for: ${email}`);

    // In production, you would:
    // 1. Add to your email list
    // 2. Send a confirmation email
    // 3. Track the subscription

    // Example SendGrid integration:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    //
    // await sgMail.send({
    //   to: email,
    //   from: 'hello@riscura.com',
    //   subject: 'Welcome to Riscura Blog',
    //   text: 'Thank you for subscribing...',
    //   html: '<strong>Thank you for subscribing...</strong>',
    // });

    return {
      success: true,
      message: 'Successfully subscribed to newsletter',
    };
  } catch (error) {
    // console.error('Newsletter subscription error:', error);
    throw new Error('Failed to subscribe to newsletter');
  }
});
