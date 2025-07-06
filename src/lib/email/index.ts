import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

// Create reusable transporter
const createTransporter = () => {
  // Use SendGrid if available
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Use SMTP settings if configured
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Use Gmail if configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Fallback to console logging in development
  if (process.env.NODE_ENV === 'development') {
    return {
      sendMail: async (options: any) => {
        console.log('📧 Email would be sent:', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) || options.html?.substring(0, 100),
        });
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }

  throw new Error('No email service configured. Please set up SMTP, SendGrid, or Gmail credentials.');
};

let transporter: any = null;

// Send email function
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM || 'noreply@riscura.com',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  notification: (data: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.title}</h1>
          </div>
          <div class="content">
            <p>${data.message}</p>
            ${data.actionUrl ? `
              <a href="${data.actionUrl}" class="button">
                ${data.actionText || 'View Details'}
              </a>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from Riscura.</p>
            <p>© ${new Date().getFullYear()} Riscura. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  },

  digest: (data: {
    frequency: string;
    notifications: Array<{
      category: string;
      items: Array<{
        title: string;
        message: string;
        actionUrl?: string;
      }>;
    }>;
  }) => {
    const notificationsList = data.notifications
      .map(category => `
        <h3>${category.category}</h3>
        <ul>
          ${category.items.map(item => `
            <li>
              <strong>${item.title}:</strong> ${item.message}
              ${item.actionUrl ? `<a href="${item.actionUrl}">View</a>` : ''}
            </li>
          `).join('')}
        </ul>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            h3 {
              color: #1f2937;
              margin-top: 20px;
            }
            ul {
              list-style: none;
              padding: 0;
            }
            li {
              background: white;
              padding: 10px;
              margin: 10px 0;
              border-radius: 4px;
              border-left: 4px solid #3b82f6;
            }
            a {
              color: #3b82f6;
              text-decoration: none;
              margin-left: 10px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your ${data.frequency} Notification Digest</h1>
          </div>
          <div class="content">
            ${notificationsList}
          </div>
          <div class="footer">
            <p>This is your ${data.frequency.toLowerCase()} digest from Riscura.</p>
            <p>© ${new Date().getFullYear()} Riscura. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  },
};