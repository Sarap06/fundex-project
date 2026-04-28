'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer } from '@/components/motion-wrapper';
import { CompanyStatCard } from '@/components/company/stat-card';
import { CapitalFlowChart } from '@/components/company/capital-flow-chart';
import { CompanyOverview } from '@/components/company/company-overview';
import { ActivityTable } from '@/components/company/activity-table';
import { BroadcastPreview } from '@/components/company/broadcast-preview';
import { DUMMY_STATS, DUMMY_FLOW_DATA } from '@/components/company/dummy-data';
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

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function getTodayString(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const day = now.getDate();
  const year = now.getFullYear();
  return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

/** Full comma-separated display: $210,550 */
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

  // Fallback to dummy data when real data is empty/zeros
  const isDummy = !stats || stats.totalAUM === 0;
  const displayStats = isDummy ? DUMMY_STATS : stats;
  const displayFlow = flowData && flowData.some(d => d.inflows > 0 || d.outflows > 0)
    ? flowData
    : DUMMY_FLOW_DATA;

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
              <h1 className="text-[1.75rem] font-normal tracking-tight text-stone-900 md:text-[2rem]">
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
            className="flex items-center gap-1.5  border border-stone-200 bg-white px-4 py-2 text-sm font-normal text-stone-600 transition-colors hover:bg-stone-50"
          >
            Last Month
            <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5  bg-fundex-gold px-5 py-2 text-sm font-medium text-fundex-forest shadow-sm transition-colors hover:bg-fundex-gold/85"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* ── Row 2: KPI Stats ── */}
      <div>
      {loading ? (
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="py-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-12 w-44" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className=" border border-stone-100 bg-white p-5 shadow-sm">
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
            value={displayCurrency(displayStats.totalAUM)}
            featured
          />
          <CompanyStatCard
            label="Allocated Capital"
            value={displayCurrency(displayStats.allocatedCapital)}
          />
          <CompanyStatCard
            label="Active Investors"
            value={String(displayStats.activeInvestors)}
          />
          <CompanyStatCard
            label="Monthly Returns"
            value={displayCurrency(displayStats.monthlyInterest)}
          />
        </div>
      )}
      </div>

      {/* ── Row 3: Chart + Financial Overview ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {loading ? (
          <div className=" border border-stone-100 bg-white p-7 shadow-sm">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-9 w-36" />
            <Skeleton className="mt-6 h-[280px] w-full " />
          </div>
        ) : (
          <CapitalFlowChart data={displayFlow} />
        )}

        {loading ? (
          <div className=" border border-stone-100 bg-white shadow-sm">
            <div className="p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 h-14 w-full " />
              <Skeleton className="mx-auto mt-6 h-[160px] w-[180px] " />
            </div>
            <div className="border-t border-stone-100 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-14 w-full " />
                <Skeleton className="h-14 w-full " />
              </div>
            </div>
          </div>
        ) : (
          <CompanyOverview
            company={company || { id: '', name: 'Demo Company', company_code: 'DEMO01', admin_id: '', created_at: '' }}
            stats={displayStats}
            memberCount={memberCount || 3}
          />
        )}
      </div>

      {/* ── Row 4: Transaction History + Broadcasts ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <ActivityTable companyId={company?.id || 'demo'} />

        <BroadcastPreview companyId={company?.id || 'demo'} />
      </div>
    </StaggerContainer>
  );
}
