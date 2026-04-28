'use client';

import {
  CalendarClock,
  Clock,
  DollarSign,
  Loader2,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';

/* ────────────────────────── Types ────────────────────────── */

interface PerformanceData {
  stats: { totalEarned: number; thisMonthEarnings: number; totalInvested: number; avgDealReturn: number };
  portfolioGrowth: { month: string; total: number }[];
  monthlyEarnings: { month: string; amount: number }[];
  expectedEarnings: { next30Days: number; next90Days: number; remaining: number };
  earningsBreakdown: { fromActive: number; fromCompleted: number };
  insights: { dealsCompleted: number; avgDealDuration: number; reinvestmentRate: number };
}

/* ────────────────────────── Helpers ────────────────────────── */

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/* ────────────────────────── UI Components ────────────────────────── */

function StatCard({ icon, title, value, subtext, valueClassName }: { icon: ReactNode; title: string; value: string; subtext: string; valueClassName?: string }) {
  return (
    <div className="flex min-w-0 flex-col border border-stone-100 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center bg-fundex-gold/10 text-fundex-forest">{icon}</div>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <p className={`mt-2 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${valueClassName ?? 'text-stone-900'}`}>{value}</p>
      <p className="mt-1 text-sm text-stone-500">{subtext}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, topRight, className, children }: { title: string; subtitle: string; topRight?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`border border-stone-100 bg-white p-6 shadow-sm md:p-7 ${className ?? ''}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-stone-900">{title}</h2>
          <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
        </div>
        {topRight}
      </div>
      {children}
    </section>
  );
}

function InsightMetric({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-4 py-2 text-center">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className={`mt-2 text-base font-semibold tabular-nums sm:text-lg ${valueClassName ?? 'text-stone-900'}`}>{value}</p>
    </div>
  );
}

/* ────────────────────────── Charts ────────────────────────── */

function PortfolioTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-stone-200/80 bg-white px-4 py-3 shadow-xl shadow-stone-200/40">
      <p className="mb-1.5 text-xs font-medium text-stone-400">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-fundex-forest">${payload[0].value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-stone-400">Total earned</p>
    </div>
  );
}

function PortfolioGrowthChart({ data }: { data: { month: string; total: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-[280px] items-center justify-center text-sm text-stone-400">No earnings data yet</div>;
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C0B87A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#C0B87A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 500 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a8a29e' }} tickFormatter={(v: number) => (v === 0 ? '$0' : `$${(v / 1000).toFixed(0)}k`)} />
          <Tooltip content={<PortfolioTooltip />} cursor={{ stroke: '#C0B87A', strokeWidth: 1, strokeDasharray: '4 2' }} />
          <Area type="monotone" dataKey="total" stroke="#C0B87A" strokeWidth={2.5} fill="url(#portfolioGradient)" dot={false} activeDot={{ r: 5, fill: '#C0B87A', stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyEarningsChart({ data }: { data: { month: string; amount: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-stone-400">No earnings data yet</div>;
  }
  const maxBar = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="relative w-full overflow-x-auto pt-2">
      <div className="relative flex h-[200px] items-end justify-between gap-2 border-b border-l border-stone-200 px-2 pb-8 pt-4">
        {data.map((row) => {
          const pct = Math.min(100, (row.amount / maxBar) * 100);
          return (
            <div key={row.month} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div className="w-full max-w-[44px] shadow-sm" style={{ backgroundColor: '#C0B87A', height: `${pct}%`, minHeight: '8%' }} />
              <span className="text-xs font-medium text-stone-500">{row.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────── Page ────────────────────────── */

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        const res = await fetch('/api/investor/performance', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('[PERFORMANCE] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-fundex-forest" /></div>;
  }

  const stats = data?.stats ?? { totalEarned: 0, thisMonthEarnings: 0, totalInvested: 0, avgDealReturn: 0 };
  const portfolioGrowth = data?.portfolioGrowth ?? [];
  const monthlyEarnings = data?.monthlyEarnings ?? [];
  const expected = data?.expectedEarnings ?? { next30Days: 0, next90Days: 0, remaining: 0 };
  const breakdown = data?.earningsBreakdown ?? { fromActive: 0, fromCompleted: 0 };
  const insights = data?.insights ?? { dealsCompleted: 0, avgDealDuration: 0, reinvestmentRate: 0 };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-12 md:space-y-10">
      <header>
        <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">Performance</h1>
        <p className="mt-2 text-sm font-normal text-stone-400">Earnings and growth overview</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <StatCard icon={<DollarSign className="h-5 w-5" />} title="Total Earned" value={formatCurrency(stats.totalEarned)} subtext="Total interest earned" valueClassName="text-fundex-forest" />
        <StatCard icon={<Wallet className="h-5 w-5" />} title="This Month Earnings" value={formatCurrency(stats.thisMonthEarnings)} subtext="Current monthly income" valueClassName="text-fundex-forest" />
        <StatCard icon={<PiggyBank className="h-5 w-5" />} title="Total Invested" value={formatCurrency(stats.totalInvested)} subtext="Lifetime capital deployed" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} title="Avg Deal Return" value={`${stats.avgDealReturn}%`} subtext="Across all deals" valueClassName="text-fundex-forest" />
      </section>

      <SectionCard
        title="Portfolio Growth"
        subtitle="How your earnings have grown over time"
        topRight={
          <div className="border border-stone-100 bg-fundex-gold/5 px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium text-stone-600">Total Growth</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fundex-forest">{formatCurrency(stats.totalEarned)}</p>
          </div>
        }
      >
        <PortfolioGrowthChart data={portfolioGrowth} />
      </SectionCard>

      <SectionCard title="Monthly Earnings" subtitle="Interest income from your investments">
        <MonthlyEarningsChart data={monthlyEarnings} />
      </SectionCard>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="border border-stone-100 bg-white p-6 shadow-sm md:p-8">
          <span className="inline-flex bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-medium text-fundex-forest">Active</span>
          <p className="mt-4 text-4xl font-semibold tabular-nums text-fundex-forest">{formatCurrency(breakdown.fromActive)}</p>
          <p className="mt-2 text-sm text-stone-500">Earnings from Active Deals</p>
        </div>
        <div className="border border-stone-100 bg-white p-6 shadow-sm md:p-8">
          <span className="inline-flex bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">Completed</span>
          <p className="mt-4 text-4xl font-semibold tabular-nums text-blue-600">{formatCurrency(breakdown.fromCompleted)}</p>
          <p className="mt-2 text-sm text-stone-500">Earnings from Completed Deals</p>
        </div>
      </div>

      <section className="border border-stone-100 bg-fundex-gold/5 p-6 shadow-sm md:p-8">
        <h2 className="text-base font-medium text-stone-900">Expected Earnings</h2>
        <p className="mt-1 text-sm text-stone-500">Income expected from active investments</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <div className="flex gap-4 border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-fundex-gold/10 text-fundex-forest"><CalendarClock className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-500">Next 30 Days</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{formatCurrency(expected.next30Days)}</p>
            </div>
          </div>
          <div className="flex gap-4 border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-fundex-gold/10 text-fundex-forest"><Clock className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-500">Next 90 Days</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{formatCurrency(expected.next90Days)}</p>
            </div>
          </div>
          <div className="flex gap-4 border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-fundex-gold/10 text-fundex-forest"><TrendingUp className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-500">Remaining Expected</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{formatCurrency(expected.remaining)}</p>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Portfolio Insights" subtitle="Key metrics about your investment activity">
        <div className="flex flex-col divide-y divide-stone-100 md:flex-row md:divide-x md:divide-y-0">
          <InsightMetric label="Deals Completed" value={String(insights.dealsCompleted)} />
          <InsightMetric label="Avg Deal Duration" value={insights.avgDealDuration > 0 ? `${insights.avgDealDuration} mo` : '—'} />
          <InsightMetric label="Reinvestment Rate" value={`${insights.reinvestmentRate}%`} valueClassName="text-fundex-forest" />
        </div>
      </SectionCard>
    </div>
  );
}
