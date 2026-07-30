'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Zap, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Company } from '@/lib/types';

/** Full comma-separated currency — no compact K/M abbreviation */
function fullCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

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
  const funded = stats.fundedAllocations;
  const pending = stats.pendingAllocations;
  const total = funded + pending;
  const hasData = total > 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(company.company_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const donutData = hasData
    ? [
        { name: 'Funded', value: funded },
        { name: 'Pending', value: pending || 0 },
      ]
    : [{ name: 'Empty', value: 1 }];

  return (
    <div className="relative flex flex-col overflow-hidden  border border-stone-100 bg-white font-sans shadow-sm">
      {/* Warm corner glow — cream tint */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32  bg-fundex-cream/25 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <h3 className="text-base font-medium text-stone-900">Portfolio</h3>
      </div>

      {/* Company insight banner */}
      <div className="mx-6 mt-4 flex items-center gap-3  bg-stone-50/80 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center  bg-gradient-to-br from-fundex-gold to-fundex-gold/70 shadow-sm">
          <Zap className="h-4 w-4 text-fundex-forest" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-normal text-stone-800">{company.name}</p>
          <p className="text-xs text-stone-400">Code: {company.company_code}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className=" border border-stone-200 p-2 text-stone-400 transition-colors hover:bg-white hover:text-fundex-forest"
          aria-label="Copy company code"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
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
          <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-stone-900">
            {fullCurrency(stats.allocatedCapital)}
          </p>
        </div>
      </div>

      {/* Bottom metrics */}
      <div className="mt-auto border-t border-stone-100 px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-1 bg-fundex-gold" />
            <div className="min-w-0">
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {fullCurrency(stats.monthlyInterest)}
              </p>
              <p className="text-xs text-stone-400">Monthly Interest</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-1 bg-fundex-gold" />
            <div className="min-w-0">
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {memberCount}
              </p>
              <p className="text-xs text-stone-400">Team Members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
