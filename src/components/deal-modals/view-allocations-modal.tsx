'use client';

import { Calendar, Edit, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModalShell } from './modal-shell';
import { PaymentHistoryModal } from './payment-history-modal';

interface Allocation {
  investorName: string;
  committedAmount: number;
  status: 'Confirmed' | 'Soft Commit';
  fundingStatus?: string;
  paymentsCompleted: number;
  totalPayments: number;
  nextPayment: string;
}

interface ViewAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  allocations?: Allocation[];
}

const DEFAULT_ALLOCATIONS: Allocation[] = [
  { investorName: 'Peterson Family Trust', committedAmount: 500000, status: 'Confirmed', paymentsCompleted: 8, totalPayments: 12, nextPayment: 'Aug 1, 2026' },
  { investorName: 'Riverside Capital Group', committedAmount: 350000, status: 'Confirmed', paymentsCompleted: 8, totalPayments: 12, nextPayment: 'Aug 1, 2026' },
  { investorName: 'Summit Investment Partners', committedAmount: 250000, status: 'Soft Commit', paymentsCompleted: 0, totalPayments: 12, nextPayment: 'TBD' },
];

function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function ViewAllocationsModal({ isOpen, onClose, dealName, allocations }: ViewAllocationsModalProps) {
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState('');

  const allocs = allocations || DEFAULT_ALLOCATIONS;
  const totalAllocated = allocs.reduce((s, a) => s + a.committedAmount, 0);

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Deal Allocations"
        subtitle={dealName}
        maxWidth="max-w-5xl"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Summary */}
          <div className="flex items-center justify-between border border-fundex-gold/20 bg-fundex-cream/20 p-4">
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-stone-500">Total Allocated</p>
                <p className="mt-1 text-lg font-semibold text-stone-900">{fmtM(totalAllocated)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Total Investors</p>
                <p className="mt-1 text-lg font-semibold text-stone-900">{allocs.length}</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2 text-sm">
              <UserPlus className="h-4 w-4" /> Add Investor
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-stone-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-3">Investor</th>
                  <th className="px-4 py-3">Committed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Funding</th>
                  <th className="px-4 py-3">Payments</th>
                  <th className="px-4 py-3">Next Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {allocs.map((a) => {
                  const pct = a.totalPayments > 0 ? (a.paymentsCompleted / a.totalPayments) * 100 : 0;
                  return (
                    <tr key={a.investorName} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3 font-medium text-stone-900">{a.investorName}</td>
                      <td className="px-4 py-3 tabular-nums text-stone-700">{fmtM(a.committedAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium ${
                          a.status === 'Confirmed' ? 'bg-fundex-gold/10 text-fundex-forest' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const fs = a.fundingStatus || 'Pending';
                          const fsStyle = fs === 'Funded' ? 'bg-fundex-gold/10 text-fundex-forest' : fs === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
                          return <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium ${fsStyle}`}>{fs}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-stone-100">
                            <div className="h-full bg-fundex-forest" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-stone-500">{a.paymentsCompleted}/{a.totalPayments}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{a.nextPayment}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => { setSelectedInvestor(a.investorName); setPaymentHistoryOpen(true); }}
                            className="p-1.5 text-fundex-forest hover:bg-fundex-gold/10"
                            title="Payment history"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button type="button" className="p-1.5 text-stone-500 hover:text-stone-700" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button type="button" className="p-1.5 text-red-400 hover:text-red-600" title="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ModalShell>

      <PaymentHistoryModal
        isOpen={paymentHistoryOpen}
        onClose={() => setPaymentHistoryOpen(false)}
        dealName={dealName}
        investorName={selectedInvestor}
      />
    </>
  );
}
