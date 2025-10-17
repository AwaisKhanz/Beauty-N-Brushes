'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock, Calendar, Copy, CheckCircle } from 'lucide-react';

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '15:00', isAvailable: true },
  { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '15:00', isAvailable: false },
];

interface Step8AvailabilityProps {
  onNext: (data: any) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step8Availability({ onNext, onBack, isLoading }: Step8AvailabilityProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(24);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [sameDayBooking, setSameDayBooking] = useState(false);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    const updated = [...schedule];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setSchedule(updated);
  };

  const copySchedule = (sourceDayIndex: number) => {
    setCopyFromDay(sourceDayIndex);
    setTimeout(() => setCopyFromDay(null), 1000);
  };

  const applyToDay = (targetDayIndex: number) => {
    if (copyFromDay === null) return;

    const sourceDay = schedule[copyFromDay];
    updateDay(targetDayIndex, 'startTime', sourceDay.startTime);
    updateDay(targetDayIndex, 'endTime', sourceDay.endTime);
    updateDay(targetDayIndex, 'isAvailable', sourceDay.isAvailable);
  };

  const validateSchedule = (): string | null => {
    const availableDays = schedule.filter((day) => day.isAvailable);

    if (availableDays.length === 0) {
      return 'You must have at least one available day';
    }

    for (const day of availableDays) {
      if (!day.startTime || !day.endTime) {
        return `Please set times for ${day.dayName}`;
      }

      if (day.startTime >= day.endTime) {
        return `Start time must be before end time for ${day.dayName}`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateSchedule();
    if (validationError) {
      toast.error('Validation Error', {
        description: validationError,
      });
      return;
    }

    // Convert to backend expected format: array with dayOfWeek numbers
    const scheduleArray = schedule.map((day) => ({
      dayOfWeek: day.dayOfWeek, // 0 = Sunday, 1 = Monday, etc.
      startTime: day.startTime,
      endTime: day.endTime,
      isAvailable: day.isAvailable,
    }));

    await onNext({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      schedule: scheduleArray,
      advanceBookingDays,
      minimumNoticeHours,
      bufferMinutes,
      sameDayBooking,
    });
  };

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Set Your Availability</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Define your working hours so clients can book appointments with you
        </p>
      </div>

      <div className="space-y-6 w-full">
        {/* Weekly Schedule */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
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
                  <Label className="font-medium cursor-pointer">{day.dayName}</Label>
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

            <div className="mt-4 p-3 bg-accent/10 text-accent-foreground rounded-lg border border-accent/20 text-sm">
              <p className="font-medium mb-1">💡 Quick Tip</p>
              <p>Click the copy icon next to a day to copy its schedule to other days</p>
            </div>
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
                <strong>Available Days:</strong> {schedule.filter((d) => d.isAvailable).length} days
                per week
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
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-6 w-full">
        <Button variant="outline" onClick={onBack} className="gap-2">
          Back
        </Button>

        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
          {isLoading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          You can always update your availability later from your calendar settings
        </p>
      </div>
    </div>
  );
}
