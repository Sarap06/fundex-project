"use client";

import {
  BriefcaseBusiness,
  ChevronDown,
  Filter,
  PieChart,
  Search,
  TrendingUp,
  Wallet,
  X,
  Banknote,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";


type SummaryCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  sublabel?: string;
};

function SummaryCard({ icon, title, value, sublabel }: SummaryCardProps) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-stone-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-fundex-gold/10 text-fundex-forest">
        {icon}
      </div>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-stone-900 whitespace-nowrap sm:text-2xl">
        {value}
      </p>
      {sublabel ? <p className="mt-1 text-sm text-stone-500">{sublabel}</p> : null}
    </div>
  );
}

type DetailCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

function DetailCard({ title, children, className }: DetailCardProps) {
  return (
    <div
      className={`rounded-xl border border-stone-100 bg-white p-5 shadow-sm md:p-6 ${className ?? ""}`}
    >
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

type MetricMiniCardProps = {
  label: string;
  value: string;
  subtext: string;
};

function MetricMiniCard({ label, value, subtext }: MetricMiniCardProps) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900 md:text-xl">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{subtext}</p>
    </div>
  );
}

type PaymentScheduleItemProps = {
  icon: ReactNode;
  title: string;
  date: string;
  amount: string;
  status: string;
};

function PaymentScheduleItem({ icon, title, date, amount, status }: PaymentScheduleItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-fundex-gold/5 px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fundex-gold/10 text-fundex-forest">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <p className="text-xs text-stone-500">{date}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm font-semibold tabular-nums text-stone-900">{amount}</span>
        <span className="inline-flex rounded-full bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-semibold text-fundex-forest">
          {status}
        </span>
      </div>
    </div>
  );
}

type InvestmentDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function InvestmentDetailsDrawer({ open, onClose }: InvestmentDetailsDrawerProps) {
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

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

  if (!panelVisible) return null;

  const paymentsDone = 8;
  const paymentsTotal = 24;
  const progressPct = (paymentsDone / paymentsTotal) * 100;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="investment-drawer-title">
      <div
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          panelEntered ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      <div
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-full shadow-2xl transition-transform duration-300 ease-out md:w-1/2 md:max-w-[50vw] ${
          panelEntered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full w-full flex-col bg-white">
          <div className="relative shrink-0 bg-gradient-to-br from-fundex-forest to-fundex-green px-6 py-6 text-white shadow-md md:px-8 md:py-7">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="absolute right-4 top-4 rounded-lg p-2 text-white/90 transition hover:bg-white/10 hover:text-white md:right-5 md:top-5"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="investment-drawer-title" className="pr-12 text-xl font-semibold tracking-tight md:text-2xl">
              Downtown Commercial Plaza
            </h2>
            <p className="mt-1.5 text-sm font-medium text-white/80">Investment ID: INV-001</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-7">
            <div className="space-y-6">
              <DetailCard title="Deal Overview">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                    <p className="text-xs font-medium text-stone-500">Contract Size</p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">$500,000</p>
                    <p className="mt-1 text-xs text-stone-500">Total deal value</p>
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                    <p className="text-xs font-medium text-stone-500">Your Investment</p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-fundex-forest">$250,000</p>
                    <p className="mt-1 text-xs text-stone-500">Your allocated capital</p>
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                    <p className="text-xs font-medium text-stone-500">Your Ownership</p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">50.0%</p>
                    <p className="mt-1 text-xs text-stone-500">Of total contract</p>
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Collateral">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-stone-500">Asset Type</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">Residential Property</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-stone-500">Description</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">4-bedroom house in Miami, FL</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-500">Estimated Value</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-stone-900">$666,667</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">Loan-to-Value Ratio</p>
                      <p className="text-xs text-stone-500">LTV</p>
                    </div>
                    <p className="text-xl font-semibold tabular-nums text-stone-900">75%</p>
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Investment Details">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex justify-between gap-4 border-b border-stone-100 py-2 sm:block sm:border-0 sm:py-0">
                    <dt className="text-sm text-stone-500">Status</dt>
                    <dd className="text-sm font-semibold text-stone-900">
                      <span className="inline-flex rounded-full bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-semibold text-fundex-forest">
                        Active
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-stone-100 py-2 sm:block sm:border-0 sm:py-0">
                    <dt className="text-sm text-stone-500">Interest Rate</dt>
                    <dd className="text-sm font-semibold tabular-nums text-stone-900">10%</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-stone-100 py-2 sm:block sm:border-0 sm:py-0">
                    <dt className="text-sm text-stone-500">Start Date</dt>
                    <dd className="text-sm font-semibold text-stone-900">Jan 1, 2026</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2 sm:block sm:py-0">
                    <dt className="text-sm text-stone-500">Maturity Date</dt>
                    <dd className="text-sm font-semibold text-stone-900">Dec 31, 2027</dd>
                  </div>
                </dl>
              </DetailCard>

              <div className="rounded-2xl border border-stone-100 bg-fundex-gold/5 p-5 shadow-sm md:p-6">
                <h3 className="text-sm font-semibold text-stone-900">Financial Details</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MetricMiniCard label="Interest Rate" value="10%" subtext="Annual rate" />
                  <MetricMiniCard label="Monthly Interest" value="$2,083" subtext="Per month" />
                  <MetricMiniCard label="Total Expected Return" value="$300,000" subtext="At maturity" />
                  <MetricMiniCard label="Interest Earned to Date" value="$16,664" subtext="33% earned" />
                </div>

                <div className="mt-6 rounded-xl border border-stone-100 bg-white/70 p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-900">Payment Progress</p>
                    <p className="text-sm font-semibold tabular-nums text-stone-600">
                      {paymentsDone} / {paymentsTotal} payments
                    </p>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                    <div
                      className="h-full rounded-full bg-fundex-gold transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-stone-500">
                    <span className="font-medium tabular-nums text-stone-600">$16,664 earned</span>
                    <span>16 payments remaining</span>
                  </div>
                </div>
              </div>

              <DetailCard title="Payment Schedule">
                <div className="space-y-2.5">
                  <PaymentScheduleItem
                    icon={<Banknote className="h-4 w-4" />}
                    title="Payment #1"
                    date="Aug 1, 2026"
                    amount="$2,083"
                    status="Paid"
                  />
                  <PaymentScheduleItem
                    icon={<Banknote className="h-4 w-4" />}
                    title="Payment #2"
                    date="Sep 1, 2026"
                    amount="$2,083"
                    status="Paid"
                  />
                  <PaymentScheduleItem
                    icon={<Banknote className="h-4 w-4" />}
                    title="Payment #3"
                    date="Oct 1, 2026"
                    amount="$2,083"
                    status="Paid"
                  />
                  <PaymentScheduleItem
                    icon={<Banknote className="h-4 w-4" />}
                    title="Payment #4"
                    date="Nov 1, 2026"
                    amount="$2,083"
                    status="Paid"
                  />
                </div>
              </DetailCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type InvestmentRow = {
  dealName: string;
  dealId: string;
  contractSize: string;
  yourInvestment: string;
  ownershipPct: string;
  status: string;
  monthlyInterest: string;
  apr: string;
};

const INVESTMENT_ROWS: InvestmentRow[] = [
  {
    dealName: "Salamanca Project",
    dealId: "FDX-2847",
    contractSize: "$2,100,000",
    yourInvestment: "$350,000",
    ownershipPct: "16.67%",
    status: "Active",
    monthlyInterest: "$2,450",
    apr: "8.4% APR",
  },
  {
    dealName: "Harbor Bridge Loan",
    dealId: "FDX-1922",
    contractSize: "$1,450,000",
    yourInvestment: "$290,000",
    ownershipPct: "20.0%",
    status: "Active",
    monthlyInterest: "$2,030",
    apr: "8.4% APR",
  },
  {
    dealName: "Westside Industrial",
    dealId: "FDX-4401",
    contractSize: "$3,200,000",
    yourInvestment: "$400,000",
    ownershipPct: "12.5%",
    status: "Active",
    monthlyInterest: "$2,800",
    apr: "8.4% APR",
  },
  {
    dealName: "Capital returned from maturity",
    dealId: "FDX-1188",
    contractSize: "$900,000",
    yourInvestment: "$150,000",
    ownershipPct: "16.67%",
    status: "Active",
    monthlyInterest: "$1,050",
    apr: "8.4% APR",
  },
  {
    dealName: "Riverside Mezzanine",
    dealId: "FDX-3092",
    contractSize: "$1,100,000",
    yourInvestment: "$285,000",
    ownershipPct: "25.9%",
    status: "Active",
    monthlyInterest: "$1,995",
    apr: "8.4% APR",
  },
];

function InvestmentsTable({ onViewClick }: { onViewClick: () => void }) {
  return (
    <section className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm md:p-7">
      <h2 className="text-lg font-semibold text-stone-900">All Investments</h2>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search by deal name..."
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <select
            aria-label="Filter by status"
            className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
            defaultValue="all"
          >
            <option value="all">All Status</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-stone-50">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-50 bg-transparent text-xs font-semibold uppercase tracking-wide text-stone-400">
              <th className="whitespace-nowrap px-4 py-3">Deal Name</th>
              <th className="whitespace-nowrap px-4 py-3">Contract Size</th>
              <th className="whitespace-nowrap px-4 py-3">Your Investment</th>
              <th className="whitespace-nowrap px-4 py-3">Ownership %</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Monthly Interest</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {INVESTMENT_ROWS.map((row) => (
              <tr key={row.dealId} className="bg-white hover:bg-stone-50/50">
                <td className="px-4 py-4">
                  <p className="font-semibold text-stone-900">{row.dealName}</p>
                  <p className="text-xs text-stone-500">{row.dealId}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-stone-700">{row.contractSize}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="font-semibold tabular-nums text-fundex-forest">{row.yourInvestment}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-stone-700">{row.ownershipPct}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="inline-flex rounded-full bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-semibold text-fundex-forest">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium tabular-nums text-stone-900">{row.monthlyInterest}</p>
                  <p className="text-xs text-stone-500">{row.apr}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={onViewClick}
                    className="rounded-lg bg-fundex-gold px-4 py-2 text-xs font-semibold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type MaturingRow = {
  dealName: string;
  dealId: string;
  amount: string;
  maturityDate: string;
  status: string;
};

const MATURING_ROWS: MaturingRow[] = [
  { dealName: "Salamanca Project", dealId: "FDX-2847", amount: "$200,000", maturityDate: "Aug 15, 2026", status: "Maturing Soon" },
  { dealName: "Harbor Bridge Loan", dealId: "FDX-1922", amount: "$150,000", maturityDate: "Aug 22, 2026", status: "Maturing Soon" },
  { dealName: "Westside Industrial", dealId: "FDX-4401", amount: "$100,000", maturityDate: "Sep 01, 2026", status: "Maturing Soon" },
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDayAfterDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDisplayMaturity(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(12, 0, 0, 0);
  return d;
}

function isMaturityInWindow(maturityDateStr: string, windowDays: number | null): boolean {
  if (windowDays === null) return true;
  const maturity = parseDisplayMaturity(maturityDateStr);
  const start = startOfToday();
  const end = endOfDayAfterDays(start, windowDays);
  return maturity >= start && maturity <= end;
}

type MaturityFilterValue = "all" | "30" | "60" | "90";

function MaturingTable() {
  const [selectedMaturityFilter, setSelectedMaturityFilter] = useState<MaturityFilterValue>("all");

  const filteredMaturingRows = useMemo(() => {
    const days =
      selectedMaturityFilter === "all"
        ? null
        : selectedMaturityFilter === "30"
          ? 30
          : selectedMaturityFilter === "60"
            ? 60
            : 90;
    return MATURING_ROWS.filter((row) => isMaturityInWindow(row.maturityDate, days));
  }, [selectedMaturityFilter]);

  return (
    <section className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm md:p-7">
      <h2 className="text-lg font-semibold text-stone-900">Maturing Positions — Action Required</h2>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
          <div className="rounded-xl border border-stone-100 bg-fundex-gold/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fundex-forest">Total Capital Maturing</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">$450,000</p>
          </div>
          <div className="rounded-xl border border-stone-100 bg-fundex-gold/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fundex-forest">Number of Positions</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">3</p>
          </div>
          <div className="rounded-xl border border-stone-100 bg-fundex-gold/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fundex-forest">Next Maturity</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">Aug 15, 2026</p>
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
          <div className="relative w-full min-w-[10.5rem] sm:w-44">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <select
              aria-label="Filter maturing positions by timeframe"
              value={selectedMaturityFilter}
              onChange={(e) => setSelectedMaturityFilter(e.target.value as MaturityFilterValue)}
              className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
            >
              <option value="all">All</option>
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>
          <button
            type="button"
            className="rounded-lg bg-fundex-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fundex-green"
          >
            Reinvest All
          </button>
          <button
            type="button"
            className="rounded-lg border border-fundex-gold/30 bg-white px-5 py-2.5 text-sm font-semibold text-fundex-forest shadow-sm transition hover:bg-stone-50"
          >
            Withdraw All
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-stone-50">
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
            {filteredMaturingRows.map((row) => (
              <tr key={row.dealId} className="bg-white hover:bg-stone-50/50">
                <td className="px-4 py-4">
                  <p className="font-semibold text-stone-900">{row.dealName}</p>
                  <p className="text-xs text-stone-500">{row.dealId}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="font-semibold tabular-nums text-fundex-forest">{row.amount}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-stone-700">{row.maturityDate}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {row.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-fundex-forest px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-fundex-green"
                    >
                      Reinvest
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-fundex-gold/30 bg-white px-3 py-1.5 text-xs font-semibold text-fundex-forest shadow-sm transition hover:bg-stone-50"
                    >
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

export default function MyInvestmentsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10">
          <header className="rounded-xl border border-fundex-green/20 bg-gradient-to-br from-fundex-forest via-fundex-green to-fundex-forest px-7 py-8 text-white shadow-sm shadow-fundex-forest/15 md:px-9 md:py-9">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">My Investments</h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-white/80">
              Track and manage all your investment positions
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <SummaryCard icon={<Wallet className="h-5 w-5" />} title="Capital Deployed" value="$1,475,000" />
            <SummaryCard
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              title="Active Positions"
              value="6"
              sublabel="open deals"
            />
            <SummaryCard
              icon={<PieChart className="h-5 w-5" />}
              title="Avg Position Size"
              value="$295,833"
              sublabel="per deal"
            />
            <SummaryCard icon={<TrendingUp className="h-5 w-5" />} title="Largest Investment" value="$500,000" />
          </section>

          <InvestmentsTable onViewClick={() => setIsDrawerOpen(true)} />

          <MaturingTable />
      </div>

      <InvestmentDetailsDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
