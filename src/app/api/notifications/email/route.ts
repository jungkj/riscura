/**
 * Email Notification API
 * Handles sending email notifications for alerts and support communications
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import nodemailer from 'nodemailer';

// Email payload interface
interface EmailPayload {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  category?: 'alert' | 'support' | 'marketing' | 'system';
}

// Email response interface
interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  delivered: number;
  failed: number;
}

// Create transporter based on environment
const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid if available
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (process.env.SMTP_HOST) {
    // Use custom SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    throw new Error('No email configuration found');
  }
};

export async function POST(_request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json();

    // Validate required fields
    if (!payload.to || !payload.subject || !payload.body) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Validate email addresses
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const validEmails = recipients.filter((email) => isValidEmail(email));

    if (validEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid email addresses provided' },
        { status: 400 }
      );
    }

    const transporter = createTransporter();
    const results: EmailResponse = {
      success: false,
      delivered: 0,
      failed: 0,
    };

    // Send emails individually to track delivery status
    for (const email of validEmails) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: email,
          subject: payload.subject,
          text: payload.body,
          html: payload.html || generateHTML(payload.body, payload.subject),
          attachments: payload.attachments,
          priority: payload.priority || 'normal',
          headers: {
            'X-Email-Category': payload.category || 'system',
            'X-Email-Source': 'RISCURA',
          },
        };

        const info = await transporter.sendMail(mailOptions);
        results.delivered++;

        if (!results.messageId) {
          results.messageId = info.messageId;
        }

        // Log successful delivery
        Sentry.addBreadcrumb({
          category: 'email-notification',
          message: `Email sent successfully to ${email}`,
          level: 'info',
          data: {
            recipient: email,
            subject: payload.subject,
            category: payload.category,
            messageId: info.messageId,
          },
        });
      } catch (emailError) {
        results.failed++;
        // console.error(`Failed to send email to ${email}:`, emailError);

        // Log failed delivery
        Sentry.captureException(emailError, {
          tags: {
            email_recipient: email,
            email_category: payload.category,
          },
          extra: {
            subject: payload.subject,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          },
        });
      }
    }

    results.success = results.delivered > 0;

    // Track email metrics
    await trackEmailMetrics({
      category: payload.category || 'system',
      delivered: results.delivered,
      failed: results.failed,
      subject: payload.subject,
    });

    return NextResponse.json(results);
  } catch (error) {
    // console.error('Email notification error:', error);

    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/notifications/email',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email notification',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting for email notifications
 */
async function checkRateLimit(_request: NextRequest): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Simple in-memory rate limiting (in production, use Redis)
  const rateLimitKey = `email_rate_limit:${ip}`;
  const maxRequests = 50; // 50 emails per hour per IP
  const windowMs = 60 * 60 * 1000; // 1 hour

  // This is a simplified implementation
  // In production, implement proper rate limiting with Redis
  return { allowed: true };
}

/**
 * Validate email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate HTML version of email
 */
function generateHTML(text: string, subject: string): string {
  // Convert plain text to HTML with basic formatting
  const htmlContent = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<em>$1</em>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e1e5e9;
          border-radius: 0 0 8px 8px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e1e5e9;
        }
        .alert-critical { border-left: 4px solid #dc3545; }
        .alert-warning { border-left: 4px solid #ffc107; }
        .alert-info { border-left: 4px solid #17a2b8; }
        p { margin-bottom: 16px; }
        strong { color: #2c3e50; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 24px;">RISCURA</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${subject}</p>
      </div>
      <div class="content">
        <p>${htmlContent}</p>
      </div>
      <div class="footer">
        <p>This email was sent by RISCURA Monitoring System</p>
        <p>If you believe you received this email in error, please contact support.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Track email metrics for analytics
 */
async function trackEmailMetrics(metrics: {
  category: string;
  delivered: number;
  failed: number;
  subject: string;
}) {
  try {
    // Send metrics to analytics service
    const analyticsPayload = {
      event: 'email_notification_sent',
      properties: {
        category: metrics.category,
        delivered_count: metrics.delivered,
        failed_count: metrics.failed,
        success_rate: metrics.delivered / (metrics.delivered + metrics.failed),
        subject_line: metrics.subject,
        timestamp: Date.now(),
      },
    };

    // Send to internal analytics endpoint
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [analyticsPayload] }),
      }).catch(() => {
        // Silently fail - don't break email sending for analytics
      });
    }
  } catch (error) {
    // Don't throw - email sending is more important than metrics
    // console.error('Failed to track email metrics:', error);
  }
}
