import { getSupabaseClient } from './supabase';

/**
 * Fetch all investors for a specific company
 * @param companyId - The company UUID
 * @returns Array of investors for the company
 */
export async function getInvestorsByCompany(companyId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching investors:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch investor by ID and verify it belongs to the company
 * @param investorId - The investor UUID
 * @param companyId - The company UUID
 * @returns Investor data or null
 */
export async function getInvestorByIdAndCompany(investorId: string, companyId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .eq('id', investorId)
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching investor:', error);
    throw error;
  }

  return data || null;
}

/**
 * Create a new investor for a company
 * @param companyId - The company UUID
 * @param investorData - The investor data
 * @returns Created investor data
 */
export async function createInvestorForCompany(
  companyId: string,
  investorData: {
    investor_id: string;
    full_name: string;
    email: string;
    phone?: string;
    status: string;
    sponsor_id?: string;
    initial_investment?: number;
    total_invested?: number;
    number_of_investments?: number;
    average_return?: number;
    notes?: string;
    tags?: string[];
  }
) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('investors')
    .insert({
      ...investorData,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating investor:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch all deals for a specific company
 * @param companyId - The company UUID
 * @returns Array of deals for the company
 */
export async function getDealsByCompany(companyId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch deal by ID and verify it belongs to the company
 * @param dealId - The deal UUID
 * @param companyId - The company UUID
 * @returns Deal data or null
 */
export async function getDealByIdAndCompany(dealId: string, companyId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching deal:', error);
    throw error;
  }

  return data || null;
}

/**
 * Create a new deal for a company
 * @param companyId - The company UUID
 * @param dealData - The deal data
 * @returns Created deal data
 */
export async function createDealForCompany(
  companyId: string,
  dealData: {
    deal_id: string;
    name: string;
    type: string;
    status: string;
    location?: string;
    location_state?: string;
    location_city?: string;
    target_amount?: number;
    raised_amount?: number;
    progress?: number;
    investor_count?: number;
    term?: string;
    interest_rate?: number;
    close_date?: string;
    next_milestone?: string;
    milestone_type?: string;
    borrower_name?: string;
    borrower_contact?: string;
    property_address?: string;
    property_type?: string;
    loan_purpose?: string;
    documents_status?: string;
    notes?: string;
    tags?: string[];
    created_by?: string;
  }
) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('deals')
    .insert({
      ...dealData,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deal:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch all documents for a specific company
 * @param companyId - The company UUID
 * @returns Array of documents for the company
 */
export async function getDocumentsByCompany(companyId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch documents for a specific deal within a company
 * @param dealId - The deal UUID
 * @param companyId - The company UUID
 * @returns Array of documents for the deal
 */
export async function getDocumentsByDealAndCompany(dealId: string, companyId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('deal_id', dealId)
    .eq('company_id', companyId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch documents for a specific investor within a company
 * @param investorId - The investor UUID
 * @param companyId - The company UUID
 * @returns Array of documents for the investor
 */
export async function getDocumentsByInvestorAndCompany(investorId: string, companyId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('investor_id', investorId)
    .eq('company_id', companyId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch document by ID and verify it belongs to the company
 * @param documentId - The document UUID
 * @param companyId - The company UUID
 * @returns Document data or null
 */
export async function getDocumentByIdAndCompany(documentId: string, companyId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching document:', error);
    throw error;
  }

  return data || null;
}

/**
 * Create a new document for a company
 * @param companyId - The company UUID
 * @param documentData - The document data
 * @returns Created document data
 */
export async function createDocumentForCompany(
  companyId: string,
  documentData: {
    document_id: string;
    name: string;
    type: string;
    category: string;
    deal_id?: string;
    investor_id?: string;
    file_url?: string;
    file_size?: string;
    file_type?: string;
    uploaded_by?: string;
    status: string;
    notify_investor?: boolean;
    notes?: string;
    tags?: string[];
    created_by?: string;
  }
) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...documentData,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }

  return data;
}

/**
 * Get company statistics (investors, deals, documents count)
 * @param companyId - The company UUID
 * @returns Statistics object with counts
 */
export async function getCompanyStatistics(companyId: string) {
  const supabase = getSupabaseClient();

  const [investorsRes, dealsRes, documentsRes] = await Promise.all([
    supabase.from('investors').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
  ]);

  return {
    investorsCount: investorsRes.count || 0,
    dealsCount: dealsRes.count || 0,
    documentsCount: documentsRes.count || 0,
  };
}
