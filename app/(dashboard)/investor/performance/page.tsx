"use client";

import {
  CalendarClock,
  Clock,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ReactNode, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtext: string;
  valueClassName?: string;
};

function StatCard({ icon, title, value, subtext, valueClassName }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col  border border-stone-100 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
        {icon}
      </div>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <p
        className={`mt-2 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${valueClassName ?? "text-stone-900"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-stone-500">{subtext}</p>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  subtitle: string;
  topRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

function SectionCard({ title, subtitle, topRight, className, children }: SectionCardProps) {
  return (
    <section
      className={` border border-stone-100 bg-white p-6 shadow-sm md:p-7 ${className ?? ""}`}
    >
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

type InsightMetricProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function InsightMetric({ label, value, valueClassName }: InsightMetricProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-4 py-2 text-center">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className={`mt-2 text-base font-semibold tabular-nums sm:text-lg ${valueClassName ?? "text-stone-900"}`}>{value}</p>
    </div>
  );
}

const PORTFOLIO_DATA = [
  { month: "Jan", value: 12000 },
  { month: "Feb", value: 22000 },
  { month: "Mar", value: 38000 },
  { month: "Apr", value: 53480 },
  { month: "May", value: 68000 },
  { month: "Jun", value: 82000 },
  { month: "Jul", value: 95000 },
  { month: "Aug", value: 108000 },
  { month: "Sep", value: 120000 },
  { month: "Oct", value: 132000 },
  { month: "Nov", value: 148000 },
  { month: "Dec", value: 163966 },
];

function PortfolioTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-stone-200/80 bg-white px-4 py-3 shadow-xl shadow-stone-200/40">
      <p className="mb-1.5 text-xs font-medium text-stone-400">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-fundex-forest">
        ${payload[0].value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-stone-400">Total earned</p>
    </div>
  );
}

function PortfolioGrowthChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={PORTFOLIO_DATA} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C0B87A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#C0B87A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#a8a29e", fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#a8a29e" }}
            tickFormatter={(v: number) => (v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`)}
          />
          <Tooltip
            content={<PortfolioTooltip />}
            cursor={{ stroke: "#C0B87A", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#C0B87A"
            strokeWidth={2.5}
            fill="url(#portfolioGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#C0B87A", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const MONTHLY_BAR_VALUES = [
  { label: "Jan", v: 9500 },
  { label: "Feb", v: 10200 },
  { label: "Mar", v: 11800 },
  { label: "Apr", v: 12400 },
  { label: "May", v: 13100 },
  { label: "Jun", v: 12800 },
  { label: "Jul", v: 13600 },
  { label: "Aug", v: 13980 },
];

const QUARTERLY_BAR_VALUES = [
  { label: "Q1", v: 38_000 },
  { label: "Q2", v: 45_000 },
  { label: "Q3", v: 52_000 },
  { label: "Q4", v: 60_000 },
];

const MONTHLY_Y_LABELS = ["$14k", "$11k", "$7k", "$4k", "$0k"];
const QUARTERLY_Y_LABELS = ["$60k", "$45k", "$30k", "$15k", "$0k"];

function MonthlyEarningsChart({ view }: { view: "monthly" | "quarters" }) {
  const isMonthly = view === "monthly";
  const data = isMonthly ? MONTHLY_BAR_VALUES : QUARTERLY_BAR_VALUES;
  const maxBar = isMonthly ? 14_000 : 60_000;
  const yLabels = isMonthly ? MONTHLY_Y_LABELS : QUARTERLY_Y_LABELS;

  return (
    <div className="relative w-full overflow-x-auto pt-2">
      <div className="flex min-w-[480px] gap-2">
        <div className="flex w-10 shrink-0 flex-col justify-between pb-8 pt-1 text-right">
          {yLabels.map((lab) => (
            <span key={lab} className="text-[11px] font-medium tabular-nums text-stone-400">
              {lab}
            </span>
          ))}
        </div>
        <div className="relative min-h-[220px] flex-1 border-b border-l border-stone-200">
          <div className="absolute inset-0 flex flex-col justify-between pb-8 pl-0 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-px w-full bg-stone-100" />
            ))}
          </div>
          <div className="relative flex h-[200px] items-end justify-between gap-2 px-2 pb-8 pt-4">
            {data.map((row) => {
              const pct = Math.min(100, (row.v / maxBar) * 100);
              return (
                <div key={row.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full max-w-[44px] shadow-sm"
                    style={{ backgroundColor: "#C0B87A", height: `${pct}%`, minHeight: "8%" }}
                  />
                  <span className="text-xs font-medium text-stone-500">{row.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function EarningsToggle({
  mode,
  onChange,
}: {
  mode: "monthly" | "quarters";
  onChange: (m: "monthly" | "quarters") => void;
}) {
  return (
    <div className="inline-flex  border border-stone-200 bg-stone-50/80 p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={` px-4 py-2 text-sm font-medium transition ${
          mode === "monthly" ? "bg-fundex-gold text-fundex-forest shadow-sm" : "text-stone-500 hover:text-stone-700"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("quarters")}
        className={` px-4 py-2 text-sm font-medium transition ${
          mode === "quarters" ? "bg-fundex-gold text-fundex-forest shadow-sm" : "text-stone-500 hover:text-stone-700"
        }`}
      >
        Quarters
      </button>
    </div>
  );
}

export default function PerformancePage() {
  const [earningsMode, setEarningsMode] = useState<"monthly" | "quarters">("monthly");

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-12 md:space-y-10">
          <header>
            <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">Performance</h1>
            <p className="mt-2 text-sm font-normal text-stone-400">Earnings and growth overview</p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              title="Total Earned"
              value="$163,966"
              subtext="Total interest earned"
              valueClassName="text-fundex-forest"
            />
            <StatCard
              icon={<Wallet className="h-5 w-5" />}
              title="This Month Earnings"
              value="$13,980"
              subtext="Current monthly income"
              valueClassName="text-fundex-forest"
            />
            <StatCard
              icon={<PiggyBank className="h-5 w-5" />}
              title="Total Invested"
              value="$1,975,000"
              subtext="Lifetime capital deployed"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Avg Deal Return"
              value="18.2%"
              subtext="Across all deals"
              valueClassName="text-fundex-forest"
            />
          </section>

          <SectionCard
            title="Portfolio Growth"
            subtitle="How your earnings have grown over time"
            topRight={
              <div className=" border border-stone-100 bg-fundex-gold/5 px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-medium text-stone-600">Total Growth</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-fundex-forest">$163,966</p>
              </div>
            }
          >
            <PortfolioGrowthChart />
          </SectionCard>

          <SectionCard
            title="Monthly Earnings"
            subtitle="Interest income from your investments"
            topRight={<EarningsToggle mode={earningsMode} onChange={setEarningsMode} />}
          >
            <MonthlyEarningsChart view={earningsMode} />
          </SectionCard>

          <section className=" border border-stone-100 bg-fundex-gold/5 p-6 shadow-sm md:p-8">
            <h2 className="text-base font-medium text-stone-900">Expected Earnings</h2>
            <p className="mt-1 text-sm text-stone-500">Income expected from active investments</p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              <div className="flex gap-4  border border-stone-100 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-500">Next 30 Days</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">$5,000</p>
                </div>
              </div>
              <div className="flex gap-4  border border-stone-100 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-500">Next 90 Days</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">$15,000</p>
                </div>
              </div>
              <div className="flex gap-4  border border-stone-100 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-500">Remaining Expected</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">$50,000</p>
                </div>
              </div>
            </div>
          </section>

          <SectionCard title="Portfolio Insights" subtitle="Key metrics about your investment activity">
            <div className="flex flex-col divide-y divide-stone-100 md:flex-row md:divide-x md:divide-y-0">
              <InsightMetric label="Deals Completed" value="3" />
              <InsightMetric label="Avg Deal Duration" value="8 mo" />
              <InsightMetric label="Reinvestment Rate" value="75%" valueClassName="text-fundex-forest" />
              <InsightMetric label="Capital Reinvested" value="$550,000" valueClassName="text-fundex-forest" />
              <InsightMetric label="Capital Withdrawn" value="$200,000" />
            </div>
          </SectionCard>
    </div>
  );
}
