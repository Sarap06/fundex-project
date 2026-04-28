'use client';

import { X, Calendar, DollarSign, CheckCircle2, Circle, FileText, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Investment {
  id: string;
  dealName: string;
  investedAmount: number;
  status: string;
  monthlyInterest: number;
  paymentsCompleted: number;
  totalPayments: number;
  nextPaymentDate: string;
  totalReturn: number;
  annualRate: number;
  startDate: string;
  maturityDate: string;
}

interface InvestmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
}

export function InvestmentDetailModal({ isOpen, onClose, investment }: InvestmentDetailModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const paymentTimeline = Array.from({ length: investment.totalPayments }, (_, i) => {
    const isPaid = i < investment.paymentsCompleted;
    const startDate = new Date(investment.startDate);
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    return {
      paymentNumber: i + 1,
      date: paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: investment.monthlyInterest,
      status: isPaid ? 'Paid' as const : 'Upcoming' as const,
    };
  });

  const dealMessages = [
    { id: 'DM-001', subject: 'Payment Processed', message: `Your monthly interest payment of ${formatCurrency(investment.monthlyInterest)} has been sent to your account.`, date: 'Jul 1, 2026', time: '9:30 AM' },
    { id: 'DM-002', subject: 'Investment Confirmed', message: `Your investment of ${formatCurrency(investment.investedAmount)} in ${investment.dealName} has been confirmed.`, date: investment.startDate, time: '2:15 PM' },
  ];

  const dealDocuments = [
    { id: 'DD-001', name: `Subscription Agreement - ${investment.dealName}`, uploadDate: investment.startDate },
    { id: 'DD-002', name: `${investment.dealName} - Deal Summary`, uploadDate: investment.startDate },
    { id: 'DD-003', name: `${investment.dealName} - Payment Schedule`, uploadDate: investment.startDate },
  ];

  const totalInterestToDate = investment.monthlyInterest * investment.paymentsCompleted;
  const remainingPayments = investment.totalPayments - investment.paymentsCompleted;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-8 py-6 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">{investment.dealName}</h2>
            <p className="text-sm text-neutral-600 mt-1">Investment Details</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-8 space-y-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-[#005F02] to-emerald-700 text-white">
              <CardContent className="p-6">
                <p className="text-sm opacity-90 mb-2">Invested Amount</p>
                <p className="text-3xl font-bold">{formatCurrency(investment.investedAmount)}</p>
                <Badge className="mt-3 bg-white/20 text-white border-0">{investment.annualRate}% APR</Badge>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-neutral-600 mb-2">Monthly Interest</p>
                <p className="text-3xl font-bold text-neutral-900">{formatCurrency(investment.monthlyInterest)}</p>
                <p className="text-xs text-neutral-500 mt-2">Paid on the 1st of each month</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-neutral-600 mb-2">Total Return</p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(investment.totalReturn)}</p>
                <p className="text-xs text-neutral-500 mt-2">Expected at maturity</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Financial Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Start Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-neutral-500" />
                    <p className="font-semibold text-neutral-900">{investment.startDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Maturity Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-neutral-500" />
                    <p className="font-semibold text-neutral-900">{investment.maturityDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Payments Completed</p>
                  <p className="text-2xl font-bold text-[#005F02]">{investment.paymentsCompleted} / {investment.totalPayments}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Remaining Payments</p>
                  <p className="text-2xl font-bold text-neutral-900">{remainingPayments}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-neutral-200">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Interest Earned to Date</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totalInterestToDate)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-1">Remaining Interest</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(investment.totalReturn - totalInterestToDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Timeline */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Payment Timeline</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {paymentTimeline.map((payment) => (
                  <div
                    key={payment.paymentNumber}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      payment.status === 'Paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {payment.status === 'Paid' ? (
                        <CheckCircle2 className="size-5 text-emerald-600" />
                      ) : (
                        <Circle className="size-5 text-neutral-400" />
                      )}
                      <div>
                        <p className="font-semibold text-neutral-900">Payment #{payment.paymentNumber}</p>
                        <p className="text-sm text-neutral-600">{payment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-bold text-lg ${payment.status === 'Paid' ? 'text-emerald-600' : 'text-neutral-900'}`}>
                        {formatCurrency(payment.amount)}
                      </p>
                      <Badge className={payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Two Column: Messages + Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-6">Deal Updates</h3>
                <div className="space-y-4">
                  {dealMessages.map((message) => (
                    <div key={message.id} className="p-4 border border-neutral-200 rounded-lg hover:border-[#005F02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#005F02]/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="size-5 text-[#005F02]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900 mb-1">{message.subject}</p>
                          <p className="text-sm text-neutral-700">{message.message}</p>
                          <p className="text-xs text-neutral-500 mt-2">{message.date} &bull; {message.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-6">Related Documents</h3>
                <div className="space-y-3">
                  {dealDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-[#005F02] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileText className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 text-sm">{doc.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Uploaded {doc.uploadDate}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-8 py-4 flex items-center justify-end rounded-b-xl">
          <Button onClick={onClose} className="bg-[#005F02] hover:bg-[#005F02]/90 px-8">Close</Button>
        </div>
      </div>
    </div>
  );
}
