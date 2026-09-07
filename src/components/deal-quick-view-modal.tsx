'use client';

import {
  X, MessageSquare, FileText, Users,
  Megaphone, UserPlus, Upload, Edit, Lock, Calendar,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { dealPayoutDates } from '@/services/payout-service';
import { OpenBroadcastModal } from '@/components/deal-modals/open-broadcast-modal';
import { ViewDocumentsModal } from '@/components/deal-modals/view-documents-modal';
import { ViewAllocationsModal } from '@/components/deal-modals/view-allocations-modal';
import { SendUpdateModal } from '@/components/deal-modals/send-update-modal';
import { AddAllocationModal } from '@/components/add-allocation-modal';
import { UploadDocumentModal } from '@/components/deal-modals/upload-document-modal';
import { EditDealModal } from '@/components/deal-modals/edit-deal-modal';
import { CloseDealModal } from '@/components/deal-modals/close-deal-modal';
import { PaymentHistoryModal } from '@/components/deal-modals/payment-history-modal';

export interface DealQuickViewData {
  id: string;
  name: string;
  dealId: string;
  status: string;
  type: string;
  location: string;
  targetAmount: number;
  raisedAmount: number;
  progress: number;
  interestRate: number;
  monthlyInterest: number;
  term: string;
  investorCount: number;
}

interface DealQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealQuickViewData | null;
  onDealUpdated?: () => void;
}

// Real payout-schedule row: dates come from the deal's payout schedule (the
// same source Payments uses) and statuses from what was actually recorded —
// never projected from "past date + funded = paid".
interface ScheduleRow {
  number: number;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'upcoming' | 'late';
}

interface AllocationRow {
  investorId: string;
  investorName: string;
  committedAmount: number;
  status: 'Confirmed' | 'Soft Commit';
  fundingStatus: string;
  paymentsCompleted: number;
  totalPayments: number;
  nextPayment: string;
  paymentStartDate: string | null;
  termLength: number | null;
  monthlyInterest: number | null;
  annualRate: number | null;
  payoutSchedule: ScheduleRow[];
}

interface DocumentRow {
  name: string;
  category: string;
  uploadDate: string;
  status: 'uploaded' | 'pending' | 'missing';
  size: string;
}

function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-fundex-gold/10 text-fundex-forest border-fundex-gold/30';
    case 'funding': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'due diligence': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'closed': return 'bg-stone-100 text-stone-600 border-stone-200';
    default: return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}

