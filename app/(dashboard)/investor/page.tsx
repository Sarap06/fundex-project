import {
  ArrowLeftRight,
  BellRing,
  ChevronRight,
  CircleAlert,
  FileText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";


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
      className={`flex h-full w-full min-w-[220px] flex-col rounded-3xl border p-6 shadow-sm transition-shadow duration-200 ${
        filled
          ? "border-emerald-600 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/15"
          : "border-slate-200/90 bg-white text-slate-900 hover:shadow-md"
      }`}
    >
      <p
        className={`text-sm font-medium leading-snug ${filled ? "text-emerald-50/95" : "text-slate-500"}`}
      >
        {title}
      </p>
      <p className="mt-3 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
        {value}
      </p>
      <div className="mt-2 min-h-[2.75rem]">
        {subtext ? (
          <p
            className={`text-sm leading-snug ${filled ? "text-emerald-50/90" : "text-slate-500"}`}
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
    <section
      className={`relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-7 ${className ?? ""}`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-500 md:text-base">{subtitle}</p>
        </div>
        {topRight}
      </div>
      {children}
    </section>
  );
}

function ActionItem({ icon, title, subtitle }: ActionItemProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 rounded-3xl border border-slate-200/90 bg-white px-5 py-5 text-left shadow-sm transition duration-200 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md"
    >
      <div className="shrink-0 rounded-lg bg-amber-100/90 p-2.5 text-amber-600">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-semibold leading-snug text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </button>
  );
}

function ActivityItem({ icon, title, subtitle, date }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-5 first:pt-0.5 last:pb-0.5">
      <div className="shrink-0 rounded-xl bg-slate-100/90 p-2.5 text-slate-600">{icon}</div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[0.9375rem] font-semibold leading-snug text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <p className="shrink-0 self-center text-right text-sm font-medium tabular-nums text-slate-400">{date}</p>
    </div>
  );
}

export default function Page() {
  return (
        <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10 md:space-y-10">
          <header className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-500 px-7 py-9 text-white shadow-sm shadow-emerald-600/20 md:px-9 md:py-10">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-base font-medium text-emerald-50/95 md:text-[1.05rem]">
              Your investment overview
            </p>
          </header>

          <section className="grid gap-5 lg:grid-cols-4 lg:items-stretch">
            <StatCard title="Total Capital" value="$1,775,000" />
            <StatCard title="Capital Deployed" value="$1,475,000" subtext="Across 5 active deals" />
            <StatCard title="Monthly Income" value="$13,980" />
            <StatCard
              title="Upcoming Payments"
              value="$5,750"
              subtext="3 payments • Next in 7 days"
              filled
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-amber-100/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-6 shadow-sm md:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800/90">Funds Being Deployed</p>
                  <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">$300,000</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                    Being placed into active opportunities
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-200/90 bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  Deploying
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/40 p-6 shadow-sm md:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-800/90">Collateral Backing (Active Deals)</p>
                  <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">$8,500,000</p>
                  <p className="mt-1.5 text-sm text-slate-600">Total collateral value</p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-200/90 bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-900">
                  Active
                </span>
              </div>
              <div className="mt-6 border-t border-emerald-200/70 pt-6">
                <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">68%</p>
                <p className="mt-1 text-sm text-slate-600">Average LTV</p>
              </div>
            </div>
          </section>

          <SectionCard
            title="Actions Required"
            subtitle="Items that need your attention"
            topRight={<CircleAlert className="mt-0.5 h-5 w-5 text-amber-500" />}
          >
            <div className="space-y-3">
              <ActionItem
                icon={<BellRing className="h-5 w-5" />}
                title="2 broadcast messages require acknowledgment"
                subtitle="Click to review and take action"
              />
              <ActionItem
                icon={<Wallet className="h-5 w-5" />}
                title="2 investments maturing soon"
                subtitle="Click to review and take action"
              />
              <ActionItem
                icon={<FileText className="h-5 w-5" />}
                title="3 new documents available"
                subtitle="Click to review and take action"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Recent Activity"
            subtitle="Latest updates and transactions"
            topRight={
              <div className="absolute -right-1.5 top-9 rounded-full border border-slate-200/90 bg-white p-2 shadow-sm">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            }
          >
            <div className="divide-y divide-slate-200/80">
              <ActivityItem
                icon={<Wallet className="h-5 w-5 text-emerald-600" />}
                title="Payment received — $5,208"
                subtitle="Salamanca Project"
                date="Today"
              />
              <ActivityItem
                icon={<FileText className="h-5 w-5 text-blue-600" />}
                title="New document added — Distribution Statement"
                subtitle="Harbor Bridge Loan"
                date="Yesterday"
              />
              <ActivityItem
                icon={<ArrowLeftRight className="h-5 w-5 text-indigo-600" />}
                title="Wire confirmed — $150,000 deposited"
                subtitle="Capital returned from maturity"
                date="2 days ago"
              />
              <ActivityItem
                icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                title="Investment updated — Status changed to Active"
                subtitle="Westside Industrial"
                date="3 days ago"
              />
            </div>
          </SectionCard>
        </div>
  );
}
