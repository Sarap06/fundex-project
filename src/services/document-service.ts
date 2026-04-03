import { getServiceClient } from './access';

// ─── FILE UTILITIES (single source of truth) ──────────────────────────

/**
 * Format file size for display. Consistent everywhere.
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`;
  return `${bytes} B`;
}

/**
 * Generate a unique storage path for a file upload.
 */
export function generateStoragePath(
  context: { companyId: string; dealId?: string },
  fileName: string
): string {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (context.dealId) {
    return `${context.companyId}/${context.dealId}/${timestamp}_${safeName}`;
  }
  return `${context.companyId}/${timestamp}_${safeName}`;
}

// ─── QUERIES (company-scoped) ─────────────────────────────────────────

/**
 * Get all documents for a company.
 */
export async function getDocumentsByCompany(companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get documents for a specific deal, scoped by company.
 */
export async function getDocumentsByDeal(dealId: string, companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('deal_id', dealId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get document summary stats for a company.
 */
export async function getDocumentSummary(companyId: string) {
  const docs = await getDocumentsByCompany(companyId);

  const dealDocs = docs.filter(d => d.deal_id).length;
  const investorDocs = docs.filter(d => d.investor_id).length;
  const reports = docs.filter(d => d.category === 'Reports').length;

  return {
    total: docs.length,
    dealDocuments: dealDocs,
    investorDocuments: investorDocs,
    reports,
  };
}

/**
 * Upload a file to Supabase storage and create a document record.
 */
export async function uploadDocument(
  companyId: string,
  file: File,
  metadata: {
    name: string;
    type: string;
    category: string;
    deal_id?: string;
    investor_id?: string;
    uploaded_by: string;
    status?: string;
    notify_investor?: boolean;
    notes?: string;
  }
) {
  const supabase = getServiceClient();

  // Upload to storage
  const storagePath = generateStoragePath(
    { companyId, dealId: metadata.deal_id },
    file.name
  );

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, uint8Array, { contentType: file.type });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  // Create document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      company_id: companyId,
      document_id: '', // auto-generated if trigger exists
      file_url: urlData.publicUrl,
      file_size: formatFileSize(file.size),
      file_type: file.type,
      status: metadata.status || 'Draft',
      ...metadata,
    })
    .select()
    .single();

  if (docError) throw docError;
  return doc;
}