export function DealQuickViewModal({ isOpen, onClose, deal, onDealUpdated }: DealQuickViewModalProps) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [closingDeal, setClosingDeal] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [allocationsOpen, setAllocationsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [addAllocationOpen, setAddAllocationOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [editDealOpen, setEditDealOpen] = useState(false);
  const [closeDealOpen, setCloseDealOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);

  // Real data for sub-modals
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [allocationsData, setAllocationsData] = useState<AllocationRow[]>([]);
  const [documentsData, setDocumentsData] = useState<DocumentRow[]>([]);
  const [paymentSchedule, setPaymentSchedule] = useState<ScheduleRow[]>([]);
  const [broadcastsData, setBroadcastsData] = useState<
    { title: string; content: string; date: string; audience: string; acknowledged: number; total: number }[]
  >([]);

  const fetchDocuments = async (cid: string, dealId: string) => {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, category, upload_date, status, file_size')
      .eq('company_id', cid)
      .eq('deal_id', dealId)
      .order('upload_date', { ascending: false });

    if (docs) {
      setDocumentsData(docs.map((d) => ({
        name: d.name,
        category: d.category || 'General',
        uploadDate: d.upload_date ? new Date(d.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        status: (d.status?.toLowerCase() === 'published' || d.status?.toLowerCase() === 'signed') ? 'uploaded' as const : d.status?.toLowerCase() === 'draft' ? 'pending' as const : 'missing' as const,
        size: d.file_size || '—',
      })));
    }
  };

  // Fetch this deal's allocations + payment schedule. Investor names are resolved
  // via a name map (investors + user_profiles) rather than a PostgREST embed —
  // allocations.investor_id has no single FK (dual investor identity), so
  // `investors(full_name)` embedding returns a 400.
  const fetchAllocations = async (cid: string, dealId: string) => {
    const [{ data: allocs }, { data: dealRow }] = await Promise.all([
      supabase
        .from('allocations')
        .select('id, investor_id, allocation_amount, status, funding_status, payment_start_date, term_length, monthly_interest, annual_rate')
        .eq('company_id', cid)
        .eq('deal_id', dealId),
      supabase
        .from('deals')
        .select('first_payout_date, payout_cycle, term_length_months, status, close_date')
        .eq('company_id', cid)
        .eq('id', dealId)
        .single(),
    ]);

    if (!allocs) return;
    const investorIds = [...new Set(allocs.map((a) => a.investor_id))];
    const nameMap = new Map<string, string>();
    // Recorded payout statuses for this deal's investors, keyed inv:date —
    // the SAME truth the Payments page shows (completed / partial / missed).
    const payoutStatus = new Map<string, string>();
    if (investorIds.length > 0) {
      const [{ data: manualInvs }, { data: profileInvs }, { data: payoutRows }] = await Promise.all([
        supabase.from('investors').select('id, full_name').in('id', investorIds),
        supabase.from('user_profiles').select('user_id, full_name').in('user_id', investorIds),
        supabase.from('investor_payouts').select('investor_id, due_date, status').eq('company_id', cid).in('investor_id', investorIds),
      ]);
      (manualInvs || []).forEach((i) => nameMap.set(i.id, i.full_name));
      (profileInvs || []).forEach((p) => nameMap.set(p.user_id, p.full_name));
      (payoutRows || []).forEach((r) => payoutStatus.set(`${r.investor_id}:${r.due_date}`, r.status));
    }

    // One payout-date source: the deal-level schedule Payments runs on.
    const schedDates = dealPayoutDates(
      dealRow?.first_payout_date ?? null,
      dealRow?.payout_cycle ?? null,
      dealRow?.term_length_months ?? null,
      dealRow?.status ?? null,
      dealRow?.close_date ?? null
    );
    const todayIso = new Date().toISOString().slice(0, 10);
    const fmt = (iso: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : iso;
    };
    const rowStatus = (invId: string, date: string): ScheduleRow['status'] => {
      const st = payoutStatus.get(`${invId}:${date}`);
      if (st === 'completed') return 'paid';
      if (st === 'missed') return 'late';
      if (date > todayIso) return 'upcoming';
      return 'pending'; // partial or nothing recorded on a due/past date
    };
    const scheduleFor = (invId: string, monthly: number): ScheduleRow[] =>
      schedDates.map((d, i) => ({ number: i + 1, dueDate: fmt(d), amount: Math.round(monthly), status: rowStatus(invId, d) }));

    setAllocationsData(allocs.map((a) => ({
      investorId: a.investor_id,
      payoutSchedule: a.funding_status === 'Funded' ? scheduleFor(a.investor_id, Number(a.monthly_interest || 0)) : [],
      investorName: nameMap.get(a.investor_id) || 'Unknown',
      committedAmount: Number(a.allocation_amount || 0),
      status: a.status === 'confirmed' ? 'Confirmed' as const : 'Soft Commit' as const,
      fundingStatus: a.funding_status || 'Pending',
      paymentsCompleted: (() => {
        if (!a.payment_start_date || a.funding_status !== 'Funded') return 0;
        const start = new Date(a.payment_start_date);
        const now = new Date();
        return Math.max(0, Math.min(Number(a.term_length || 0), Math.floor((now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth())));
      })(),
      totalPayments: Number(a.term_length || 0),
      nextPayment: a.funding_status === 'Funded' ? 'Scheduled' : 'TBD',
      paymentStartDate: a.payment_start_date,
      termLength: a.term_length != null ? Number(a.term_length) : null,
      monthlyInterest: a.monthly_interest != null ? Number(a.monthly_interest) : null,
      annualRate: a.annual_rate != null ? Number(a.annual_rate) : null,
    })));
    // Deal-level schedule: sum funded allocations per scheduled date; a date is
    // paid only when EVERY funded investor's recorded payout is completed.
    const funded = allocs.filter((a) => a.funding_status === 'Funded');
    const dealTotal = funded.reduce((s2, a) => s2 + Math.round(Number(a.monthly_interest || 0)), 0);
    setPaymentSchedule(schedDates.map((d, i) => {
      const statuses = funded.map((a) => payoutStatus.get(`${a.investor_id}:${d}`));
      let status: ScheduleRow['status'];
      if (funded.length > 0 && statuses.every((st) => st === 'completed')) status = 'paid';
      else if (funded.length > 0 && statuses.every((st) => st === 'missed')) status = 'late';
      else if (d > todayIso) status = 'upcoming';
      else status = 'pending';
      return { number: i + 1, dueDate: fmt(d), amount: dealTotal, status };
    }));
  };

  // Fetch this deal's broadcast updates (title, content, date) with real
  // acknowledged/total counts from the recipients table — no hardcoded samples.
  const fetchBroadcasts = async (dealId: string) => {
    const { data: updates } = await supabase
      .from('broadcast_updates')
      .select('id, title, message, sent_at, created_at, require_acknowledgment')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (!updates || updates.length === 0) { setBroadcastsData([]); return; }

    const ids = updates.map((u) => u.id);
    const total = new Map<string, number>();
    const acked = new Map<string, number>();
    const { data: recips } = await supabase
      .from('broadcast_update_recipients')
      .select('broadcast_update_id, acknowledged_at')
      .in('broadcast_update_id', ids);
    (recips || []).forEach((r) => {
      total.set(r.broadcast_update_id, (total.get(r.broadcast_update_id) || 0) + 1);
      if (r.acknowledged_at) acked.set(r.broadcast_update_id, (acked.get(r.broadcast_update_id) || 0) + 1);
    });

    setBroadcastsData(updates.map((u) => {
      const recipients = total.get(u.id) || 0;
      return {
        title: u.title,
        content: u.message,
        date: new Date(u.sent_at || u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        audience: recipients > 0 ? `${recipients} investor${recipients === 1 ? '' : 's'}` : 'All investors',
        acknowledged: acked.get(u.id) || 0,
        total: recipients,
      };
    }));
  };

  useEffect(() => {
    if (!isOpen || !deal) return;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);

      await fetchAllocations(profile.company_id, deal.id);
      await fetchDocuments(profile.company_id, deal.id);
      await fetchBroadcasts(deal.id);
    })();
  }, [isOpen, deal]);

  const handleUploadDocument = async ({ name, category, file }: { name: string; category: string; file: File }) => {
    if (!deal || !companyId) {
      alert('Unable to determine company. Please refresh the page.');
      throw new Error('Missing deal or company context');
    }

    const docId = `DOC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const fileExt = file.name.split('.').pop();
    const filePath = `documents/${docId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      alert('Failed to upload file to storage');
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('documents').insert([{
      company_id: companyId,
      deal_id: deal.id,
      document_id: docId,
      name,
      type: category,
      category: 'Deal Documents',
      upload_date: new Date().toISOString(),
      uploaded_by: 'Admin',
      status: 'Draft',
      file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      file_type: file.type,
      file_url: urlData.publicUrl,
      tags: [category, 'Deal Documents', 'Draft'],
    }]);

    if (dbError) {
      console.error('Error creating document record:', dbError);
      alert('File uploaded but failed to save document record');
      throw dbError;
    }

    await fetchDocuments(companyId, deal.id);
  };

  // Persist a deal patch via the tenant-scoped API, then refresh the parent list.
  const patchDeal = async (body: Record<string, unknown>) => {
    if (!deal) throw new Error('No deal');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session expired. Please log in again.');

    const res = await fetch(`/api/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(json?.message || 'Request failed');
    return json.deal;
  };

  const handleCloseDeal = async () => {
    setClosingDeal(true);
    try {
      await patchDeal({ action: 'close' });
      onDealUpdated?.();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to close deal');
    } finally {
      setClosingDeal(false);
    }
  };

  const handleSaveDeal = async (patch: Record<string, unknown>) => {
    await patchDeal(patch);
    onDealUpdated?.();
  };

  // Send an investor update for this deal via the existing broadcast endpoint.
  const handleSendUpdate = async (data: { title: string; message: string; audience: string; sendEmail: boolean }) => {
    if (!deal) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Your session expired. Please log in again.'); return; }

    try {
      const res = await fetch(`/api/broadcasts/deals/${deal.id}/send-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ dealId: deal.id, title: data.title, message: data.message, requireAcknowledgment: false }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { alert(json?.error || 'Failed to send update'); return; }
      await fetchBroadcasts(deal.id);
    } catch {
      alert('Failed to send update. Please try again.');
    }
  };

  // Create an allocation for this deal via the tenant-scoped allocation API.
  // One allocation workflow everywhere: this posts the SAME payload shape as
  // Admin -> Allocations -> New Allocation, driven by the same AddAllocationModal
  // (deal pre-selected). No parallel investor/deal relationship form exists.
  const handleCreateAllocation = async (formData: {
    investor_id: string;
    deal_id: string;
    allocation_amount: number;
    commit_date: string;
    expected_funding_date: string;
    annual_rate: number;
    term_length: number;
    term_unit: string;
    payment_frequency: string;
    payment_start_date: string;
    funding_status: string;
    notes: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Your session expired. Please log in again.'); return; }

    const res = await fetch('/api/allocations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        investor_id: formData.investor_id,
        deal_id: formData.deal_id,
        allocation_amount: formData.allocation_amount,
        allocation_percentage: 0,
        commit_date: formData.commit_date,
        expected_funding_date: formData.expected_funding_date,
        annual_rate: formData.annual_rate,
        term_length: formData.term_unit === 'years' ? formData.term_length * 12 : formData.term_length,
        payment_frequency: formData.payment_frequency,
        payment_start_date: formData.payment_start_date,
        funding_status: formData.funding_status,
        notes: formData.notes,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || 'Failed to create allocation');
    }
    if (deal && companyId) await fetchAllocations(companyId, deal.id);
    onDealUpdated?.();
    setAddAllocationOpen(false);
  };

  if (!isOpen || !deal) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden border border-stone-100 bg-white shadow-xl">
          {/* Header */}
          <div className="shrink-0 border-b border-stone-100 bg-stone-50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-stone-900">{deal.name}</h2>
                  <Badge className={`border ${getStatusColor(deal.status)}`}>{deal.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <span className="font-medium">ID: {deal.dealId}</span>
                  <span>·</span>
                  <span>{deal.type}</span>
                  {deal.location && (
                    <>
                      <span>·</span>
                      <span>{deal.location}</span>
                    </>
                  )}
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-stone-400 transition hover:text-stone-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">
            {/* Financial Snapshot */}
            <div className="border border-stone-100 p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Financial Snapshot</h3>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Target Raise</p>
                  <p className="text-lg font-semibold text-stone-900">{fmtM(deal.targetAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Raised Amount</p>
                  <p className="text-lg font-semibold text-fundex-forest">{fmtM(deal.raisedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Funding Progress</p>
                  <p className="text-lg font-semibold text-blue-600">{deal.progress}%</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-5 h-2 w-full overflow-hidden bg-stone-100">
                <div className="h-full bg-gradient-to-r from-fundex-forest to-fundex-green transition-all" style={{ width: `${deal.progress}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Interest Rate</p>
                  <p className="text-sm font-semibold text-stone-900">{deal.interestRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Monthly Interest</p>
                  <p className="text-sm font-semibold text-purple-600">{fmtM(deal.monthlyInterest)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Term</p>
                  <p className="text-sm font-semibold text-stone-900">{deal.term}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-stone-100 p-4">
                <p className="text-xs text-stone-500 mb-1">Investors</p>
                <p className="text-lg font-semibold text-stone-900">{deal.investorCount}</p>
              </div>
              <div className="border border-stone-100 p-4">
                <p className="text-xs text-stone-500 mb-1">Raised / Target</p>
                <p className="text-lg font-semibold text-stone-900">
                  {fmtM(deal.raisedAmount)} / {fmtM(deal.targetAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer — Quick Actions */}
          <div className="shrink-0 border-t border-stone-100 bg-stone-50 p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" className="flex-1 min-w-[140px] gap-2" onClick={() => setBroadcastOpen(true)}>
                <MessageSquare className="h-4 w-4" /> Broadcast
              </Button>
              <Button variant="outline" className="flex-1 min-w-[140px] gap-2" onClick={() => setDocumentsOpen(true)}>
                <FileText className="h-4 w-4" /> Documents
              </Button>
              <Button variant="outline" className="flex-1 min-w-[140px] gap-2" onClick={() => setAllocationsOpen(true)}>
                <Users className="h-4 w-4" /> Allocations
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setUpdateOpen(true)}>
                <Megaphone className="h-3.5 w-3.5" /> Send Update
              </Button>
              {/* Disabled until the tenant id resolves so the allocation modal
                  never opens with an empty company scope. */}
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={!companyId} onClick={() => setAddAllocationOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Add Investor
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setUploadDocOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Upload Doc
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditDealOpen(true)}>
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setCloseDealOpen(true)}>
                <Lock className="h-3.5 w-3.5" /> Close
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setPaymentHistoryOpen(true)}>
                <Calendar className="h-3.5 w-3.5" /> Payments
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <OpenBroadcastModal isOpen={broadcastOpen} onClose={() => setBroadcastOpen(false)} dealName={deal.name} broadcasts={broadcastsData} onSendNew={() => setUpdateOpen(true)} />
      <ViewDocumentsModal isOpen={documentsOpen} onClose={() => setDocumentsOpen(false)} dealName={deal.name} documents={documentsData} onUploadClick={() => setUploadDocOpen(true)} />
      <ViewAllocationsModal isOpen={allocationsOpen} onClose={() => setAllocationsOpen(false)} dealName={deal.name} allocations={allocationsData} onAddInvestor={() => setAddAllocationOpen(true)} />
      <SendUpdateModal isOpen={updateOpen} onClose={() => setUpdateOpen(false)} dealName={deal.name} onSend={handleSendUpdate} />
      <AddAllocationModal
        isOpen={addAllocationOpen}
        onClose={() => setAddAllocationOpen(false)}
        onSave={handleCreateAllocation}
        companyId={companyId ?? ''}
        preselectedDealId={deal.id}
      />
      <UploadDocumentModal isOpen={uploadDocOpen} onClose={() => setUploadDocOpen(false)} dealName={deal.name} onUpload={handleUploadDocument} />
      <EditDealModal isOpen={editDealOpen} onClose={() => setEditDealOpen(false)} deal={{
        name: deal.name,
        targetAmount: deal.targetAmount,
        interestRate: deal.interestRate,
        term: deal.term,
      }}
        onSave={async (d) => {
          const num = (s: string) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
          await handleSaveDeal({
            name: d.name,
            target_amount: num(d.targetAmount),
            interest_rate: num(d.interestRate),
            term: d.term,
          });
        }}
      />
      <CloseDealModal
        isOpen={closeDealOpen}
        onClose={() => setCloseDealOpen(false)}
        dealName={deal.name}
        onConfirm={handleCloseDeal}
        loading={closingDeal}
      />
      <PaymentHistoryModal isOpen={paymentHistoryOpen} onClose={() => setPaymentHistoryOpen(false)} dealName={deal.name} payments={paymentSchedule} />
    </>
  );
}
