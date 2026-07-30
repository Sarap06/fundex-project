'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock,
  FileText, Loader2, Megaphone, Send,
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
  const [scheduleForm, setScheduleForm] = useState({ title: '', message: '', date: '', time: '' });
  const [scheduling, setScheduling] = useState(false);

  // Acknowledgment filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'opened' | 'pending' | 'acknowledged'>('all');
  const [ackInvestors, setAckInvestors] = useState<AcknowledgmentInvestor[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<
    { name: string; category: string; uploadDate: string; status: 'uploaded' | 'pending' | 'missing'; size: string }[]
  >([]);

  // New updates require acknowledgment by default
  const requireAckByDefault = true;

  const loadData = useCallback(async () => {
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
          .select('id, deal_id, name, status, target_amount, interest_rate, term, investor_count, collateral_type, estimated_property_value, first_payout_date')
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
          collateral: dealData.collateral_type || '',
          collateralValue: Number(dealData.estimated_property_value || 0),
          startDate: '',
          maturityDate: '',
          firstPayout: dealData.first_payout_date || '',
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
              .select('investor_id, investor_source, email, opened_at, acknowledged_at')
              .eq('broadcast_update_id', enriched[0].id);

            if (recipients && recipients.length > 0) {
              const userProfileIds = recipients
                .filter((r: any) => r.investor_source === 'user_profiles')
                .map((r: any) => r.investor_id);

              const investorIds = recipients
                .filter((r: any) => r.investor_source === 'investors')
                .map((r: any) => r.investor_id);

              const nameMap = new Map<string, string>();

              if (userProfileIds.length > 0) {
                const { data: profiles } = await supabase
                  .from('user_profiles')
                  .select('user_id, full_name')
                  .in('user_id', userProfileIds);

                profiles?.forEach((p: any) => {
                  nameMap.set(`${p.user_id}:user_profiles`, p.full_name);
                });
              }

              if (investorIds.length > 0) {
                const { data: investorRows } = await supabase
                  .from('investors')
                  .select('id, full_name')
                  .in('id', investorIds);

                investorRows?.forEach((i: any) => {
                  nameMap.set(`${i.id}:investors`, i.full_name);
                });
              }

              const ackList: AcknowledgmentInvestor[] = recipients.map((r: any) => {
                let status: 'acknowledged' | 'opened' | 'pending' = 'pending';
                if (r.acknowledged_at) status = 'acknowledged';
                else if (r.opened_at) status = 'opened';
                return {
                  id: r.investor_id,
                  name: nameMap.get(`${r.investor_id}:${r.investor_source}`) || 'Unknown Investor',
                  email: r.email || '',
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

        // Fetch linked documents
        const docsResponse = await fetch(`/api/broadcasts/deals/${dealId}/documents`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const docsData = await docsResponse.json();
        setLinkedDocuments(
          (docsData.documents || []).map((d: any) => ({
            name: d.name || '',
            category: d.category || 'General',
            uploadDate: d.upload_date ? formatDate(d.upload_date) : '',
            status: 'uploaded' as const,
            size: d.file_size || '',
          }))
        );

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
  }, [dealId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSendUpdate = async (data: { title: string; message: string; audience: string; sendEmail: boolean }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Your session expired. Please log in again.'); return; }
      const res = await fetch(`/api/broadcasts/deals/${dealId}/send-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ title: data.title, message: data.message, requireAcknowledgment: requireAckByDefault }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) { alert(result?.error || 'Failed to send update.'); return; }
      setSendUpdateOpen(false);
      await loadData();
    } catch (err) {
      console.error('[BROADCAST_DETAIL] send update error:', err);
      alert('Failed to send update.');
    }
  };

  const handleScheduleUpdate = async () => {
    if (!scheduleForm.title || !scheduleForm.message || !scheduleForm.date || !scheduleForm.time) {
      alert('Please fill in the title, message, date and time.');
      return;
    }
    setScheduling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Your session expired. Please log in again.'); return; }
      const res = await fetch(`/api/broadcasts/deals/${dealId}/schedule-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          title: scheduleForm.title,
          message: scheduleForm.message,
          scheduledDate: scheduleForm.date,
          scheduledEstTime: scheduleForm.time,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) { alert(result?.error || 'Failed to schedule update.'); return; }
      setScheduleForm({ title: '', message: '', date: '', time: '' });
      setScheduleOpen(false);
      await loadData();
    } catch (err) {
      console.error('[BROADCAST_DETAIL] schedule update error:', err);
      alert('Failed to schedule update.');
    } finally {
      setScheduling(false);
    }
  };

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
            {latestUpdate && (
              <>
                <span className="text-stone-300">·</span>
                <span>Last update {formatRelative(latestUpdate.sentAt)}</span>
              </>
            )}
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
                  <p className="text-sm text-stone-500">Published {formatRelative(latestUpdate.sentAt)}</p>
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
                        <p className="text-xs text-stone-600 leading-relaxed">{event.description}</p>
                      )}
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
        onSend={handleSendUpdate}
      />

      <ViewDocumentsModal
        isOpen={linkedDocsOpen}
        onClose={() => setLinkedDocsOpen(false)}
        dealName={deal.name}
        documents={linkedDocuments}
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
            <Button onClick={handleScheduleUpdate} disabled={scheduling} className="gap-2 bg-fundex-forest hover:bg-fundex-green disabled:opacity-60">
              <Calendar className="h-4 w-4" /> {scheduling ? 'Scheduling…' : 'Schedule Update'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">Update Title</label>
            <Input
              placeholder="e.g., Q3 Performance Report"
              className="mt-1.5"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Message Body</label>
            <textarea
              placeholder="Enter your scheduled message..."
              rows={6}
              className="mt-1.5 w-full resize-none border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
              value={scheduleForm.message}
              onChange={(e) => setScheduleForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Send Date</label>
              <Input type="date" className="mt-1.5" value={scheduleForm.date} onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Send Time</label>
              <Input type="time" className="mt-1.5" value={scheduleForm.time} onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))} />
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
          {/* Summary card */}
          <div className="grid grid-cols-1 gap-3">
            <div className="border border-red-100 bg-red-50 p-4 text-center">
              <p className="text-2xl font-semibold text-red-700">
                {updates.reduce((s, u) => s + (u.recipientCount - u.acknowledgedCount), 0)}
              </p>
              <p className="mt-1 text-xs text-red-600">Pending Acknowledgments</p>
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
              </div>
            ))}
            {updates.filter(u => u.requireAcknowledgment && u.acknowledgedCount < u.recipientCount).length === 0 && (
              <div className="py-8 text-center text-sm text-stone-400">No pending actions</div>
            )}
          </div>
        </div>
      </ModalShell>

    </>
  );
}
