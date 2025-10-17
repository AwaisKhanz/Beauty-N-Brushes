'use client';

import { useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Search,
  Phone,
  Mail,
} from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - replace with real data from API
  const bookings = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah@email.com',
      clientPhone: '(555) 123-4567',
      service: 'Hair Color & Cut',
      date: '2025-01-20',
      time: '14:00',
      duration: 120,
      status: 'confirmed' as BookingStatus,
      totalAmount: 150,
      depositPaid: 75,
      balanceOwed: 75,
      location: 'In-studio',
      specialRequests: 'Would like to go a bit lighter than last time',
      inspirationPhotos: 2,
      bookingDate: '2025-01-15',
      paymentStatus: 'deposit_paid',
    },
    {
      id: '2',
      clientName: 'Maria Garcia',
      clientEmail: 'maria@email.com',
      clientPhone: '(555) 234-5678',
      service: 'Bridal Makeup',
      date: '2025-01-22',
      time: '10:00',
      duration: 90,
      status: 'pending' as BookingStatus,
      totalAmount: 200,
      depositPaid: 100,
      balanceOwed: 100,
      location: 'Client location - Hotel Downtown',
      specialRequests: 'Natural look with subtle shimmer',
      inspirationPhotos: 3,
      bookingDate: '2025-01-16',
      paymentStatus: 'deposit_paid',
    },
    {
      id: '3',
      clientName: 'Emma Davis',
      clientEmail: 'emma@email.com',
      clientPhone: '(555) 345-6789',
      service: 'Nail Art',
      date: '2025-01-25',
      time: '15:30',
      duration: 60,
      status: 'confirmed' as BookingStatus,
      totalAmount: 75,
      depositPaid: 37.5,
      balanceOwed: 37.5,
      location: 'In-studio',
      specialRequests: 'Floral design with pastel colors',
      inspirationPhotos: 1,
      bookingDate: '2025-01-18',
      paymentStatus: 'deposit_paid',
    },
    {
      id: '4',
      clientName: 'Jessica Brown',
      clientEmail: 'jessica@email.com',
      clientPhone: '(555) 456-7890',
      service: 'Hair Styling',
      date: '2025-01-18',
      time: '16:00',
      duration: 90,
      status: 'completed' as BookingStatus,
      totalAmount: 120,
      depositPaid: 60,
      balanceOwed: 0,
      location: 'In-studio',
      specialRequests: '',
      inspirationPhotos: 0,
      bookingDate: '2025-01-10',
      paymentStatus: 'fully_paid',
    },
  ];

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      case 'no_show':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
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

  const filteredBookings = bookings.filter(
    (booking) => statusFilter === 'all' || booking.status === statusFilter
  );

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    pendingRevenue: bookings
      .filter((b) => ['pending', 'confirmed'].includes(b.status))
      .reduce((sum, b) => sum + b.balanceOwed, 0),
  };

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
                      <div className="font-medium">{booking.clientName}</div>
                      <div className="text-sm text-muted-foreground">{booking.clientEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.duration}min • ${booking.totalAmount}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">{booking.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant={getPaymentStatusColor(booking.paymentStatus)}>
                        {booking.paymentStatus.replace('_', ' ')}
                      </Badge>
                      {booking.balanceOwed > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${booking.balanceOwed} owed
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {booking.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          Call Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Email Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {booking.status === 'pending' && (
                          <>
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <XCircle className="mr-2 h-4 w-4" />
                              Decline Booking
                            </DropdownMenuItem>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
