'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
import { CompanyStatCard } from '@/components/company/stat-card';
import { CapitalFlowChart } from '@/components/company/capital-flow-chart';
import { CompanyOverview } from '@/components/company/company-overview';
import { ActivityTable } from '@/components/company/activity-table';
import { BroadcastPreview } from '@/components/company/broadcast-preview';
import { formatCurrency } from '@/services/allocation-service';
import type { Company } from '@/lib/types';

interface DashboardStats {
  totalAUM: number;
  allocatedCapital: number;
  monthlyInterest: number;
  fundedAllocations: number;
  pendingAllocations: number;
  activeDeals: number;
  totalDeals: number;
  totalTarget: number;
  totalRaised: number;
  activeInvestors: number;
  totalInvestors: number;
  totalInvested: number;
}

interface FlowDataPoint {
  month: string;
  inflows: number;
  outflows: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getTodayString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Full comma-separated display: $210,550 — not compact $0.21M */
function displayCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function CompanyDashboard() {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [flowData, setFlowData] = useState<FlowDataPoint[] | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;
        setFirstName(profile.full_name?.split(' ')[0] || '');

        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (companyData) setCompany(companyData);

        const { count } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        setMemberCount(count || 0);

        const [statsRes, flowRes] = await Promise.all([
          fetch('/api/company/dashboard-stats', { headers }),
          fetch('/api/company/capital-flow?months=6', { headers }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (flowRes.ok) {
          const flowJson = await flowRes.json();
          setFlowData(flowJson.data || []);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <StaggerContainer className="space-y-7 pb-12">

      {/* ── Row 1: Greeting ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {loading ? (
            <>
              <Skeleton className="h-10 w-80" />
              <Skeleton className="mt-2 h-4 w-56" />
            </>
          ) : (
            <>
              <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-stone-900 md:text-[2rem]">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="mt-1 text-sm text-stone-400">
                Today is {getTodayString()}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-sm font-normal text-stone-600 transition-colors hover:bg-stone-50"
          >
            Last Month
            <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-fundex-gold px-5 py-2 text-sm font-semibold text-fundex-forest shadow-sm transition-colors hover:bg-fundex-gold/85"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* ── Row 2: KPI Stats ── */}
      <div>
      {loading || !stats ? (
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="py-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-12 w-44" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CompanyStatCard
            label="Total AUM"
            value={displayCurrency(stats.totalAUM)}
            change={stats.totalAUM > 0 ? `+${((stats.fundedAllocations / Math.max(stats.fundedAllocations + stats.pendingAllocations, 1)) * 100).toFixed(1)}%` : undefined}
            changeLabel="from last month"
            featured
          />
          <CompanyStatCard
            label="Active Deals"
            value={String(stats.activeDeals)}
            sublabel="Growth Rate"
            change={stats.activeDeals > 0 ? `+${((stats.activeDeals / Math.max(stats.totalDeals, 1)) * 100).toFixed(1)}%` : undefined}
          />
          <CompanyStatCard
            label="Active Investors"
            value={String(stats.activeInvestors)}
            sublabel="Growth Rate"
            change={stats.activeInvestors > 0 ? `+${((stats.activeInvestors / Math.max(stats.totalInvestors, 1)) * 100).toFixed(1)}%` : undefined}
          />
          <CompanyStatCard
            label="Allocated Capital"
            value={displayCurrency(stats.allocatedCapital)}
            sublabel="Growth Rate"
            change={stats.allocatedCapital > 0 ? `+${((stats.monthlyInterest / Math.max(stats.allocatedCapital, 1)) * 100).toFixed(1)}%` : undefined}
          />
        </div>
      )}
      </div>

      {/* ── Row 3: Chart + Company Overview ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {loading || !flowData ? (
          <div className="rounded-2xl border border-stone-100 bg-white p-7 shadow-sm">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-9 w-36" />
            <Skeleton className="mt-6 h-[280px] w-full rounded-lg" />
          </div>
        ) : (
          <CapitalFlowChart data={flowData} />
        )}

        {loading || !company || !stats ? (
          <div className="rounded-2xl border border-stone-100 bg-white shadow-sm">
            <div className="p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 h-14 w-full rounded-xl" />
              <Skeleton className="mx-auto mt-6 h-[160px] w-[180px] rounded-full" />
            </div>
            <div className="border-t border-stone-100 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <CompanyOverview
            company={company}
            stats={stats}
            memberCount={memberCount}
          />
        )}
      </div>

      {/* ── Row 4: Activity Table + Broadcasts ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {company ? (
          <ActivityTable companyId={company.id} />
        ) : (
          <div className="rounded-2xl border border-stone-100 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-5">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="space-y-0 px-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-stone-50 py-4">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        )}

        {company ? (
          <BroadcastPreview companyId={company.id} />
        ) : (
          <div className="rounded-2xl border border-stone-100 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-5">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1 px-6 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StaggerContainer>
  );
}
