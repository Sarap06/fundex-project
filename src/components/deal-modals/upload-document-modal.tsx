'use client';

import { File, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalShell } from './modal-shell';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  onUpload?: (data: { name: string; category: string; file: globalThis.File }) => void;
}

export function UploadDocumentModal({ isOpen, onClose, dealName, onUpload }: UploadDocumentModalProps) {
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    if (!docName) setDocName(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = () => {
    if (!selectedFile || !category) return;
    onUpload?.({ name: docName || selectedFile.name, category, file: selectedFile });
    resetAndClose();
  };

  const resetAndClose = () => {
    setDocName('');
    setCategory('');
    setSelectedFile(null);
    onClose();
  };

  const canUpload = !!selectedFile && !!category;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Upload Document"
      subtitle={dealName}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!canUpload} className="gap-2 bg-fundex-forest hover:bg-fundex-green disabled:opacity-50">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700">Document Name</label>
          <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g., Loan_Agreement_Final.pdf" className="mt-1.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
          >
            <option value="">Select category...</option>
            <option value="Loan Agreement">Loan Agreement</option>
            <option value="Appraisal">Appraisal</option>
            <option value="Borrower Docs">Borrower Docs</option>
            <option value="Subscription Docs">Subscription Docs</option>
            <option value="Term Sheet">Term Sheet</option>
            <option value="Offering Memorandum">Offering Memorandum</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Upload File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="sr-only"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {selectedFile ? (
            <div className="mt-1.5 flex items-center justify-between border border-stone-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <File className="h-5 w-5 shrink-0 text-fundex-forest" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{selectedFile.name}</p>
                  <p className="text-xs text-stone-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedFile(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-12 text-center transition ${
                dragActive
                  ? 'border-fundex-forest bg-fundex-cream/20'
                  : 'border-stone-200 bg-stone-50/50 hover:border-fundex-forest/30 hover:bg-fundex-cream/10'
              }`}
            >
              <File className="h-10 w-10 text-stone-300" />
              <p className="mt-3 text-sm font-medium text-stone-600">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-stone-400">PDF, DOC, DOCX up to 10MB</p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
