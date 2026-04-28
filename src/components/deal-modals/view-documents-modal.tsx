'use client';

import { CheckCircle, Clock, AlertCircle, Download, FileText, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModalShell } from './modal-shell';

interface ViewDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  documents?: { name: string; category: string; uploadDate: string; status: 'uploaded' | 'pending' | 'missing'; size: string }[];
}

const DEFAULT_DOCS = [
  { name: 'Subscription Agreement', category: 'Legal', uploadDate: 'Jun 15, 2026', status: 'uploaded' as const, size: '2.4 MB' },
  { name: 'Loan Agreement & Terms', category: 'Legal', uploadDate: 'Jun 12, 2026', status: 'uploaded' as const, size: '3.1 MB' },
  { name: 'Property Appraisal', category: 'Appraisal', uploadDate: '', status: 'pending' as const, size: '—' },
  { name: 'Distribution Schedule', category: 'Financial', uploadDate: '', status: 'missing' as const, size: '—' },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'uploaded': return <CheckCircle className="h-4 w-4 text-fundex-forest" />;
    case 'pending': return <Clock className="h-4 w-4 text-amber-600" />;
    case 'missing': return <AlertCircle className="h-4 w-4 text-red-600" />;
    default: return <FileText className="h-4 w-4 text-stone-400" />;
  }
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    uploaded: 'bg-fundex-gold/10 text-fundex-forest',
    pending: 'bg-amber-50 text-amber-700',
    missing: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function ViewDocumentsModal({ isOpen, onClose, dealName, documents }: ViewDocumentsModalProps) {
  const docs = documents || DEFAULT_DOCS;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Deal Documents"
      subtitle={dealName}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" className="gap-2 text-sm">
            <Upload className="h-4 w-4" /> Upload Document
          </Button>
        </div>

        <div className="overflow-hidden border border-stone-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {docs.map((doc) => (
                <tr key={doc.name} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-stone-400" />
                      <span className="font-medium text-stone-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{doc.category}</td>
                  <td className="px-4 py-3 text-stone-600">{doc.uploadDate || '—'}</td>
                  <td className="px-4 py-3 text-stone-600">{doc.size}</td>
                  <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {doc.status === 'uploaded' ? (
                      <div className="flex justify-end gap-2">
                        <button type="button" className="p-1.5 text-stone-500 hover:text-fundex-forest"><Download className="h-4 w-4" /></button>
                        <button type="button" className="p-1.5 text-stone-500 hover:text-stone-700"><RefreshCw className="h-4 w-4" /></button>
                      </div>
                    ) : doc.status === 'missing' ? (
                      <button type="button" className="p-1.5 text-fundex-forest hover:text-fundex-green"><Upload className="h-4 w-4" /></button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}
