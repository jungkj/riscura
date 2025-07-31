import nodemailer from 'nodemailer';
import { emailConfig, env } from '@/config/env';
import { generateId } from '@/lib/utils';
import { db } from '@/lib/db';
import { createTransporter } from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    encoding?: string;
    contentType?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  deliveryTime?: Date;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  envelope: {
    from: string;
    to: string[];
  };
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<{ messageId: string; success: boolean }>;
}

// Mock email provider for development
class MockEmailProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<{ messageId: string; success: boolean }> {
    console.log('📧 Mock Email Sent:', {
      to: options.to,
      subject: options.subject,
      template: options.template,
    });

    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      success: true,
    };
  }
}

// SendGrid email provider (production)
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(options: EmailOptions): Promise<{ messageId: string; success: boolean }> {
    // TODO: Implement actual SendGrid integration
    throw new Error('SendGrid integration not implemented yet');
  }
}

// AWS SES email provider (production)
class SESProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<{ messageId: string; success: boolean }> {
    // TODO: Implement actual AWS SES integration
    throw new Error('AWS SES integration not implemented yet');
  }
}

// Email templates
const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to Riscura',
    html: `
      <h1>Welcome to Riscura!</h1>
      <p>Hello {{firstName}},</p>
      <p>Welcome to Riscura, your comprehensive risk management platform.</p>
      <p>To get started:</p>
      <ol>
        <li>Complete your profile setup</li>
        <li>Explore the dashboard</li>
        <li>Create your first risk assessment</li>
      </ol>
      <p>If you have any questions, our support team is here to help.</p>
      <p>Best regards,<br>The Riscura Team</p>
    `,
  },
  emailVerification: {
    subject: 'Verify your email address',
    html: `
      <h1>Verify Your Email</h1>
      <p>Hello {{firstName}},</p>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="{{verificationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  },
  passwordReset: {
    subject: 'Reset your password',
    html: `
      <h1>Password Reset</h1>
      <p>Hello {{firstName}},</p>
      <p>You requested to reset your password. Click the link below:</p>
      <p><a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  },
  riskAlert: {
    subject: 'Risk Alert: {{riskTitle}}',
    html: `
      <h1>Risk Alert</h1>
      <p>A {{riskLevel}} risk has been identified:</p>
      <h2>{{riskTitle}}</h2>
      <p><strong>Category:</strong> {{riskCategory}}</p>
      <p><strong>Risk Score:</strong> {{riskScore}}</p>
      <p><strong>Description:</strong> {{riskDescription}}</p>
      <p><a href="{{riskUrl}}">View Risk Details</a></p>
    `,
  },
  workflowNotification: {
    subject: 'Action Required: {{workflowName}}',
    html: `
      <h1>Action Required</h1>
      <p>Hello {{firstName}},</p>
      <p>You have a pending action in the workflow: <strong>{{workflowName}}</strong></p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
      <p><strong>Description:</strong> {{description}}</p>
      <p><a href="{{workflowUrl}}">Take Action</a></p>
    `,
  },
  complianceReport: {
    subject: 'Compliance Report - {{reportDate}}',
    html: `
      <h1>Compliance Report</h1>
      <p>Your compliance report for {{reportDate}} is ready.</p>
      <p><strong>Overall Score:</strong> {{complianceScore}}%</p>
      <p><strong>Critical Issues:</strong> {{criticalIssues}}</p>
      <p><strong>Recommendations:</strong> {{recommendations}}</p>
      <p><a href="{{reportUrl}}">View Full Report</a></p>
    `,
  },
};

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, EmailTemplate> = new Map();
  private queue: Array<{ id: string; email: EmailOptions; retryCount: number; scheduledAt: Date }> =
    [];
  private isProcessing = false;
  private provider: EmailProvider;
  private config: EmailConfig;
  private sesClient?: SESClient;
  private smtpTransporter?: any;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeTransporter();
    this.loadTemplates();
    this.startQueueProcessor();

    // Choose provider based on environment
    if (env.NODE_ENV === 'production') {
      if (env.SENDGRID_API_KEY) {
        this.provider = new SendGridProvider(env.SENDGRID_API_KEY);
      } else if (env.AWS_SES_REGION) {
        this.provider = new SESProvider();
      } else {
        console.warn('No email provider configured for production');
        this.provider = new MockEmailProvider();
      }
    } else {
      this.provider = new MockEmailProvider();
    }
  }

  private initializeTransporter() {
    if (!emailConfig.enabled) {
      console.warn('Email service is disabled. Check your SMTP configuration.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth:
        emailConfig.user && emailConfig.pass
          ? {
              user: emailConfig.user,
              pass: emailConfig.pass,
            }
          : undefined,
      tls: {
        rejectUnauthorized: env.NODE_ENV === 'production',
      },
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service connection failed:', error);
      } else {
        console.log('Email service connected successfully');
      }
    });
  }

  private loadTemplates() {
    // Email verification template
    this.templates.set('verification', {
      name: 'verification',
      subject: 'Verify your Riscura account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Riscura</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hello {{firstName}},</p>
              <p>Thank you for signing up for Riscura. To complete your registration, please verify your email address by clicking the button below:</p>
              <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
              <p>This verification link will expire in 24 hours.</p>
              <p>If you didn't create an account with Riscura, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Riscura. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Riscura!
        
        Hello {{firstName}},
        
        Thank you for signing up for Riscura. To complete your registration, please verify your email address by visiting:
        
        {{verificationUrl}}
        
        This verification link will expire in 24 hours.
        
        If you didn't create an account with Riscura, you can safely ignore this email.
        
        © 2024 Riscura. All rights reserved.
      `,
    });

    // Password reset template
    this.templates.set('password-reset', {
      name: 'password-reset',
      subject: 'Reset your Riscura password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello {{firstName}},</p>
              <p>We received a request to reset your password for your Riscura account. Click the button below to reset it:</p>
              <a href="{{resetUrl}}" class="button">Reset Password</a>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
              <p>This password reset link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Riscura. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello {{firstName}},
        
        We received a request to reset your password for your Riscura account. Visit this link to reset it:
        
        {{resetUrl}}
        
        This password reset link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email.
        
        © 2024 Riscura. All rights reserved.
      `,
    });

    // Risk notification template
    this.templates.set('risk-notification', {
      name: 'risk-notification',
      subject: 'Risk Alert: {{riskTitle}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Risk Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .risk-level { padding: 10px; border-radius: 5px; margin: 15px 0; }
            .risk-high { background: #fecaca; border: 1px solid #ef4444; }
            .risk-medium { background: #fed7aa; border: 1px solid #f97316; }
            .risk-low { background: #bbf7d0; border: 1px solid #22c55e; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Risk Alert</h1>
            </div>
            <div class="content">
              <h2>{{riskTitle}}</h2>
              <div class="risk-level risk-{{riskLevel}}">
                <strong>Risk Level: {{riskLevel|upper}}</strong><br>
                Risk Score: {{riskScore}}
              </div>
              <p><strong>Description:</strong></p>
              <p>{{riskDescription}}</p>
              <p><strong>Category:</strong> {{riskCategory}}</p>
              <p><strong>Owner:</strong> {{riskOwner}}</p>
              <a href="{{riskUrl}}" class="button">View Risk Details</a>
              <p>Please review this risk and take appropriate action as needed.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Riscura. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async send(options: EmailOptions): Promise<EmailResult | null> {
    if (!emailConfig.enabled || !this.transporter) {
      console.warn('Email service is disabled. Email not sent:', options.subject);
      return null;
    }

    try {
      // Process template if specified
      if (options.template && options.templateData) {
        const processed = this.processTemplate(options.template, options.templateData);
        if (processed) {
          options.subject = processed.subject;
          options.html = processed.html;
          options.text = processed.text;
        }
      }

      const mailOptions = {
        from: emailConfig.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        priority: options.priority || 'normal',
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return {
        messageId: result.messageId,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        pending: result.pending || [],
        envelope: result.envelope,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(
        `Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async sendTemplate(
    templateName: string,
    to: string | string[],
    data: Record<string, any>,
    options: Partial<Omit<EmailOptions, 'template' | 'templateData'>> = {}
  ): Promise<EmailResult | null> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    return this.send({
      to,
      subject: template.subject,
      template: templateName,
      templateData: data,
      ...options,
    });
  }

  private processTemplate(templateName: string, data: Record<string, any>): EmailTemplate | null {
    const template = this.templates.get(templateName);
    if (!template) {
      console.error(`Email template not found: ${templateName}`);
      return null;
    }

    // Simple template processing (replace {{variable}} with data)
    const processText = (text: string) => {
      return text.replace(/\{\{(\w+)(\|(\w+))?\}\}/g, (match, key, _, filter) => {
        let value = data[key] || match;

        // Apply filters
        if (filter === 'upper') {
          value = String(value).toUpperCase();
        } else if (filter === 'lower') {
          value = String(value).toLowerCase();
        }

        return String(value);
      });
    };

    return {
      name: template.name,
      subject: processText(template.subject),
      html: processText(template.html),
      text: template.text ? processText(template.text) : undefined,
    };
  }

  async queueEmail(options: EmailOptions): Promise<string> {
    const id = generateId();
    const scheduledAt = options.deliveryTime || new Date();

    this.queue.push({
      id,
      email: options,
      retryCount: 0,
      scheduledAt,
    });

    console.log(`Email queued for delivery: ${id}`);
    return id;
  }

  private async startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) return;

      this.isProcessing = true;

      try {
        const now = new Date();
        const readyEmails = this.queue.filter((item) => item.scheduledAt <= now);

        for (const item of readyEmails) {
          try {
            await this.send(item.email);
            // Remove from queue on success
            this.queue = this.queue.filter((q) => q.id !== item.id);
          } catch (error) {
            console.error(`Failed to send queued email ${item.id}:`, error);

            item.retryCount++;
            if (item.retryCount >= 3) {
              console.error(`Email ${item.id} failed after 3 attempts, removing from queue`);
              this.queue = this.queue.filter((q) => q.id !== item.id);
            } else {
              // Retry in 5 minutes
              item.scheduledAt = new Date(Date.now() + 5 * 60 * 1000);
            }
          }
        }
      } finally {
        this.isProcessing = false;
      }
    }, 30000); // Process queue every 30 seconds
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.isProcessing,
      configured: emailConfig.enabled,
    };
  }

  addTemplate(template: EmailTemplate) {
    this.templates.set(template.name, template);
  }

  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }

  listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<{ messageId: string; success: boolean }> {
    try {
      // Process template if specified
      if (options.template && EMAIL_TEMPLATES[options.template]) {
        const template = EMAIL_TEMPLATES[options.template];
        options.subject = this.processTemplate(template.subject, options.templateData || {});
        options.html = this.processTemplate(template.html, options.templateData || {});
        if (template.text) {
          options.text = this.processTemplate(template.text, options.templateData || {});
        }
      }

      // Send email
      const result = await this.provider.sendEmail(options);

      // Log email in database
      await this.logEmail(options, result);

      return result;
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    emails: EmailOptions[]
  ): Promise<Array<{ messageId: string; success: boolean }>> {
    const results = [];

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push(result);
      } catch (error) {
        console.error('Bulk email error:', error);
        results.push({ messageId: '', success: false });
      }
    }

    return results;
  }

  /**
   * Send template email
   */
  async sendTemplateEmail(
    template: string,
    to: string | string[],
    data: Record<string, any>
  ): Promise<{ messageId: string; success: boolean }> {
    return this.sendEmail({
      to,
      template,
      templateData: data,
      subject: '', // Will be set by template
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: { email: string; firstName: string }): Promise<void> {
    await this.sendTemplateEmail('welcome', user.email, {
      firstName: user.firstName,
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    user: { email: string; firstName: string },
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${env.APP_URL}/auth/verify-email?token=${verificationToken}`;

    await this.sendTemplateEmail('emailVerification', user.email, {
      firstName: user.firstName,
      verificationUrl,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    user: { email: string; firstName: string },
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${env.APP_URL}/auth/reset-password?token=${resetToken}`;

    await this.sendTemplateEmail('passwordReset', user.email, {
      firstName: user.firstName,
      resetUrl,
    });
  }

  /**
   * Send risk alert
   */
  async sendRiskAlert(
    users: Array<{ email: string; firstName: string }>,
    risk: {
      id: string;
      title: string;
      description: string;
      category: string;
      riskLevel: string;
      riskScore: number;
    }
  ): Promise<void> {
    const riskUrl = `${env.APP_URL}/dashboard/risks/${risk.id}`;

    for (const user of users) {
      await this.sendTemplateEmail('riskAlert', user.email, {
        firstName: user.firstName,
        riskTitle: risk.title,
        riskDescription: risk.description,
        riskCategory: risk.category,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        riskUrl,
      });
    }
  }

  /**
   * Send workflow notification
   */
  async sendWorkflowNotification(
    user: { email: string; firstName: string },
    workflow: {
      id: string;
      name: string;
      description: string;
      dueDate: Date;
    }
  ): Promise<void> {
    const workflowUrl = `${env.APP_URL}/dashboard/workflows/${workflow.id}`;

    await this.sendTemplateEmail('workflowNotification', user.email, {
      firstName: user.firstName,
      workflowName: workflow.name,
      description: workflow.description,
      dueDate: workflow.dueDate.toLocaleDateString(),
      workflowUrl,
    });
  }

  /**
   * Log email in database
   */
  private async logEmail(
    options: EmailOptions,
    result: { messageId: string; success: boolean }
  ): Promise<void> {
    try {
      await db.client.emailLog.create({
        data: {
          messageId: result.messageId,
          to: Array.isArray(options.to) ? options.to.join(',') : options.to,
          subject: options.subject,
          template: options.template || null,
          success: result.success,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Email logging error:', error);
      // Don't throw error, logging is optional
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
