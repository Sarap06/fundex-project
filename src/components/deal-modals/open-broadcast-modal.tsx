'use client';

import { Clock, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModalShell } from './modal-shell';

interface BroadcastEntry {
  title: string;
  content: string;
  date: string;
  audience: string;
  acknowledged: number;
  total: number;
}

interface OpenBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  broadcasts?: BroadcastEntry[];
}

const DEFAULT_BROADCASTS: BroadcastEntry[] = [
  { title: 'Funding Milestone Reached', content: 'We are pleased to inform you that the funding milestone for this deal has been achieved...', date: 'Jun 15, 2026', audience: 'All Investors', acknowledged: 141, total: 184 },
  { title: 'Quarterly Performance Update', content: 'Attached is the Q2 2026 performance report showing strong returns across all metrics...', date: 'Jun 1, 2026', audience: 'Allocated Investors', acknowledged: 120, total: 142 },
];

export function OpenBroadcastModal({ isOpen, onClose, dealName, broadcasts }: OpenBroadcastModalProps) {
  const entries = broadcasts || DEFAULT_BROADCASTS;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Broadcast Updates"
      subtitle={dealName}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="gap-2 bg-fundex-forest hover:bg-fundex-green">
            <Send className="h-4 w-4" /> Send New Update
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {entries.map((entry) => {
          const pct = entry.total > 0 ? (entry.acknowledged / entry.total) * 100 : 0;
          return (
            <div key={entry.title} className="border border-stone-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-stone-900">{entry.title}</h3>
                  <p className="mt-2 text-sm text-stone-600 line-clamp-2">{entry.content}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{entry.audience}</Badge>
              </div>
              <div className="mt-4 border-t border-stone-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <Clock className="h-3.5 w-3.5" /> {entry.date}
                  </span>
                  <span className="tabular-nums text-stone-600">
                    {entry.acknowledged} / {entry.total} acknowledged
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-stone-100">
                  <div className="h-full bg-fundex-forest transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
