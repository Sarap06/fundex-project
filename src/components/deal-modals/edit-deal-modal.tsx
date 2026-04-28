'use client';

import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalShell } from './modal-shell';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: {
    name: string;
    targetAmount: number;
    interestRate: number;
    term: string;
    minimumInvestment: number;
  };
  onSave?: (data: { name: string; targetAmount: string; interestRate: string; term: string; minimumInvestment: string }) => void;
}

export function EditDealModal({ isOpen, onClose, deal, onSave }: EditDealModalProps) {
  const [name, setName] = useState(deal.name);
  const [targetAmount, setTargetAmount] = useState(`$${deal.targetAmount.toLocaleString()}`);
  const [interestRate, setInterestRate] = useState(`${deal.interestRate}%`);
  const [term, setTerm] = useState(deal.term);
  const [minimumInvestment, setMinimumInvestment] = useState(`$${deal.minimumInvestment.toLocaleString()}`);

  useEffect(() => {
    if (isOpen) {
      setName(deal.name);
      setTargetAmount(`$${deal.targetAmount.toLocaleString()}`);
      setInterestRate(`${deal.interestRate}%`);
      setTerm(deal.term);
      setMinimumInvestment(`$${deal.minimumInvestment.toLocaleString()}`);
    }
  }, [isOpen, deal]);

  const handleSave = () => {
    onSave?.({ name, targetAmount, interestRate, term, minimumInvestment });
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Deal"
      subtitle={deal.name}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="gap-2 bg-fundex-forest hover:bg-fundex-green">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700">Deal Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Target Raise</label>
          <Input value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Interest Rate</label>
          <Input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Term Length</label>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Minimum Investment</label>
          <Input value={minimumInvestment} onChange={(e) => setMinimumInvestment(e.target.value)} className="mt-1.5" />
        </div>
      </div>
    </ModalShell>
  );
}
