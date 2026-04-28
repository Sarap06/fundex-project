'use client';

import { X, Calendar, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Payment {
  id: string;
  dealName: string;
  paymentType: 'Interest Payment' | 'Principal Return';
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  referenceId?: string;
  notes?: string;
}

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}

export function PaymentDetailModal({ isOpen, onClose, payment }: PaymentDetailModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-8 py-6 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Payment Details</h2>
            <p className="text-sm text-neutral-600 mt-1">{payment.dealName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-8 space-y-6">
          {/* Status Icon */}
          <div className="flex items-center justify-center">
            {payment.status === 'Completed' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
            ) : payment.status === 'Pending' ? (
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="size-8 text-amber-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="size-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Amount Card */}
          <Card className="bg-gradient-to-br from-[#005F02] to-emerald-700 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-sm opacity-90 mb-2">Payment Amount</p>
              <p className="text-4xl font-bold">{formatCurrency(payment.amount)}</p>
              <Badge className="mt-3 bg-white/20 text-white border-0">{payment.paymentType}</Badge>
            </CardContent>
          </Card>

          {/* Payment Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Deal Name</p>
              <p className="font-semibold text-neutral-900">{payment.dealName}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Payment Type</p>
              <p className="font-semibold text-neutral-900">{payment.paymentType}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-neutral-500" />
                <p className="font-semibold text-neutral-900">{payment.date}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Status</p>
              <Badge className={
                payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                payment.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }>
                {payment.status}
              </Badge>
            </div>
          </div>

          {/* Optional Fields */}
          {payment.referenceId && (
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600 mb-1">Reference ID</p>
              <p className="font-mono text-sm text-neutral-900">{payment.referenceId}</p>
            </div>
          )}

          {payment.notes && (
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600 mb-1">Notes</p>
              <p className="text-sm text-neutral-700">{payment.notes}</p>
            </div>
          )}

          {/* Payment Information */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Payment Information</p>
                <p className="text-xs text-blue-700">
                  {payment.paymentType === 'Interest Payment'
                    ? 'This is a recurring interest payment based on your investment terms. Interest payments are typically processed on the 1st of each month.'
                    : 'This is the return of your principal investment upon deal maturity. The full invested amount has been returned to your account.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-neutral-200 px-8 py-4 flex items-center justify-end rounded-b-xl">
          <Button onClick={onClose} className="bg-[#005F02] hover:bg-[#005F02]/90 px-8">Close</Button>
        </div>
      </div>
    </div>
  );
}
