'use client';

import { useState } from 'react';
import { Bell, Globe, Mail, MessageSquare, Settings, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ManageCommsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center ${color}`}>{icon}</div>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
    </div>
  );
}

export function ManageCommsPanel({ isOpen, onClose }: ManageCommsPanelProps) {
  const [defaultAudience, setDefaultAudience] = useState('all');
  const [requireAck, setRequireAck] = useState(false);
  const [allowReplies, setAllowReplies] = useState(false);
  const [updateType, setUpdateType] = useState('official');

  const [inboxFilter, setInboxFilter] = useState('all');
  const [allowInvestorStart, setAllowInvestorStart] = useState(false);
  const [autoTagByDeal, setAutoTagByDeal] = useState(true);

  const [notifyOnMessage, setNotifyOnMessage] = useState(true);
  const [notifyOnPendingAck, setNotifyOnPendingAck] = useState(true);
  const [reminderTiming, setReminderTiming] = useState('48h');

  const [channelMode, setChannelMode] = useState('broadcast-only');
  const [defaultAckRequired, setDefaultAckRequired] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-fundex-forest to-fundex-green px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-medium">Communications Settings</h2>
                <p className="text-sm text-white/80">Platform-wide configuration</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Communication Defaults */}
          <section>
            <SectionHeader icon={<Globe className="h-4 w-4" />} title="Communication Defaults" color="bg-fundex-gold/10 text-fundex-forest" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Default Audience</label>
                <select value={defaultAudience} onChange={(e) => setDefaultAudience(e.target.value)} className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30">
                  <option value="all">All Investors</option>
                  <option value="allocated">Allocated Investors</option>
                  <option value="custom">Custom Groups</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={requireAck} onCheckedChange={(c) => setRequireAck(!!c)} />
                <label className="text-sm text-stone-700">Require investor acknowledgment by default</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={allowReplies} onCheckedChange={(c) => setAllowReplies(!!c)} />
                <label className="text-sm text-stone-700">Allow investors to reply to updates</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Default Update Type</label>
                <select value={updateType} onChange={(e) => setUpdateType(e.target.value)} className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30">
                  <option value="official">Official Update</option>
                  <option value="performance">Performance Report</option>
                  <option value="document">Document Share</option>
                  <option value="distribution">Distribution Notice</option>
                </select>
              </div>
            </div>
          </section>

          {/* Inbox Behavior */}
          <section>
            <SectionHeader icon={<MessageSquare className="h-4 w-4" />} title="Inbox Behavior" color="bg-purple-50 text-purple-600" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Default Inbox Filter</label>
                <select value={inboxFilter} onChange={(e) => setInboxFilter(e.target.value)} className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30">
                  <option value="all">All Messages</option>
                  <option value="unread">Unread</option>
                  <option value="needs-reply">Needs Reply</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={allowInvestorStart} onCheckedChange={(c) => setAllowInvestorStart(!!c)} />
                <label className="text-sm text-stone-700">Allow investors to start conversations</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={autoTagByDeal} onCheckedChange={(c) => setAutoTagByDeal(!!c)} />
                <label className="text-sm text-stone-700">Automatically tag conversations by deal</label>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section>
            <SectionHeader icon={<Bell className="h-4 w-4" />} title="Notification Settings" color="bg-amber-50 text-amber-600" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={notifyOnMessage} onCheckedChange={(c) => setNotifyOnMessage(!!c)} />
                <label className="text-sm text-stone-700">Notify when investor sends a message</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={notifyOnPendingAck} onCheckedChange={(c) => setNotifyOnPendingAck(!!c)} />
                <label className="text-sm text-stone-700">Notify on pending acknowledgments</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Reminder Automation</label>
                <select value={reminderTiming} onChange={(e) => setReminderTiming(e.target.value)} className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30">
                  <option value="none">No Reminders</option>
                  <option value="24h">After 24 hours</option>
                  <option value="48h">After 48 hours</option>
                  <option value="72h">After 72 hours</option>
                </select>
              </div>
            </div>
          </section>

          {/* Channel Defaults */}
          <section>
            <SectionHeader icon={<Shield className="h-4 w-4" />} title="Channel Defaults" color="bg-blue-50 text-blue-600" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Default Channel Mode</label>
                <select value={channelMode} onChange={(e) => setChannelMode(e.target.value)} className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30">
                  <option value="broadcast-only">Broadcast Only</option>
                  <option value="broadcast-replies">Broadcast + Replies</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={defaultAckRequired} onCheckedChange={(c) => setDefaultAckRequired(!!c)} />
                <label className="text-sm text-stone-700">Default acknowledgment requirement</label>
              </div>
            </div>
          </section>

          {/* Templates */}
          <section>
            <SectionHeader icon={<Mail className="h-4 w-4" />} title="Communication Templates" color="bg-pink-50 text-pink-600" />
            <div className="space-y-3">
              {['Funding Complete', 'Distribution Notice', 'Quarterly Update'].map((name) => (
                <div key={name} className="flex items-center justify-between border border-stone-100 px-4 py-3">
                  <span className="text-sm font-medium text-stone-900">{name}</span>
                  <Button variant="ghost" size="sm" className="text-xs text-fundex-forest">Edit</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">Create Template</Button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-100 bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onClose} className="bg-fundex-forest hover:bg-fundex-green">Save Settings</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
