"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  DollarSign,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";


function FilterBar() {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
        <div className="relative min-w-0 flex-1 lg:min-w-[200px] lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search transactions..."
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
          />
        </div>

        <div className="relative w-full lg:w-40">
          <select
            aria-label="Transaction type"
            className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-600 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            defaultValue="all-types"
          >
            <option value="all-types">All Types</option>
            <option value="contribution">Contribution</option>
            <option value="distribution">Distribution</option>
            <option value="interest">Interest Income</option>
            <option value="reinvestment">Reinvestment</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>

        <div className="relative w-full lg:w-40">
          <select
            aria-label="Status"
            className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-600 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            defaultValue="all-status"
          >
            <option value="all-status">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>

        <div className="relative w-full lg:w-44">
          <select
            aria-label="Date range"
            className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-600 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            defaultValue="30d"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="year">Last year</option>
            <option value="all">All time</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:ml-auto lg:w-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50"
          >
            <Download className="h-4 w-4 text-stone-600" />
            Export CSV
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fundex-gold px-4 py-2.5 text-sm font-semibold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
          >
            <Download className="h-4 w-4" />
            Download Statement
          </button>
        </div>
      </div>
    </div>
  );
}

type TxType = "Contribution" | "Distribution" | "Interest Income" | "Reinvestment";
type TxStatus = "Completed" | "Pending" | "Processing" | "Failed";

type Transaction = {
  id: string;
  deal: string;
  type: TxType;
  date: string;
  amount: number;
  status: TxStatus;
  ratePct: number;
  totalPayments: number;
  completedPayments: number;
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-9284",
    deal: "Green Energy Infrastructure",
    type: "Interest Income",
    date: "Jul 31, 2026",
    amount: 4167,
    status: "Completed",
    ratePct: 12.5,
    totalPayments: 12,
    completedPayments: 8,
  },
  {
    id: "TXN-9281",
    deal: "Luxury Apartment Complex",
    type: "Contribution",
    date: "Jul 28, 2026",
    amount: 100000,
    status: "Completed",
    ratePct: 10,
    totalPayments: 24,
    completedPayments: 24,
  },
  {
    id: "TXN-9275",
    deal: "Downtown Commercial Plaza",
    type: "Distribution",
    date: "Jul 22, 2026",
    amount: -10000,
    status: "Completed",
    ratePct: 11.25,
    totalPayments: 12,
    completedPayments: 12,
  },
  {
    id: "TXN-9268",
    deal: "General Account Activity",
    type: "Interest Income",
    date: "Jul 15, 2026",
    amount: 2083,
    status: "Pending",
    ratePct: 9.5,
    totalPayments: 12,
    completedPayments: 3,
  },
  {
    id: "TXN-9260",
    deal: "Green Energy Infrastructure",
    type: "Reinvestment",
    date: "Jul 10, 2026",
    amount: 25000,
    status: "Processing",
    ratePct: 12.5,
    totalPayments: 12,
    completedPayments: 6,
  },
  {
    id: "TXN-9254",
    deal: "Luxury Apartment Complex",
    type: "Contribution",
    date: "Jul 5, 2026",
    amount: 50000,
    status: "Failed",
    ratePct: 10,
    totalPayments: 24,
    completedPayments: 0,
  },
  {
    id: "TXN-9249",
    deal: "Downtown Commercial Plaza",
    type: "Interest Income",
    date: "Jul 1, 2026",
    amount: 3125,
    status: "Completed",
    ratePct: 11.25,
    totalPayments: 12,
    completedPayments: 10,
  },
  {
    id: "TXN-9241",
    deal: "General Account Activity",
    type: "Distribution",
    date: "Jun 28, 2026",
    amount: -5000,
    status: "Completed",
    ratePct: 8,
    totalPayments: 6,
    completedPayments: 6,
  },
];

