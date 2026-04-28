'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  BellRing,
  ChevronRight,
  CircleAlert,
  FileText,
  Loader2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type StatCardProps = {
  title: string;
  value: string;
  subtext?: string;
  filled?: boolean;
};

type SectionCardProps = {
  title: string;
  subtitle: string;
  topRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ActionItemProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  href?: string;
};

type ActivityItemProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  date: string;
};

function StatCard({ title, value, subtext, filled = false }: StatCardProps) {
  return (
    <div
      className={`flex h-full w-full min-w-[220px] flex-col p-6 shadow-sm transition-shadow duration-200 ${
        filled
          ? ' bg-gradient-to-br from-fundex-forest to-fundex-green text-white shadow-sm shadow-fundex-forest/15'
          : 'fdx-card hover:shadow-md'
      }`}
    >
      <p
        className={`text-sm font-medium leading-snug ${filled ? 'text-white/90' : 'text-stone-500'}`}
      >
        {title}
      </p>
      <p className="mt-3 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">
        {value}
      </p>
      <div className="mt-2 min-h-[2.75rem]">
        {subtext ? (
          <p
            className={`text-sm leading-snug ${filled ? 'text-white/90' : 'text-stone-500'}`}
          >
            {subtext}
          </p>
        ) : (
          <span className="block min-h-[2.75rem]" aria-hidden />
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, topRight, className, children }: SectionCardProps) {
  return (
    <section className={`relative fdx-card p-6 md:p-7 ${className ?? ''}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-medium tracking-tight text-stone-900 md:text-[1.65rem]">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-stone-500 md:text-base">{subtitle}</p>
        </div>
        {topRight}
      </div>
      {children}
    </section>
  );
}

function ActionItem({ icon, title, subtitle, href }: ActionItemProps) {
  const content = (
    <div className="flex w-full items-center gap-4 fdx-card px-5 py-5 text-left transition duration-200 hover:border-stone-200 hover:bg-stone-50 hover:shadow-md">
      <div className="shrink-0 bg-fundex-gold/10 p-2.5 text-fundex-forest">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-medium leading-snug text-stone-900">{title}</p>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button type="button">{content}</button>;
}

function ActivityItem({ icon, title, subtitle, date }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-5 first:pt-0.5 last:pb-0.5">
      <div className="shrink-0 bg-stone-100 p-2.5 text-stone-500">{icon}</div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[0.9375rem] font-medium leading-snug text-stone-900">{title}</p>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      <p className="shrink-0 self-center text-right text-sm font-medium tabular-nums text-stone-400">
        {date}
      </p>
    </div>
  );
}

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

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ACTIVITY_TYPE_MAP: Record<string, { icon: ReactNode; color: string }> = {
  allocation_created: { icon: <Wallet className="h-5 w-5" />, color: 'text-fundex-forest' },
  allocation_funded: { icon: <Wallet className="h-5 w-5" />, color: 'text-fundex-forest' },
  allocation_updated: { icon: <ArrowLeftRight className="h-5 w-5" />, color: 'text-stone-500' },
  deal_created: { icon: <TrendingUp className="h-5 w-5" />, color: 'text-fundex-forest' },
  deal_status_changed: { icon: <TrendingUp className="h-5 w-5" />, color: 'text-fundex-forest' },
  document_uploaded: { icon: <FileText className="h-5 w-5" />, color: 'text-stone-600' },
  document_requested: { icon: <FileText className="h-5 w-5" />, color: 'text-stone-600' },
  investor_added: { icon: <Wallet className="h-5 w-5" />, color: 'text-fundex-forest' },
  investor_accepted: { icon: <Wallet className="h-5 w-5" />, color: 'text-fundex-forest' },
  investor_status_changed: { icon: <ArrowLeftRight className="h-5 w-5" />, color: 'text-stone-500' },
};

interface DashboardData {
  stats: {
    totalCapital: number;
    capitalDeployed: number;
    monthlyIncome: number;
    upcomingPayments: { total: number; count: number; nextInDays: number | null };
    fundsBeingDeployed: number;
    activeDealCount: number;
    collateral: { totalValue: number; avgLtv: number };
  };
  actions: {
    unacknowledgedBroadcasts: number;
    maturingInvestments: number;
    newDocuments: number;
  };
  recentActivity: {
    id: string;
    type: string;
    title: string;
    description: string;
    dealName: string;
    createdAt: string;
  }[];
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/investor/dashboard', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || 'Failed to load dashboard');
          setLoading(false);
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('[INVESTOR_DASHBOARD] Error:', err);
        setError('Failed to load dashboard');
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

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10">
        <header>
          <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm font-normal text-stone-400">Your investment overview</p>
        </header>
        <div className="fdx-card p-10 text-center text-stone-500">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  const { stats, actions, recentActivity } = data;

  const hasActions =
    actions.unacknowledgedBroadcasts > 0 ||
    actions.maturingInvestments > 0 ||
    actions.newDocuments > 0;

  const paymentSubtext =
    stats.upcomingPayments.count > 0
      ? `${stats.upcomingPayments.count} payment${stats.upcomingPayments.count > 1 ? 's' : ''} • Next in ${stats.upcomingPayments.nextInDays} day${stats.upcomingPayments.nextInDays !== 1 ? 's' : ''}`
      : 'No upcoming payments';

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10 md:space-y-10">
      <header>
        <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm font-normal text-stone-400">Your investment overview</p>
      </header>

      {/* Portfolio Stats */}
      <section className="grid gap-5 lg:grid-cols-4 lg:items-stretch">
        <StatCard title="Total Capital" value={formatCurrency(stats.totalCapital)} />
        <StatCard
          title="Capital Deployed"
          value={formatCurrency(stats.capitalDeployed)}
          subtext={stats.activeDealCount > 0 ? `Across ${stats.activeDealCount} active deal${stats.activeDealCount > 1 ? 's' : ''}` : undefined}
        />
        <StatCard title="Monthly Income" value={formatCurrency(stats.monthlyIncome)} />
        <StatCard
          title="Upcoming Payments"
          value={formatCurrency(stats.upcomingPayments.total)}
          subtext={paymentSubtext}
          filled
        />
      </section>

      {/* Funds Being Deployed + Collateral */}
      <section className="grid gap-5 xl:grid-cols-2">
        {stats.fundsBeingDeployed > 0 && (
          <div className="border border-fundex-gold/20 bg-gradient-to-br from-fundex-cream/30 via-white to-fundex-cream/10 p-6 shadow-sm md:p-7">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fundex-forest">Funds Being Deployed</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">
                  {formatCurrency(stats.fundsBeingDeployed)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 md:text-[0.9375rem]">
                  Being placed into active opportunities
                </p>
              </div>
              <span className="shrink-0 border border-fundex-gold/30 bg-fundex-gold/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-900">
                Deploying
              </span>
            </div>
          </div>
        )}

        {stats.collateral.totalValue > 0 && (
          <div className="border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-stone-50 p-6 shadow-sm md:p-7">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-700">Collateral Backing (Active Deals)</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">
                  {formatCurrency(stats.collateral.totalValue)}
                </p>
                <p className="mt-1.5 text-sm text-stone-600">Total collateral value</p>
              </div>
              <span className="shrink-0 border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-900">
                Active
              </span>
            </div>
            {stats.collateral.avgLtv > 0 && (
              <div className="mt-6 border-t border-stone-200 pt-6">
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-stone-900">
                  {stats.collateral.avgLtv}%
                </p>
                <p className="mt-1 text-sm text-stone-600">Average LTV</p>
              </div>
            )}
          </div>
        )}

        {stats.fundsBeingDeployed === 0 && stats.collateral.totalValue === 0 && (
          <div className="col-span-2 fdx-card p-8 text-center text-stone-400">
            No active deployment or collateral data yet
          </div>
        )}
      </section>

      {/* Actions Required */}
      <SectionCard
        title="Actions Required"
        subtitle="Items that need your attention"
        topRight={
          hasActions ? (
            <CircleAlert className="mt-0.5 h-5 w-5 text-fundex-gold" />
          ) : undefined
        }
      >
        <div className="space-y-3">
          {actions.unacknowledgedBroadcasts > 0 && (
            <ActionItem
              icon={<BellRing className="h-5 w-5" />}
              title={`${actions.unacknowledgedBroadcasts} broadcast message${actions.unacknowledgedBroadcasts > 1 ? 's' : ''} require${actions.unacknowledgedBroadcasts === 1 ? 's' : ''} acknowledgment`}
              subtitle="Click to review and take action"
              href="/investor/broadcast"
            />
          )}
          {actions.maturingInvestments > 0 && (
            <ActionItem
              icon={<Wallet className="h-5 w-5" />}
              title={`${actions.maturingInvestments} investment${actions.maturingInvestments > 1 ? 's' : ''} maturing soon`}
              subtitle="Click to review and take action"
              href="/investor/investments"
            />
          )}
          {actions.newDocuments > 0 && (
            <ActionItem
              icon={<FileText className="h-5 w-5" />}
              title={`${actions.newDocuments} new document${actions.newDocuments > 1 ? 's' : ''} available`}
              subtitle="Click to review and take action"
              href="/investor/documents"
            />
          )}
          {!hasActions && (
            <div className="py-6 text-center text-sm text-stone-400">
              All caught up — no actions required
            </div>
          )}
        </div>
      </SectionCard>

      {/* Recent Activity */}
      <SectionCard
        title="Recent Activity"
        subtitle="Latest updates and transactions"
        topRight={
          <div className="absolute -right-1.5 top-9 border border-stone-200 bg-white p-2 shadow-sm">
            <FileText className="h-4 w-4 text-stone-600" />
          </div>
        }
      >
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {recentActivity.map((activity) => {
              const typeInfo = ACTIVITY_TYPE_MAP[activity.type] || {
                icon: <FileText className="h-5 w-5" />,
                color: 'text-stone-500',
              };
              return (
                <ActivityItem
                  key={activity.id}
                  icon={<span className={typeInfo.color}>{typeInfo.icon}</span>}
                  title={activity.title}
                  subtitle={activity.dealName || activity.description || ''}
                  date={formatRelativeDate(activity.createdAt)}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-stone-400">No recent activity</div>
        )}
      </SectionCard>
    </div>
  );
}
