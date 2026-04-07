"use client";

import { Download, Eye, FileText, Filter, Search, X } from "lucide-react";
import { ReactNode, useState } from "react";


type StatCardProps = {
  title: string;
  value: string | number;
  valueClassName?: string;
  titleAdornment?: ReactNode;
};

function StatCard({ title, value, valueClassName, titleAdornment }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {titleAdornment}
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums tracking-tight ${valueClassName ?? "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}

type TabId = "all" | "tax";

function TabSwitcher({ activeTab, onChange }: { activeTab: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-8">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`relative pb-3 text-sm font-semibold transition ${
            activeTab === "all" ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All Documents
          {activeTab === "all" ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onChange("tax")}
          className={`relative pb-3 text-sm font-semibold transition ${
            activeTab === "tax" ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Tax Documents
          {activeTab === "tax" ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
          ) : null}
        </button>
      </div>
    </div>
  );
}

type DocumentRowData = {
  id: string;
  name: string;
  type: string;
  deals: string[];
  date: string;
  fileSize?: string;
};

function DocumentPreviewModal({
  open,
  document: doc,
  onClose,
}: {
  open: boolean;
  document: DocumentRowData | null;
  onClose: () => void;
}) {
  if (!open || !doc) return null;

  const dealLabel = doc.deals[0] ?? "—";
  const fileSize = doc.fileSize ?? "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" aria-hidden />
      <div className="relative flex max-h-[min(90vh,880px)] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)] md:w-[54%] md:max-w-[720px] md:min-w-[min(100%,520px)]">
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 pb-5 pt-6 md:px-8 md:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="document-preview-title" className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Document Preview
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">View the document details</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-7">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 md:p-6">
            <p className="text-lg font-bold text-slate-900">{doc.name}</p>
            <p className="mt-1 font-mono text-sm text-slate-600">{doc.id}</p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400">Type</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-slate-900">{doc.type}</p>
                </div>
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400">Upload date</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-slate-900">{doc.date}</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400">Deal</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold leading-snug text-slate-900">{dealLabel}</p>
                </div>
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400">File size</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-slate-900">{fileSize}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-bold text-slate-900">Document Preview</h3>
            <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-100/90 px-6 py-16 md:min-h-[280px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-400 shadow-sm">
                <FileText className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="mt-5 text-base font-semibold text-slate-800">Preview Unavailable</p>
              <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-slate-500">
                Click &quot;Open Full Document&quot; to view the complete file
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4 md:px-8 md:py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:justify-self-start"
            >
              Close
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:justify-self-center"
            >
              <Eye className="h-4 w-4" />
              Open Full Document
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:justify-self-end"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ doc, onView }: { doc: DocumentRowData; onView: (doc: DocumentRowData) => void }) {
  return (
    <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80">
      <td className="px-4 py-4 align-top">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{doc.name}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{doc.id}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-sm font-medium text-slate-700">{doc.type}</td>
      <td className="px-4 py-4 align-middle text-sm text-slate-600">
        <div className="flex flex-col gap-0.5">
          {doc.deals.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-sm tabular-nums text-slate-700">{doc.date}</td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label="View document"
            onClick={() => onView(doc)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Download document"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

const SAMPLE_DOCUMENTS: DocumentRowData[] = [
  {
    id: "DOC-2026-014",
    name: "Wire Confirmation — Initial Capital",
    type: "Deposit",
    deals: ["Dallas Mixed-Use Development", "Miami Office Project"],
    date: "Apr 1, 2026",
  },
  {
    id: "DOC-2026-089",
    name: "Subscription Agreement — Amendment",
    type: "Agreement",
    deals: ["Dallas Mixed-Use Development"],
    date: "Mar 22, 2026",
  },
  {
    id: "DOC-2026-072",
    name: "Quarterly Statement Q1",
    type: "Other",
    deals: ["Miami Office Project"],
    date: "Mar 15, 2026",
  },
  {
    id: "DOC-2026-051",
    name: "Distribution Notice",
    type: "Other",
    deals: ["Dallas Mixed-Use Development", "Miami Office Project"],
    date: "Feb 28, 2026",
  },
  {
    id: "DOC-2026-033",
    name: "Operating Agreement Acknowledgment",
    type: "Agreement",
    deals: ["Miami Office Project"],
    date: "Feb 10, 2026",
  },
];

type DealPill = "active" | "closed" | "all";

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [dealPill, setDealPill] = useState<DealPill>("active");
  const [selectedDocument, setSelectedDocument] = useState<DocumentRowData | null>(null);
  const isPreviewOpen = selectedDocument !== null;

  const closePreview = () => setSelectedDocument(null);

  return (
    <>
      <DocumentPreviewModal open={isPreviewOpen} document={selectedDocument} onClose={closePreview} />

      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-12">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Documents</h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              View and manage all documents related to your investments
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <StatCard title="My Documents" value={10} />
            <StatCard
              title="New Documents"
              value={2}
              titleAdornment={<span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />}
            />
            <StatCard title="Requires Attention" value={0} valueClassName="text-orange-500" />
            <StatCard title="Active Documents" value={8} valueClassName="text-emerald-600" />
          </section>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by document, deal, or type..."
              className="w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <SectionCard className="!p-0 overflow-hidden">
            <div className="border-b border-slate-100 px-6 pt-6 md:px-8 md:pt-8">
              <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === "all" ? (
              <div className="space-y-5 px-6 py-6 md:px-8 md:py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    <Filter className="h-4 w-4 text-slate-500" />
                    Deal Status
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "active" as const, label: "Active" },
                        { id: "closed" as const, label: "Closed" },
                        { id: "all" as const, label: "All" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDealPill(p.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          dealPill === p.id
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="whitespace-nowrap px-4 py-3">Document Name</th>
                          <th className="whitespace-nowrap px-4 py-3">Type</th>
                          <th className="whitespace-nowrap px-4 py-3">Deals</th>
                          <th className="whitespace-nowrap px-4 py-3">Date</th>
                          <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {SAMPLE_DOCUMENTS.map((doc) => (
                          <DocumentRow key={doc.id} doc={doc} onView={setSelectedDocument} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-lg font-bold text-slate-900">2026</h3>
                    <p className="text-sm font-semibold text-emerald-600">Total Income: $18,450</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Tax Summary 2026</p>
                      <p className="mt-1 text-sm text-slate-500">File size: 456 KB • PDF</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-lg font-bold text-slate-900">2025</h3>
                    <p className="text-sm font-semibold text-slate-700">Total Income: $12,200</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Tax Summary 2025</p>
                      <p className="mt-1 text-sm text-slate-500">File size: 412 KB • PDF</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
      </div>
    </>
  );
}