function TypeCell({ type }: { type: TxType }) {
  if (type === "Contribution") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fundex-gold/10 text-fundex-forest">
          <ArrowUp className="h-4 w-4" />
        </span>
        {type}
      </span>
    );
  }
  if (type === "Distribution") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <ArrowDown className="h-4 w-4" />
        </span>
        {type}
      </span>
    );
  }
  if (type === "Interest Income") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fundex-gold/10 text-fundex-forest">
          <DollarSign className="h-4 w-4" />
        </span>
        {type}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-600">
        <RefreshCw className="h-4 w-4" />
      </span>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    Completed: "bg-fundex-gold/10 text-fundex-forest ring-fundex-gold/20",
    Pending: "bg-amber-50 text-amber-800 ring-amber-100",
    Processing: "bg-stone-50 text-stone-700 ring-stone-200",
    Failed: "bg-red-50 text-red-800 ring-red-100",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatAmount(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const n = Math.abs(value);
  return `${sign}$${n.toLocaleString("en-US")}`;
}

/** Long-form display ID (Figma sample style when applicable). */
function displayTransactionId(tx: Transaction): string {
  if (tx.id === "TXN-9284") return "TXN-2026-08-015";
  return tx.id;
}

function expandProcessedDate(shortDate: string): string {
  const parts = shortDate.replace(",", "").split(" ");
  if (parts.length < 3) return shortDate;
  const [mon, day, year] = parts;
  const months: Record<string, string> = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December",
  };
  const full = months[mon] ?? mon;
  return `${full} ${day}, ${year}`;
}

function drawerNotesFor(tx: Transaction): string {
  if (tx.type === "Interest Income") {
    return "Monthly interest payment for August 2026";
  }
  if (tx.type === "Contribution") {
    return "Capital contribution to investment account.";
  }
  if (tx.type === "Distribution") {
    return "Distribution payment to investor.";
  }
  return "Transaction processed per fund administration.";
}

function DrawerTypeRow({ type }: { type: TxType }) {
  return (
    <div className="flex items-center gap-2">
      {type === "Interest Income" ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fundex-gold/10 text-fundex-forest">
          <DollarSign className="h-4 w-4" />
        </span>
      ) : type === "Contribution" ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fundex-gold/10 text-fundex-forest">
          <ArrowUp className="h-4 w-4" />
        </span>
      ) : type === "Distribution" ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <ArrowDown className="h-4 w-4" />
        </span>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-50 text-stone-600">
          <RefreshCw className="h-4 w-4" />
        </span>
      )}
      <span className="text-sm font-semibold text-stone-900">{type}</span>
    </div>
  );
}

