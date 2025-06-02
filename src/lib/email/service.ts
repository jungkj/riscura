import nodemailer from 'nodemailer';
import { emailConfig, env } from '@/config/env';
import { generateId } from '@/lib/utils';

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

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, EmailTemplate> = new Map();
  private queue: Array<{ id: string; email: EmailOptions; retryCount: number; scheduledAt: Date }> = [];
  private isProcessing = false;

  constructor() {
    this.initializeTransporter();
    this.loadTemplates();
    this.startQueueProcessor();
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
      auth: emailConfig.user && emailConfig.pass ? {
        user: emailConfig.user,
        pass: emailConfig.pass,
      } : undefined,
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
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
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
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const readyEmails = this.queue.filter(item => item.scheduledAt <= now);
        
        for (const item of readyEmails) {
          try {
            await this.send(item.email);
            // Remove from queue on success
            this.queue = this.queue.filter(q => q.id !== item.id);
          } catch (error) {
            console.error(`Failed to send queued email ${item.id}:`, error);
            
            item.retryCount++;
            if (item.retryCount >= 3) {
              console.error(`Email ${item.id} failed after 3 attempts, removing from queue`);
              this.queue = this.queue.filter(q => q.id !== item.id);
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
}

// Export singleton instance
export const emailService = new EmailService(); 