'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Clock,
  Calendar as CalendarIcon,
  Copy,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type {
  DaySchedule,
  BlockedDate,
  CreateBlockedDateRequest,
} from '@/shared-types/calendar.types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Weekly Schedule
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(24);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [sameDayBooking, setSameDayBooking] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);

  // Blocked Dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [showAddBlockedDate, setShowAddBlockedDate] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState<CreateBlockedDateRequest>({
    startDate: '',
    endDate: '',
    reason: '',
    allDay: true,
  });

  useEffect(() => {
    fetchCalendarData();
  }, []);

  async function fetchCalendarData() {
    try {
      setLoading(true);
      setError('');

      const [availabilityResponse, blockedDatesResponse] = await Promise.all([
        api.calendar.getAvailability(),
        api.calendar.getBlockedDates(),
      ]);

      // Set availability data
      const { schedule: fetchedSchedule, settings } = availabilityResponse.data;

      // Ensure all 7 days are present
      const fullSchedule = DAY_NAMES.map((_, index) => {
        const existing = fetchedSchedule.find((s) => s.dayOfWeek === index);
        return (
          existing || {
            dayOfWeek: index,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: index !== 0, // Sunday default to closed
          }
        );
      });

      setSchedule(fullSchedule);
      setTimezone(settings.timezone);
      setAdvanceBookingDays(settings.advanceBookingDays);
      setMinimumNoticeHours(settings.minimumNoticeHours);
      setBufferMinutes(settings.bufferMinutes);
      setSameDayBooking(settings.sameDayBooking);

      // Set blocked dates
      setBlockedDates(blockedDatesResponse.data.blockedDates);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: string | boolean) => {
    const updated = [...schedule];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setSchedule(updated);
  };

  const copySchedule = (sourceDayIndex: number) => {
    setCopyFromDay(sourceDayIndex);
    toast.success('Schedule copied', {
      description: 'Click "Paste" on another day to apply',
    });
  };

  const applyToDay = (targetDayIndex: number) => {
    if (copyFromDay === null) return;

    const sourceDay = schedule[copyFromDay];
    updateDay(targetDayIndex, 'startTime', sourceDay.startTime);
    updateDay(targetDayIndex, 'endTime', sourceDay.endTime);
    updateDay(targetDayIndex, 'isAvailable', sourceDay.isAvailable);

    toast.success('Schedule pasted');
    setCopyFromDay(null);
  };

  const validateSchedule = (): string | null => {
    const availableDays = schedule.filter((day) => day.isAvailable);

    if (availableDays.length === 0) {
      return 'You must have at least one available day';
    }

    for (const day of availableDays) {
      if (!day.startTime || !day.endTime) {
        return `Please set times for ${DAY_NAMES[day.dayOfWeek]}`;
      }

      if (day.startTime >= day.endTime) {
        return `Start time must be before end time for ${DAY_NAMES[day.dayOfWeek]}`;
      }
    }

    return null;
  };

  async function saveAvailability() {
    const validationError = validateSchedule();
    if (validationError) {
      toast.error('Validation Error', {
        description: validationError,
      });
      return;
    }

    try {
      setSaving(true);

      await api.calendar.updateAvailability({
        schedule,
        timezone,
        advanceBookingDays,
        minimumNoticeHours,
        bufferMinutes,
        sameDayBooking,
      });

      toast.success('Availability updated', {
        description: 'Your schedule has been saved successfully',
      });
    } catch (error: unknown) {
      toast.error('Failed to save availability', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  }

  async function addBlockedDate() {
    if (!newBlockedDate.startDate || !newBlockedDate.endDate) {
      toast.error('Dates required', {
        description: 'Please select start and end dates',
      });
      return;
    }

    try {
      const response = await api.calendar.createBlockedDate(newBlockedDate);

      setBlockedDates([...blockedDates, response.data.blockedDate]);
      setNewBlockedDate({
        startDate: '',
        endDate: '',
        reason: '',
        allDay: true,
      });
      setShowAddBlockedDate(false);

      toast.success('Time off added', {
        description: 'Blocked dates saved successfully',
      });
    } catch (error: unknown) {
      toast.error('Failed to add time off', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    }
  }

  async function removeBlockedDate(id: string) {
    try {
      await api.calendar.deleteBlockedDate(id);

      setBlockedDates(blockedDates.filter((b) => b.id !== id));

      toast.success('Time off removed');
    } catch (error: unknown) {
      toast.error('Failed to remove time off', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    }
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">Calendar & Availability</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={fetchCalendarData} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Calendar & Availability</h1>
          <p className="text-muted-foreground">Manage your working hours and blocked dates</p>
        </div>
        <Button onClick={saveAvailability} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="blocked">Blocked Dates</TabsTrigger>
        </TabsList>

        {/* Weekly Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Set your regular working hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.map((day, index) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    copyFromDay === index ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Switch
                      checked={day.isAvailable}
                      onCheckedChange={(checked) => updateDay(index, 'isAvailable', checked)}
                    />
                    <Label className="font-medium cursor-pointer">{DAY_NAMES[day.dayOfWeek]}</Label>
                  </div>

                  {day.isAvailable ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDay(index, 'startTime', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(index, 'endTime', e.target.value)}
                        className="w-32"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copySchedule(index)}
                        title="Copy this schedule"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {copyFromDay !== null && copyFromDay !== index && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyToDay(index)}
                        >
                          Paste
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-muted-foreground">Closed</div>
                  )}
                </div>
              ))}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  💡 Click the copy icon next to a day to copy its schedule to other days
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Settings
              </CardTitle>
              <CardDescription>Configure how clients can book with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advance-booking">Advance Booking Window (days)</Label>
                  <Input
                    id="advance-booking"
                    type="number"
                    min="1"
                    max="90"
                    value={advanceBookingDays}
                    onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many days in advance can clients book?
                  </p>
                </div>

                <div>
                  <Label htmlFor="minimum-notice">Minimum Notice Required (hours)</Label>
                  <Input
                    id="minimum-notice"
                    type="number"
                    min="1"
                    max="168"
                    value={minimumNoticeHours}
                    onChange={(e) => setMinimumNoticeHours(Number(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum time before appointment starts
                  </p>
                </div>

                <div>
                  <Label htmlFor="buffer-time">Buffer Between Appointments (minutes)</Label>
                  <Input
                    id="buffer-time"
                    type="number"
                    min="0"
                    max="60"
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(Number(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time between back-to-back appointments
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="same-day-booking" className="font-medium cursor-pointer">
                      Same-Day Booking
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Allow clients to book on the same day
                    </p>
                  </div>
                  <Switch
                    id="same-day-booking"
                    checked={sameDayBooking}
                    onCheckedChange={setSameDayBooking}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Availability Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Available Days:</strong> {schedule.filter((d) => d.isAvailable).length}{' '}
                  days per week
                </p>
                <p>
                  <strong>Booking Window:</strong> Up to {advanceBookingDays} days in advance
                </p>
                <p>
                  <strong>Minimum Notice:</strong> {minimumNoticeHours} hours
                </p>
                {bufferMinutes > 0 && (
                  <p>
                    <strong>Buffer Time:</strong> {bufferMinutes} minutes between appointments
                  </p>
                )}
                <p>
                  <strong>Timezone:</strong> {timezone}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Dates Tab */}
        <TabsContent value="blocked" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Blocked Dates & Time Off
                  </CardTitle>
                  <CardDescription>
                    Block off specific dates when you're unavailable (vacation, personal time, etc.)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBlockedDate(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Time Off
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Blocked Date Form */}
              {showAddBlockedDate && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base">Block New Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={newBlockedDate.startDate}
                          onChange={(e) =>
                            setNewBlockedDate({ ...newBlockedDate, startDate: e.target.value })
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={newBlockedDate.endDate}
                          onChange={(e) =>
                            setNewBlockedDate({ ...newBlockedDate, endDate: e.target.value })
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reason">Reason (Optional)</Label>
                      <Input
                        id="reason"
                        placeholder="e.g., Vacation, Personal time"
                        value={newBlockedDate.reason}
                        onChange={(e) =>
                          setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })
                        }
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="all-day"
                        checked={newBlockedDate.allDay}
                        onCheckedChange={(checked) =>
                          setNewBlockedDate({ ...newBlockedDate, allDay: checked })
                        }
                      />
                      <Label htmlFor="all-day" className="cursor-pointer">
                        All Day
                      </Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddBlockedDate(false);
                          setNewBlockedDate({
                            startDate: '',
                            endDate: '',
                            reason: '',
                            allDay: true,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={addBlockedDate}>
                        Add Time Off
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blocked Dates List */}
              {blockedDates.length > 0 ? (
                <div className="space-y-3">
                  {blockedDates.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {new Date(blocked.startDate).toLocaleDateString()} -{' '}
                            {new Date(blocked.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {blocked.reason && (
                          <p className="text-sm text-muted-foreground mt-1">{blocked.reason}</p>
                        )}
                        {!blocked.allDay && blocked.startTime && blocked.endTime && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {blocked.startTime} - {blocked.endTime}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlockedDate(blocked.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No blocked dates</p>
                  <p className="text-sm text-muted-foreground">
                    Block dates when you're unavailable (vacation, personal time, etc.)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Skeleton className="h-12 w-full" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
