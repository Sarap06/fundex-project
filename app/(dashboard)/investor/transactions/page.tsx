'use client';

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';


type FilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
};

function FilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className=" border border-stone-100 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
        <div className="relative min-w-0 flex-1 lg:min-w-[200px] lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full  border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
          />
        </div>

        <div className="relative w-full lg:w-40">
          <select
            aria-label="Transaction type"
            className="w-full appearance-none  border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-600 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
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
            className="w-full appearance-none  border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-stone-600 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all-status">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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

function mapApiTypeToDisplay(type: string): TxType {
  switch (type) {
    case 'contribution': return 'Contribution';
    case 'distribution': return 'Distribution';
    case 'interest_income': return 'Interest Income';
    case 'reinvestment': return 'Reinvestment';
    default: return 'Contribution';
  }
}

function mapApiStatusToDisplay(status: string): TxStatus {
  switch (status) {
    case 'completed': return 'Completed';
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'failed': return 'Failed';
    default: return 'Completed';
  }
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TypeCell({ type }: { type: TxType }) {
  if (type === "Contribution") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="flex h-8 w-8 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
          <ArrowUp className="h-4 w-4" />
        </span>
        {type}
      </span>
    );
  }
  if (type === "Distribution") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="flex h-8 w-8 items-center justify-center  bg-red-50 text-red-600">
          <ArrowDown className="h-4 w-4" />
        </span>
        {type}
      </span>
    );
  }
  if (type === "Interest Income") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="flex h-8 w-8 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
          <DollarSign className="h-4 w-4" />
        </span>
        {type}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
      <span className="flex h-8 w-8 items-center justify-center  bg-stone-50 text-stone-600">
        <RefreshCw className="h-4 w-4" />
      </span>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    Completed: "bg-fundex-gold/10 text-fundex-forest ring-fundex-gold/20",
    Pending: "bg-stone-100 text-stone-600 ring-stone-200",
    Processing: "bg-stone-50 text-stone-700 ring-stone-200",
    Failed: "bg-red-50 text-red-800 ring-red-100",
  };
  return (
    <span
      className={`inline-flex  px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
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

function DrawerTypeRow({ type }: { type: TxType }) {
  return (
    <div className="flex items-center gap-2">
      {type === "Interest Income" ? (
        <span className="flex h-9 w-9 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
          <DollarSign className="h-4 w-4" />
        </span>
      ) : type === "Contribution" ? (
        <span className="flex h-9 w-9 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
          <ArrowUp className="h-4 w-4" />
        </span>
      ) : type === "Distribution" ? (
        <span className="flex h-9 w-9 items-center justify-center  bg-red-50 text-red-600">
          <ArrowDown className="h-4 w-4" />
        </span>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center  bg-stone-50 text-stone-600">
          <RefreshCw className="h-4 w-4" />
        </span>
      )}
      <span className="text-sm font-medium text-stone-900">{type}</span>
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
            <h2 id="txn-drawer-title" className="text-lg font-medium text-stone-900 md:text-xl">
              Transaction Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className=" p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-6">
            <section className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Transaction ID</p>
                <p className="mt-1 font-mono text-sm font-semibold text-stone-900">{transaction.id}</p>
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

              <div className=" border border-stone-100 bg-stone-50/50 p-4 shadow-sm">
                <p className="text-xs font-medium text-stone-500">Amount</p>
                <p
                  className={`mt-2 text-lg font-semibold tabular-nums ${positive ? "text-fundex-forest" : "text-red-600"}`}
                >
                  {formatAmount(transaction.amount)}
                </p>
              </div>

              <div className="border-t border-stone-100 pt-5">
                <p className="text-xs font-medium text-stone-500">Date Processed</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  {expandProcessedDate(transaction.date)}
                </p>
              </div>
            </section>

            <section className="mt-8 border-t border-stone-100 pt-8">
              <h3 className="text-sm font-medium text-stone-900">Deal Information</h3>
              <div className="mt-4  border border-fundex-gold/20 bg-fundex-gold/5 px-4 py-4 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-500">Deal Name</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{transaction.deal}</p>
                </div>
              </div>
            </section>

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
        <div className="mt-2 h-1.5 w-full max-w-[100px] overflow-hidden  bg-stone-100">
          <div className="h-full  bg-fundex-gold" style={{ width: `${paymentPct}%` }} />
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-right">
        <button
          type="button"
          onClick={() => onView(tx)}
          className=" border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/10"
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
    <div className="overflow-hidden  border border-stone-100 bg-white shadow-sm">
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all-types');
  const [statusFilter, setStatusFilter] = useState('all-status');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        const res = await fetch('/api/investor/transactions', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: Transaction[] = (data.transactions || []).map((tx: any) => ({
            id: tx.id,
            deal: tx.dealName || 'Unknown Deal',
            type: mapApiTypeToDisplay(tx.type),
            date: formatDateShort(tx.date),
            amount: tx.type === 'distribution' ? -Math.abs(tx.amount) : tx.amount,
            status: mapApiStatusToDisplay(tx.status),
            ratePct: tx.monthlyRate || 0,
            totalPayments: tx.totalPayments || 0,
            completedPayments: tx.paymentNumber || 0,
          }));
          setTransactions(mapped);
        }
      } catch (err) {
        console.error('[TRANSACTIONS] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) {
      const t = window.setTimeout(() => setSelectedTransaction(null), 320);
      return () => window.clearTimeout(t);
    }
  }, [isDrawerOpen]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (searchQuery && !tx.deal.toLowerCase().includes(searchQuery.toLowerCase()) && !tx.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (typeFilter !== 'all-types') {
        const typeMap: Record<string, TxType> = { contribution: 'Contribution', distribution: 'Distribution', interest: 'Interest Income', reinvestment: 'Reinvestment' };
        if (tx.type !== typeMap[typeFilter]) return false;
      }
      if (statusFilter !== 'all-status' && tx.status.toLowerCase() !== statusFilter) return false;
      return true;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter]);

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-fundex-forest" /></div>;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 pb-12 md:space-y-8">
          <header>
            <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">Transactions</h1>
            <p className="mt-2 text-sm font-normal text-stone-400">Capital activity and payment history</p>
          </header>

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          <TransactionTable rows={filteredTransactions} onViewTransaction={(tx) => { setSelectedTransaction(tx); setIsDrawerOpen(true); }} />
      </div>

      <TransactionDetailsDrawer
        open={isDrawerOpen}
        transaction={selectedTransaction}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
