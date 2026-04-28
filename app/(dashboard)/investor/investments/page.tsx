'use client';

import {
  Banknote,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  DollarSign,
  Download,
  FileText,
  Filter,
  Loader2,
  PieChart,
  Search,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

/* ────────────────────────── Types ────────────────────────── */

interface Investment {
  id: string;
  dealId: string;
  dealName: string;
  dealType: string;
  dealStatus: string;
  dealSize: number;
  investedAmount: number;
  status: string;
  fundingStatus: string;
  monthlyInterest: number;
  annualRate: number;
  paymentsCompleted: number;
  totalPayments: number;
  nextPaymentDate: string | null;
  maturityDate: string | null;
  ltv: number;
  totalEarned: number;
  totalExpectedReturn: number;
  allocationPercentage: number;
  commitDate: string;
  location: string;
}

interface InvestmentsData {
  investments: Investment[];
  maturingPositions: Investment[];
  stats: {
    totalCapital: number;
    activeCapital: number;
    avgPositionSize: number;
    largestInvestment: number;
    monthlyIncome: number;
    activeDealCount: number;
  };
}

/* ────────────────────────── Helpers ────────────────────────── */

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ────────────────────────── UI Components ────────────────────────── */

function SummaryCard({ icon, title, value, sublabel }: { icon: ReactNode; title: string; value: string; sublabel?: string }) {
  return (
    <div className="flex h-full min-w-0 flex-col border border-stone-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center bg-fundex-gold/10 text-fundex-forest">{icon}</div>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <p className="mt-2 whitespace-nowrap text-xl font-semibold tabular-nums tracking-tight text-stone-900 sm:text-2xl">{value}</p>
      {sublabel ? <p className="mt-1 text-sm text-stone-500">{sublabel}</p> : null}
    </div>
  );
}

function DetailCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`border border-stone-100 bg-white p-5 shadow-sm md:p-6 ${className ?? ''}`}>
      <h3 className="text-sm font-medium text-stone-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MetricMiniCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="border border-stone-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900 md:text-xl">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{subtext}</p>
    </div>
  );
}

function PaymentScheduleItem({ title, date, amount, status }: { title: string; date: string; amount: string; status: string }) {
  return (
    <div className="flex items-center gap-3 border border-stone-100 bg-fundex-gold/5 px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-fundex-gold/10 text-fundex-forest">
        <Banknote className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-900">{title}</p>
        <p className="text-xs text-stone-500">{date}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm font-semibold tabular-nums text-stone-900">{amount}</span>
        <span className="inline-flex bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-medium text-fundex-forest">{status}</span>
      </div>
    </div>
  );
}

/* ────────────────────────── Investment Details Drawer ────────────────────────── */

