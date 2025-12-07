import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface RefundUpdateData {
  type: string;
  refundId: string;
  bookingId: string;
  status: string;
  amount: number;
  currency: string;
}

/**
 * Hook to listen for real-time refund updates via Socket.IO
 * @param bookingId - The booking ID to listen for refund updates
 * @param onRefundUpdate - Callback function to execute when refund is updated
 */
export function useRefundSocket(bookingId: string, onRefundUpdate: () => void) {
  const { socket } = useSocket();

  const handleRefundUpdate = useCallback((data: RefundUpdateData) => {
    if (data.bookingId === bookingId) {
      console.log('🔄 Refund updated:', data);
      onRefundUpdate();
    }
  }, [bookingId, onRefundUpdate]);

  useEffect(() => {
    if (!socket) {
      console.log('⚠️  Socket not connected, refund updates disabled');
      return;
    }

    console.log(`👂 Listening for refund updates on booking: ${bookingId}`);
    socket.on('refund:updated', handleRefundUpdate);

    return () => {
      console.log(`👋 Stopped listening for refund updates on booking: ${bookingId}`);
      socket.off('refund:updated', handleRefundUpdate);
    };
  }, [socket, handleRefundUpdate, bookingId]);
}
