'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Copy, Check, MoreHorizontal, ArrowUpRight, MessageCircle } from 'lucide-react';
import { formatCurrency } from '@/services/allocation-service';
import type { Company } from '@/lib/types';

interface DashboardStats {
  totalAUM: number;
  allocatedCapital: number;
  pendingAllocations: number;
  fundedAllocations: number;
  activeDeals: number;
  totalDeals: number;
  activeInvestors: number;
  totalInvestors: number;
  monthlyInterest: number;
}

interface CompanyOverviewProps {
  company: Company;
  stats: DashboardStats;
  memberCount: number;
}

export function CompanyOverview({ company, stats, memberCount }: CompanyOverviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(company.company_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const funded = stats.fundedAllocations;
  const pending = stats.pendingAllocations;
  const total = funded + pending;
  const hasData = total > 0;

  const donutData = hasData
    ? [
        { name: 'Funded', value: funded },
        { name: 'Pending', value: pending || 0 },
      ]
    : [{ name: 'Empty', value: 1 }];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white font-sans shadow-sm">
      {/* Warm corner glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fundex-cream/25 blur-3xl" />
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <h3 className="text-base font-semibold text-stone-900">Company</h3>
        <button
          type="button"
          className="rounded-md p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Insight banner — matches "AI Finance Insight" in reference */}
      <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-stone-50/80 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fundex-gold to-fundex-gold/70 shadow-sm">
          <Copy className="h-4 w-4 text-fundex-forest" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-800">{company.name}</p>
          <p className="text-xs text-stone-400">Code: {company.company_code}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-stone-200 p-2 text-stone-400 transition-colors hover:bg-white hover:text-fundex-forest"
          aria-label="Copy company code"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <MessageCircle className="h-4 w-4" />}
        </button>
      </div>

      {/* Donut chart — large, centered */}
      <div className="relative mx-auto mt-3 h-[170px] w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={76}
              paddingAngle={hasData ? 4 : 0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {hasData ? (
                <>
                  <Cell fill="#C0B87A" />
                  <Cell fill="#292524" />
                </>
              ) : (
                <Cell fill="#e7e5e4" />
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium tracking-wide text-stone-400">Allocated Capital</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-stone-900">
            {formatCurrency(stats.allocatedCapital)}
          </p>
        </div>
      </div>

      {/* Bottom metrics — matches reference's "Earnings" and "AI Suggested Save" */}
      <div className="mt-auto border-t border-stone-100 px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg text-left transition-colors hover:bg-stone-50"
          >
            <div className="h-10 w-1 rounded-full bg-fundex-gold" />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-stone-900">
                {formatCurrency(stats.monthlyInterest)}
              </p>
              <p className="text-xs text-stone-400">Monthly Income</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-stone-300" />
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg text-left transition-colors hover:bg-stone-50"
          >
            <div className="h-10 w-1 rounded-full bg-fundex-gold" />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-stone-900">
                {memberCount}
              </p>
              <p className="text-xs text-stone-400">Team Members</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-stone-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