function InvestmentDetailsDrawer({ open, onClose, investment }: { open: boolean; onClose: () => void; investment: Investment | null }) {
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'payments' | 'documents' | 'activity'>('overview');

  useEffect(() => {
    if (open) {
      setPanelVisible(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPanelEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setPanelEntered(false);
    const t = window.setTimeout(() => setPanelVisible(false), 300);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!panelVisible || !investment) return null;

  const progressPct = investment.totalPayments > 0 ? (investment.paymentsCompleted / investment.totalPayments) * 100 : 0;
  const earnedPct = investment.totalExpectedReturn > 0 ? Math.round((investment.totalEarned / investment.totalExpectedReturn) * 100) : 0;
  const paymentsRemaining = investment.totalPayments - investment.paymentsCompleted;
  const statusLabel = investment.fundingStatus === 'Funded' ? (investment.dealStatus === 'Active' ? 'Active' : investment.dealStatus) : investment.fundingStatus;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="investment-drawer-title">
      <div
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${panelEntered ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-full shadow-2xl transition-transform duration-300 ease-out md:w-1/2 md:max-w-[50vw] ${panelEntered ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full w-full flex-col bg-white">
          <div className="relative shrink-0 bg-gradient-to-br from-fundex-forest to-fundex-green px-6 py-6 text-white shadow-md md:px-8 md:py-7">
            <button type="button" onClick={onClose} aria-label="Close panel" className="absolute right-4 top-4 p-2 text-white/90 transition hover:bg-white/10 hover:text-white md:right-5 md:top-5">
              <X className="h-5 w-5" />
            </button>
            <h2 id="investment-drawer-title" className="pr-12 text-xl font-medium tracking-tight md:text-2xl">{investment.dealName}</h2>
            <p className="mt-1.5 text-sm font-medium text-white/80">Deal ID: {investment.dealId}</p>
          </div>

          {/* Drawer Tabs */}
          <div className="shrink-0 border-b border-stone-200 px-5 md:px-8">
            <div className="flex gap-1 -mb-px overflow-x-auto">
              {([
                { key: 'overview' as const, label: 'Overview' },
                { key: 'payments' as const, label: 'Payments' },
                { key: 'documents' as const, label: 'Documents' },
                { key: 'activity' as const, label: 'Activity' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDrawerTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    drawerTab === tab.key
                      ? 'border-fundex-forest text-fundex-forest'
                      : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-7">

            {/* Payments Tab */}
            {drawerTab === 'payments' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900">Payment Schedule</h3>
                <div className="space-y-2">
                  {Array.from({ length: investment.totalPayments }).map((_, i) => {
                    const isPaid = i < investment.paymentsCompleted;
                    const isNext = i === investment.paymentsCompleted;
                    const startDate = new Date(investment.commitDate);
                    const payDate = new Date(startDate);
                    payDate.setMonth(payDate.getMonth() + i);
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${isPaid ? 'bg-emerald-50/50 border-emerald-100' : isNext ? 'bg-amber-50/50 border-amber-100' : 'bg-stone-50 border-stone-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${isPaid ? 'bg-emerald-100 text-emerald-700' : isNext ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-500'}`}>
                            {isPaid ? '✓' : i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">Payment #{i + 1}</p>
                            <p className="text-xs text-stone-500">{payDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold tabular-nums ${isPaid ? 'text-emerald-700' : 'text-stone-900'}`}>{formatCurrency(investment.monthlyInterest)}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 ${isPaid ? 'bg-emerald-100 text-emerald-700' : isNext ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                            {isPaid ? 'Paid' : isNext ? 'Upcoming' : 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {drawerTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900">Related Documents</h3>
                {[
                  { name: `Subscription Agreement - ${investment.dealName}`, date: formatDate(investment.commitDate) },
                  { name: `${investment.dealName} - Deal Summary`, date: formatDate(investment.commitDate) },
                  { name: `${investment.dealName} - Payment Schedule`, date: formatDate(investment.commitDate) },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-stone-100 rounded-lg hover:border-fundex-gold/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{doc.name}</p>
                        <p className="text-xs text-stone-500">Uploaded {doc.date}</p>
                      </div>
                    </div>
                    <button className="p-2 text-stone-400 hover:text-stone-600">
                      <Download className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Tab */}
            {drawerTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900">Activity Updates</h3>
                {[
                  { type: 'payment', title: 'Payment Processed', desc: `Monthly interest payment of ${formatCurrency(investment.monthlyInterest)} sent to your account.`, date: 'Jul 1, 2026', time: '9:30 AM' },
                  { type: 'update', title: 'Deal Update', desc: `${investment.dealName} remains on schedule. All borrower obligations current.`, date: 'Jun 15, 2026', time: '2:00 PM' },
                  { type: 'document', title: 'Document Uploaded', desc: 'Monthly performance report is now available.', date: 'Jun 1, 2026', time: '10:15 AM' },
                  { type: 'payment', title: 'Investment Confirmed', desc: `Your investment of ${formatCurrency(investment.investedAmount)} has been confirmed.`, date: formatDate(investment.commitDate), time: '2:15 PM' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 border border-stone-100 rounded-lg">
                    <div className={`size-9 shrink-0 rounded-lg flex items-center justify-center ${item.type === 'payment' ? 'bg-emerald-50 text-emerald-600' : item.type === 'document' ? 'bg-blue-50 text-blue-600' : 'bg-fundex-cream text-fundex-forest'}`}>
                      {item.type === 'payment' ? <DollarSign className="size-4" /> : item.type === 'document' ? <FileText className="size-4" /> : <Bell className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900">{item.title}</p>
                      <p className="text-xs text-stone-600 mt-0.5">{item.desc}</p>
                      <p className="text-[10px] text-stone-400 mt-1">{item.date} &bull; {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Overview Tab (existing content) */}
            {drawerTab === 'overview' && <div className="space-y-6">
              <DetailCard title="Deal Overview">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="border border-stone-100 bg-stone-50/60 p-4">
                    <p className="text-xs font-medium text-stone-500">Deal Size</p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">{formatCurrency(investment.dealSize)}</p>
                  </div>
                  <div className="border border-stone-100 bg-stone-50/60 p-4">
                    <p className="text-xs font-medium text-stone-500">Your Investment</p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-fundex-forest">{formatCurrency(investment.investedAmount)}</p>
                  </div>
                  <div className="border border-stone-100 bg-stone-50/60 p-4">
                    <p className="text-xs font-medium text-stone-500">Your Ownership</p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">{investment.allocationPercentage.toFixed(1)}%</p>
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Investment Details">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex justify-between gap-4 border-b border-stone-100 py-2 sm:block sm:border-0 sm:py-0">
                    <dt className="text-sm text-stone-500">Status</dt>
                    <dd className="text-sm font-semibold text-stone-900">
                      <span className="inline-flex bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-medium text-fundex-forest">{statusLabel}</span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-stone-100 py-2 sm:block sm:border-0 sm:py-0">
                    <dt className="text-sm text-stone-500">Interest Rate</dt>
                    <dd className="text-sm font-semibold tabular-nums text-stone-900">{investment.annualRate}%</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-stone-100 py-2 sm:block sm:border-0 sm:py-0">
                    <dt className="text-sm text-stone-500">Start Date</dt>
                    <dd className="text-sm font-semibold text-stone-900">{formatDate(investment.commitDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2 sm:block sm:py-0">
                    <dt className="text-sm text-stone-500">Maturity Date</dt>
                    <dd className="text-sm font-semibold text-stone-900">{formatDate(investment.maturityDate)}</dd>
                  </div>
                </dl>
              </DetailCard>

              <div className="border border-stone-100 bg-fundex-gold/5 p-5 shadow-sm md:p-6">
                <h3 className="text-sm font-medium text-stone-900">Financial Details</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MetricMiniCard label="Interest Rate" value={`${investment.annualRate}%`} subtext="Annual rate" />
                  <MetricMiniCard label="Monthly Interest" value={formatCurrency(investment.monthlyInterest)} subtext="Per month" />
                  <MetricMiniCard label="Total Expected Return" value={formatCurrency(investment.totalExpectedReturn)} subtext="At maturity" />
                  <MetricMiniCard label="Interest Earned to Date" value={formatCurrency(investment.totalEarned)} subtext={`${earnedPct}% earned`} />
                </div>
                <div className="mt-6 border border-stone-100 bg-white/70 p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900">Payment Progress</p>
                    <p className="text-sm font-semibold tabular-nums text-stone-600">{investment.paymentsCompleted} / {investment.totalPayments} payments</p>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden bg-stone-200/80">
                    <div className="h-full bg-fundex-gold transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-stone-500">
                    <span className="font-medium tabular-nums text-stone-600">{formatCurrency(investment.totalEarned)} earned</span>
                    <span>{paymentsRemaining} payments remaining</span>
                  </div>
                </div>
              </div>
            </div>}

            {/* Action Buttons — visible on all tabs when investment is active */}
            {(investment.fundingStatus === 'Funded' && investment.dealStatus === 'Active') && (
              <div className="grid grid-cols-2 gap-3 pt-6 mt-6 border-t border-stone-100">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-fundex-gold/30 text-fundex-forest bg-fundex-cream/30 hover:bg-fundex-cream/60 transition-colors">
                  <svg className="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  Reinvest at Maturity
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 transition-colors">
                  <svg className="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  Request Withdrawal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Investments Table ────────────────────────── */

function InvestmentsTable({ investments, onViewClick }: { investments: Investment[]; onViewClick: (inv: Investment) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return investments.filter((inv) => {
      const matchesSearch = !searchQuery || inv.dealName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && inv.fundingStatus === 'Funded' && inv.dealStatus === 'Active') ||
        (statusFilter === 'pending' && inv.fundingStatus !== 'Funded') ||
        (statusFilter === 'completed' && (inv.dealStatus === 'Closed' || inv.dealStatus === 'Completed'));
      return matchesSearch && matchesStatus;
    });
  }, [investments, searchQuery, statusFilter]);

  return (
    <section className="border border-stone-100 bg-white p-6 shadow-sm md:p-7">
      <h2 className="text-lg font-medium text-stone-900">All Investments</h2>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search by deal name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-stone-50">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-50 bg-transparent text-xs font-semibold uppercase tracking-wide text-stone-400">
              <th className="whitespace-nowrap px-4 py-3">Deal Name</th>
              <th className="whitespace-nowrap px-4 py-3">Your Investment</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Monthly Interest</th>
              <th className="whitespace-nowrap px-4 py-3">Progress</th>
              <th className="whitespace-nowrap px-4 py-3">LTV</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-400">
                  No investments found
                </td>
              </tr>
            ) : (
              filtered.map((inv) => {
                const statusLabel = inv.fundingStatus === 'Funded'
                  ? (inv.dealStatus === 'Active' ? 'Active' : inv.dealStatus)
                  : inv.fundingStatus;
                const progressPct = inv.totalPayments > 0 ? Math.round((inv.paymentsCompleted / inv.totalPayments) * 100) : 0;
                const ltvColor = inv.ltv <= 65 ? 'bg-fundex-forest' : inv.ltv <= 75 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <tr key={inv.id} className="bg-white hover:bg-stone-50/50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-stone-900">{inv.dealName}</p>
                      <p className="text-xs text-stone-500">{inv.dealId}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="font-semibold tabular-nums text-fundex-forest">{formatCurrency(inv.investedAmount)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-medium text-fundex-forest">{statusLabel}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium tabular-nums text-stone-900">{formatCurrency(inv.monthlyInterest)}</p>
                      <p className="text-xs text-stone-500">{inv.annualRate}% APR</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-stone-100">
                          <div className="h-full bg-fundex-gold transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-stone-500">{inv.paymentsCompleted}/{inv.totalPayments}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {inv.ltv > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${ltvColor}`} />
                          <span className="text-sm tabular-nums text-stone-700">{inv.ltv}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-stone-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewClick(inv)}
                        className="bg-fundex-gold px-4 py-2 text-xs font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ────────────────────────── Maturing Positions Table ────────────────────────── */

type MaturityFilterValue = 'all' | '30' | '60' | '90';

function MaturingTable({ positions }: { positions: Investment[] }) {
  const [maturityFilter, setMaturityFilter] = useState<MaturityFilterValue>('all');

  const filtered = useMemo(() => {
    if (maturityFilter === 'all') return positions;
    const days = Number(maturityFilter);
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return positions.filter((p) => p.maturityDate && new Date(p.maturityDate) <= cutoff);
  }, [positions, maturityFilter]);

  const totalMaturing = positions.reduce((s, p) => s + p.investedAmount, 0);
  const nextMaturity = positions.length > 0
    ? positions.reduce((earliest, p) => {
        if (!p.maturityDate) return earliest;
        return !earliest || new Date(p.maturityDate) < new Date(earliest) ? p.maturityDate : earliest;
      }, '' as string)
    : null;

  if (positions.length === 0) return null;

  return (
    <section className="border border-stone-100 bg-white p-6 shadow-sm md:p-7">
      <h2 className="text-lg font-medium text-stone-900">Maturing Positions — Action Required</h2>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
          <div className="border border-stone-100 bg-fundex-gold/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-fundex-forest">Total Capital Maturing</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">{formatCurrency(totalMaturing)}</p>
          </div>
          <div className="border border-stone-100 bg-fundex-gold/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-fundex-forest">Number of Positions</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">{positions.length}</p>
          </div>
          <div className="border border-stone-100 bg-fundex-gold/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-fundex-forest">Next Maturity</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">{formatDate(nextMaturity)}</p>
          </div>
        </div>
        <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
          <div className="relative w-full min-w-[10.5rem] sm:w-44">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <select
              aria-label="Filter maturing positions by timeframe"
              value={maturityFilter}
              onChange={(e) => setMaturityFilter(e.target.value as MaturityFilterValue)}
              className="w-full appearance-none border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
            >
              <option value="all">All</option>
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-stone-50">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-50 bg-transparent text-xs font-semibold uppercase tracking-wide text-stone-400">
              <th className="whitespace-nowrap px-4 py-3">Deal Name</th>
              <th className="whitespace-nowrap px-4 py-3">Amount</th>
              <th className="whitespace-nowrap px-4 py-3">Maturity Date</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.map((pos) => (
              <tr key={pos.id} className="bg-white hover:bg-stone-50/50">
                <td className="px-4 py-4">
                  <p className="font-semibold text-stone-900">{pos.dealName}</p>
                  <p className="text-xs text-stone-500">{pos.dealId}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="font-semibold tabular-nums text-fundex-forest">{formatCurrency(pos.investedAmount)}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-stone-700">{formatDate(pos.maturityDate)}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="inline-flex bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">Maturing Soon</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="bg-fundex-forest px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-fundex-green">
                      Reinvest
                    </button>
                    <button type="button" className="border border-fundex-gold/30 bg-white px-3 py-1.5 text-xs font-medium text-fundex-forest shadow-sm transition hover:bg-stone-50">
                      Withdraw
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ────────────────────────── Page ────────────────────────── */

export default function MyInvestmentsPage() {
  const [data, setData] = useState<InvestmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        const res = await fetch('/api/investor/investments', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('[INVESTMENTS] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fundex-forest" />
      </div>
    );
  }

  const stats = data?.stats ?? { totalCapital: 0, activeCapital: 0, avgPositionSize: 0, largestInvestment: 0, monthlyIncome: 0, activeDealCount: 0 };
  const investments = data?.investments ?? [];
  const maturingPositions = data?.maturingPositions ?? [];

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10">
        <header>
          <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">My Investments</h1>
          <p className="mt-2 text-sm font-normal text-stone-400">Track and manage all your investment positions</p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <SummaryCard icon={<Wallet className="h-5 w-5" />} title="Capital Deployed" value={formatCurrency(stats.activeCapital)} />
          <SummaryCard icon={<BriefcaseBusiness className="h-5 w-5" />} title="Active Positions" value={String(stats.activeDealCount)} sublabel="open deals" />
          <SummaryCard icon={<PieChart className="h-5 w-5" />} title="Avg Position Size" value={formatCurrency(stats.avgPositionSize)} sublabel="per deal" />
          <SummaryCard icon={<TrendingUp className="h-5 w-5" />} title="Largest Investment" value={formatCurrency(stats.largestInvestment)} />
        </section>

        <InvestmentsTable investments={investments} onViewClick={(inv) => setSelectedInvestment(inv)} />

        <MaturingTable positions={maturingPositions} />
      </div>

      <InvestmentDetailsDrawer
        open={!!selectedInvestment}
        onClose={() => setSelectedInvestment(null)}
        investment={selectedInvestment}
      />
    </>
  );
}
