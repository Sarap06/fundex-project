'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle, Archive, ArrowLeft, Bell, Calendar, CheckCircle2, Clock,
  FileDown, FileText, Link2, Loader2, Megaphone, Pause, Radio, Send,
  Settings, Shield, Trash2, Upload, Users, X, Download, Eye, MessageSquare,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SendUpdateModal } from '@/components/deal-modals/send-update-modal';
import { ViewDocumentsModal } from '@/components/deal-modals/view-documents-modal';
import { ModalShell } from '@/components/deal-modals/modal-shell';

/* ────────────────────────── Types ────────────────────────── */

interface DealChannel {
  id: string;
  name: string;
  dealId: string;
  status: string;
  targetAmount: number;
  interestRate: number;
  term: string;
  investorCount: number;
  collateral?: string;
  collateralValue?: number;
  startDate?: string;
  maturityDate?: string;
  firstPayout?: string;
}

interface BroadcastUpdate {
  id: string;
  title: string;
  message: string;
  updateType: string;
  sentAt: string;
  requireAcknowledgment: boolean;
  recipientCount: number;
  acknowledgedCount: number;
  openedCount: number;
}

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string;
  createdAt: string;
}

interface AcknowledgmentInvestor {
  id: string;
  name: string;
  email: string;
  status: 'acknowledged' | 'opened' | 'pending';
  time: string | null;
}

/* ────────────────────────── Helpers ────────────────────────── */

function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
}

function getTimelineColor(eventType: string) {
  const type = eventType.toLowerCase();
  if (type.includes('official') || type.includes('activation') || type.includes('fund')) return 'emerald';
  if (type.includes('progress') || type.includes('update')) return 'blue';
  if (type.includes('document') || type.includes('upload')) return 'purple';
  return 'neutral';
}

/* ────────────────────────── Page ────────────────────────── */

