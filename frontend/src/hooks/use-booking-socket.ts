/**
 * useBookingSocket Hook
 * Handles real-time booking updates via Socket.IO
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BookingSocketData {
  type: string;
  booking: {
    id: string;
    [key: string]: any;
  };
  timestamp?: string;
}

export function useBookingSocket() {
  const { socket } = useSocket();
  const { toast } = useToast();
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
    toast({
      title: 'New Booking Request',
      description: `${data.booking.clientName} booked ${data.booking.serviceName}`,
      variant: 'default',
    });
    invalidateBookings();
  }, [toast, invalidateBookings]);

  // Handle booking confirmed event
  const handleBookingConfirmed = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Booking Confirmed!',
      description: `Your booking with ${data.booking.providerName} is confirmed`,
      variant: 'default',
    });
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle booking cancelled event
  const handleBookingCancelled = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Booking Cancelled',
      description: `${data.booking.cancellerName} cancelled the booking`,
      variant: 'destructive',
    });
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle booking rescheduled event
  const handleBookingRescheduled = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Booking Rescheduled',
      description: `Booking moved to ${data.booking.newDate} at ${data.booking.newTime}`,
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle reschedule requested event
  const handleRescheduleRequested = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Reschedule Request',
      description: `${data.booking.providerName} requested to reschedule to ${data.booking.proposedDate}`,
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle reschedule approved event
  const handleRescheduleApproved = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Reschedule Approved',
      description: 'Client approved your reschedule request',
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle reschedule rejected event
  const handleRescheduleRejected = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Reschedule Rejected',
      description: 'Client rejected your reschedule request',
      variant: 'destructive',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle booking completed event
  const handleBookingCompleted = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Appointment Complete!',
      description: `How was your experience? Leave a review for ${data.booking.providerName}`,
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle no-show event
  const handleBookingNoShow = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Missed Appointment',
      description: `You were marked as no-show for your appointment on ${data.booking.appointmentDate}`,
      variant: 'destructive',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle team member assigned event
  const handleTeamMemberAssigned = useCallback((data: BookingSocketData) => {
    toast({
      title: 'Stylist Assigned',
      description: `${data.booking.stylistName} will be your stylist`,
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBookings();
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle booking assigned to you event (for team members)
  const handleBookingAssignedToYou = useCallback((data: BookingSocketData) => {
    toast({
      title: 'New Assignment',
      description: `You've been assigned to ${data.booking.clientName}'s booking`,
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBookings();
  }, [toast, invalidateBookings, invalidateBooking]);

  // Handle booking photo added event
  const handleBookingPhotoAdded = useCallback((data: BookingSocketData) => {
    toast({
      title: 'New Photo Added',
      description: `${data.booking.uploaderName} added a ${data.booking.photoType.toLowerCase()} photo`,
      variant: 'default',
    });

    // Invalidate bookings query
    invalidateBooking(data.booking.id);
  }, [toast, invalidateBookings, invalidateBooking]);

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
  ]);

  return {
    // Hook doesn't need to return anything
    // It just sets up listeners and handles events
  };
}
