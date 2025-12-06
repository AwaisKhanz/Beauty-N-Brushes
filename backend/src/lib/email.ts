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
  /**
   * Send upcoming billing reminder
   */
  async sendUpcomingBillingEmail(
    email: string,
    data: {
      firstName: string;
      amount: string;
      billingDate: string;
      paymentMethod: string;
      manageSubscriptionUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('upcoming-billing');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Upcoming Charge - Beauty N Brushes', html);
  }

  /**
   * Send subscription paused email
   */
  async sendSubscriptionPausedEmail(
    email: string,
    data: {
      firstName: string;
      resumeDate: string;
      manageSubscriptionUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('subscription-paused');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Subscription Paused - Beauty N Brushes', html);
  }

  /**
   * Send subscription resumed email
   */
  async sendSubscriptionResumedEmail(
    email: string,
    data: {
      firstName: string;
      nextBillingDate: string;
      amount: string;
      manageSubscriptionUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('subscription-resumed');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Subscription Resumed - Beauty N Brushes', html);
  }

  /**
   * Send expiring card warning
   */
  async sendExpiringCardEmail(
    email: string,
    data: {
      firstName: string;
      cardBrand: string;
      last4: string;
      expiryDate: string;
      updatePaymentUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('expiring-card');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Action Required: Card Expiring Soon', html);
  }

  /**
   * Send booking confirmation email (client)
   */
  async sendBookingConfirmation(
    email: string,
    data: {
      bookingId: string;
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      duration: string;
      location: string;
      providerName: string;
      providerPhone: string;
      providerEmail: string;
      totalPrice: string;
      depositPaid: string;
      balanceDue: string;
      cancellationPolicy: string;
      bookingUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('booking-confirmation');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Booking Confirmed - Beauty N Brushes', html);
  }

  /**
   * Send 24-hour appointment reminder
   */
  async send24HourReminder(
    email: string,
    data: {
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      providerName: string;
      providerPhone: string;
      providerEmail: string;
      location: string;
      balanceDue: string;
      bookingUrl: string;
      directionsUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('booking-reminder-24h');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'Reminder: Appointment Tomorrow - Beauty N Brushes', html);
  }

  /**
   * Send review reminder email
   */
  async sendReviewReminder(
    email: string,
    data: {
      clientName: string;
      serviceName: string;
      appointmentDate: string;
      providerName: string;
      reviewUrl: string;
    }
  ): Promise<void> {
    const template = await this.loadTemplate('review-reminder');
    const html = this.replaceVariables(template, data);

    await this.sendEmail(email, 'How Was Your Experience? - Beauty N Brushes', html);
  }

  /**
   * Send payment reminder email (Phase 2)
   */
  async sendPaymentReminderEmail(
    email: string,
    clientName: string,
    booking: {
      id: string;
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      depositAmount: number;
      currency: string;
    }
  ): Promise<void> {
    const paymentLink = `${env.FRONTEND_URL}/client/bookings/${booking.id}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #B06F64; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #B06F64; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${clientName},</h2>
            <p>Your booking for <strong>${booking.serviceName}</strong> is not yet confirmed.</p>
            
            <div class="details">
              <p><strong>📅 Appointment:</strong> ${booking.appointmentDate} at ${booking.appointmentTime}</p>
              <p><strong>💰 Deposit Required:</strong> ${booking.currency} ${booking.depositAmount.toFixed(2)}</p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Important:</strong> Your booking will be automatically cancelled in approximately 22 hours if payment is not received.</p>
            </div>
            
            <p>Please complete your payment to secure your appointment:</p>
            
            <a href="${paymentLink}" class="button">Pay Deposit Now</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you have any questions, please contact us or the service provider directly.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, '⏰ Payment Reminder - Complete Your Booking', html);
  }

  /**
   * Send booking auto-cancelled email (Phase 2)
   */
  async sendBookingAutoCancelledEmail(
    email: string,
    clientName: string,
    booking: {
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
    }
  ): Promise<void> {
    const searchUrl = `${env.FRONTEND_URL}/search`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #B06F64; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Booking Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${clientName},</h2>
            <p>Your booking for <strong>${booking.serviceName}</strong> has been automatically cancelled due to non-payment.</p>
            
            <div class="details">
              <p><strong>📅 Appointment:</strong> ${booking.appointmentDate} at ${booking.appointmentTime}</p>
              <p><strong>Reason:</strong> Deposit payment not received within 24 hours</p>
            </div>
            
            <p>We understand that things happen! You can create a new booking anytime from our platform.</p>
            
            <a href="${searchUrl}" class="button">Browse Services</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you have any questions or concerns, please don't hesitate to contact us.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, '❌ Booking Cancelled - Payment Not Received', html);
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