export default function BroadcastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<DealChannel | null>(null);
  const [updates, setUpdates] = useState<BroadcastUpdate[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendUpdateOpen, setSendUpdateOpen] = useState(false);
  const [linkedDocsOpen, setLinkedDocsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingActionsOpen, setPendingActionsOpen] = useState(false);
  const [manageChannelOpen, setManageChannelOpen] = useState(false);

  // Acknowledgment filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'opened' | 'pending' | 'acknowledged'>('all');
  const [ackInvestors, setAckInvestors] = useState<AcknowledgmentInvestor[]>([]);

  // Manage channel form states
  const [channelStatus, setChannelStatus] = useState<'active' | 'paused' | 'archived'>('active');
  const [whoCanSend, setWhoCanSend] = useState<'admin-only' | 'designated-users' | 'all-users'>('admin-only');
  const [investorsCanReply, setInvestorsCanReply] = useState(false);
  const [requireAckByDefault, setRequireAckByDefault] = useState(true);
  const [internalNotifications, setInternalNotifications] = useState(true);
  const [autoReminders, setAutoReminders] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/auth/login'); return; }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('user_id', session.user.id)
          .single();

        if (!profile?.company_id) return;
        const companyId = profile.company_id;

        // Fetch deal
        const { data: dealData } = await supabase
          .from('deals')
          .select('id, deal_id, name, status, target_amount, interest_rate, term, investor_count, collateral, collateral_value, start_date, maturity_date, first_payout')
          .eq('id', dealId)
          .eq('company_id', companyId)
          .single();

        if (!dealData) { router.push('/admin/broadcast'); return; }

        setDeal({
          id: dealData.id,
          name: dealData.name,
          dealId: dealData.deal_id,
          status: dealData.status,
          targetAmount: Number(dealData.target_amount || 0),
          interestRate: Number(dealData.interest_rate || 0),
          term: dealData.term || '',
          investorCount: dealData.investor_count || 0,
          collateral: dealData.collateral || '',
          collateralValue: Number(dealData.collateral_value || 0),
          startDate: dealData.start_date || '',
          maturityDate: dealData.maturity_date || '',
          firstPayout: dealData.first_payout || '',
        });

        // Fetch broadcast updates
        const { data: updatesData } = await supabase
          .from('broadcast_updates')
          .select('id, title, message, update_type, sent_at, require_acknowledgment')
          .eq('deal_id', dealId)
          .eq('is_sent', true)
          .order('sent_at', { ascending: false })
          .limit(10);

        if (updatesData && updatesData.length > 0) {
          const enriched = await Promise.all(
            updatesData.map(async (u: any) => {
              const { count: recipientCount } = await supabase
                .from('broadcast_update_recipients')
                .select('id', { count: 'exact', head: true })
                .eq('broadcast_update_id', u.id);

              const { count: acknowledgedCount } = await supabase
                .from('broadcast_update_recipients')
                .select('id', { count: 'exact', head: true })
                .eq('broadcast_update_id', u.id)
                .not('acknowledged_at', 'is', null);

              const { count: openedCount } = await supabase
                .from('broadcast_update_recipients')
                .select('id', { count: 'exact', head: true })
                .eq('broadcast_update_id', u.id)
                .not('opened_at', 'is', null);

              return {
                id: u.id,
                title: u.title,
                message: u.message,
                updateType: u.update_type,
                sentAt: u.sent_at,
                requireAcknowledgment: u.require_acknowledgment,
                recipientCount: recipientCount || 0,
                acknowledgedCount: acknowledgedCount || 0,
                openedCount: openedCount || 0,
              };
            })
          );
          setUpdates(enriched);

          // Fetch individual acknowledgment data for latest update
          if (enriched[0]) {
            const { data: recipients } = await supabase
              .from('broadcast_update_recipients')
              .select('investor_id, opened_at, acknowledged_at')
              .eq('broadcast_update_id', enriched[0].id);

            if (recipients && recipients.length > 0) {
              const investorIds = recipients.map((r: any) => r.investor_id);
              const { data: investorProfiles } = await supabase
                .from('investors')
                .select('id, name, email')
                .in('id', investorIds);

              const ackList: AcknowledgmentInvestor[] = recipients.map((r: any) => {
                const inv = investorProfiles?.find((p: any) => p.id === r.investor_id);
                let status: 'acknowledged' | 'opened' | 'pending' = 'pending';
                if (r.acknowledged_at) status = 'acknowledged';
                else if (r.opened_at) status = 'opened';
                return {
                  id: r.investor_id,
                  name: inv?.name || 'Unknown Investor',
                  email: inv?.email || '',
                  status,
                  time: r.acknowledged_at
                    ? new Date(r.acknowledged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : null,
                };
              });
              setAckInvestors(ackList);
            }
          }
        }

        // Fetch timeline
        const { data: timelineData } = await supabase
          .from('broadcast_communication_timeline')
          .select('id, event_type, title, description, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(10);

        setTimeline(
          (timelineData || []).map((t: any) => ({
            id: t.id,
            eventType: t.event_type,
            title: t.title,
            description: t.description,
            createdAt: t.created_at,
          }))
        );
      } catch (err) {
        console.error('[BROADCAST_DETAIL] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [dealId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fundex-forest" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-8 text-center text-stone-500">Deal not found</div>
    );
  }

  const latestUpdate = updates[0] || null;
  const ackPct = latestUpdate && latestUpdate.recipientCount > 0
    ? Math.round((latestUpdate.acknowledgedCount / latestUpdate.recipientCount) * 100)
    : 0;

  const pendingCount = latestUpdate ? latestUpdate.recipientCount - latestUpdate.acknowledgedCount : 0;

  const filteredAckInvestors = ackInvestors.filter((inv) => {
    if (statusFilter === 'all') return true;
    return inv.status === statusFilter;
  });

  return (
    <>
      <div className="mx-auto max-w-screen-xl space-y-6 px-6 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/broadcast')}
            className="mt-1 p-2 text-stone-400 transition hover:text-stone-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-bold text-white shadow-md">
                {deal.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-stone-900">{deal.name}</h1>
                  <Badge className="bg-fundex-gold/10 text-fundex-forest border-fundex-gold/30">{deal.status}</Badge>
                </div>
                <p className="text-sm text-stone-500">Broadcast Channel</p>
              </div>
            </div>
          </div>
          {/* Info row + Manage button */}
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <span className="font-medium text-stone-900">{deal.investorCount} Investors</span>
            <span className="text-stone-300">·</span>
            <span className="text-fundex-forest font-semibold">Admin Only</span>
            {latestUpdate && (
              <>
                <span className="text-stone-300">·</span>
                <span>Last update {formatRelative(latestUpdate.sentAt)}</span>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-2 font-semibold"
              onClick={() => setManageChannelOpen(true)}
            >
              Manage
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button className="gap-1.5 bg-fundex-forest hover:bg-fundex-green text-white shadow-md font-semibold px-6" onClick={() => setSendUpdateOpen(true)}>
            <Send className="h-4 w-4" /> Send Update
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLinkedDocsOpen(true)}>
            <FileText className="h-4 w-4" /> Linked Docs
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setScheduleOpen(true)}>
            <Calendar className="h-4 w-4" /> Schedule
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPendingActionsOpen(true)}>
            <AlertCircle className="h-4 w-4" /> Pending Actions
          </Button>
        </div>

        {/* Latest Update Card — Enhanced with metrics + message + contract facts */}
        {latestUpdate && (
          <div className="border border-stone-100 bg-white shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-stone-50 to-white px-6 py-5 border-b border-stone-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 mb-2">Latest Deal Update</h2>
                  <p className="text-sm text-stone-600">
                    Sent to {latestUpdate.recipientCount} investors · {formatRelative(latestUpdate.sentAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500 mb-2">Published {formatRelative(latestUpdate.sentAt)}</p>
                  <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 text-xs h-8 px-3">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    View Communication Log
                  </Button>
                </div>
              </div>

              {/* Broadcast Status */}
              {latestUpdate.requireAcknowledgment && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wide font-semibold text-stone-500">Broadcast Status</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-fundex-forest font-bold text-sm">{ackPct}%</span>
                      <span className="text-xs text-stone-500">acknowledged</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-fundex-forest rounded-full transition-all" style={{ width: `${ackPct}%` }} />
                  </div>
                  <p className="text-xs text-stone-600">{latestUpdate.acknowledgedCount} / {latestUpdate.recipientCount} investors confirmed</p>

                  {/* Interactive Metrics */}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={() => setStatusFilter('opened')}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer group ${statusFilter === 'opened' ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'opened' ? 'bg-stone-600' : 'bg-stone-400'}`} />
                      <span className={statusFilter === 'opened' ? 'underline decoration-2 underline-offset-2' : 'group-hover:underline underline-offset-2'}>
                        {latestUpdate.openedCount} Opened
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('acknowledged')}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer group ${statusFilter === 'acknowledged' ? 'text-fundex-forest' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'acknowledged' ? 'bg-fundex-forest' : 'bg-green-500'}`} />
                      <span className={statusFilter === 'acknowledged' ? 'underline decoration-2 underline-offset-2' : 'group-hover:underline underline-offset-2'}>
                        {latestUpdate.acknowledgedCount} Acknowledged
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer group ${statusFilter === 'pending' ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'pending' ? 'bg-stone-600' : 'bg-stone-300'}`} />
                      <span className={statusFilter === 'pending' ? 'underline decoration-2 underline-offset-2' : 'group-hover:underline underline-offset-2'}>
                        {pendingCount} Pending
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="px-6 py-6 bg-white">
              <p className="text-base text-stone-800 leading-relaxed whitespace-pre-line">{latestUpdate.message}</p>
            </div>

            {/* Contract Facts */}
            {(deal.interestRate > 0 || deal.targetAmount > 0) && (
              <div className="px-6 pb-6">
                <div className="border border-fundex-green/30 shadow-sm overflow-hidden bg-white">
                  <div className="bg-fundex-forest px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                      <h3 className="font-bold text-white">Contract Facts</h3>
                    </div>
                  </div>
                  {/* Contract Identity */}
                  <div className="px-5 py-4 bg-white border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-stone-900 text-base mb-1">{deal.name}</h4>
                        <p className="text-xs text-stone-500 font-medium">#{deal.dealId}</p>
                      </div>
                      <Badge className="bg-fundex-gold/10 text-fundex-forest border-fundex-gold/30">{deal.status}</Badge>
                    </div>
                  </div>
                  {/* Two-Column Details */}
                  <div className="px-5 py-5 bg-gradient-to-b from-stone-50/50 to-white">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      {deal.startDate && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Signed</p>
                          <p className="text-sm font-bold text-stone-900">{formatDate(deal.startDate)}</p>
                        </div>
                      )}
                      {deal.maturityDate && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Maturity Date</p>
                          <p className="text-sm font-bold text-stone-900">{formatDate(deal.maturityDate)}</p>
                        </div>
                      )}
                      {deal.startDate && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Starts</p>
                          <p className="text-sm font-bold text-stone-900">{formatDate(deal.startDate)}</p>
                        </div>
                      )}
                      {deal.term && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Term</p>
                          <p className="text-sm font-bold text-stone-900">{deal.term}</p>
                        </div>
                      )}
                      {deal.firstPayout && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">First Payout</p>
                          <p className="text-sm font-bold text-stone-900">{formatDate(deal.firstPayout)}</p>
                        </div>
                      )}
                      {deal.interestRate > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Rate</p>
                          <p className="text-base font-bold text-fundex-forest">{deal.interestRate}% APR</p>
                        </div>
                      )}
                      {deal.collateral && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Collateral</p>
                          <p className="text-sm font-semibold text-stone-900 leading-snug">{deal.collateral}</p>
                        </div>
                      )}
                      {deal.targetAmount > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Principal</p>
                          <p className="text-base font-bold text-stone-900">{fmtM(deal.targetAmount)}</p>
                        </div>
                      )}
                      {deal.collateralValue && deal.collateralValue > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Collateral Value</p>
                          <p className="text-base font-bold text-stone-900">{fmtM(deal.collateralValue)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acknowledgment Status Section */}
        {latestUpdate && latestUpdate.requireAcknowledgment && ackInvestors.length > 0 && (
          <div className="border border-stone-100 bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-stone-900">Acknowledgment Status</h3>
                <Button variant="outline" size="sm" className="font-medium">
                  Send Reminder
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 mb-5 p-1 bg-stone-100 w-fit">
                {(['all', 'opened', 'pending', 'acknowledged'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      statusFilter === tab
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Investor List */}
              <div className="space-y-0">
                {filteredAckInvestors.map((investor) => (
                  <div key={investor.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-stone-700">
                          {investor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-stone-900">{investor.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {investor.status === 'acknowledged' && (
                        <>
                          <Badge className="bg-fundex-forest text-white border-0">Acknowledged</Badge>
                          {investor.time && <span className="text-sm text-stone-500 font-medium w-16 text-right">{investor.time}</span>}
                        </>
                      )}
                      {investor.status === 'opened' && (
                        <Badge className="bg-stone-200 text-stone-700 border-0">Opened, Pending</Badge>
                      )}
                      {investor.status === 'pending' && (
                        <Badge className="bg-stone-200 text-stone-700 border-0">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {filteredAckInvestors.length === 0 && (
                  <div className="py-8 text-center text-sm text-stone-400">No investors in this category</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Previous Updates */}
        {updates.length > 1 && (
          <div className="border border-stone-100 bg-white shadow-sm">
            <div className="border-b border-stone-100 p-5">
              <h2 className="text-base font-medium text-stone-900">Previous Updates</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {updates.slice(1).map((u) => (
                <div key={u.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-stone-900">{u.title}</h3>
                      <p className="mt-1 text-sm text-stone-500 line-clamp-2">{u.message}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-stone-400">{formatRelative(u.sentAt)}</p>
                      {u.requireAcknowledgment && (
                        <p className="mt-1 text-xs tabular-nums text-stone-500">
                          {u.acknowledgedCount}/{u.recipientCount} acknowledged
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communication Timeline — Enhanced with color-coded dots and hover */}
        {timeline.length > 0 && (
          <div className="border border-stone-100 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-stone-900 mb-6">Deal Communication Timeline</h2>
            <div className="space-y-0">
              {timeline.map((event, index) => {
                const color = getTimelineColor(event.eventType);
                return (
                  <div key={event.id} className="flex items-start gap-4 py-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 -mx-2 px-2 transition-colors group">
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        color === 'emerald' ? 'bg-emerald-500' :
                        color === 'blue' ? 'bg-blue-500' :
                        color === 'purple' ? 'bg-purple-500' :
                        'bg-stone-400'
                      }`} />
                      {index !== timeline.length - 1 && (
                        <div className="w-px flex-1 bg-stone-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-stone-900">{formatRelative(event.createdAt)}</span>
                          <span className="text-stone-300">—</span>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium border ${
                              color === 'emerald' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                              color === 'blue' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              color === 'purple' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                              'border-stone-300 text-stone-600 bg-stone-50'
                            }`}
                          >
                            {event.eventType}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-stone-900 mb-1.5">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-stone-600 leading-relaxed mb-3">{event.description}</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium text-xs h-7 px-2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {updates.length === 0 && timeline.length === 0 && (
          <div className="border border-stone-100 bg-white p-12 text-center shadow-sm">
            <Megaphone className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-4 text-base font-medium text-stone-700">No broadcasts yet</p>
            <p className="mt-1 text-sm text-stone-500">Send your first update to investors in this deal channel.</p>
            <Button className="mt-5 gap-2 bg-fundex-forest hover:bg-fundex-green" onClick={() => setSendUpdateOpen(true)}>
              <Send className="h-4 w-4" /> Send First Update
            </Button>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}

      <SendUpdateModal
        isOpen={sendUpdateOpen}
        onClose={() => setSendUpdateOpen(false)}
        dealName={deal.name}
      />

      <ViewDocumentsModal
        isOpen={linkedDocsOpen}
        onClose={() => setLinkedDocsOpen(false)}
        dealName={deal.name}
      />

      {/* Schedule Modal */}
      <ModalShell
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Broadcast"
        subtitle={deal.name}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={() => setScheduleOpen(false)} className="gap-2 bg-fundex-forest hover:bg-fundex-green">
              <Calendar className="h-4 w-4" /> Schedule Update
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">Update Title</label>
            <Input placeholder="e.g., Q3 Performance Report" className="mt-1.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Message Body</label>
            <textarea
              placeholder="Enter your scheduled message..."
              rows={6}
              className="mt-1.5 w-full resize-none border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Send Date</label>
              <Input type="date" className="mt-1.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Send Time</label>
              <Input type="time" className="mt-1.5" />
            </div>
          </div>
          <div className="flex items-center gap-2 border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Clock className="h-4 w-4 shrink-0" />
            <span>All times are in Eastern Time (ET)</span>
          </div>
        </div>
      </ModalShell>

      {/* Pending Actions Modal */}
      <ModalShell
        isOpen={pendingActionsOpen}
        onClose={() => setPendingActionsOpen(false)}
        title="Pending Actions"
        subtitle={deal.name}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPendingActionsOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-red-100 bg-red-50 p-4 text-center">
              <p className="text-2xl font-semibold text-red-700">
                {updates.reduce((s, u) => s + (u.recipientCount - u.acknowledgedCount), 0)}
              </p>
              <p className="mt-1 text-xs text-red-600">Pending Acks</p>
            </div>
            <div className="border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="text-2xl font-semibold text-blue-700">0</p>
              <p className="mt-1 text-xs text-blue-600">Doc Confirmations</p>
            </div>
            <div className="border border-purple-100 bg-purple-50 p-4 text-center">
              <p className="text-2xl font-semibold text-purple-700">0</p>
              <p className="mt-1 text-xs text-purple-600">Unanswered Messages</p>
            </div>
          </div>

          {/* Action items */}
          <div className="space-y-3">
            {updates.filter(u => u.requireAcknowledgment && u.acknowledgedCount < u.recipientCount).map((u) => (
              <div key={u.id} className="flex items-center justify-between border border-stone-100 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-50 text-red-700 border-0 text-[10px]">PENDING ACK</Badge>
                    <span className="text-sm font-medium text-stone-900 truncate">{u.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {u.recipientCount - u.acknowledgedCount} of {u.recipientCount} investors haven&apos;t acknowledged
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 text-xs">Send Reminder</Button>
              </div>
            ))}
            {updates.filter(u => u.requireAcknowledgment && u.acknowledgedCount < u.recipientCount).length === 0 && (
              <div className="py-8 text-center text-sm text-stone-400">No pending actions</div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* ─── Manage Channel Settings Panel (Side Drawer) ─── */}
      {manageChannelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-stretch justify-end z-50">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-fundex-forest to-fundex-green px-6 py-5 z-10 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Channel Settings</h3>
                    <p className="text-sm text-white/80">Communication Control Center</p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setManageChannelOpen(false)}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              {/* Channel Identity */}
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-fundex-forest font-bold text-sm">{deal.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{deal.name}</p>
                    <p className="text-xs text-white/70">Deal #{deal.dealId} · Broadcast Channel</p>
                  </div>
                  <Badge className="bg-white text-fundex-forest hover:bg-white font-semibold shadow-sm">
                    {deal.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-8">
              {/* Section 1: Channel Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-fundex-forest" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Channel Details</h4>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Channel Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-white border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-fundex-forest focus:border-transparent"
                      value={deal.name}
                      readOnly
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Channel Type</label>
                      <div className="px-4 py-2.5 bg-white border border-stone-300">
                        <p className="text-sm font-semibold text-stone-900">Broadcast Channel</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Related Deal ID</label>
                      <div className="px-4 py-2.5 bg-white border border-stone-300">
                        <p className="text-sm font-semibold text-stone-900">#{deal.dealId}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Channel Status</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-fundex-forest focus:border-transparent"
                      value={channelStatus}
                      onChange={(e) => setChannelStatus(e.target.value as any)}
                    >
                      <option value="active">Active - Channel is operational</option>
                      <option value="paused">Paused - Temporarily suspended</option>
                      <option value="archived">Archived - Closed permanently</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Audience Settings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Audience Settings</h4>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Default Audience</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-fundex-forest focus:border-transparent">
                      <option>All Investors in this Deal</option>
                      <option>Accredited Investors Only</option>
                      <option>Specific Investor Groups</option>
                      <option>Custom Audience</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-stone-300 p-4">
                      <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1">Current Recipients</p>
                      <p className="text-2xl font-bold text-fundex-forest">{deal.investorCount}</p>
                      <p className="text-xs text-stone-500 mt-1">Active investors</p>
                    </div>
                    <div className="bg-white border border-stone-300 p-4">
                      <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1">Investor Groups</p>
                      <p className="text-2xl font-bold text-blue-600">3</p>
                      <p className="text-xs text-stone-500 mt-1">Linked groups</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full font-semibold">
                    <Users className="h-4 w-4 mr-2" /> Manage Recipient Scope
                  </Button>
                </div>
              </div>

              {/* Section 3: Permissions & Communication Rules */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Permissions & Communication Rules</h4>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Who Can Send Updates</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-fundex-forest focus:border-transparent"
                      value={whoCanSend}
                      onChange={(e) => setWhoCanSend(e.target.value as any)}
                    >
                      <option value="admin-only">Admin Only - Restricted access</option>
                      <option value="designated-users">Designated Users - Selected team members</option>
                      <option value="all-users">All Users - Any team member</option>
                    </select>
                  </div>
                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="investorsCanReplyPanel"
                        className="mt-1 w-4 h-4 accent-fundex-forest"
                        checked={investorsCanReply}
                        onChange={(e) => setInvestorsCanReply(e.target.checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="investorsCanReplyPanel" className="block text-sm font-bold text-stone-900 cursor-pointer">
                          Allow investor replies & contact
                        </label>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          Enable two-way communication. Investors can reply to updates and send direct messages to your team.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="requireAckByDefaultPanel"
                        className="mt-1 w-4 h-4 accent-fundex-forest"
                        checked={requireAckByDefault}
                        onChange={(e) => setRequireAckByDefault(e.target.checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="requireAckByDefaultPanel" className="block text-sm font-bold text-stone-900 cursor-pointer">
                          Require acknowledgment by default
                        </label>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          All updates will require investor acknowledgment. Track who has read and confirmed each message.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Communication Mode indicator */}
                  <div className="bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-start gap-2">
                      <Radio className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Communication Mode</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {investorsCanReply ? 'Reply-Enabled Channel' : 'Broadcast-Only Channel'}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {investorsCanReply
                            ? 'Investors can send replies and engage in conversation'
                            : 'One-way communication - investors receive updates only'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Notification & Reminder Settings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-4 w-4 text-yellow-600" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Notification & Reminder Settings</h4>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 space-y-5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="internalNotifsPanel"
                      className="mt-1 w-4 h-4 accent-fundex-forest"
                      checked={internalNotifications}
                      onChange={(e) => setInternalNotifications(e.target.checked)}
                    />
                    <div className="flex-1">
                      <label htmlFor="internalNotifsPanel" className="block text-sm font-bold text-stone-900 cursor-pointer">
                        Internal team notifications
                      </label>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Notify team members about new investor messages, pending acknowledgments, and channel activity.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="autoRemindersPanel"
                        className="mt-1 w-4 h-4 accent-fundex-forest"
                        checked={autoReminders}
                        onChange={(e) => setAutoReminders(e.target.checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="autoRemindersPanel" className="block text-sm font-bold text-stone-900 cursor-pointer">
                          Automated reminder system
                        </label>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed mb-3">
                          Automatically send follow-up reminders to investors with pending acknowledgments.
                        </p>
                        {autoReminders && (
                          <div className="bg-white border border-stone-300 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-stone-700">First Reminder</span>
                              <select className="text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 px-2 py-1">
                                <option>24 hours after send</option>
                                <option>48 hours after send</option>
                                <option>72 hours after send</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-stone-700">Second Reminder</span>
                              <select className="text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 px-2 py-1">
                                <option>48 hours after first</option>
                                <option>72 hours after first</option>
                                <option>7 days after first</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Linked Resources */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Linked Resources</h4>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-stone-300 p-3 text-center">
                      <FileText className="h-5 w-5 text-fundex-forest mx-auto mb-2" />
                      <p className="text-lg font-bold text-stone-900">4</p>
                      <p className="text-xs text-stone-600 font-semibold">Documents</p>
                    </div>
                    <div className="bg-white border border-stone-300 p-3 text-center">
                      <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                      <p className="text-lg font-bold text-stone-900">2</p>
                      <p className="text-xs text-stone-600 font-semibold">Scheduled</p>
                    </div>
                    <div className="bg-white border border-stone-300 p-3 text-center">
                      <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                      <p className="text-lg font-bold text-stone-900">3</p>
                      <p className="text-xs text-stone-600 font-semibold">Groups</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full font-semibold text-left justify-start">
                      <FileText className="h-4 w-4 mr-2" /> View Linked Documents
                    </Button>
                    <Button variant="outline" size="sm" className="w-full font-semibold text-left justify-start">
                      <Calendar className="h-4 w-4 mr-2" /> Manage Scheduled Updates
                    </Button>
                    <Button variant="outline" size="sm" className="w-full font-semibold text-left justify-start">
                      <Users className="h-4 w-4 mr-2" /> Edit Investor Groups
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section 6: Channel Actions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Channel Actions</h4>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 space-y-3">
                  <Button variant="outline" size="sm" className="w-full border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 font-semibold text-left justify-start">
                    <Pause className="h-4 w-4 mr-2" /> Pause Channel Temporarily
                  </Button>
                  <Button variant="outline" size="sm" className="w-full font-semibold text-left justify-start">
                    <FileDown className="h-4 w-4 mr-2" /> Export Communication Log
                  </Button>
                  <Button variant="outline" size="sm" className="w-full border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-left justify-start">
                    <Archive className="h-4 w-4 mr-2" /> Archive Channel Permanently
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-5 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-stone-600 flex-1">
                  Changes will apply immediately to all future communications in this channel.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setManageChannelOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-fundex-forest hover:bg-fundex-green text-white shadow-md font-semibold px-6"
                    onClick={() => setManageChannelOpen(false)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
