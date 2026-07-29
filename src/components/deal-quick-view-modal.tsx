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
import { buildDealPaymentSchedule, type PaymentScheduleRow } from '@/services/payment-schedule';
import { OpenBroadcastModal } from '@/components/deal-modals/open-broadcast-modal';
import { ViewDocumentsModal } from '@/components/deal-modals/view-documents-modal';
import { ViewAllocationsModal } from '@/components/deal-modals/view-allocations-modal';
import { SendUpdateModal } from '@/components/deal-modals/send-update-modal';
import { AddInvestorAllocationModal } from '@/components/deal-modals/add-investor-allocation-modal';
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
  minimumInvestment: number;
  term: string;
  investorCount: number;
}

interface DealQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealQuickViewData | null;
  onDealUpdated?: () => void;
}

interface AllocationRow {
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
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleRow[]>([]);
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
    const { data: allocs } = await supabase
      .from('allocations')
      .select('id, investor_id, allocation_amount, status, funding_status, payment_start_date, term_length, monthly_interest, annual_rate')
      .eq('company_id', cid)
      .eq('deal_id', dealId);

    if (!allocs) return;
    const investorIds = [...new Set(allocs.map((a) => a.investor_id))];
    const nameMap = new Map<string, string>();
    if (investorIds.length > 0) {
      const [{ data: manualInvs }, { data: profileInvs }] = await Promise.all([
        supabase.from('investors').select('id, full_name').in('id', investorIds),
        supabase.from('user_profiles').select('user_id, full_name').in('user_id', investorIds),
      ]);
      (manualInvs || []).forEach((i) => nameMap.set(i.id, i.full_name));
      (profileInvs || []).forEach((p) => nameMap.set(p.user_id, p.full_name));
    }

    setAllocationsData(allocs.map((a) => ({
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
    setPaymentSchedule(buildDealPaymentSchedule(allocs));
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

    setBroadcastsData(updates.map((u) => ({
      title: u.title,
      content: u.message,
      date: new Date(u.sent_at || u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      audience: 'All Investors',
      acknowledged: acked.get(u.id) || 0,
      total: total.get(u.id) || 0,
    })));
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
  const handleAddInvestor = async (d: { investorId: string; amount: string; type: string; notes: string }) => {
    if (!deal) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Your session expired. Please log in again.'); return; }

    const today = new Date().toISOString().slice(0, 10);
    const termMonths = parseInt(String(deal.term).replace(/[^0-9]/g, ''), 10) || 12;
    const confirmed = d.type === 'confirmed';
    try {
      const res = await fetch('/api/allocations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          investor_id: d.investorId,
          deal_id: deal.id,
          allocation_amount: Number(String(d.amount).replace(/[^0-9.]/g, '')) || 0,
          allocation_percentage: 0,
          commit_date: today,
          expected_funding_date: today,
          annual_rate: deal.interestRate,
          term_length: termMonths,
          payment_frequency: 'Monthly',
          payment_start_date: today,
          funding_status: confirmed ? 'Funded' : 'Pending',
          notes: d.notes,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) { alert(json?.message || 'Failed to add allocation'); return; }
      if (companyId) await fetchAllocations(companyId, deal.id);
      onDealUpdated?.();
    } catch {
      alert('Failed to add allocation. Please try again.');
    }
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
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Interest Rate</p>
                  <p className="text-sm font-semibold text-stone-900">{deal.interestRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Monthly Interest</p>
                  <p className="text-sm font-semibold text-purple-600">{fmtM(deal.monthlyInterest)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Min Investment</p>
                  <p className="text-sm font-semibold text-stone-900">{fmtM(deal.minimumInvestment)}</p>
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
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAddAllocationOpen(true)}>
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
      <AddInvestorAllocationModal isOpen={addAllocationOpen} onClose={() => setAddAllocationOpen(false)} dealName={deal.name} onAdd={handleAddInvestor} />
      <UploadDocumentModal isOpen={uploadDocOpen} onClose={() => setUploadDocOpen(false)} dealName={deal.name} onUpload={handleUploadDocument} />
      <EditDealModal isOpen={editDealOpen} onClose={() => setEditDealOpen(false)} deal={{
        name: deal.name,
        targetAmount: deal.targetAmount,
        interestRate: deal.interestRate,
        term: deal.term,
        minimumInvestment: deal.minimumInvestment,
      }}
        onSave={async (d) => {
          const num = (s: string) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
          await handleSaveDeal({
            name: d.name,
            target_amount: num(d.targetAmount),
            interest_rate: num(d.interestRate),
            term: d.term,
            minimum_investment: num(d.minimumInvestment),
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
