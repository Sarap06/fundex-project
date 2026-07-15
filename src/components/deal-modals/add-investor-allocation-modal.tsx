'use client';

import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalShell } from './modal-shell';
import { supabase } from '@/lib/supabase';

interface AddInvestorAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  onAdd?: (data: { investorId: string; amount: string; type: string; notes: string }) => void;
}

interface InvestorOption {
  id: string;
  investorCode: string;
  fullName: string;
  email: string;
}

export function AddInvestorAllocationModal({ isOpen, onClose, dealName, onAdd }: AddInvestorAllocationModalProps) {
  const [investors, setInvestors] = useState<InvestorOption[]>([]);
  const [investorId, setInvestorId] = useState('');
  const [amount, setAmount] = useState('');
  const [allocationType, setAllocationType] = useState('soft-commit');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      if (!profile?.company_id) return;

      const { data: invData } = await supabase
        .from('investors')
        .select('id, investor_id, full_name, email')
        .eq('company_id', profile.company_id)
        .eq('status', 'Active')
        .order('full_name');

      setInvestors((invData || []).map((i: any) => ({ id: i.id, investorCode: i.investor_id, fullName: i.full_name, email: i.email })));
    })();
  }, [isOpen]);

  const handleAdd = () => {
    if (!investorId || !amount) return;
    onAdd?.({ investorId, amount, type: allocationType, notes });
    resetAndClose();
  };

  const resetAndClose = () => {
    setInvestorId('');
    setAmount('');
    setAllocationType('soft-commit');
    setNotes('');
    onClose();
  };

  const canAdd = !!investorId && !!amount;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Add Investor Allocation"
      subtitle={dealName}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!canAdd} className="gap-2 bg-fundex-forest hover:bg-fundex-green disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> Add Allocation
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700">Investor</label>
          <select
            value={investorId}
            onChange={(e) => setInvestorId(e.target.value)}
            className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          >
            <option value="">Select investor...</option>
            {investors.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.fullName}{inv.investorCode ? ` — ${inv.investorCode}` : ''} ({inv.email})</option>
            ))}
          </select>
          {investors.length === 0 && (
            <p className="mt-1 text-xs text-stone-400">No active investors found. Add investors first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Investment Amount</label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 500000" className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Allocation Type</label>
          <select
            value={allocationType}
            onChange={(e) => setAllocationType(e.target.value)}
            className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          >
            <option value="soft-commit">Soft Commit</option>
            <option value="confirmed">Confirmed Allocation</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1.5 w-full resize-none border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          />
        </div>
      </div>
    </ModalShell>
  );
}
