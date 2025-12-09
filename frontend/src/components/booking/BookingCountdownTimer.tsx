'use client';

import { useEffect, useState, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: Date;
  type: 'deposit' | 'confirmation' | 'balance';
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(deadline: Date): TimeRemaining {
  const now = new Date();
  const total = deadline.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

function formatTimeRemaining(time: TimeRemaining): string {
  if (time.total <= 0) return 'Expired';

  const parts: string[] = [];
  if (time.days > 0) parts.push(`${time.days}d`);
  if (time.hours > 0) parts.push(`${time.hours}h`);
  if (time.minutes > 0) parts.push(`${time.minutes}m`);
  if (time.days === 0 && time.hours === 0) parts.push(`${time.seconds}s`);

  return parts.join(' ');
}

export function BookingCountdownTimer({ deadline, type, onExpired }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(deadline));
  const onExpiredRef = useRef(onExpired);

  // Update ref when onExpired changes
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && onExpiredRef.current) {
        onExpiredRef.current();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  // Determine urgency level
  const totalHours = timeRemaining.total / (1000 * 60 * 60);
  const isExpired = timeRemaining.total <= 0;
  const isUrgent = totalHours < 6 && totalHours > 0;
  const isWarning = totalHours < 12 && totalHours >= 6;

  // Don't show if expired
  if (isExpired) return null;

  // Get message based on type
  const getMessage = () => {
    switch (type) {
      case 'deposit':
        return 'Pay deposit within:';
      case 'confirmation':
        return 'Provider must confirm within:';
      case 'balance':
        return 'Pay balance within:';
    }
  };

  return (
    <Alert variant={isUrgent ? 'destructive' : 'default'} className={isWarning ? 'border-warning/30 bg-warning/10' : ''}>
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className={`h-4 w-4 ${isWarning ? 'text-warning' : ''}`} />
        )}
        <AlertDescription className={`flex items-center gap-2 ${isWarning ? 'text-warning' : ''}`}>
          <span>{getMessage()}</span>
          <Badge variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'outline'} className="font-mono">
            {formatTimeRemaining(timeRemaining)}
          </Badge>
        </AlertDescription>
      </div>
    </Alert>
  );
}

// Compact version for inline display
export function CompactCountdown({ deadline }: Omit<CountdownTimerProps, 'onExpired' | 'type'>) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const totalHours = timeRemaining.total / (1000 * 60 * 60);
  const isUrgent = totalHours < 6 && totalHours > 0;

  if (timeRemaining.total <= 0) return null;

  return (
    <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="font-mono">
      <Clock className="h-3 w-3 mr-1" />
      {formatTimeRemaining(timeRemaining)}
    </Badge>
  );
}
