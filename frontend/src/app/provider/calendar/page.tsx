'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Clock,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
} from 'lucide-react';

export default function CalendarPage() {
  // Mock data - replace with real data from API
  const weeklySchedule = [
    { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Saturday', startTime: '10:00', endTime: '15:00', isAvailable: true },
    { day: 'Sunday', startTime: '', endTime: '', isAvailable: false },
  ];

  const upcomingBookings = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      service: 'Hair Color & Cut',
      date: '2025-01-20',
      time: '14:00',
      duration: 120,
      status: 'confirmed',
      location: 'In-studio',
    },
    {
      id: '2',
      clientName: 'Maria Garcia',
      service: 'Bridal Makeup',
      date: '2025-01-22',
      time: '10:00',
      duration: 90,
      status: 'pending',
      location: 'Client location',
    },
    {
      id: '3',
      clientName: 'Emma Davis',
      service: 'Nail Art',
      date: '2025-01-25',
      time: '15:30',
      duration: 60,
      status: 'confirmed',
      location: 'In-studio',
    },
  ];

  const blockedDates = [
    { date: '2025-01-30', reason: 'Vacation' },
    { date: '2025-02-14', reason: 'Personal appointment' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your availability and view upcoming bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Block Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Set your regular working hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklySchedule.map((day) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch checked={day.isAvailable} onCheckedChange={() => {}} />
                      <Label className="font-medium min-w-[80px]">{day.day}</Label>
                    </div>
                    {day.isAvailable && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{day.startTime}</span>
                        <span>-</span>
                        <span>{day.endTime}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Edit Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>Configure how clients can book with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Advance Booking Window</Label>
                <Select defaultValue="7">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Minimum Notice</Label>
                <Select defaultValue="24">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Buffer Time Between Appointments</Label>
                <Select defaultValue="15">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Sync with your existing calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      Sync appointments with Google Calendar
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar Navigation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>January 2025</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Today
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar grid would go here */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {/* Calendar days would be rendered here */}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{booking.clientName}</h4>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{booking.service}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(booking.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.time} ({booking.duration}min)
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.location}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blocked Dates */}
          {blockedDates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Blocked Dates</CardTitle>
                <CardDescription>Dates when you're unavailable</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedDates.map((block, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(block.date).toLocaleDateString()}</TableCell>
                        <TableCell>{block.reason}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
