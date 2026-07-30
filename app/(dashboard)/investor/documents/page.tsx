'use client';

import { Download, Eye, FileText, Loader2, Search, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';


type StatCardProps = {
  title: string;
  value: string | number;
  valueClassName?: string;
  titleAdornment?: ReactNode;
};

function StatCard({ title, value, valueClassName, titleAdornment }: StatCardProps) {
  return (
    <div className=" border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        {titleAdornment}
      </div>
      <p className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${valueClassName ?? "text-stone-900"}`}>
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
    <div className={` border border-stone-100 bg-white p-6 shadow-sm md:p-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}

type TabId = "all" | "tax";

function TabSwitcher({ activeTab, onChange }: { activeTab: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="border-b border-stone-200">
      <div className="flex gap-8">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`relative pb-3 text-sm font-medium transition ${
            activeTab === "all" ? "text-fundex-forest" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          All Documents
          {activeTab === "all" ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5  bg-fundex-gold" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onChange("tax")}
          className={`relative pb-3 text-sm font-medium transition ${
            activeTab === "tax" ? "text-fundex-forest" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Tax Documents
          {activeTab === "tax" ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5  bg-fundex-gold" />
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
  fileUrl?: string;
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
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" aria-hidden />
      <div className="relative flex max-h-[min(90vh,880px)] w-full max-w-2xl min-w-0 flex-col overflow-hidden  border border-stone-100 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)] md:w-[54%] md:max-w-[720px] md:min-w-[min(100%,520px)]">
        <div className="shrink-0 border-b border-stone-100 bg-white px-6 pb-5 pt-6 md:px-8 md:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="document-preview-title" className="text-xl font-medium tracking-tight text-stone-900 md:text-2xl">
                Document Preview
              </h2>
              <p className="mt-1.5 text-sm text-stone-500">View the document details</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0  border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-7">
          <div className=" border border-stone-100 bg-stone-50/80 p-5 md:p-6">
            <p className="text-lg font-semibold text-stone-900">{doc.name}</p>
            <p className="mt-1 font-mono text-sm text-stone-600">{doc.id}</p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Type</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-stone-900">{doc.type}</p>
                </div>
                <div>
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Upload date</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-stone-900">{doc.date}</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">Deal</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold leading-snug text-stone-900">{dealLabel}</p>
                </div>
                <div>
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">File size</p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-stone-900">{fileSize}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-medium text-stone-900">Document Preview</h3>
            <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center  border border-stone-200 bg-stone-100/90 px-6 py-16 md:min-h-[280px]">
              <div className="flex h-14 w-14 items-center justify-center  border border-stone-200/80 bg-white text-stone-400 shadow-sm">
                <FileText className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="mt-5 text-base font-semibold text-stone-800">Preview Unavailable</p>
              <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-stone-500">
                Click &quot;Open Full Document&quot; to view the complete file
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-stone-100 bg-white px-6 py-4 md:px-8 md:py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <button
              type="button"
              onClick={onClose}
              className=" border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 sm:justify-self-start"
            >
              Close
            </button>
            {doc.fileUrl ? (
              <button
                type="button"
                onClick={() => window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center justify-center gap-2  border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 sm:justify-self-center"
              >
                <Eye className="h-4 w-4" />
                Open Full Document
              </button>
            ) : null}
            {doc.fileUrl ? (
              <a
                href={doc.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2  bg-fundex-gold px-5 py-2.5 text-sm font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90 sm:justify-self-end"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ doc, onView }: { doc: DocumentRowData; onView: (doc: DocumentRowData) => void }) {
  return (
    <tr className="border-b border-stone-50 transition-colors last:border-0 hover:bg-stone-50/50">
      <td className="px-4 py-4 align-top">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center  bg-fundex-gold/10 text-fundex-forest">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900">{doc.name}</p>
            <p className="mt-0.5 font-mono text-xs text-stone-500">{doc.id}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-sm font-medium text-stone-700">{doc.type}</td>
      <td className="px-4 py-4 align-middle text-sm text-stone-600">
        <div className="flex flex-col gap-0.5">
          {doc.deals.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-sm tabular-nums text-stone-700">{doc.date}</td>
      <td className="whitespace-nowrap px-4 py-4 align-middle text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label="View document"
            onClick={() => onView(doc)}
            className=" border border-stone-200 bg-white p-2 text-fundex-forest shadow-sm transition hover:bg-fundex-gold/10"
          >
            <Eye className="h-4 w-4" />
          </button>
          {doc.fileUrl ? (
            <a
              href={doc.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download document"
              className=" border border-stone-200 bg-white p-2 text-stone-500 shadow-sm transition hover:bg-stone-50"
            >
              <Download className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

type DealPill = 'active' | 'closed' | 'all';

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ApiDocument {
  id: string;
  documentId: string;
  name: string;
  type: string;
  category: string;
  status: string;
  fileUrl: string | null;
  fileSize: string | null;
  fileType: string | null;
  uploadedBy: string | null;
  uploadDate: string;
  notes: string | null;
  linkedDeal: string | null;
  dealId: string | null;
  dealStatus: string | null;
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [dealPill, setDealPill] = useState<DealPill>('active');
  const [selectedDocument, setSelectedDocument] = useState<DocumentRowData | null>(null);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [stats, setStats] = useState({ total: 0, newCount: 0, requiresAttention: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        const res = await fetch('/api/investor/documents', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
          setStats(data.stats || { total: 0, newCount: 0, requiresAttention: 0, active: 0 });
        }
      } catch (err) {
        console.error('[DOCUMENTS] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents
      .filter((d) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!d.name.toLowerCase().includes(q) && !d.type.toLowerCase().includes(q) && !(d.linkedDeal || '').toLowerCase().includes(q)) return false;
        }
        if (dealPill === 'active' && d.dealStatus && d.dealStatus !== 'Active') return false;
        if (dealPill === 'closed' && d.dealStatus !== 'Closed') return false;
        return true;
      })
      .map((d): DocumentRowData => ({
        id: d.documentId || d.id,
        name: d.name,
        type: d.type || d.category,
        deals: d.linkedDeal ? [d.linkedDeal] : [],
        date: formatDateShort(d.uploadDate),
        fileSize: d.fileSize || undefined,
        fileUrl: d.fileUrl || undefined,
      }));
  }, [documents, searchQuery, dealPill]);

  const isPreviewOpen = selectedDocument !== null;
  const closePreview = () => setSelectedDocument(null);

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-fundex-forest" /></div>;
  }

  return (
    <>
      <DocumentPreviewModal open={isPreviewOpen} document={selectedDocument} onClose={closePreview} />

      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-12">
          <header>
            <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">Documents</h1>
            <p className="mt-2 text-sm font-normal text-stone-400">View and manage all documents related to your investments</p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <StatCard title="My Documents" value={stats.total} />
            <StatCard
              title="New Documents"
              value={stats.newCount}
              titleAdornment={stats.newCount > 0 ? <span className="h-2 w-2 bg-fundex-gold" aria-hidden /> : undefined}
            />
            <StatCard title="Requires Attention" value={stats.requiresAttention} />
            <StatCard title="Active Documents" value={stats.active} valueClassName="text-fundex-forest" />
          </section>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Search by document, deal, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-stone-200 bg-white py-3.5 pl-12 pr-4 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            />
          </div>

          <SectionCard className="!p-0 overflow-hidden">
            <div className="border-b border-stone-100 px-6 pt-6 md:px-8 md:pt-8">
              <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === 'all' ? (
              <div className="space-y-5 px-6 py-6 md:px-8 md:py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: 'active' as const, label: 'Active' },
                      { id: 'closed' as const, label: 'Closed' },
                      { id: 'all' as const, label: 'All' },
                    ]).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDealPill(p.id)}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          dealPill === p.id
                            ? 'bg-fundex-gold text-fundex-forest shadow-sm'
                            : 'border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden border border-stone-100">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/90 text-xs font-semibold uppercase tracking-wide text-stone-500">
                          <th className="whitespace-nowrap px-4 py-3">Document Name</th>
                          <th className="whitespace-nowrap px-4 py-3">Type</th>
                          <th className="whitespace-nowrap px-4 py-3">Deals</th>
                          <th className="whitespace-nowrap px-4 py-3">Date</th>
                          <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredDocs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">No documents found</td>
                          </tr>
                        ) : (
                          filteredDocs.map((doc) => (
                            <DocumentRow key={doc.id} doc={doc} onView={setSelectedDocument} />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <div className="py-8 text-center text-sm text-stone-400">
                  Tax documents will appear here when available
                </div>
              </div>
            )}
          </SectionCard>
      </div>
    </>
  );
}
