import nodemailer from 'nodemailer';
import fs from 'fs/promises';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailServiceConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'reports@riscura.com',
    };

    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });

      // Verify connection
      await this.transporter.verify();
      // console.log('Email service initialized successfully')
    } catch (error) {
      // console.error('Email service initialization failed:', error)
      // Create a mock transporter for development
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  /**
   * Send email with optional attachments
   */
  async sendEmail(_options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
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
      };

      const _result = await this.transporter.sendMail(mailOptions);
      // console.log('Email sent successfully:', result.messageId)
    } catch (error) {
      // console.error('Failed to send email:', error)
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send report via email
   */
  async sendReport(
    recipients: string[],
    reportName: string,
    reportPaths: Array<{ path: string; filename: string; format: string }>,
    additionalMessage?: string
  ): Promise<void> {
    const attachments = await Promise.all(
      reportPaths.map(async (report) => {
        const content = await fs.readFile(report.path);
        return {
          filename: report.filename,
          content,
          contentType: this.getContentType(report.format),
        };
      })
    );

    const html = this.generateReportEmailHTML(reportName, reportPaths, additionalMessage);

    await this.sendEmail({
      to: recipients,
      subject: `Report: ${reportName}`,
      html,
      attachments,
    });
  }

  /**
   * Send scheduled report notification
   */
  async sendScheduledReportNotification(
    recipients: string[],
    reportName: string,
    scheduleInfo: {
      frequency: string;
      nextRun: Date;
      lastRun?: Date;
    }
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a365d; margin: 0;">Scheduled Report Notification</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #2d3748; margin-top: 0;">Report: ${reportName}</h3>
          
          <div style="margin: 20px 0;">
            <p><strong>Frequency:</strong> ${scheduleInfo.frequency}</p>
            <p><strong>Next Run:</strong> ${scheduleInfo.nextRun.toLocaleString()}</p>
            ${scheduleInfo.lastRun ? `<p><strong>Last Run:</strong> ${scheduleInfo.lastRun.toLocaleString()}</p>` : ''}
          </div>
          
          <div style="background: #edf2f7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #4a5568;">
              <strong>Note:</strong> This is a notification about your scheduled report. 
              The actual report will be delivered according to the schedule above.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #718096;">
            Riscura Risk Management Platform | Automated Report System
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: recipients,
      subject: `Scheduled Report Notification: ${reportName}`,
      html,
    });
  }

  /**
   * Send report generation failure notification
   */
  async sendReportFailureNotification(
    recipients: string[],
    reportName: string,
    error: string,
    retryInfo?: {
      willRetry: boolean;
      nextRetry?: Date;
      attemptNumber: number;
    }
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #c53030; margin: 0;">Report Generation Failed</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #2d3748; margin-top: 0;">Report: ${reportName}</h3>
          
          <div style="background: #fed7d7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #c53030;">
              <strong>Error:</strong> ${error}
            </p>
          </div>
          
          ${
            retryInfo
              ? `
            <div style="background: ${retryInfo.willRetry ? '#bee3f8' : '#feebc8'}; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: ${retryInfo.willRetry ? '#2c5282' : '#c05621'};">
                ${
                  retryInfo.willRetry
                    ? `<strong>Retry Scheduled:</strong> Attempt ${retryInfo.attemptNumber + 1} will occur at ${retryInfo.nextRetry?.toLocaleString()}`
                    : `<strong>No Retry:</strong> Maximum retry attempts reached (${retryInfo.attemptNumber})`
                }
              </p>
            </div>
          `
              : ''
          }
          
          <div style="margin: 20px 0;">
            <p>Please check the system logs for more details or contact your system administrator.</p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #718096;">
            Riscura Risk Management Platform | Automated Report System
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: recipients,
      subject: `Report Generation Failed: ${reportName}`,
      html,
    });
  }

  /**
   * Generate HTML for report email
   */
  private generateReportEmailHTML(
    reportName: string,
    reportPaths: Array<{ path: string; filename: string; format: string }>,
    additionalMessage?: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a365d; margin: 0;">Your Report is Ready</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #2d3748; margin-top: 0;">Report: ${reportName}</h3>
          
          ${
            additionalMessage
              ? `
            <div style="margin: 20px 0; padding: 15px; background: #edf2f7; border-radius: 6px;">
              <p style="margin: 0; color: #4a5568;">${additionalMessage}</p>
            </div>
          `
              : ''
          }
          
          <div style="margin: 20px 0;">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Formats:</strong> ${reportPaths.map((r) => r.format.toUpperCase()).join(', ')}</p>
            <p><strong>Files:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${reportPaths
                .map(
                  (report) => `
                <li style="margin: 5px 0;">${report.filename}</li>
              `
                )
                .join('')}
            </ul>
          </div>
          
          <div style="background: #e6fffa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #234e52;">
              <strong>Security Note:</strong> These reports contain sensitive organizational data. 
              Please handle them according to your organization's data security policies.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #718096;">
            Riscura Risk Management Platform | Generated on ${new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get content type for file format
   */
  private getContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection successful' };
    } catch (error) {
      return { success: false, message: `Email service connection failed: ${error.message}` };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(recipient: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a365d; margin: 0;">Email Service Test</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p>This is a test email from the Riscura Risk Management Platform.</p>
          <p><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
          <p>If you received this email, the email service is working correctly.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: recipient,
      subject: 'Riscura Email Service Test',
      html,
    });
  }
}
