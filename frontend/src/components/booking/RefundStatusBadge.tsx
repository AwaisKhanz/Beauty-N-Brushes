'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface RefundStatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
}

export function RefundStatusBadge({ status }: RefundStatusBadgeProps) {
  const config = {
    PENDING: {
      color: 'bg-warning/10 text-warning border-warning/30',
      icon: Clock,
      label: 'Pending',
    },
    PROCESSING: {
      color: 'bg-info/10 text-info border-info/30',
      icon: Clock,
      label: 'Processing',
    },
    SUCCEEDED: {
      color: 'bg-success/10 text-success border-success/30',
      icon: CheckCircle,
      label: 'Refunded',
    },
    FAILED: {
      color: 'bg-destructive/10 text-destructive border-destructive/30',
      icon: XCircle,
      label: 'Failed',
    },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <Badge className={`${color} gap-1.5 border`} variant="outline">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
