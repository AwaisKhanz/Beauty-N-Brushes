/**
 * Paystack Test Credentials
 * Use these for testing Paystack integration in test mode
 * 
 * Documentation: https://paystack.com/docs/payments/test-payments
 */

export const PAYSTACK_TEST_CARDS = {
  // Successful - No validation (reusable)
  NO_VALIDATION: {
    number: '4084084084084081',
    cvv: '408',
    expiry_month: '10',
    expiry_year: '26',
    pin: null,
  },
  
  // PIN validation
  PIN_VALIDATION: {
    number: '5078507850785078',
    cvv: '081',
    expiry_month: '10',
    expiry_year: '26',
    pin: '1111',
  },
  
  // PIN + OTP validation
  PIN_OTP_VALIDATION: {
    number: '5060666666666666666',
    cvv: '123',
    expiry_month: '10',
    expiry_year: '26',
    pin: '1234',
    otp: '123456',
  },
  
  // Failed - Declined
  DECLINED: {
    number: '4084080000005408',
    cvv: '001',
    expiry_month: '10',
    expiry_year: '26',
  },
  
  // Failed - Insufficient funds
  INSUFFICIENT_FUNDS: {
    number: '4084080000670037',
    cvv: '787',
    expiry_month: '10',
    expiry_year: '26',
  },
} as const;

export const PAYSTACK_TEST_MOBILE_MONEY = {
  // MTN Ghana
  MTN_GHANA: {
    phone: '0551234987',
    provider: 'mtn',
    network: 'MTN',
  },
  
  // Vodafone Ghana
  VODAFONE_GHANA: {
    phone: '0201234567',
    provider: 'vod',
    network: 'Vodafone',
  },
  
  // AirtelTigo Ghana
  AIRTELTIGO_GHANA: {
    phone: '0271234567',
    provider: 'atl',
    network: 'AirtelTigo',
  },
  
  // M-PESA Kenya (if needed)
  MPESA_KENYA: {
    phone: '+254710000000',
    provider: 'mpesa',
    network: 'M-Pesa',
  },
} as const;

export const PAYSTACK_TEST_BANK_ACCOUNTS = {
  // Zenith Bank (Nigeria)
  ZENITH_BANK: {
    account_number: '0000000000',
    bank_code: '057',
    bank_name: 'Zenith Bank',
    birthday: '1999-04-20',
    otp: '123456',
  },
  
  // Kuda Bank (Nigeria)
  KUDA_BANK: {
    phone: '+2348100000000',
    bank_code: '50211',
    bank_name: 'Kuda Bank',
    token: '123456',
  },
} as const;

/**
 * Test OTP for Paystack transactions
 * Use this when prompted for OTP during test mode
 */
export const PAYSTACK_TEST_OTP = '123456';

/**
 * Test PIN for Paystack card transactions
 * Use this when prompted for PIN during test mode
 */
export const PAYSTACK_TEST_PIN = '1111';

/**
 * Paystack IP addresses for webhook whitelisting
 * These are the only IPs that Paystack will send webhooks from
 */
export const PAYSTACK_WEBHOOK_IPS = [
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220',
] as const;
