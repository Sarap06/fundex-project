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
      className={`flex h-full w-full min-w-[220px] flex-col p-6 shadow-sm transition-shadow duration-200 ${
        filled
          ? "rounded-2xl bg-gradient-to-br from-fundex-forest to-fundex-green text-white shadow-sm shadow-fundex-forest/15"
          : "fdx-card hover:shadow-md"
      }`}
    >
      <p
        className={`text-sm font-medium leading-snug ${filled ? "text-white/90" : "text-stone-500"}`}
      >
        {title}
      </p>
      <p className="mt-3 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">
        {value}
      </p>
      <div className="mt-2 min-h-[2.75rem]">
        {subtext ? (
          <p
            className={`text-sm leading-snug ${filled ? "text-white/90" : "text-stone-500"}`}
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
      className={`relative fdx-card p-6 md:p-7 ${className ?? ""}`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-[1.65rem]">{title}</h2>
          <p className="mt-1.5 text-sm text-stone-500 md:text-base">{subtitle}</p>
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
      className="flex w-full items-center gap-4 fdx-card px-5 py-5 text-left transition duration-200 hover:border-stone-200 hover:bg-stone-50 hover:shadow-md"
    >
      <div className="shrink-0 rounded-lg bg-fundex-gold/10 p-2.5 text-fundex-forest">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-semibold leading-snug text-stone-900">{title}</p>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
    </button>
  );
}

function ActivityItem({ icon, title, subtitle, date }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-5 first:pt-0.5 last:pb-0.5">
      <div className="shrink-0 rounded-xl bg-stone-100 p-2.5 text-stone-500">{icon}</div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[0.9375rem] font-semibold leading-snug text-stone-900">{title}</p>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      <p className="shrink-0 self-center text-right text-sm font-medium tabular-nums text-stone-400">{date}</p>
    </div>
  );
}

export default function Page() {
  return (
        <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10 md:space-y-10">
          <header className="rounded-2xl bg-gradient-to-br from-fundex-forest via-fundex-green to-fundex-forest px-7 py-9 text-white shadow-sm shadow-fundex-forest/20 md:px-9 md:py-10">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-base font-medium text-white/90 md:text-[1.05rem]">
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
            <div className="rounded-2xl border border-fundex-gold/20 bg-gradient-to-br from-fundex-cream/30 via-white to-fundex-cream/10 p-6 shadow-sm md:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fundex-forest">Funds Being Deployed</p>
                  <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">$300,000</p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 md:text-[0.9375rem]">
                    Being placed into active opportunities
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-fundex-gold/30 bg-fundex-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-900">
                  Deploying
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-stone-50 p-6 shadow-sm md:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-700">Collateral Backing (Active Deals)</p>
                  <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">$8,500,000</p>
                  <p className="mt-1.5 text-sm text-stone-600">Total collateral value</p>
                </div>
                <span className="shrink-0 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-900">
                  Active
                </span>
              </div>
              <div className="mt-6 border-t border-stone-200 pt-6">
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-stone-900">68%</p>
                <p className="mt-1 text-sm text-stone-600">Average LTV</p>
              </div>
            </div>
          </section>

          <SectionCard
            title="Actions Required"
            subtitle="Items that need your attention"
            topRight={<CircleAlert className="mt-0.5 h-5 w-5 text-fundex-gold" />}
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
              <div className="absolute -right-1.5 top-9 rounded-full border border-stone-200 bg-white p-2 shadow-sm">
                <FileText className="h-4 w-4 text-stone-600" />
              </div>
            }
          >
            <div className="divide-y divide-stone-100">
              <ActivityItem
                icon={<Wallet className="h-5 w-5 text-fundex-forest" />}
                title="Payment received — $5,208"
                subtitle="Salamanca Project"
                date="Today"
              />
              <ActivityItem
                icon={<FileText className="h-5 w-5 text-stone-600" />}
                title="New document added — Distribution Statement"
                subtitle="Harbor Bridge Loan"
                date="Yesterday"
              />
              <ActivityItem
                icon={<ArrowLeftRight className="h-5 w-5 text-stone-500" />}
                title="Wire confirmed — $150,000 deposited"
                subtitle="Capital returned from maturity"
                date="2 days ago"
              />
              <ActivityItem
                icon={<TrendingUp className="h-5 w-5 text-fundex-forest" />}
                title="Investment updated — Status changed to Active"
                subtitle="Westside Industrial"
                date="3 days ago"
              />
            </div>
          </SectionCard>
        </div>
  );
}
