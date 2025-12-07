'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefundStatusBadge } from './RefundStatusBadge';
import { Clock, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  reason: string;
  createdAt: string;
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
  stripeRefundId?: string;
  paystackRefundId?: string;
}

interface RefundCardProps {
  refund: Refund;
}

export function RefundCard({ refund }: RefundCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Refund Status</CardTitle>
          <RefundStatusBadge status={refund.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Refund Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Amount</span>
          </div>
          <span className="font-semibold">
            {refund.currency} {refund.amount.toFixed(2)}
          </span>
        </div>

        {/* Initiated Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Initiated</span>
          </div>
          <span className="text-sm">
            {format(new Date(refund.createdAt), 'MMM dd, yyyy')}
          </span>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Reason</div>
          <div className="text-sm">{refund.reason}</div>
        </div>

        {/* Status-specific alerts */}
        {refund.status === 'PROCESSING' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Refund is being processed. Funds typically appear in your account within{' '}
              <strong>5-10 business days</strong>.
            </AlertDescription>
          </Alert>
        )}

        {refund.status === 'SUCCEEDED' && refund.processedAt && (
          <Alert className="border-green-200 bg-green-50">
            <Clock className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Refund completed on {format(new Date(refund.processedAt), 'MMM dd, yyyy')}. 
              Funds should appear in your account within 5-10 business days.
            </AlertDescription>
          </Alert>
        )}

        {refund.status === 'FAILED' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Refund failed:</strong> {refund.failureReason || 'Unknown error'}
              <br />
              Our team has been notified and will resolve this within 24 hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Refund ID for tracking */}
        {(refund.stripeRefundId || refund.paystackRefundId) && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Refund ID: {refund.stripeRefundId || refund.paystackRefundId}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
