/**
 * useBookingSocket Hook
 * Handles real-time booking updates via Socket.IO
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface BookingSocketData {
  type: string;
  booking: {
    id: string;
    [key: string]: unknown;
  };
  timestamp?: string;
}

export function useBookingSocket() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Memoize invalidate function to prevent unnecessary re-renders
  const invalidateBookings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  }, [queryClient]);

  const invalidateBooking = useCallback((bookingId: string) => {
    queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
  }, [queryClient]);

  // Handle booking created event
  const handleBookingCreated = useCallback((data: BookingSocketData) => {
    toast.success('New Booking Request', {
      description: `${data.booking.clientName} booked ${data.booking.serviceName}`,
    });
    invalidateBookings();
  }, [invalidateBookings]);

  // Handle booking confirmed event
  const handleBookingConfirmed = useCallback((data: BookingSocketData) => {
    toast.success('Booking Confirmed!', {
      description: `Your booking with ${data.booking.providerName} is confirmed`,
    });
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle booking cancelled event
  const handleBookingCancelled = useCallback((data: BookingSocketData) => {
    toast.error('Booking Cancelled', {
      description: `${data.booking.cancellerName} cancelled the booking`,
    });
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle booking rescheduled event
  const handleBookingRescheduled = useCallback((data: BookingSocketData) => {
    toast.success('Booking Rescheduled', {
      description: `Booking moved to ${data.booking.newDate} at ${data.booking.newTime}`,
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle reschedule requested event
  const handleRescheduleRequested = useCallback((data: BookingSocketData) => {
    toast.info('Reschedule Request', {
      description: `${data.booking.providerName} requested to reschedule to ${data.booking.proposedDate}`,
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle reschedule approved event
  const handleRescheduleApproved = useCallback((data: BookingSocketData) => {
    toast.success('Reschedule Approved', {
      description: 'Client approved your reschedule request',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle reschedule rejected event
  const handleRescheduleRejected = useCallback((data: BookingSocketData) => {
    toast.error('Reschedule Rejected', {
      description: 'Client rejected your reschedule request',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle booking completed event
  const handleBookingCompleted = useCallback((data: BookingSocketData) => {
    toast.success('Appointment Complete!', {
      description: `How was your experience? Leave a review for ${data.booking.providerName}`,
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle no-show event
  const handleBookingNoShow = useCallback((data: BookingSocketData) => {
    toast.error('Missed Appointment', {
      description: `You were marked as no-show for your appointment on ${data.booking.appointmentDate}`,
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle team member assigned event
  const handleTeamMemberAssigned = useCallback((data: BookingSocketData) => {
    toast.success('Stylist Assigned', {
      description: `${data.booking.stylistName} will be your stylist`,
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [invalidateBookings, invalidateBooking]);

  // Handle booking assigned to you event (for team members)
  const handleBookingAssignedToYou = useCallback((data: BookingSocketData) => {
    toast.success('New Assignment', {
      description: `You've been assigned to ${data.booking.clientName}'s booking`,
    });

    // Invalidate bookings query
    invalidateBookings();
  }, [invalidateBookings]);

  // Handle booking photo added event
  const handleBookingPhotoAdded = useCallback((data: BookingSocketData) => {
    const photoType = (data.booking.photoType as string) || 'booking';
    toast.success('New Photo Added', {
      description: `${data.booking.uploaderName} added a ${photoType.toLowerCase()} photo`,
    });

    // Invalidate bookings query
    invalidateBooking(data.booking.id);
  }, [invalidateBooking]);

  // Handle booking updated event (for payment status changes from webhooks)
  const handleBookingUpdated = useCallback((data: { bookingId: string; paymentStatus?: string; bookingStatus?: string; paidAt?: Date }) => {
    console.log('📡 Received booking:updated event:', data);
    
    // Show toast for payment status changes
    if (data.paymentStatus === 'DEPOSIT_PAID') {
      toast.success('Payment Successful! ✅', {
        description: 'Your deposit payment has been confirmed',
      });
    } else if (data.paymentStatus === 'FULLY_PAID') {
      toast.success('Payment Complete! ✅', {
        description: 'Your booking is now fully paid',
      });
    }

    // Invalidate queries to refresh the UI
    invalidateBookings();
    invalidateBooking(data.bookingId);
  }, [invalidateBookings, invalidateBooking]);

  // Set up Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    // Register all event listeners
    socket.on('booking_created', handleBookingCreated);
    socket.on('booking_confirmed', handleBookingConfirmed);
    socket.on('booking_cancelled', handleBookingCancelled);
    socket.on('booking_rescheduled', handleBookingRescheduled);
    socket.on('reschedule_requested', handleRescheduleRequested);
    socket.on('reschedule_approved', handleRescheduleApproved);
    socket.on('reschedule_rejected', handleRescheduleRejected);
    socket.on('booking_completed', handleBookingCompleted);
    socket.on('booking_no_show', handleBookingNoShow);
    socket.on('team_member_assigned', handleTeamMemberAssigned);
    socket.on('booking_assigned_to_you', handleBookingAssignedToYou);
    socket.on('booking_photo_added', handleBookingPhotoAdded);
    socket.on('booking:updated', handleBookingUpdated); // ✅ Payment status updates from webhooks

    // Cleanup listeners on unmount
    return () => {
      socket.off('booking_created', handleBookingCreated);
      socket.off('booking_confirmed', handleBookingConfirmed);
      socket.off('booking_cancelled', handleBookingCancelled);
      socket.off('booking_rescheduled', handleBookingRescheduled);
      socket.off('reschedule_requested', handleRescheduleRequested);
      socket.off('reschedule_approved', handleRescheduleApproved);
      socket.off('reschedule_rejected', handleRescheduleRejected);
      socket.off('booking_completed', handleBookingCompleted);
      socket.off('booking_no_show', handleBookingNoShow);
      socket.off('team_member_assigned', handleTeamMemberAssigned);
      socket.off('booking_assigned_to_you', handleBookingAssignedToYou);
      socket.off('booking_photo_added', handleBookingPhotoAdded);
      socket.off('booking:updated', handleBookingUpdated); // ✅ Cleanup
    };
  }, [
    socket,
    handleBookingCreated,
    handleBookingConfirmed,
    handleBookingCancelled,
    handleBookingRescheduled,
    handleRescheduleRequested,
    handleRescheduleApproved,
    handleRescheduleRejected,
    handleBookingCompleted,
    handleBookingNoShow,
    handleTeamMemberAssigned,
    handleBookingAssignedToYou,
    handleBookingPhotoAdded,
    handleBookingUpdated, // ✅ Added
  ]);

  return {
    // Hook doesn't need to return anything
    // It just sets up listeners and handles events
  };
}
