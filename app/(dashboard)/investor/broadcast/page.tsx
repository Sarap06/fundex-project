"use client";

import { ChevronRight, CheckCircle2, Loader2, Search, Send, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";


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
  acknowledged: boolean;
  latestUpdateId: string;
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
  enableInvestorInbox: boolean;
};

function fmtDate(iso: string | null | undefined, short = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", short
    ? { month: "short", year: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" }
  );
}

function fmtCurrency(val: number | null | undefined): string {
  if (!val) return "$0";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function mapApiDeal(d: any): BroadcastDeal {
  const u = d.latestUpdate ?? null;
  const amount = fmtCurrency(d.targetAmount);
  const rate = d.interestRate ? `${d.interestRate}%` : "—";
  const maturity = fmtDate(d.closeDate, true);
  return {
    id: d.id,
    dealId: d.id,
    initials: getInitials(d.name),
    name: d.name,
    metrics: `${amount} • ${rate} • Matures ${maturity}`,
    updateType: u?.updateType === "manual" ? "Official Update" : "System Update",
    preview: u?.message?.slice(0, 160) ?? "No updates yet.",
    newCount: d.newCount ?? 0,
    actionRequired: !!d.actionRequired,
    acknowledged: !!u?.acknowledged,
    latestUpdateId: u?.id ?? "",
    activatedBadge: u ? `${u.updateType === "manual" ? "Official Update" : "System Update"} • ${fmtDate(u.sentAt)}` : "No updates yet",
    messageTitle: u?.title ?? "",
    messageBody: u?.message ?? "",
    messageTime: u ? relativeTime(u.sentAt) : "",
    signedDate: fmtDate(d.fundingCloseDate || d.closeDate),
    firstPayout: fmtDate(d.firstPayoutDate),
    collateralAddress: d.collateralAddress || `${d.locationCity ?? ""}${d.locationState ? ", " + d.locationState : ""}`,
    collateralValue: d.estimatedPropertyValue ? `${fmtCurrency(d.estimatedPropertyValue)} appraised` : "—",
    loanAmount: d.targetAmount ? `$${Number(d.targetAmount).toLocaleString()}` : "—",
    rateApr: d.interestRate ? `${d.interestRate}% APR` : "—",
    term: d.term ?? "—",
    maturityDate: fmtDate(d.closeDate),
    investorCommunity: "",
    totalAmount: amount,
    rateDisplay: rate,
    maturityShort: maturity,
    enableInvestorInbox: !!d.enableInvestorInbox,
  };
}

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
      className="flex w-full gap-4  border border-stone-100 bg-white p-5 text-left shadow-sm transition hover:border-stone-200 hover:shadow-md md:gap-5 md:p-6"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center  bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-semibold text-white shadow-sm">
        {deal.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-medium text-stone-900 md:text-lg">{deal.name}</p>
          <span className=" bg-fundex-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-fundex-forest">
            Active
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-500">{deal.metrics}</p>
        <div className="mt-4  border border-stone-100 bg-stone-50/90 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-stone-500">{deal.updateType}</span>
            {deal.actionRequired ? (
              <span className=" bg-stone-200 px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-stone-700">
                Action Required
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{deal.preview}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 self-center">
        {deal.newCount > 0 ? (
          <span className=" bg-fundex-gold px-2.5 py-1 text-xs font-medium text-fundex-forest shadow-sm">
            {deal.newCount} New
          </span>
        ) : (
          <span className=" border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-400">
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
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Deal name</p>
            <p className="mt-1 font-semibold text-stone-900">{deal.name}</p>
            <p className="mt-0.5 font-mono text-xs text-stone-500">{deal.dealId}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Signed date</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.signedDate}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">First payout</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.firstPayout}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Collateral address</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-stone-900">{deal.collateralAddress}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Collateral value</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.collateralValue}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Loan amount</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.loanAmount}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Rate</p>
            <p className="mt-1 text-sm font-semibold text-fundex-forest">{deal.rateApr}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Term</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.term}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Maturity date</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{deal.maturityDate}</p>
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return <div className="overflow-hidden  border border-stone-100 shadow-sm">{grid}</div>;
  }

  return (
    <div className="overflow-hidden  border border-stone-100 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-fundex-forest to-fundex-green px-4 py-3 md:px-5">
        <h3 className="text-sm font-medium text-white md:text-base">Contract Facts</h3>
        <span className=" bg-white/20 px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-white">
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
  onAcknowledge,
}: {
  deal: BroadcastDeal | null;
  open: boolean;
  onClose: () => void;
  onOpenContractFacts: () => void;
  onAcknowledge: (dealId: string, updateId: string) => Promise<void>;
}) {
  const [acknowledging, setAcknowledging] = useState(false);

  if (!open || !deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close channel"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,820px)] w-full max-w-2xl flex-col overflow-hidden border border-stone-100 bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.35)] sm: md:max-w-3xl">
        <div className="shrink-0 border-b border-stone-100 bg-white px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 gap-3">
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="mt-0.5 shrink-0  border border-stone-200 bg-white p-2 text-stone-500 shadow-sm transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center  bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-semibold text-white shadow-sm">
                {deal.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-medium tracking-tight text-stone-900 md:text-xl">{deal.name}</h2>
                  <span className=" bg-fundex-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-fundex-forest">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-500">{deal.metrics}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                className=" border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
              >
                Contact Admin
              </button>
              <button
                type="button"
                onClick={onOpenContractFacts}
                className=" border-2 border-fundex-gold bg-white px-4 py-2.5 text-sm font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/10"
              >
                View Contract Facts
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-5 md:px-6 md:py-6">
          <div className="mb-5 inline-flex  border border-fundex-gold/20 bg-fundex-gold/10 px-4 py-1.5 text-sm font-medium text-fundex-forest">
            {deal.activatedBadge}
          </div>

          <div className=" border border-stone-100 bg-white p-5 shadow-sm md:p-6">
            <div className="border-b border-stone-100 pb-4">
              <p className="text-sm font-medium text-stone-900">Fundex System</p>
              <p className="mt-0.5 text-xs text-stone-500">{deal.messageTime}</p>
            </div>
            <h3 className="mt-4 text-lg font-medium text-stone-900">{deal.messageTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{deal.messageBody}</p>
          </div>

          <div className="mt-6">
            <ContractFactsPanel deal={deal} />
          </div>

          {deal.actionRequired && !deal.acknowledged && (
            <>
              <div className="mt-6  border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-relaxed text-stone-600 md:px-5">
                Please review the contract details and confirm your acknowledgment. This is required for compliance.
              </div>
              <button
                type="button"
                disabled={acknowledging}
                onClick={async () => {
                  setAcknowledging(true);
                  await onAcknowledge(deal.id, deal.latestUpdateId);
                  setAcknowledging(false);
                }}
                className="mt-4 w-full  bg-fundex-gold py-3.5 text-sm font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {acknowledging ? <><Loader2 className="h-4 w-4 animate-spin" />Acknowledging...</> : "Acknowledge Contract"}
              </button>
            </>
          )}
          {deal.acknowledged && (
            <div className="mt-6 flex items-center gap-2  border border-fundex-forest/20 bg-fundex-forest/5 px-4 py-4 text-sm font-medium text-fundex-forest">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              You have acknowledged this contract update.
            </div>
          )}
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
              <div className="flex h-11 w-11 shrink-0 items-center justify-center  bg-gradient-to-br from-fundex-forest to-fundex-green text-sm font-semibold text-white">
                {deal.initials}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{deal.name}</p>
                <span className="mt-1 inline-block  bg-fundex-gold/10 px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-fundex-forest">
                  Active
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0  border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">Deal overview</h3>
            <div className="mt-3 space-y-3  border border-stone-100 bg-stone-50/80 p-4 shadow-sm">
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
              <h3 className="text-sm font-medium text-stone-900">Contract Facts</h3>
              <span className=" bg-stone-200 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-stone-600">
                Pinned
              </span>
            </div>
            <ContractFactsPanel deal={deal} compact embedded />
          </section>

          <section className="mt-6">
            <div className=" border border-stone-200 bg-stone-50 px-4 py-4 shadow-sm md:px-5">
              <p className="text-sm font-medium text-stone-900">Always Accessible</p>
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
              className="w-full  border border-stone-200 bg-white py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Back to Messages
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

type InboxMessage = {
  id: string;
  sender_id: string;
  sender_role: string;
  sender_name: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
};

function fmtMsgTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function InvestorInboxPanel({ currentUserId, canMessage }: { currentUserId: string; canMessage: boolean }) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useCallback((el: HTMLDivElement | null) => { el?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!currentUserId) return;
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/inbox/${currentUserId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages ?? []);
    };
    load();
    // Poll every 10 seconds for new messages
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !currentUserId) return;
    setSending(true);
    setSendError(null);
    setInput("");
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/inbox/${currentUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(prev => [...prev, json.message]);
      } else {
        setInput(text); // Restore message so user can retry
        setSendError("Failed to send. Please try again.");
      }
    } catch (err) {
      console.error("[InvestorInboxPanel] send error:", err);
      setInput(text);
      setSendError("Connection error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden  border border-stone-100 bg-white shadow-sm">
      <div className="flex min-h-[min(70vh,640px)] flex-col md:min-h-[520px]">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-stone-100 px-4 py-3.5 md:px-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center  bg-gradient-to-br from-fundex-forest to-fundex-green text-xs font-semibold text-white">
            FX
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5  border-2 border-white bg-fundex-green" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-stone-900">Fundex Admin</p>
            <p className="text-xs text-stone-500">Your company representative</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-stone-50/40 px-4 py-5 md:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16 text-sm text-stone-400">
              No messages yet. Start the conversation below.
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_role === "investor";
              return (
                <div key={msg.id} className={`flex max-w-[90%] flex-col gap-1 md:max-w-[78%] ${isMine ? "self-end" : "self-start"}`}>
                  <div className={`px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm ${isMine ? " border border-fundex-gold/20 bg-fundex-gold/5" : " border border-stone-100 bg-white"}`}>
                    {msg.content}
                  </div>
                  <span className={`text-xs text-stone-400 ${isMine ? "pr-1 text-right" : "pl-1"}`}>
                    {fmtMsgTime(msg.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-stone-100 bg-white p-3 md:p-4">
          {canMessage ? (
            <>
              {sendError && (
                <p className="mb-2 text-xs text-red-500">{sendError}</p>
              )}
              <div className="flex items-center gap-2  border border-stone-200/90 bg-stone-50/50 px-1 py-1 pl-4 shadow-sm">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none"
                />
                <button
                  type="button"
                  aria-label="Send message"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center  bg-fundex-gold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : (
            <p className="py-2 text-center text-xs text-stone-400">
              Two-way messaging is not enabled for your investments.
            </p>
          )}
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
  const [deals, setDeals] = useState<BroadcastDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const fetchDeals = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/investor/broadcasts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setDeals((json.deals ?? []).map(mapApiDeal));
    } catch (err) {
      console.error("[BroadcastPage] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    init();
    fetchDeals();
  }, [fetchDeals]);

  const handleAcknowledge = async (dealId: string, updateId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`/api/broadcasts/deals/${dealId}/acknowledgments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ updateId }),
      });
      // Update local state optimistically
      setDeals(prev => prev.map(d => d.id === dealId
        ? { ...d, actionRequired: false, acknowledged: true, newCount: Math.max(0, d.newCount - 1) }
        : d
      ));
      setSelectedDealChannel(prev => prev?.id === dealId
        ? { ...prev, actionRequired: false, acknowledged: true }
        : prev
      );
    } catch (err) {
      console.error("[BroadcastPage] acknowledge error:", err);
    }
  };

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

  const filteredDeals = deals.filter((d) => {
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
        onAcknowledge={handleAcknowledge}
      />
      <ContractFactsDrawer
        deal={selectedDealChannel}
        open={isContractFactsOpen}
        onClose={closeContractFacts}
        onBackToMessages={closeContractFacts}
      />

      <div className="mx-auto max-w-screen-2xl space-y-8">
          <header>
            <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">Broadcast</h1>
            <p className="mt-2 text-sm font-normal text-stone-400">Stay updated with important communications from your investments</p>
          </header>

          <div>
            <h2 className="text-2xl font-medium tracking-tight text-stone-900">Deal Communications</h2>
            <p className="mt-2 text-base text-stone-600">Official updates from your active investments</p>
          </div>

          <div className="flex gap-2 border-b border-stone-200 pb-0">
            <button
              type="button"
              onClick={() => setMainTab("channels")}
              className={`relative px-4 py-2.5 text-sm font-medium transition md:px-5 ${
                mainTab === "channels"
                  ? " bg-fundex-gold text-fundex-forest shadow-sm"
                  : " text-stone-500 hover:text-stone-700"
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
              className={`relative px-4 py-2.5 text-sm font-medium transition md:px-5 ${
                mainTab === "inbox"
                  ? " bg-fundex-gold text-fundex-forest shadow-sm"
                  : " text-stone-500 hover:text-stone-700"
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
                    className="w-full  border border-stone-200/90 bg-white py-3.5 pl-12 pr-4 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest"
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
                      className={` px-4 py-2 text-sm font-medium transition ${
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
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-sm text-stone-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading your deal channels…
                  </div>
                ) : filteredDeals.length > 0 ? filteredDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onOpen={openChannel} />
                )) : (
                  <p className=" border border-dashed border-stone-200 bg-white py-12 text-center text-sm text-stone-500">
                    {deals.length === 0 ? "No active deal channels yet." : "No deals match this filter."}
                  </p>
                )}
              </div>
            </>
          ) : (
            <InvestorInboxPanel currentUserId={currentUserId} canMessage={deals.some(d => d.enableInvestorInbox)} />
          )}
        </div>
    </>
  );
}
