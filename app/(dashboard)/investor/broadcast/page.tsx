"use client";

import { ChevronRight, Search, Send, X } from "lucide-react";
import { useState } from "react";


type BroadcastDeal = {
  id: string;
  dealId: string;
  initials: string;
  name: string;
  metrics: string;
  updateType: "System Update" | "Official Update";
  preview: string;
  newCount: number;
  actionRequired: boolean;
  activatedBadge: string;
  messageTitle: string;
  messageBody: string;
  messageTime: string;
  signedDate: string;
  firstPayout: string;
  collateralAddress: string;
  collateralValue: string;
  loanAmount: string;
  rateApr: string;
  term: string;
  maturityDate: string;
  investorCommunity: string;
  totalAmount: string;
  rateDisplay: string;
  maturityShort: string;
};

const SAMPLE_DEALS: BroadcastDeal[] = [
  {
    id: "1",
    dealId: "DEAL-MT-2024-014",
    initials: "MO",
    name: "Midtown Office Complex",
    metrics: "$2.2M • 11.8% • Matures Apr 2027",
    updateType: "System Update",
    preview:
      "Your participation in this deal is now fully recorded. Review the activation notice and confirm acknowledgment for compliance.",
    newCount: 1,
    actionRequired: true,
    activatedBadge: "Deal Activated • April 1, 2026",
    messageTitle: "Contract Fully Funded and Activated 🎉",
    messageBody:
      "The Midtown Office Complex contract has been fully funded and officially activated. Interest begins accruing as of April 1, 2026. Your first payout will occur on May 1, 2026.",
    messageTime: "1 day ago",
    signedDate: "Mar 18, 2026",
    firstPayout: "May 1, 2026",
    collateralAddress: "450 W 42nd St, New York, NY",
    collateralValue: "$3.4M appraised",
    loanAmount: "$2,200,000",
    rateApr: "11.8% APR",
    term: "36 months",
    maturityDate: "Apr 30, 2027",
    investorCommunity: "176 investors participating in this deal",
    totalAmount: "$2.2M",
    rateDisplay: "11.8%",
    maturityShort: "Apr 2027",
  },
  {
    id: "2",
    dealId: "DEAL-SB-2025-008",
    initials: "SB",
    name: "Salamanca Bridge Loan",
    metrics: "$4.1M • 10.2% • Matures Dec 2028",
    updateType: "Official Update",
    preview:
      "Quarterly distribution schedule posted. No action needed unless you elect to reinvest proceeds.",
    newCount: 0,
    actionRequired: false,
    activatedBadge: "Distribution Scheduled • March 28, 2026",
    messageTitle: "Q1 distribution timeline",
    messageBody:
      "We have published the Q1 distribution calendar for the Salamanca Bridge Loan. Distributions will process on the dates shown in your investor statement. Contact admin if you need to update wire instructions before the next cycle.",
    messageTime: "3 days ago",
    signedDate: "Jan 8, 2025",
    firstPayout: "Apr 1, 2025",
    collateralAddress: "Industrial parcel, Salamanca, ES",
    collateralValue: "€5.2M equivalent",
    loanAmount: "$4,100,000",
    rateApr: "10.2% APR",
    term: "48 months",
    maturityDate: "Dec 15, 2028",
    investorCommunity: "243 investors participating in this deal",
    totalAmount: "$4.1M",
    rateDisplay: "10.2%",
    maturityShort: "Dec 2028",
  },
];

type MainTab = "channels" | "inbox";
type FilterPill = "all" | "unread" | "ack";

