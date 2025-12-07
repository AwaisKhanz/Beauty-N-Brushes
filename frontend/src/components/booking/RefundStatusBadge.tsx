'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface RefundStatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
}

export function RefundStatusBadge({ status }: RefundStatusBadgeProps) {
  const config = {
    PENDING: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      label: 'Pending',
    },
    PROCESSING: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock,
      label: 'Processing',
    },
    SUCCEEDED: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: 'Completed',
    },
    FAILED: {
      color: 'bg-red-100 text-red-800 border-red-200',
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
