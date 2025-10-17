import sgMail from '@sendgrid/mail';
import fs from 'fs/promises';
import path from 'path';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@beautynbrushes.com';
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email/${verificationToken}`;

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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

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