function DealCard({
  deal,
  onOpen,
}: {
  deal: BroadcastDeal;
  onOpen: (deal: BroadcastDeal) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(deal)}
      className="flex w-full gap-4 rounded-xl border border-stone-100 bg-white p-5 text-left shadow-sm transition hover:border-stone-200 hover:shadow-md md:gap-5 md:p-6"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-semibold text-white shadow-sm">
        {deal.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-stone-900 md:text-lg">{deal.name}</p>
          <span className="rounded-full bg-fundex-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fundex-forest">
            Active
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-500">{deal.metrics}</p>
        <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50/90 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{deal.updateType}</span>
            {deal.actionRequired ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-orange-800">
                Action Required
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{deal.preview}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 self-center">
        {deal.newCount > 0 ? (
          <span className="rounded-full bg-fundex-gold px-2.5 py-1 text-xs font-semibold text-fundex-forest shadow-sm">
            {deal.newCount} New
          </span>
        ) : (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-400">
            Up to date
          </span>
        )}
        <ChevronRight className="h-5 w-5 text-stone-400" aria-hidden />
      </div>
    </button>
  );
}

function ContractFactsPanel({
  deal,
  compact,
  embedded,
}: {
  deal: BroadcastDeal;
  compact?: boolean;
  /** No branded banner — use when an outer section already titles "Contract Facts" */
  embedded?: boolean;
}) {
  const pad = compact ? "p-4 md:p-5" : "p-5 md:p-6";
  const grid = (
    <div className={`grid gap-6 bg-white sm:grid-cols-2 ${pad}`}>
        <div className="space-y-4">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Deal name</p>
            <p className="mt-1 font-semibold text-stone-900">{deal.name}</p>
            <p className="mt-0.5 font-mono text-xs text-stone-500">{deal.dealId}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Signed date</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.signedDate}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">First payout</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.firstPayout}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Collateral address</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-stone-900">{deal.collateralAddress}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Collateral value</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.collateralValue}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Loan amount</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.loanAmount}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Rate</p>
            <p className="mt-1 text-sm font-semibold text-fundex-forest">{deal.rateApr}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Term</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.term}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-stone-400">Maturity date</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.maturityDate}</p>
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return <div className="overflow-hidden rounded-xl border border-stone-100 shadow-sm">{grid}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-100 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-fundex-forest to-fundex-green px-4 py-3 md:px-5">
        <h3 className="text-sm font-semibold text-white md:text-base">Contract Facts</h3>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-white">
          Active
        </span>
      </div>
      {grid}
    </div>
  );
}

