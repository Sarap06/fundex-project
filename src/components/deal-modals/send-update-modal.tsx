'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ModalShell } from './modal-shell';

interface SendUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  onSend?: (data: { title: string; message: string; audience: string; sendEmail: boolean }) => void;
}

export function SendUpdateModal({ isOpen, onClose, dealName, onSend }: SendUpdateModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sendEmail, setSendEmail] = useState(true);

  const handleSend = () => {
    onSend?.({ title, message, audience, sendEmail });
    setTitle('');
    setMessage('');
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Send Update"
      subtitle={dealName}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!title || !message} className="gap-2 bg-fundex-forest hover:bg-fundex-green">
            <Send className="h-4 w-4" /> Send Update
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700">Update Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Funding closing schedule update" className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Message Content</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your update message to investors..."
            rows={10}
            className="mt-1.5 w-full resize-none border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          >
            <option value="all">All Investors</option>
            <option value="allocated">Allocated Investors</option>
            <option value="custom">Custom Investor Groups</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(!!c)} />
          <label className="text-sm text-stone-700">Send email notification</label>
        </div>
      </div>
    </ModalShell>
  );
}
