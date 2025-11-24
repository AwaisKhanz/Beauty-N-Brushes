'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Search,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookingsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError('');
      const response = await api.bookings.getAll();
      setBookings(response.data.bookings);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }


  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled_by_client':
      case 'cancelled_by_provider':
        return 'destructive';
      case 'completed':
        return 'outline';
      case 'no_show':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'deposit_paid':
        return 'secondary';
      case 'fully_paid':
        return 'default';
      case 'pending':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return booking.bookingStatus === 'pending';
    if (statusFilter === 'confirmed') return booking.bookingStatus === 'confirmed';
    if (statusFilter === 'completed') return booking.bookingStatus === 'completed';
    if (statusFilter === 'cancelled')
      return ['cancelled_by_client', 'cancelled_by_provider'].includes(booking.bookingStatus);
    return true;
  });

  const calculateBalanceOwed = (booking: BookingDetails) => {
    return booking.servicePrice - booking.depositAmount;
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.bookingStatus === 'pending').length,
    confirmed: bookings.filter((b) => b.bookingStatus === 'confirmed').length,
    completed: bookings.filter((b) => b.bookingStatus === 'completed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    pendingRevenue: bookings
      .filter((b) => ['pending', 'confirmed'].includes(b.bookingStatus))
      .reduce((sum, b) => sum + calculateBalanceOwed(b), 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">Bookings</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage your appointments and client bookings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-lg">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <span className="text-lg">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingRevenue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage your client appointments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search bookings..." className="pl-8 w-64" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {booking.client
                          ? `${booking.client.firstName} ${booking.client.lastName}`
                          : 'Unknown Client'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.client?.email || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.service?.title || 'Service'}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.service?.durationMinutes || 0}min • {booking.currency}{' '}
                        {booking.totalAmount}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(booking.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">{booking.appointmentTime}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(booking.bookingStatus)}>
                      {booking.bookingStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant={getPaymentStatusColor(booking.paymentStatus)}>
                        {booking.paymentStatus.replace(/_/g, ' ')}
                      </Badge>
                      {calculateBalanceOwed(booking) > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {booking.currency} {calculateBalanceOwed(booking).toFixed(2)} owed
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {booking.provider
                        ? `${booking.provider.city}, ${booking.provider.state}`
                        : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/provider/bookings/${booking.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all'
                  ? "You don't have any bookings yet"
                  : `No bookings with status: ${statusFilter}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