function DealChannelChatModal({
  deal,
  open,
  onClose,
  onOpenContractFacts,
}: {
  deal: BroadcastDeal | null;
  open: boolean;
  onClose: () => void;
  onOpenContractFacts: () => void;
}) {
  if (!open || !deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close channel"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-stone-100 bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.35)] sm:rounded-2xl md:max-w-3xl">
        <div className="shrink-0 border-b border-stone-100 bg-white px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 gap-3">
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="mt-0.5 shrink-0 rounded-xl border border-stone-200 bg-white p-2 text-stone-500 shadow-sm transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-semibold text-white shadow-sm">
                {deal.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-stone-900 md:text-xl">{deal.name}</h2>
                  <span className="rounded-full bg-fundex-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fundex-forest">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-500">{deal.metrics}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
              >
                Contact Admin
              </button>
              <button
                type="button"
                onClick={onOpenContractFacts}
                className="rounded-xl border-2 border-fundex-gold bg-white px-4 py-2.5 text-sm font-semibold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/10"
              >
                View Contract Facts
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-5 md:px-6 md:py-6">
          <div className="mb-5 inline-flex rounded-full border border-fundex-gold/20 bg-fundex-gold/10 px-4 py-1.5 text-sm font-semibold text-fundex-forest">
            {deal.activatedBadge}
          </div>

          <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm md:p-6">
            <div className="border-b border-stone-100 pb-4">
              <p className="text-sm font-semibold text-stone-900">Fundex System</p>
              <p className="mt-0.5 text-xs text-stone-500">{deal.messageTime}</p>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-stone-900">{deal.messageTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{deal.messageBody}</p>
          </div>

          <div className="mt-6">
            <ContractFactsPanel deal={deal} />
          </div>

          <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 text-sm leading-relaxed text-amber-800 md:px-5">
            Please review the contract details and confirm your acknowledgment. This is required for compliance.
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-fundex-gold py-3.5 text-sm font-semibold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
          >
            Acknowledge Contract
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractFactsDrawer({
  deal,
  open,
  onClose,
  onBackToMessages,
}: {
  deal: BroadcastDeal | null;
  open: boolean;
  onClose: () => void;
  onBackToMessages: () => void;
}) {
  if (!open || !deal) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Contract facts">
      <button
        type="button"
        aria-label="Close contract facts"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-full flex-col border-l border-stone-200 bg-white shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.2)] sm:max-w-[min(42%,420px)] sm:min-w-[300px] md:max-w-[min(40%,480px)]">
        <div className="shrink-0 border-b border-stone-100 px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-semibold text-white">
                {deal.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{deal.name}</p>
                <span className="mt-1 inline-block rounded-full bg-fundex-gold/10 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fundex-forest">
                  Active
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Deal overview</h3>
            <div className="mt-3 space-y-3 rounded-xl border border-stone-100 bg-stone-50/80 p-4 shadow-sm">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Total amount</span>
                <span className="font-semibold text-stone-900">{deal.totalAmount}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Rate</span>
                <span className="font-semibold text-fundex-forest">{deal.rateDisplay}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Maturity</span>
                <span className="font-semibold text-stone-900">{deal.maturityShort}</span>
              </div>
              <p className="border-t border-stone-200/80 pt-3 text-sm leading-relaxed text-stone-600">
                {deal.investorCommunity}
              </p>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-900">Contract Facts</h3>
              <span className="rounded bg-stone-200 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-stone-600">
                Pinned
              </span>
            </div>
            <ContractFactsPanel deal={deal} compact embedded />
          </section>

          <section className="mt-6">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 shadow-sm md:px-5">
              <p className="text-sm font-semibold text-stone-900">Always Accessible</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                This contract information is always available here. You don&apos;t need to scroll through messages to find these
                details.
              </p>
            </div>
          </section>

          <section className="mt-6 pb-4">
            <button
              type="button"
              onClick={onBackToMessages}
              className="w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Back to Messages
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

type InboxPeerId = "derek-a" | "support" | "derek-b";

const INBOX_CONVERSATIONS: {
  id: InboxPeerId;
  initials: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
}[] = [
  {
    id: "derek-a",
    initials: "DA",
    name: "Derek Admin",
    preview: "Let me know if you want us to review the reinvestment options.",
    time: "1h",
    unread: 1,
  },
  {
    id: "support",
    initials: "FS",
    name: "Fundex Support",
    preview: "Your document request has been received.",
    time: "Yesterday",
  },
  {
    id: "derek-b",
    initials: "DA",
    name: "Derek Admin",
    preview: "We can walk you through the maturity options anytime.",
    time: "Mon",
  },
];

function InvestorInboxPanel() {
  const [activeId, setActiveId] = useState<InboxPeerId>("derek-a");

  const active = INBOX_CONVERSATIONS.find((c) => c.id === activeId)!;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm">
      <div className="flex min-h-[min(70vh,640px)] flex-col md:min-h-[520px] md:flex-row">
        <div className="flex w-full flex-col border-b border-stone-200 bg-stone-50/40 md:w-[32%] md:shrink-0 md:border-b-0 md:border-r md:border-stone-200/90">
          <div className="shrink-0 border-b border-stone-200/80 p-3 md:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                placeholder="Search messages"
                className="w-full rounded-xl border border-stone-200/90 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-stone-100 overflow-y-auto md:max-h-none">
            {INBOX_CONVERSATIONS.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full gap-3 px-3 py-3.5 text-left transition md:px-4 ${
                    isActive ? "bg-stone-100" : "hover:bg-white/80"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-600 to-stone-800 text-xs font-semibold text-white">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-stone-900">{c.name}</p>
                      <span className="shrink-0 text-xs text-stone-400">{c.time}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="line-clamp-2 min-w-0 flex-1 text-xs leading-snug text-stone-500">{c.preview}</p>
                      {c.unread ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-fundex-gold px-1.5 text-[0.625rem] font-semibold text-fundex-forest">
                          {c.unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-[320px] min-w-0 flex-1 flex-col bg-white md:w-[68%]">
          <div className="flex shrink-0 items-center gap-3 border-b border-stone-100 px-4 py-3.5 md:px-5">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-600 to-stone-800 text-xs font-semibold text-white">
              {active.initials}
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-fundex-green"
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-stone-900">{active.name}</p>
              <p className="text-xs text-stone-500">{active.name.includes("Support") ? "Support" : "Admin"}</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-stone-50/40 px-4 py-5 md:px-6">
            {activeId === "derek-a" ? (
              <>
                <div className="flex max-w-[90%] flex-col gap-1 self-start md:max-w-[78%]">
                  <div className="rounded-2xl rounded-tl-md border border-stone-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm">
                    Hi Nigel, just checking in. Let me know if you&apos;d like us to go over your current maturity options.
                  </div>
                  <span className="pl-1 text-xs text-stone-400">10:12 AM</span>
                </div>
                <div className="flex max-w-[90%] flex-col gap-1 self-end md:max-w-[78%]">
                  <div className="rounded-2xl rounded-tr-md border border-fundex-gold/20 bg-fundex-gold/5 px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm">
                    Yes, I&apos;d like to understand whether reinvesting would be better for the Midtown deal.
                  </div>
                  <span className="pr-1 text-right text-xs text-stone-400">10:18 AM</span>
                </div>
                <div className="flex max-w-[90%] flex-col gap-1 self-start md:max-w-[78%]">
                  <div className="rounded-2xl rounded-tl-md border border-stone-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm">
                    Absolutely. I can walk you through the available options and expected payout timing.
                  </div>
                  <span className="pl-1 text-xs text-stone-400">10:19 AM</span>
                </div>
                <div className="flex max-w-[90%] flex-col gap-1 self-start md:max-w-[78%]">
                  <div className="rounded-2xl rounded-tl-md border border-stone-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm">
                    Also, if you want, I can have the admin team prepare a simple summary for you.
                  </div>
                  <span className="pl-1 text-xs text-stone-400">10:20 AM</span>
                </div>
              </>
            ) : activeId === "support" ? (
              <div className="flex max-w-[90%] flex-col gap-1 self-start md:max-w-[78%]">
                <div className="rounded-2xl rounded-tl-md border border-stone-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm">
                  Your document request has been received. We&apos;ll follow up if we need anything else from you.
                </div>
                <span className="pl-1 text-xs text-stone-400">Yesterday · 4:02 PM</span>
              </div>
            ) : (
              <div className="flex max-w-[90%] flex-col gap-1 self-start md:max-w-[78%]">
                <div className="rounded-2xl rounded-tl-md border border-stone-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm">
                  We can walk you through the maturity options anytime — just say the word and we&apos;ll set up a quick call.
                </div>
                <span className="pl-1 text-xs text-stone-400">Mon · 9:41 AM</span>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-stone-100 bg-white p-3 md:p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-stone-200/90 bg-stone-50/50 px-1 py-1 pl-4 shadow-sm">
              <input
                type="text"
                placeholder="Type a message..."
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none"
              />
              <button
                type="button"
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fundex-gold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BroadcastPage() {
  const [mainTab, setMainTab] = useState<MainTab>("channels");
  const [filterPill, setFilterPill] = useState<FilterPill>("all");
  const [selectedDealChannel, setSelectedDealChannel] = useState<BroadcastDeal | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isContractFactsOpen, setIsContractFactsOpen] = useState(false);

  const openChannel = (deal: BroadcastDeal) => {
    setSelectedDealChannel(deal);
    setIsChannelModalOpen(true);
    setIsContractFactsOpen(false);
  };

  const closeChannelModal = () => {
    setIsChannelModalOpen(false);
    setIsContractFactsOpen(false);
    setSelectedDealChannel(null);
  };

  const openContractFacts = () => setIsContractFactsOpen(true);
  const closeContractFacts = () => setIsContractFactsOpen(false);

  const filteredDeals = SAMPLE_DEALS.filter((d) => {
    if (filterPill === "unread") return d.newCount > 0;
    if (filterPill === "ack") return d.actionRequired;
    return true;
  });

  return (
    <>
      <DealChannelChatModal
        deal={selectedDealChannel}
        open={isChannelModalOpen}
        onClose={closeChannelModal}
        onOpenContractFacts={openContractFacts}
      />
      <ContractFactsDrawer
        deal={selectedDealChannel}
        open={isContractFactsOpen}
        onClose={closeContractFacts}
        onBackToMessages={closeContractFacts}
      />

      <header className="bg-gradient-to-r from-fundex-forest via-fundex-green to-fundex-forest px-5 py-10 text-white md:px-10 md:py-12">
        <div className="mx-auto max-w-screen-2xl">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Broadcast</h1>
            <p className="mt-3 max-w-2xl text-base text-white/90 md:text-lg">
              Stay updated with important communications from your investments
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-screen-2xl space-y-8 px-5 py-8 md:px-8 md:py-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Deal Communications</h2>
            <p className="mt-2 text-base text-stone-600">Official updates from your active investments</p>
          </div>

          <div className="flex gap-2 border-b border-stone-200 pb-0">
            <button
              type="button"
              onClick={() => setMainTab("channels")}
              className={`relative px-4 py-2.5 text-sm font-semibold transition md:px-5 ${
                mainTab === "channels"
                  ? "rounded-t-xl rounded-b-none bg-fundex-gold text-fundex-forest shadow-sm"
                  : "rounded-t-lg text-stone-500 hover:text-stone-700"
              }`}
            >
              Deal Channels
            </button>
            <button
              type="button"
              onClick={() => {
                setIsChannelModalOpen(false);
                setIsContractFactsOpen(false);
                setSelectedDealChannel(null);
                setMainTab("inbox");
              }}
              className={`relative px-4 py-2.5 text-sm font-semibold transition md:px-5 ${
                mainTab === "inbox"
                  ? "rounded-t-xl rounded-b-none bg-fundex-gold text-fundex-forest shadow-sm"
                  : "rounded-t-lg text-stone-500 hover:text-stone-700"
              }`}
            >
              Investor Inbox
            </button>
          </div>

          {mainTab === "channels" ? (
            <>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                  <input
                    type="search"
                    placeholder="Search deals or updates"
                    className="w-full rounded-xl border border-stone-200/90 bg-white py-3.5 pl-12 pr-4 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "all" as const, label: "All" },
                      { id: "unread" as const, label: "Unread" },
                      { id: "ack" as const, label: "Needs Acknowledgment" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFilterPill(p.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        filterPill === p.id
                          ? "bg-stone-900 text-white shadow-sm"
                          : "border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pb-12">
                {filteredDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onOpen={openChannel} />
                ))}
                {filteredDeals.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 bg-white py-12 text-center text-sm text-stone-500">
                    No deals match this filter.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <InvestorInboxPanel />
          )}
        </div>
    </>
  );
}
