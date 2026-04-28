'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModalShell } from './modal-shell';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  investorName?: string;
  payments?: { number: number; dueDate: string; amount: number; status: 'paid' | 'pending' | 'upcoming' | 'late' }[];
}

const DEFAULT_PAYMENTS = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  dueDate: new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  amount: 10416,
  status: (i < 6 ? 'paid' : i === 6 ? 'pending' : 'upcoming') as 'paid' | 'pending' | 'upcoming' | 'late',
}));

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <span className="inline-flex items-center gap-1 bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-medium text-fundex-forest"><CheckCircle className="h-3 w-3" /> Paid</span>;
    case 'pending':
      return <span className="inline-flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"><Clock className="h-3 w-3" /> Pending</span>;
    case 'late':
      return <span className="inline-flex items-center gap-1 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"><AlertCircle className="h-3 w-3" /> Late</span>;
    default:
      return <span className="inline-flex bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">Upcoming</span>;
  }
}

export function PaymentHistoryModal({ isOpen, onClose, dealName, investorName, payments }: PaymentHistoryModalProps) {
  const paymentList = payments || DEFAULT_PAYMENTS;
  const paid = paymentList.filter(p => p.status === 'paid').length;
  const remaining = paymentList.length - paid;
  const totalPaid = paymentList.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Payment History"
      subtitle={investorName ? `${dealName} — ${investorName}` : dealName}
      maxWidth="max-w-3xl"
      zIndex="z-[70]"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="border border-stone-100 p-3 text-center">
            <p className="text-xs text-stone-500">Total Scheduled</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{paymentList.length}</p>
          </div>
          <div className="border border-stone-100 p-3 text-center">
            <p className="text-xs text-stone-500">Completed</p>
            <p className="mt-1 text-lg font-semibold text-fundex-forest">{paid}</p>
          </div>
          <div className="border border-stone-100 p-3 text-center">
            <p className="text-xs text-stone-500">Remaining</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">{remaining}</p>
          </div>
          <div className="border border-stone-100 p-3 text-center">
            <p className="text-xs text-stone-500">Total Paid</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">${(totalPaid / 1000).toFixed(0)}K</p>
          </div>
        </div>

        {/* Payment List */}
        <div className="overflow-hidden border border-stone-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Payment #</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paymentList.map((p) => (
                <tr key={p.number} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-medium text-stone-900">#{p.number}</td>
                  <td className="px-4 py-3 tabular-nums text-stone-600">{p.dueDate}</td>
                  <td className="px-4 py-3 tabular-nums text-stone-900">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}
