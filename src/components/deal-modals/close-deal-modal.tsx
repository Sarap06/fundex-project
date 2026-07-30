'use client';

import { AlertTriangle, Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ModalShell } from './modal-shell';

interface CloseDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
}

export function CloseDealModal({ isOpen, onClose, dealName, onConfirm, loading }: CloseDealModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Close Deal"
      subtitle={dealName}
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            disabled={!confirmed || loading}
            onClick={() => { if (onConfirm) { onConfirm(); } else { onClose(); } }}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            <Lock className="h-4 w-4" /> {loading ? 'Closing…' : 'Close Deal'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-3 border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">This action will finalize the deal</p>
            <p className="mt-1 text-sm text-amber-700">No further allocations will be allowed and all commitments will be locked.</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} className="mt-1" />
          <label className="text-sm text-stone-700">I confirm this deal is fully funded and ready to close.</label>
        </div>

        <div className="space-y-2 text-sm text-stone-600">
          <p className="font-medium text-stone-700">Closing this deal will:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lock all existing allocations</li>
            <li>Change status to &quot;Closed&quot;</li>
            <li>Prevent new investor allocations</li>
            <li>Activate payout schedules</li>
          </ul>
        </div>
      </div>
    </ModalShell>
  );
}
