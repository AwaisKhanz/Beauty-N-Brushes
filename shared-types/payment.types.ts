/**
 * Payment API types
 */

export interface InitializePaystackRequest {
  email: string;
  amount: number;
  currency: string;
  subscriptionTier: 'solo' | 'salon';
  regionCode: string;
}

export interface InitializePaystackResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaystackResponse {
  status: string;
  amount: number;
  currency: string;
  authorizationCode: string;
  customer: {
    email: string;
  };
}
