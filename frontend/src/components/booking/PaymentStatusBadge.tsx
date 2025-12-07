import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, DollarSign, RefreshCw } from 'lucide-react';
import type { PaymentStatus } from '@/shared-types/booking.types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  variant?: 'default' | 'compact';
  className?: string;
}

export function PaymentStatusBadge({ 
  status, 
  variant = 'default',
  className = '' 
}: PaymentStatusBadgeProps) {
  const config = {
    AWAITING_DEPOSIT: {
      label: 'Payment Pending',
      compactLabel: 'Pending',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertCircle,
    },
    DEPOSIT_PAID: {
      label: 'Deposit Paid',
      compactLabel: 'Deposit Paid',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: DollarSign,
    },
    FULLY_PAID: {
      label: 'Fully Paid',
      compactLabel: 'Paid',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
    },
    REFUNDED: {
      label: 'Refunded',
      compactLabel: 'Refunded',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: RefreshCw,
    },
    PARTIALLY_REFUNDED: {
      label: 'Partially Refunded',
      compactLabel: 'Part. Refunded',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: RefreshCw,
    },
  };

  const statusConfig = config[status];
  
  if (!statusConfig) {
    return null;
  }

  const { label, compactLabel, className: badgeClassName, icon: Icon } = statusConfig;
  const displayLabel = variant === 'compact' ? compactLabel : label;

  return (
    <Badge 
      variant="outline" 
      className={`${badgeClassName} ${className} flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {displayLabel}
    </Badge>
  );
}
