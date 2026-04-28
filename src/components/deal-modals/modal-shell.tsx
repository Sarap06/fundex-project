'use client';

import { X } from 'lucide-react';
import { type ReactNode } from 'react';

/**
 * Shared modal wrapper used by all deal sub-modals.
 * Renders a centered overlay with header, scrollable body, and sticky footer.
 */
export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  zIndex = 'z-[60]',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  zIndex?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden border border-stone-100 bg-white shadow-xl`}>
        {/* Header */}
        <div className="shrink-0 border-b border-stone-100 bg-stone-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-stone-900">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-stone-100 bg-stone-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
