'use client';

import {
  X, ExternalLink, MessageSquare, FileText, Users,
  Megaphone, UserPlus, Upload, Edit, Lock, Calendar,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
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

export function DealQuickViewModal({ isOpen, onClose, deal }: DealQuickViewModalProps) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [allocationsOpen, setAllocationsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [addAllocationOpen, setAddAllocationOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [editDealOpen, setEditDealOpen] = useState(false);
  const [closeDealOpen, setCloseDealOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);

  // Real data for sub-modals
  const [allocationsData, setAllocationsData] = useState<any[]>([]);
  const [documentsData, setDocumentsData] = useState<any[]>([]);

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

      // Fetch allocations for this deal
      const { data: allocs } = await supabase
        .from('allocations')
        .select('id, allocation_amount, status, funding_status, payment_start_date, term_length, monthly_interest, investors(full_name)')
        .eq('company_id', profile.company_id)
        .eq('deal_id', deal.id);

      if (allocs) {
        setAllocationsData(allocs.map((a: any) => ({
          investorName: a.investors?.full_name || 'Unknown',
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
        })));
      }

      // Fetch documents for this deal
      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, category, upload_date, status, file_size')
        .eq('company_id', profile.company_id)
        .eq('deal_id', deal.id)
        .order('upload_date', { ascending: false });

      if (docs) {
        setDocumentsData(docs.map((d: any) => ({
          name: d.name,
          category: d.category || 'General',
          uploadDate: d.upload_date ? new Date(d.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          status: (d.status?.toLowerCase() === 'published' || d.status?.toLowerCase() === 'signed') ? 'uploaded' as const : d.status?.toLowerCase() === 'draft' ? 'pending' as const : 'missing' as const,
          size: d.file_size || '—',
        })));
      }
    })();
  }, [isOpen, deal]);

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
              <Button className="flex-1 min-w-[140px] gap-2 bg-fundex-forest hover:bg-fundex-green">
                <ExternalLink className="h-4 w-4" /> Open Full Deal
              </Button>
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
      <OpenBroadcastModal isOpen={broadcastOpen} onClose={() => setBroadcastOpen(false)} dealName={deal.name} />
      <ViewDocumentsModal isOpen={documentsOpen} onClose={() => setDocumentsOpen(false)} dealName={deal.name} documents={documentsData.length > 0 ? documentsData : undefined} />
      <ViewAllocationsModal isOpen={allocationsOpen} onClose={() => setAllocationsOpen(false)} dealName={deal.name} allocations={allocationsData.length > 0 ? allocationsData : undefined} />
      <SendUpdateModal isOpen={updateOpen} onClose={() => setUpdateOpen(false)} dealName={deal.name} />
      <AddInvestorAllocationModal isOpen={addAllocationOpen} onClose={() => setAddAllocationOpen(false)} dealName={deal.name} />
      <UploadDocumentModal isOpen={uploadDocOpen} onClose={() => setUploadDocOpen(false)} dealName={deal.name} />
      <EditDealModal isOpen={editDealOpen} onClose={() => setEditDealOpen(false)} deal={{
        name: deal.name,
        targetAmount: deal.targetAmount,
        interestRate: deal.interestRate,
        term: deal.term,
        minimumInvestment: deal.minimumInvestment,
      }} />
      <CloseDealModal isOpen={closeDealOpen} onClose={() => setCloseDealOpen(false)} dealName={deal.name} />
      <PaymentHistoryModal isOpen={paymentHistoryOpen} onClose={() => setPaymentHistoryOpen(false)} dealName={deal.name} />
    </>
  );
}
