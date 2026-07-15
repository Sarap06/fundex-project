// Single source of truth for document taxonomy.
// Both upload surfaces (admin documents page and the deal upload modal)
// must render their selects from these lists — never inline literals.

export const DOCUMENT_TYPES = [
  'Offering',
  'Offering Memorandum',
  'Agreement',
  'Loan Agreement',
  'Subscription Docs',
  'Term Sheet',
  'Appraisal',
  'Borrower Docs',
  'Report',
  'Other',
] as const;

export const DOCUMENT_CATEGORIES = [
  'Deal Documents',
  'Investor Documents',
  'Reports',
  'Legal Documents',
  'Other',
] as const;

export const DOCUMENT_STATUSES = [
  'Draft',
  'Published',
  'Signed',
  'Archived',
] as const;

export const DOCUMENT_ACCEPT_EXTENSIONS =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.png,.jpg,.jpeg';

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
