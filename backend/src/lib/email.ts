import sgMail from '@sendgrid/mail';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@beautynbrushesapp.com';
const FROM_NAME = process.env.FROM_NAME || 'Beauty N Brushes';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Email Template Service
 */
class EmailTemplateService {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/email');
  }

  /**
   * Load and parse email template
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf-8');
    return template;
  }

  /**
   * Replace template variables
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Send email using SendGrid
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!SENDGRID_API_KEY) {
      console.log(`
        ===== EMAIL (SendGrid Not Configured) =====
        To: ${to}
        Subject: ${subject}
        
        Configure SENDGRID_API_KEY to send actual emails.
        ===========================================
      `);
      return;
    }

    try {
      await sgMail.send({
        to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject,
        html,
      });

      console.log(`✅ Email sent to ${to}: ${subject}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ SendGrid error:', errorMessage);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const template = await this.loadTemplate('verification');
    const html = this.replaceVariables(template, {
      firstName,
      verificationUrl,
    });

    await this.sendEmail(email, 'Verify Your Beauty N Brushes Account', html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const template = await this.loadTemplate('password-reset');
    const html = this.replaceVariables(template, {
      firstName,
      resetUrl,
    });

    await this.sendEmail(email, 'Reset Your Password - Beauty N Brushes', html);
  }

  /**
   * Send welcome email (after onboarding complete)
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    data: {
      trialEndDate: string;
      bookingPageUrl: string;
      dashboardUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('welcome');
    const html = this.replaceVariables(template, {
      firstName,
      trialEndDate: data.trialEndDate,
      bookingPageUrl: data.bookingPageUrl,
      dashboardUrl: data.dashboardUrl,
    });

    await this.sendEmail(email, 'Welcome to Beauty N Brushes! 🎉', html);
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(
    email: string,
    data: {
      clientName: string;
      serviceName: string;
      providerName: string;
      appointmentDateTime: string;
      duration: string;
      location: string;
      totalAmount: string;
      cancellationPolicy: string;
      bookingDetailsUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('booking-confirmation');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Booking Confirmed - Beauty N Brushes', html);
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccessEmail(
    email: string,
    data: {
      firstName: string;
      amount: string;
      planName: string;
      paymentDate: string;
      nextBillingDate: string;
      paymentMethod: string;
      dashboardUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('payment-success');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Payment Received - Beauty N Brushes', html);
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(
    email: string,
    data: {
      firstName: string;
      amount: string;
      retryDate: string;
      updatePaymentUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('payment-failed');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, '⚠️ Payment Failed - Action Required', html);
  }

  /**
   * Send trial ending reminder
   */
  async sendTrialEndingEmail(
    email: string,
    data: {
      firstName: string;
      trialEndDate: string;
      billingStartDate: string;
      monthlyFee: string;
      paymentMethod: string;
      manageSubscriptionUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('trial-ending');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Your Trial Ends Soon - Beauty N Brushes', html);
  }

  /**
   * Send subscription cancelled email
   */
  async sendSubscriptionCancelledEmail(
    email: string,
    data: {
      firstName: string;
      accessEndDate: string;
      reactivateUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('subscription-cancelled');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Subscription Cancelled - Beauty N Brushes', html);
  }

  /**
   * Send test email
   */
  async sendTestEmail(email: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email - Beauty N Brushes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #B06F64; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .success { color: #28a745; font-weight: bold; }
          .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email Test Successful!</h1>
            <p>Beauty N Brushes Email System</p>
          </div>
          <div class="content">
            <h2>Hello! 👋</h2>
            <p>This is a test email from your Beauty N Brushes application.</p>
            
            <div class="info">
              <h3>✅ Email Configuration Status:</h3>
              <ul>
                <li><strong>SendGrid API:</strong> Connected</li>
                <li><strong>Domain Authentication:</strong> Verified</li>
                <li><strong>From Address:</strong> noreply@beautynbrushesapp.com</li>
                <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p>Your email system is working perfectly! You can now send:</p>
            <ul>
              <li>Welcome emails</li>
              <li>Booking confirmations</li>
              <li>Password reset emails</li>
              <li>Payment notifications</li>
              <li>And much more!</li>
            </ul>
            
            <p class="success">🚀 Ready to launch your beauty business!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              This email was sent from Beauty N Brushes<br>
              Domain: beautynbrushesapp.com | Powered by SendGrid
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, '✅ Beauty N Brushes - Email Test Successful!', html);
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(params: {
    to: string;
    salonName: string;
    role: string;
    invitationId: string;
  }): Promise<void> {
    const acceptUrl = `${env.FRONTEND_URL}/team/accept-invitation/${params.invitationId}`;

    const template = await this.loadTemplate('team-invitation');
    const html = this.replaceVariables(template, {
      salonName: params.salonName,
      role: params.role.charAt(0).toUpperCase() + params.role.slice(1),
      acceptUrl,
    });

    await this.sendEmail(params.to, `You've Been Invited to Join ${params.salonName}`, html);
  }
}

export const emailService = new EmailTemplateService();

/**
 * Standalone function for backward compatibility
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<void> {
  await emailService.sendVerificationEmail(email, firstName, verificationToken);
}
