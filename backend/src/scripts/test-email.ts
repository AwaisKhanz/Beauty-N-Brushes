/**
 * Email Testing Utility
 * Run: npx ts-node src/scripts/test-email.ts
 */

import { emailService } from '../lib/email';

async function testEmails() {
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  console.log('🧪 Testing Email Service...\n');
  console.log(`Target Email: ${testEmail}\n`);

  try {
    // Test 1: Verification Email
    console.log('1️⃣  Testing Verification Email...');
    await emailService.sendVerificationEmail(testEmail, 'John', 'test-verification-token-123');
    console.log('✅ Verification email sent\n');

    // Test 2: Password Reset Email
    console.log('2️⃣  Testing Password Reset Email...');
    await emailService.sendPasswordResetEmail(testEmail, 'Jane', 'test-reset-token-456');
    console.log('✅ Password reset email sent\n');

    // Test 3: Welcome Email
    console.log('3️⃣  Testing Welcome Email...');
    await emailService.sendWelcomeEmail(testEmail, 'Sarah', {
      trialEndDate: 'December 15, 2025',
      bookingPageUrl: 'https://beautynbrushes.com/@sarahs-salon',
      dashboardUrl: 'https://beautynbrushes.com/dashboard',
    });
    console.log('✅ Welcome email sent\n');

    // Test 4: Booking Confirmation
    console.log('4️⃣  Testing Booking Confirmation Email...');
    await emailService.sendBookingConfirmationEmail(testEmail, {
      clientName: 'Emily',
      serviceName: 'Balayage Hair Color',
      providerName: "Sarah's Beauty Studio",
      appointmentDateTime: 'Saturday, December 20, 2025 at 2:00 PM',
      duration: '3 hours',
      location: '123 Main St, New York, NY 10001',
      totalAmount: '$250.00',
      cancellationPolicy: 'Free cancellation up to 48 hours before appointment.',
      bookingDetailsUrl: 'https://beautynbrushes.com/bookings/123',
    });
    console.log('✅ Booking confirmation email sent\n');

    // Test 5: Payment Success
    console.log('5️⃣  Testing Payment Success Email...');
    await emailService.sendPaymentSuccessEmail(testEmail, {
      firstName: 'Maria',
      amount: '$49.00',
      planName: 'Salon Plan',
      paymentDate: 'December 1, 2025',
      nextBillingDate: 'January 1, 2026',
      paymentMethod: '•••• •••• •••• 4242',
      dashboardUrl: 'https://beautynbrushes.com/dashboard',
    });
    console.log('✅ Payment success email sent\n');

    // Test 6: Payment Failed
    console.log('6️⃣  Testing Payment Failed Email...');
    await emailService.sendPaymentFailedEmail(testEmail, {
      firstName: 'Lisa',
      amount: '$19.00',
      retryDate: 'December 5, 2025',
      updatePaymentUrl: 'https://beautynbrushes.com/dashboard/subscription/payment-method',
    });
    console.log('✅ Payment failed email sent\n');

    // Test 7: Trial Ending
    console.log('7️⃣  Testing Trial Ending Email...');
    await emailService.sendTrialEndingEmail(testEmail, {
      firstName: 'Rachel',
      trialEndDate: 'December 10, 2025',
      billingStartDate: 'December 11, 2025',
      monthlyFee: '$19.00',
      paymentMethod: '•••• •••• •••• 5555',
      manageSubscriptionUrl: 'https://beautynbrushes.com/dashboard/subscription',
    });
    console.log('✅ Trial ending email sent\n');

    // Test 8: Subscription Cancelled
    console.log('8️⃣  Testing Subscription Cancelled Email...');
    await emailService.sendSubscriptionCancelledEmail(testEmail, {
      firstName: 'Nina',
      accessEndDate: 'January 15, 2026',
      reactivateUrl: 'https://beautynbrushes.com/dashboard/subscription',
    });
    console.log('✅ Subscription cancelled email sent\n');

    console.log('🎉 All email tests completed successfully!');
    console.log('\nNote: Check your inbox at', testEmail);
    console.log('If SendGrid is not configured, check console output instead.');
  } catch (error) {
    console.error('❌ Error testing emails:', error);
    process.exit(1);
  }
}

// Run tests
testEmails().then(() => process.exit(0));
