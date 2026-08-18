'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ExtractionResponse {
  fields: Record<string, string | number | null>;
  low_confidence: string[];
  summary: string;
}

interface DealPdfUploadModalProps {
  onClose: () => void;
  /**
   * Called once the PDF has been parsed. `initialData` is the snake_case,
   * wizard-ready field object; `file` is the original PDF so the caller can
   * attach it to the deal without a second upload; `lowConfidence` lists the
   * fields the model was unsure about so the wizard can flag them.
   */
  onExtracted: (payload: {
    initialData: Record<string, unknown>;
    file: File;
    lowConfidence: string[];
    summary: string;
  }) => void;
}

const MAX_MB = 20;

export function DealPdfUploadModal({ onClose, onExtracted }: DealPdfUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const pickFile = (f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`That PDF is too large (max ${MAX_MB}MB).`);
      return;
    }
    setFile(f);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;
      if (!token || !userId) {
        setError('Your session expired. Please refresh and sign in again.');
        setLoading(false);
        return;
      }

      // Upload the PDF straight to Supabase Storage first, then send only the
      // path to the API. Vercel functions cap the request body at 4.5MB, so a
      // multi-MB scan POSTed directly is rejected at the edge — the browser→storage
      // upload has no such limit.
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const storagePath = `deal-extractions/${userId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false, contentType: 'application/pdf' });

      if (uploadError) {
        console.error('[DealPdfUpload] storage upload failed:', uploadError);
        setError('Could not upload the PDF. Please try again.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/deals/extract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not read that PDF. Try another file or enter the deal manually.');
        setLoading(false);
        return;
      }

      const { fields, low_confidence, summary } = data as ExtractionResponse;

      // Drop null fields so the wizard's own defaults take over for anything
      // the document didn't contain.
      const initialData: Record<string, unknown> = {};
      Object.entries(fields || {}).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') initialData[k] = v;
      });

      onExtracted({ initialData, file, lowConfidence: low_confidence || [], summary: summary || '' });
    } catch (e) {
      console.error('[DealPdfUpload] extract failed:', e);
      setError('Something went wrong reading the PDF. Please try again.');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-fundex-forest" />
            <h2 className="text-lg font-semibold text-stone-900">Create Deal from PDF</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 transition-colors hover:text-stone-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="mb-4 text-sm text-stone-600">
            Upload a mortgage, promissory note, or term sheet. We&apos;ll read it and pre-fill the
            deal form — you review and edit everything before saving.
          </p>

          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                isDragActive
                  ? 'border-fundex-forest bg-fundex-cream/40'
                  : 'border-stone-300 hover:border-fundex-green hover:bg-stone-50'
              )}
            >
              <UploadCloud className="size-8 text-fundex-green" />
              <div>
                <p className="text-sm font-medium text-stone-800">Drag &amp; drop a PDF here</p>
                <p className="text-xs text-stone-500">or click to browse — max {MAX_MB}MB</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-fundex-forest" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-800">{file.name}</p>
                  <p className="text-xs text-stone-500">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
              </div>
              {!loading && (
                <button
                  onClick={() => setFile(null)}
                  className="text-stone-400 hover:text-stone-700"
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-fundex-cream/50 px-3 py-2 text-sm text-fundex-forest">
              <Loader2 className="size-4 animate-spin" />
              <span>Reading the document and extracting deal terms…</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading} className="fdx-btn-secondary">
            Cancel
          </Button>
          <Button onClick={handleExtract} disabled={!file || loading} className="fdx-btn-primary gap-2">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Extracting…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Extract &amp; Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