function TransactionDetailsDrawer({
  open,
  transaction,
  onClose,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      setPanelVisible(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPanelEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setPanelEntered(false);
    const t = window.setTimeout(() => setPanelVisible(false), 300);
    return () => window.clearTimeout(t);
  }, [open, transaction]);

  if (!panelVisible || !transaction) return null;

  const positive = transaction.amount >= 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="txn-drawer-title">
      <button
        type="button"
        aria-label="Close overlay"
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          panelEntered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-full shadow-2xl transition-transform duration-300 ease-out md:max-w-[48%] md:min-w-[380px] ${
          panelEntered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full w-full flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4 md:px-6">
            <h2 id="txn-drawer-title" className="text-lg font-semibold text-stone-900 md:text-xl">
              Transaction Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-6">
            <section className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Transaction ID</p>
                <p className="mt-1 font-mono text-sm font-semibold text-stone-900">{displayTransactionId(transaction)}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-stone-500">Type</p>
                  <div className="mt-2">
                    <DrawerTypeRow type={transaction.type} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Status</p>
                  <div className="mt-2">
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4 shadow-sm">
                  <p className="text-xs font-medium text-stone-500">Amount</p>
                  <p
                    className={`mt-2 text-lg font-semibold tabular-nums ${positive ? "text-fundex-forest" : "text-red-600"}`}
                  >
                    {formatAmount(transaction.amount)}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4 shadow-sm">
                  <p className="text-xs font-medium text-stone-500">Net Position After</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">$1,975,000</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-stone-500">Date Processed</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {expandProcessedDate(transaction.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Payment Method</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">ACH</p>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-stone-100 pt-8">
              <h3 className="text-sm font-semibold text-stone-900">Deal Information</h3>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-fundex-gold/20 bg-fundex-gold/5 px-4 py-4 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-500">Deal Name</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{transaction.deal}</p>
                </div>
                <button
                  type="button"
                  aria-label="Open deal"
                  className="shrink-0 rounded-lg p-2 text-fundex-forest transition hover:bg-fundex-gold/10"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="mt-8 border-t border-stone-100 pt-8">
              <h3 className="text-sm font-semibold text-stone-900">Flow of Funds</h3>
              <div className="mt-4 space-y-0">
                <div className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-stone-500">Source</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-stone-900">
                    IHIG Operating Account (Wells Fargo)
                  </p>
                </div>
                <div className="flex justify-center py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                </div>
                <div className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-stone-500">Destination</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">Investor Capital Account</p>
                  <p className="mt-2 text-xs text-stone-500">Bank Account: ****4832</p>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-stone-100 pt-8">
              <h3 className="text-sm font-semibold text-stone-900">Notes</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{drawerNotesFor(transaction)}</p>
            </section>

            <div className="mt-10 border-t border-stone-100 pt-6">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50"
              >
                <Download className="h-4 w-4 text-stone-600" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx, onView }: { tx: Transaction; onView: (tx: Transaction) => void }) {
  const positive = tx.amount >= 0;
  const paymentPct =
    tx.totalPayments > 0 ? Math.min(100, (tx.completedPayments / tx.totalPayments) * 100) : 0;

  return (
    <tr className="border-b border-stone-100 bg-white last:border-0 hover:bg-stone-50/50">
      <td className="whitespace-nowrap px-4 py-4 align-top">
        <p className="font-semibold text-stone-900">{tx.deal}</p>
        <p className="mt-0.5 text-xs text-stone-500">{tx.id}</p>
      </td>
      <td className="px-4 py-4 align-middle">
        <TypeCell type={tx.type} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-sm tabular-nums text-stone-700">{tx.date}</td>
      <td className="whitespace-nowrap px-4 py-4 align-middle">
        <span
          className={`text-sm font-semibold tabular-nums ${positive ? "text-fundex-forest" : "text-red-600"}`}
        >
          {formatAmount(tx.amount)}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle">
        <StatusBadge status={tx.status} />
      </td>
      <td className="min-w-[130px] px-4 py-4 align-middle">
        <p className="text-sm font-semibold tabular-nums text-fundex-forest">{tx.ratePct}%</p>
        <p className="mt-1 text-xs tabular-nums text-stone-500">
          {tx.completedPayments} / {tx.totalPayments} payments
        </p>
        <div className="mt-2 h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-fundex-gold" style={{ width: `${paymentPct}%` }} />
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-right">
        <button
          type="button"
          onClick={() => onView(tx)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-fundex-forest shadow-sm transition hover:bg-fundex-gold/10"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function TransactionTable({
  rows,
  onViewTransaction,
}: {
  rows: Transaction[];
  onViewTransaction: (tx: Transaction) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/90 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <th className="whitespace-nowrap px-4 py-3">Deal</th>
              <th className="whitespace-nowrap px-4 py-3">Type</th>
              <th className="whitespace-nowrap px-4 py-3">Date</th>
              <th className="whitespace-nowrap px-4 py-3">Amount</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Rate</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onView={onViewTransaction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!isDrawerOpen) {
      const t = window.setTimeout(() => setSelectedTransaction(null), 320);
      return () => window.clearTimeout(t);
    }
  }, [isDrawerOpen]);

  function handleViewTransaction(tx: Transaction) {
    setSelectedTransaction(tx);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 pb-12 md:space-y-8">
          <header className="rounded-xl border border-fundex-green/20 bg-gradient-to-br from-fundex-forest via-fundex-green to-fundex-forest px-7 py-8 text-white shadow-sm shadow-fundex-forest/15 md:rounded-2xl md:px-9 md:py-9">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Transactions</h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-white/90">
              Capital activity and payment history
            </p>
          </header>

          <FilterBar />

          <TransactionTable rows={SAMPLE_TRANSACTIONS} onViewTransaction={handleViewTransaction} />
      </div>

      <TransactionDetailsDrawer
        open={isDrawerOpen}
        transaction={selectedTransaction}
        onClose={handleCloseDrawer}
      />
    </>
  );
}
