'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Calendar, ArrowUpRight, FileWarning, Download,
  X, Info, PlayCircle, ArrowRightCircle, UserX, Eye,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Types ──────────────────────────────────────────────────────────────────

interface PerformanceData {
  kpis: {
    totalActivePrincipal: number;
    availableCash: number;
    monthlyInterestDue: number;
    netSpread: number;
    contractsAtRisk: number;
    totalPaidYTD: number;
    avgRate: number;
  };
  paymentOps: {
    paidThisCycle: number;
    pending: number;
    overdue: number;
    upcomingThisWeek: number;
    nextPayoutDate: string | null;
    nextPayoutAmount: number;
    activeInvestors: number;
  };
  capitalFlow: { month: string; capitalIn: number; interestOut: number; principalReturned: number }[];
  risk: { latePayments: number; missingDocuments: number; contractsNearingMaturity: number };
  contractPerformance: {
    id: string; dealId: string; name: string;
    principalDeployed: number; interestRate: number; monthlyInterest: number;
    paymentsCompleted: number; totalPayments: number;
    nextPaymentDate: string | null; outstandingBalance: number;
    status: string; riskLevel: string;
  }[];
  distributions: {
    totalPaidYTD: number; nextDistributionDate: string | null;
    nextDistributionAmount: number; activeInvestors: number;
    avgPayment: number; onTimeRate: number;
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, highlight }: {
  icon: React.ReactNode; label: string; value: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className={`fdx-card p-5 flex flex-col gap-3 ${highlight ? 'border-red-200 bg-red-50/30' : ''}`}>
      <div className={`size-10 flex items-center justify-center ${highlight ? 'bg-red-100 text-red-600' : 'bg-fundex-gold/10 text-fundex-forest'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className={`text-2xl font-semibold tabular-nums mt-0.5 ${highlight ? 'text-red-600' : 'text-stone-900'}`}>{value}</p>
        <p className="text-xs text-stone-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function PayCard({ label, count, sub, variant, onClick }: {
  label: string; count: number; sub: string;
  variant: 'green' | 'yellow' | 'red' | 'blue';
  onClick?: () => void;
}) {
  const colors = {
    green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    yellow: 'bg-amber-50 border-amber-100 text-amber-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
  };
  return (
    <button onClick={onClick} className={`border p-5 flex flex-col gap-1 text-left hover:shadow-md transition-all cursor-pointer ${colors[variant]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold tabular-nums">{count}</p>
      <p className="text-xs opacity-70">{sub}</p>
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-100 shadow-lg p-3 text-sm">
      <p className="font-medium text-stone-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="tabular-nums">
          {entry.name}: ${entry.value}M
        </p>
      ))}
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskDetailsOpen, setRiskDetailsOpen] = useState(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [paymentDetailsType, setPaymentDetailsType] = useState<'paid' | 'pending' | 'overdue' | 'upcoming'>('paid');
  const [payoutExecutionOpen, setPayoutExecutionOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/performance', {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load performance data');
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-6 py-6 md:px-8 md:py-8">
        <PageHeader title="Performance" subtitle="Financial command center for portfolio operations" />
        <div className="mt-8 fdx-card p-8 text-center">
          <AlertTriangle className="size-8 text-amber-400 mx-auto mb-3" />
          <p className="text-stone-500">{error ?? 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { kpis, paymentOps, capitalFlow, risk, contractPerformance, distributions } = data;

  return (
    <StaggerContainer className="space-y-8 px-6 py-6 md:px-8 md:py-8">

      {/* Header */}
      <StaggerItem>
        <div className="flex items-center justify-between">
          <PageHeader title="Performance" subtitle="Financial command center for portfolio operations" />
          <button className="fdx-btn-secondary gap-2 text-sm hidden md:flex">
            <Download className="size-4" />
            Export Report
          </button>
        </div>
      </StaggerItem>

      {/* KPI Row */}
      <StaggerItem>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={<DollarSign className="size-5" />} label="Total Active Principal" value={fmtM(kpis.totalActivePrincipal)} sub="Currently deployed" />
          <KpiCard icon={<TrendingUp className="size-5" />} label="Available Cash" value={fmtM(kpis.availableCash)} sub="Pending capital" />
          <KpiCard icon={<Calendar className="size-5" />} label="Monthly Interest Due" value={fmtM(kpis.monthlyInterestDue)} sub="This cycle" />
          <KpiCard icon={<ArrowUpRight className="size-5" />} label="Net Spread" value={fmtM(kpis.netSpread)} sub={`${kpis.avgRate.toFixed(1)}% avg rate`} />
          <KpiCard icon={<AlertTriangle className="size-5" />} label="Contracts at Risk" value={String(kpis.contractsAtRisk)} sub="Requires action" highlight={kpis.contractsAtRisk > 0} />
          <KpiCard icon={<CheckCircle2 className="size-5" />} label="Total Paid Out YTD" value={fmtM(kpis.totalPaidYTD)} sub="To investors" />
        </div>
      </StaggerItem>

      {/* Payment Operations + Next Payout side-by-side */}
      <StaggerItem>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Payment Ops */}
          <div className="lg:col-span-2 fdx-card p-6">
            <h2 className="fdx-section-title text-base mb-1">Payment Operations</h2>
            <p className="text-sm text-stone-400 mb-5">Current cycle payment tracking</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PayCard label="Paid This Cycle" count={paymentOps.paidThisCycle} sub="Funded allocations" variant="green" onClick={() => { setPaymentDetailsType('paid'); setPaymentDetailsOpen(true); }} />
              <PayCard label="Pending" count={paymentOps.pending} sub="Awaiting funding" variant="yellow" onClick={() => { setPaymentDetailsType('pending'); setPaymentDetailsOpen(true); }} />
              <PayCard label="Overdue" count={paymentOps.overdue} sub="Action required" variant="red" onClick={() => { setPaymentDetailsType('overdue'); setPaymentDetailsOpen(true); }} />
              <PayCard label="Upcoming" count={paymentOps.upcomingThisWeek} sub="Next 7 days" variant="blue" onClick={() => { setPaymentDetailsType('upcoming'); setPaymentDetailsOpen(true); }} />
            </div>
          </div>

          {/* Next Payout Batch */}
          <div className="fdx-card p-6 flex flex-col gap-4">
            <div>
              <h2 className="fdx-section-title text-base mb-1">Next Payout Batch</h2>
              <p className="text-sm text-stone-400">Scheduled investor distribution</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Next Payout Date</span>
                <span className="font-medium text-stone-900">{fmtDate(paymentOps.nextPayoutDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total Payout Amount</span>
                <span className="font-medium text-stone-900">{fmtM(paymentOps.nextPayoutAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Number of Investors</span>
                <span className="font-medium text-stone-900">{paymentOps.activeInvestors}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Status</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Ready</Badge>
              </div>
            </div>
            <button className="fdx-btn-primary w-full mt-auto gap-2 text-sm" onClick={() => setPayoutExecutionOpen(true)}>
              <CheckCircle2 className="size-4" />
              Execute Payout Batch
            </button>
          </div>
        </div>
      </StaggerItem>

      {/* Capital Flow Chart */}
      <StaggerItem>
        <div className="fdx-card p-6">
          <h2 className="fdx-section-title text-base mb-1">Capital Flow</h2>
          <p className="text-sm text-stone-400 mb-6">Monthly capital movement (in millions)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capitalFlow} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#78716c' }} />
                <Bar dataKey="capitalIn" name="Capital In (new allocations)" fill="#427A43" radius={[3, 3, 0, 0]} />
                <Bar dataKey="interestOut" name="Interest Out (payouts)" fill="#C0B87A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="principalReturned" name="Principal Returned" fill="#d6d3d1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </StaggerItem>

      {/* Risk + Distributions side-by-side */}
      <StaggerItem>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Portfolio Risk */}
          <div className="fdx-card p-6">
            <h2 className="fdx-section-title text-base mb-1">Portfolio Risk & Exceptions</h2>
            <p className="text-sm text-stone-400 mb-5">Active alerts and operational issues</p>
            <div className="space-y-3">
              {[
                { label: 'Late Payments', desc: 'Requires immediate action', count: risk.latePayments, color: 'text-red-600 bg-red-50' },
                { label: 'Missing Documents', desc: 'Follow up required', count: risk.missingDocuments, color: 'text-amber-600 bg-amber-50' },
                { label: 'Borrower Delinquent', desc: 'Under review', count: 1, color: 'text-orange-600 bg-orange-50', icon: <UserX className="size-4 text-orange-500" /> },
                { label: 'Contracts Nearing Maturity', desc: 'Within 90 days', count: risk.contractsNearingMaturity, color: 'text-blue-600 bg-blue-50' },
              ].map(({ label, desc, count, color, icon }) => (
                <div key={label} className="flex items-center justify-between p-3 border border-stone-100">
                  <div className="flex items-center gap-3">
                    {icon || <FileWarning className="size-4 text-stone-400" />}
                    <div>
                      <p className="text-sm font-medium text-stone-900">{label}</p>
                      <p className="text-xs text-stone-400">{desc}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold tabular-nums px-2.5 py-0.5 ${color}`}>{count}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full fdx-btn-secondary text-sm" onClick={() => setRiskDetailsOpen(true)}>
              <Eye className="size-4 mr-2 inline" />
              View All Alerts
            </button>
          </div>

          {/* Investor Distributions */}
          <div className="fdx-card p-6">
            <h2 className="fdx-section-title text-base mb-1">Investor Distributions</h2>
            <p className="text-sm text-stone-400 mb-5">Payment tracking and schedules</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-fundex-cream/30 border border-fundex-gold/20">
                <p className="text-xs text-stone-500">Total Paid to Investors (YTD)</p>
                <p className="text-xl font-bold text-stone-900 mt-1">{fmtM(distributions.totalPaidYTD)}</p>
              </div>
              <div className="p-4 bg-fundex-cream/30 border border-fundex-gold/20">
                <p className="text-xs text-stone-500">Next Distribution</p>
                <p className="text-base font-semibold text-stone-900 mt-1">{fmtDate(distributions.nextDistributionDate)}</p>
                <p className="text-xs text-stone-400">{distributions.activeInvestors} investors · {fmtM(distributions.nextDistributionAmount)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 border border-stone-100">
                <p className="text-xs text-stone-500">Avg Payment</p>
                <p className="text-lg font-bold text-stone-900">{fmtM(distributions.avgPayment)}</p>
              </div>
              <div className="text-center p-3 border border-stone-100">
                <p className="text-xs text-stone-500">On-Time Rate</p>
                <p className="text-lg font-bold text-fundex-forest">{distributions.onTimeRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Contract Performance Table */}
      <StaggerItem>
        <div className="fdx-card">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="fdx-section-title text-base mb-1">Contract Performance</h2>
              <p className="text-sm text-stone-400">Active lending contract operational details</p>
            </div>
            <button className="fdx-btn-secondary text-sm gap-2 hidden md:flex">
              <Download className="size-4" />
              Export
            </button>
          </div>
          {contractPerformance.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">No active contracts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Contract / Deal', 'Principal Deployed', 'Rate', 'Monthly Interest', 'Payments', 'Next Payment', 'Outstanding', 'Status', 'Risk'].map(h => (
                      <th key={h} className="fdx-table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contractPerformance.map(c => (
                    <tr key={c.id} className="fdx-table-row">
                      <td className="py-3 px-4">
                        <p className="font-medium text-stone-900 text-sm">{c.name}</p>
                        <p className="text-xs text-stone-400">{c.dealId}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-900 tabular-nums text-sm">{fmtM(c.principalDeployed)}</td>
                      <td className="py-3 px-4 text-stone-700 tabular-nums text-sm">{c.interestRate.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-stone-700 tabular-nums text-sm">
                        {fmtM(c.monthlyInterest)}<span className="text-xs text-stone-400">/mo</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-100 min-w-[60px]">
                            <div
                              className="h-full bg-fundex-forest"
                              style={{ width: `${Math.min(100, (c.paymentsCompleted / c.totalPayments) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap">
                            {c.paymentsCompleted} / {c.totalPayments}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600 whitespace-nowrap">{fmtDate(c.nextPaymentDate)}</td>
                      <td className="py-3 px-4 text-sm text-stone-700 tabular-nums">{fmtM(c.outstandingBalance)}</td>
                      <td className="py-3 px-4">
                        <span className={`fdx-badge ${c.status === 'Active' ? 'fdx-badge-active' : 'fdx-badge-pending'}`}>{c.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 ${c.riskLevel === 'On Schedule' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {c.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </StaggerItem>

      {/* Risk Details Modal */}
      {riskDetailsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRiskDetailsOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Risk Details & Exceptions</h2>
                <p className="text-sm text-stone-500 mt-1">Active issues requiring attention</p>
              </div>
              <button onClick={() => setRiskDetailsOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="size-5 text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'R-001', contract: 'Office Building Acquisition', issue: 'Late Payment', severity: 'High' as const, daysLate: 11, amount: fmtM(kpis.monthlyInterestDue * 0.03) },
                { id: 'R-002', contract: 'Mixed-Use Development', issue: 'Missing Documents', severity: 'Medium' as const, description: 'Borrower agreement pending' },
                { id: 'R-003', contract: 'Hotel Acquisition', issue: 'Borrower Delinquent', severity: 'High' as const, description: 'Under legal review' },
              ].map((risk) => (
                <div key={risk.id} className={`p-4 rounded-lg border ${risk.severity === 'High' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-stone-900">{risk.contract}</p>
                      <p className="text-sm text-stone-600 mt-0.5">{risk.id}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${risk.severity === 'High' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'}`}>
                      {risk.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className={`size-4 ${risk.severity === 'High' ? 'text-red-600' : 'text-amber-600'}`} />
                    <span className="font-medium">{risk.issue}</span>
                  </div>
                  {'daysLate' in risk && risk.daysLate && (
                    <p className="text-sm text-red-700 mt-2">{risk.daysLate} days late &bull; Amount: {risk.amount}</p>
                  )}
                  {'description' in risk && risk.description && (
                    <p className="text-sm text-stone-700 mt-2">{risk.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button className="fdx-btn-primary text-xs px-3 py-1.5 gap-1">
                      <ArrowRightCircle className="size-3" />
                      Take Action
                    </button>
                    <button className="fdx-btn-outline text-xs px-3 py-1.5">View Contract</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {paymentDetailsOpen && (() => {
        const paymentData = {
          paid: [
            { id: 'P-001', investor: 'Sarah Johnson', amount: '$45,200', date: 'Jul 28, 2026', deal: 'Commercial Construction' },
            { id: 'P-002', investor: 'Michael Chen', amount: '$32,800', date: 'Jul 27, 2026', deal: 'Multifamily Bridge Loan' },
            { id: 'P-003', investor: 'Emma Williams', amount: '$58,900', date: 'Jul 26, 2026', deal: 'Industrial Property' },
          ],
          pending: [
            { id: 'P-047', investor: 'David Martinez', amount: '$22,400', date: 'Aug 1, 2026', deal: 'Retail Center', status: 'Processing' },
            { id: 'P-048', investor: 'Linda Garcia', amount: '$41,100', date: 'Aug 1, 2026', deal: 'Office Building', status: 'Pending Transfer' },
          ],
          overdue: [
            { id: 'P-034', investor: 'Robert Kim', amount: '$38,500', date: 'Jul 15, 2026', deal: 'Mixed-Use Development', daysLate: 11 },
            { id: 'P-041', investor: 'Jessica Lee', amount: '$29,700', date: 'Jul 20, 2026', deal: 'Hotel Acquisition', daysLate: 6 },
          ],
          upcoming: [
            { id: 'P-049', investor: 'Thomas Anderson', amount: '$51,200', date: 'Aug 1, 2026', deal: 'Commercial Construction' },
            { id: 'P-050', investor: 'Patricia Moore', amount: '$33,800', date: 'Aug 2, 2026', deal: 'Retail Strip Center' },
            { id: 'P-051', investor: 'James Wilson', amount: '$44,600', date: 'Aug 3, 2026', deal: 'Industrial Property' },
          ],
        };
        const titles = { paid: 'Paid This Cycle', pending: 'Pending Payments', overdue: 'Overdue Payments', upcoming: 'Upcoming Payments' };
        const items = paymentData[paymentDetailsType];

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentDetailsOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">{titles[paymentDetailsType]}</h2>
                  <p className="text-sm text-stone-500 mt-1">{items.length} payments</p>
                </div>
                <button onClick={() => setPaymentDetailsOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                  <X className="size-5 text-stone-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="fdx-table-header">Payment ID</th>
                        <th className="fdx-table-header">Investor</th>
                        <th className="fdx-table-header">Amount</th>
                        <th className="fdx-table-header">{paymentDetailsType === 'overdue' ? 'Due Date' : 'Date'}</th>
                        <th className="fdx-table-header">Deal</th>
                        {paymentDetailsType === 'overdue' && <th className="fdx-table-header">Days Late</th>}
                        {paymentDetailsType === 'pending' && <th className="fdx-table-header">Status</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((payment: any) => (
                        <tr key={payment.id} className="fdx-table-row">
                          <td className="py-3 px-4 font-medium">{payment.id}</td>
                          <td className="py-3 px-4">{payment.investor}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">{payment.amount}</td>
                          <td className="py-3 px-4">{payment.date}</td>
                          <td className="py-3 px-4">{payment.deal}</td>
                          {payment.daysLate && <td className="py-3 px-4"><span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5">{payment.daysLate} days</span></td>}
                          {payment.status && <td className="py-3 px-4"><span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">{payment.status}</span></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payout Execution Modal */}
      {payoutExecutionOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPayoutExecutionOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-fundex-forest text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-semibold">Execute Payout Batch</h2>
              <p className="text-sm text-emerald-100 mt-1">Review and confirm investor distribution</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                <h3 className="font-semibold text-stone-900 mb-3">Payout Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-stone-600">Payout Date</p>
                    <p className="font-semibold text-stone-900">{fmtDate(paymentOps.nextPayoutDate)}</p>
                  </div>
                  <div>
                    <p className="text-stone-600">Total Amount</p>
                    <p className="font-semibold text-emerald-600">{fmtM(paymentOps.nextPayoutAmount)}</p>
                  </div>
                  <div>
                    <p className="text-stone-600">Number of Investors</p>
                    <p className="font-semibold text-stone-900">{paymentOps.activeInvestors}</p>
                  </div>
                  <div>
                    <p className="text-stone-600">Available Cash</p>
                    <p className="font-semibold text-blue-600">{fmtM(kpis.availableCash)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-1">Pre-Execution Checks</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>&#10003; Sufficient liquidity confirmed</li>
                      <li>&#10003; All investor bank details verified</li>
                      <li>&#10003; Payment schedules validated</li>
                      <li>&#10003; Compliance requirements met</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="fdx-btn-primary flex-1 gap-2 py-2.5"
                  onClick={() => setPayoutExecutionOpen(false)}
                >
                  <PlayCircle className="size-4" />
                  Confirm & Execute
                </button>
                <button
                  className="fdx-btn-outline flex-1 py-2.5"
                  onClick={() => setPayoutExecutionOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </StaggerContainer>
  );
}
