'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Users,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';

// ─── types (mirror the /api/payments response) ───────────────────────
type PayoutStatus = 'pending' | 'completed' | 'missed';

interface PayoutLineItem {
  allocationId: string;
  dealId: string;
  dealName: string;
  amount: number;
  paymentNumber: number;
  totalPayments: number;
}

interface InvestorPayoutView {
  investorId: string;
  investorSource?: string | null;
  investorName: string;
  expectedTotal: number;
  deals: PayoutLineItem[];
  status: PayoutStatus;
  actualAmount: number | null;
  paidDate: string | null;
  note: string | null;
}

// ─── helpers ──────────────────────────────────────────────────────────
function money(value: number): string {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Format a 'YYYY-MM-DD' as local calendar parts (no UTC-midnight shift).
function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_META: Record<PayoutStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', badge: 'fdx-badge fdx-badge-pending', icon: <Clock className="size-4 text-amber-600" /> },
  completed: { label: 'Completed', badge: 'fdx-badge fdx-badge-active', icon: <CheckCircle2 className="size-4 text-emerald-600" /> },
  missed: { label: 'Missed', badge: 'fdx-badge fdx-badge-info', icon: <XCircle className="size-4 text-red-600" /> },
};

export default function PaymentsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [payouts, setPayouts] = useState<InvestorPayoutView[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // mark modal state
  const [markTarget, setMarkTarget] = useState<{ payout: InvestorPayoutView; mode: 'completed' | 'missed' } | null>(null);

  // ── auth + initial load (dates) ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') { router.push('/admin'); return; }

      setReady(true);
      await loadDates();
    })();
  }, [router]);

  async function authHeader(): Promise<Record<string, string> | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return { Authorization: `Bearer ${session.access_token}` };
  }

  const loadDates = useCallback(async () => {
    setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { router.push('/auth/login'); return; }

      const res = await fetch('/api/payments/dates', { headers });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load payout dates');

      const list: string[] = json.dates ?? [];
      setDates(list);

      // default to the nearest upcoming date (else the most recent one)
      if (list.length > 0) {
        const today = todayIso();
        const upcoming = list.find((d) => d >= today);
        setSelectedDate(upcoming ?? list[list.length - 1]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payout dates');
    }
  }, [router]);

  // ── load payouts whenever the selected date changes ─────────────────
  const loadPayouts = useCallback(async (date: string) => {
    if (!date) return;
    setLoadingList(true);
    setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { router.push('/auth/login'); return; }

      const res = await fetch(`/api/payments?date=${date}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load payouts');

      setPayouts(json.payouts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payouts');
      setPayouts([]);
    } finally {
      setLoadingList(false);
    }
  }, [router]);

  useEffect(() => {
    if (selectedDate) loadPayouts(selectedDate);
  }, [selectedDate, loadPayouts]);

  // ── date navigation ─────────────────────────────────────────────────
  const dateIndex = dates.indexOf(selectedDate);
  const gotoPrev = () => { if (dateIndex > 0) setSelectedDate(dates[dateIndex - 1]); };
  const gotoNext = () => { if (dateIndex >= 0 && dateIndex < dates.length - 1) setSelectedDate(dates[dateIndex + 1]); };

  // ── summary for the selected date ───────────────────────────────────
  const summary = useMemo(() => {
    const totalExpected = payouts.reduce((s, p) => s + p.expectedTotal, 0);
    const totalPaid = payouts.filter((p) => p.status === 'completed').reduce((s, p) => s + (p.actualAmount ?? p.expectedTotal), 0);
    return {
      investors: payouts.length,
      totalExpected,
      totalPaid,
      completed: payouts.filter((p) => p.status === 'completed').length,
      pending: payouts.filter((p) => p.status === 'pending').length,
      missed: payouts.filter((p) => p.status === 'missed').length,
    };
  }, [payouts]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── mutations ───────────────────────────────────────────────────────
  const revertPayout = async (payout: InvestorPayoutView) => {
    const headers = await authHeader();
    if (!headers) { router.push('/auth/login'); return; }
    try {
      const res = await fetch('/api/payments/mark', {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ investor_id: payout.investorId, due_date: selectedDate }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to revert');
      await loadPayouts(selectedDate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revert payout');
    }
  };

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <PageHeader
            title="Payments"
            subtitle="Track and record investor payouts by payroll date"
          />
        </StaggerItem>

        {/* Date navigation */}
        <StaggerItem>
          <div className="fdx-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-2 text-stone-700">
              <CalendarDays className="size-5 text-fundex-forest" />
              <span className="text-sm font-medium">Payroll date</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={gotoPrev}
                disabled={dateIndex <= 0}
                className="h-9 w-9 inline-flex items-center justify-center rounded border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous payroll date"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="relative">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={dates.length === 0}
                  className="fdx-input appearance-none pr-9 pl-4 py-2 min-w-[190px] text-center font-medium disabled:opacity-50"
                  aria-label="Select payroll date"
                >
                  {dates.length === 0 && <option value="">No scheduled dates</option>}
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {formatDate(d, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              </div>
              <button
                onClick={gotoNext}
                disabled={dateIndex < 0 || dateIndex >= dates.length - 1}
                className="h-9 w-9 inline-flex items-center justify-center rounded border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next payroll date"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </StaggerItem>

        {/* Error banner */}
        {error && (
          <StaggerItem>
            <div className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded text-sm">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          </StaggerItem>
        )}

        {/* Summary stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Investors Due" value={summary.investors} icon={<Users className="text-stone-400" size={22} />} />
            <StatCard label="Total Expected" value={money(summary.totalExpected)} icon={<DollarSign className="text-stone-400" size={22} />} />
            <StatCard label="Total Paid" value={money(summary.totalPaid)} color="text-emerald-700" icon={<CheckCircle2 className="text-stone-400" size={22} />} />
            <StatCard label="Pending" value={summary.pending} color="text-amber-700" icon={<Clock className="text-stone-400" size={22} />} />
            <StatCard label="Missed" value={summary.missed} color="text-red-700" icon={<XCircle className="text-stone-400" size={22} />} />
          </div>
        </StaggerItem>

        {/* Payout list */}
        <StaggerItem>
          {loadingList ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : payouts.length === 0 ? (
            <div className="fdx-card text-center py-16">
              <CalendarDays className="mx-auto size-8 text-stone-300" />
              <p className="mt-3 text-stone-600 font-medium">No payouts scheduled</p>
              <p className="mt-1 text-sm text-stone-500">
                {dates.length === 0
                  ? 'No deals have a payout schedule yet. Set a first payout date, cycle, and term on a deal to see payouts here.'
                  : `Nothing is due on ${formatDate(selectedDate)}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => {
                const meta = STATUS_META[p.status];
                const isOpen = expanded.has(p.investorId);
                return (
                  <div key={p.investorId} className="fdx-card overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                      {/* Investor + amount */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-stone-900 truncate">{p.investorName}</p>
                          <span className={`px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 ${meta.badge}`}>
                            {meta.label}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleExpand(p.investorId)}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
                        >
                          {p.deals.length} deal{p.deals.length === 1 ? '' : 's'}
                          <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-stone-500 uppercase tracking-wide">Expected</p>
                        <p className="text-lg font-semibold text-stone-900">{money(p.expectedTotal)}</p>
                        {p.status === 'completed' && p.actualAmount != null && p.actualAmount !== p.expectedTotal && (
                          <p className="text-xs text-emerald-700">Paid {money(p.actualAmount)}</p>
                        )}
                        {p.status === 'completed' && p.paidDate && (
                          <p className="text-xs text-stone-500">on {formatDate(p.paidDate)}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {p.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => setMarkTarget({ payout: p, mode: 'completed' })}
                              className="fdx-btn-primary text-sm px-3 py-1.5 inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="size-4" /> Mark Paid
                            </button>
                            <button
                              onClick={() => setMarkTarget({ payout: p, mode: 'missed' })}
                              className="fdx-btn-outline text-sm px-3 py-1.5 inline-flex items-center gap-1.5"
                            >
                              <XCircle className="size-4" /> Missed
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => revertPayout(p)}
                            className="fdx-btn-outline text-sm px-3 py-1.5 inline-flex items-center gap-1.5"
                            title="Revert to pending"
                          >
                            <RotateCcw className="size-4" /> Revert
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Per-deal breakdown */}
                    {isOpen && (
                      <div className="border-t border-stone-100 bg-stone-50/50 px-4 py-3">
                        <div className="space-y-2">
                          {p.deals.map((d) => (
                            <div key={d.allocationId} className="flex items-center justify-between text-sm">
                              <div className="min-w-0">
                                <span className="text-stone-800">{d.dealName}</span>
                                <span className="text-stone-400 ml-2">
                                  payment {d.paymentNumber} of {d.totalPayments}
                                </span>
                              </div>
                              <span className="font-medium text-stone-900">{money(d.amount)}</span>
                            </div>
                          ))}
                        </div>
                        {p.note && (
                          <p className="mt-3 text-xs text-stone-500 border-t border-stone-100 pt-2">
                            <span className="font-medium text-stone-600">Note:</span> {p.note}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </StaggerItem>
      </StaggerContainer>

      {markTarget && (
        <MarkPayoutModal
          payout={markTarget.payout}
          mode={markTarget.mode}
          dueDate={selectedDate}
          onClose={() => setMarkTarget(null)}
          onSaved={async () => {
            setMarkTarget(null);
            await loadPayouts(selectedDate);
          }}
          onError={(msg) => setError(msg)}
        />
      )}
    </>
  );
}

// ─── stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="fdx-card p-5 relative overflow-hidden">
      <div className="fdx-card-glow" />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase">{label}</p>
          <p className={`text-xl md:text-2xl font-semibold mt-2 ${color || 'text-stone-900'}`}>{value}</p>
        </div>
        <div className="p-2 bg-stone-50/50">{icon}</div>
      </div>
    </div>
  );
}

// ─── mark modal ───────────────────────────────────────────────────────
function MarkPayoutModal({
  payout,
  mode,
  dueDate,
  onClose,
  onSaved,
  onError,
}: {
  payout: InvestorPayoutView;
  mode: 'completed' | 'missed';
  dueDate: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [actualAmount, setActualAmount] = useState<string>(String(payout.expectedTotal));
  const [paidDate, setPaidDate] = useState<string>(dueDate);
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired. Please log in again.');

      const body: Record<string, unknown> = {
        investor_id: payout.investorId,
        investor_source: payout.investorSource ?? null,
        due_date: dueDate,
        status: mode,
        note: note.trim() || null,
      };
      if (mode === 'completed') {
        body.actual_amount = Number(actualAmount) || payout.expectedTotal;
        body.paid_date = paidDate;
      }

      const res = await fetch('/api/payments/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to save');
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to save payout');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-stone-200 p-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {mode === 'completed' ? 'Mark payout as paid' : 'Mark payout as missed'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded" aria-label="Close">
            <X className="size-5 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-stone-600">
            <p><span className="font-medium text-stone-800">{payout.investorName}</span></p>
            <p>{formatDate(dueDate, { year: 'numeric', month: 'long', day: 'numeric' })} · expected {money(payout.expectedTotal)}</p>
          </div>

          {mode === 'completed' && (
            <>
              <div>
                <label className="text-sm font-medium text-stone-700">Amount paid</label>
                <input
                  type="number"
                  min={0}
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="fdx-input w-full mt-1.5 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Date paid</label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="fdx-input w-full mt-1.5 px-3 py-2"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-stone-700">Note <span className="text-stone-400 font-normal">(optional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === 'missed' ? 'Reason for missed payout…' : 'Reference or memo…'}
              className="fdx-input w-full mt-1.5 px-3 py-2 min-h-[72px]"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={submit} disabled={saving} className="fdx-btn-primary flex-1 py-2 disabled:opacity-50">
              {saving ? 'Saving…' : mode === 'completed' ? 'Confirm Paid' : 'Confirm Missed'}
            </button>
            <button onClick={onClose} disabled={saving} className="fdx-btn-outline flex-1 py-2">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
