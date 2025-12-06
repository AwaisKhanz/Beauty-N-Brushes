/**
 * Paystack Checkout Component
 * Uses Paystack Popup JS (InlineJS v2) for payment completion
 * 
 * Documentation: https://paystack.com/docs/payments/accept-payments#popup
 */

'use client';

import { useEffect, useRef } from 'react';

// Paystack Popup types
interface PaystackPopup {
  resumeTransaction(accessCode: string): void;
  cancelTransaction(id: string): void;
}

interface PaystackTransaction {
  id: string;
  reference: string;
  status: string;
  message: string;
}

interface PaystackLoadResponse {
  id: string;
  accessCode: string;
  customer: {
    email: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

interface PaystackCheckoutProps {
  accessCode: string;
  _email: string;
  _amount: number;
  _currency: string;
  _onSuccess: (transaction: PaystackTransaction) => void;
  _onCancel?: () => void;
  onError?: (error: Error) => void;
  _onLoad?: (response: PaystackLoadResponse) => void;
  autoOpen?: boolean;
}

/**
 * Paystack Checkout Component
 * Handles Paystack payment flow using Popup JS
 */
export function PaystackCheckout({
  accessCode,
  // _email,
  // _amount,
  // _currency,
  // _onSuccess,
  // _onCancel,
  onError,
  // _onLoad,
  autoOpen = true,
}: PaystackCheckoutProps) {
  const popupRef = useRef<PaystackPopup | null>(null);
  // const _transactionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Paystack Popup script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    
    script.onload = () => {
      initializePaystack();
    };

    script.onerror = () => {
      onError?.(new Error('Failed to load Paystack script'));
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializePaystack = () => {
    try {
      // @ts-expect-error - Paystack is loaded from CDN
      const PaystackPop = window.PaystackPop;
      
      if (!PaystackPop) {
        throw new Error('Paystack library not loaded');
      }

      // Create Paystack instance
      const popup = new PaystackPop();
      popupRef.current = popup;

      // Resume transaction with access code
      if (autoOpen) {
        openPaystack();
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const openPaystack = () => {
    if (!popupRef.current) {
      onError?.(new Error('Paystack not initialized'));
      return;
    }

    try {
      // Use resumeTransaction method as per Paystack docs
      popupRef.current.resumeTransaction(accessCode);
      
      // Note: Paystack Popup handles callbacks internally
      // We need to listen for the transaction completion via webhook
      // or verify the transaction status after redirect
    } catch (error) {
      onError?.(error as Error);
    }
  };

  // This component doesn't render anything visible
  // The Paystack Popup is handled by the library
  return null;
}

/**
 * Hook to use Paystack Popup programmatically
 * Useful for custom payment flows
 */
export function usePaystackPopup() {
  const popupRef = useRef<PaystackPopup | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-expect-error - Paystack is loaded from CDN
      const PaystackPop = window.PaystackPop;
      if (PaystackPop) {
        popupRef.current = new PaystackPop();
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const resumeTransaction = (accessCode: string) => {
    if (!popupRef.current) {
      throw new Error('Paystack not initialized');
    }
    popupRef.current.resumeTransaction(accessCode);
  };

  const cancelTransaction = (id: string) => {
    if (!popupRef.current) {
      throw new Error('Paystack not initialized');
    }
    popupRef.current.cancelTransaction(id);
  };

  return {
    resumeTransaction,
    cancelTransaction,
    isReady: !!popupRef.current,
  };
}
