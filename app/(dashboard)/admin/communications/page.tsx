'use client';

import { useEffect, useState } from 'react';
import { Mail, Search, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  dealName: string;
  recipientCount: number;
  sentAt: string;
  updateType: string;
  acknowledgedCount: number;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommunicationsPage() {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.company_id) return;

        // Get all sent broadcast updates with deal names
        const { data: updates } = await supabase
          .from('broadcast_updates')
          .select(`
            id, title, message, update_type, sent_at,
            deals!inner(name, company_id)
          `)
          .eq('deals.company_id', profile.company_id)
          .eq('is_sent', true)
          .order('sent_at', { ascending: false })
          .limit(50);

        if (updates) {
          const enriched = await Promise.all(
            updates.map(async (u: any) => {
              const { count: recipientCount } = await supabase
                .from('broadcast_update_recipients')
                .select('id', { count: 'exact', head: true })
                .eq('broadcast_update_id', u.id);

              const { count: acknowledgedCount } = await supabase
                .from('broadcast_update_recipients')
                .select('id', { count: 'exact', head: true })
                .eq('broadcast_update_id', u.id)
                .not('acknowledged_at', 'is', null);

              return {
                id: u.id,
                title: u.title,
                message: u.message,
                dealName: u.deals?.name || 'Unknown Deal',
                recipientCount: recipientCount || 0,
                sentAt: u.sent_at,
                updateType: u.update_type || 'manual',
                acknowledgedCount: acknowledgedCount || 0,
              };
            })
          );
          setMessages(enriched);
        }
      } catch (err) {
        console.error('[COMMUNICATIONS] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = searchQuery
    ? messages.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.dealName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const totalSent = messages.length;
  const totalRecipients = messages.reduce((s, m) => s + m.recipientCount, 0);
  const totalAcknowledged = messages.reduce((s, m) => s + m.acknowledgedCount, 0);
  const ackRate = totalRecipients > 0 ? Math.round((totalAcknowledged / totalRecipients) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fundex-forest" />
      </div>
    );
  }

  return (
    <StaggerContainer className="space-y-8 px-6 py-6 md:px-8 md:py-8">
      <StaggerItem>
        <PageHeader title="Communications" subtitle="Broadcast history and delivery tracking" />
      </StaggerItem>

      {/* Stats */}
      <StaggerItem>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="fdx-card p-5">
            <p className="text-sm text-stone-500">Messages Sent</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{totalSent}</p>
          </div>
          <div className="fdx-card p-5">
            <p className="text-sm text-stone-500">Total Recipients</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{totalRecipients.toLocaleString()}</p>
          </div>
          <div className="fdx-card p-5">
            <p className="text-sm text-fundex-forest">Acknowledgment Rate</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-fundex-forest">{ackRate}%</p>
          </div>
          <div className="fdx-card p-5">
            <p className="text-sm text-stone-500">Total Acknowledged</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{totalAcknowledged.toLocaleString()}</p>
          </div>
        </div>
      </StaggerItem>

      {/* Search */}
      <StaggerItem>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-stone-200 bg-white py-2.5 pl-11 pr-4 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          />
        </div>
      </StaggerItem>

      {/* Messages List */}
      <StaggerItem>
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="fdx-card py-12 text-center">
              <Mail className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-3 text-sm text-stone-500">
                {searchQuery ? 'No messages match your search' : 'No broadcasts sent yet'}
              </p>
            </div>
          ) : (
            filtered.map((msg) => {
              const ackPct = msg.recipientCount > 0
                ? Math.round((msg.acknowledgedCount / msg.recipientCount) * 100)
                : 0;
              return (
                <div key={msg.id} className="fdx-card p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-fundex-gold/10 text-fundex-forest">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-stone-900 line-clamp-1">{msg.title}</h3>
                          <p className="mt-0.5 text-xs text-stone-500">{msg.dealName}</p>
                        </div>
                        <Badge className="shrink-0 bg-fundex-gold/10 text-fundex-forest border-0">Sent</Badge>
                      </div>

                      <p className="mt-2 text-sm text-stone-600 line-clamp-2">{msg.message}</p>

                      <div className="mt-3 flex items-center gap-4 border-t border-stone-100 pt-3 text-xs">
                        <span className="text-stone-500">To: <span className="font-medium text-stone-700">{msg.recipientCount} investors</span></span>
                        <span className="text-stone-500">Acknowledged: <span className="font-medium text-fundex-forest">{msg.acknowledgedCount}/{msg.recipientCount} ({ackPct}%)</span></span>
                        <span className="ml-auto text-stone-400">{fmtDate(msg.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
