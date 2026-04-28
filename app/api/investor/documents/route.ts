import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/investor/documents
 * Returns all documents linked to the authenticated investor.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, company_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id || profile.role !== 'investor') {
      return NextResponse.json({ error: 'Not an investor' }, { status: 403 });
    }

    const companyId = profile.company_id;

    // Find investor record
    const { data: investorRecord } = await supabase
      .from('investors')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', profile.email)
      .single();

    if (!investorRecord) {
      return NextResponse.json({ documents: [], stats: { total: 0, newCount: 0, requiresAttention: 0, active: 0 } });
    }

    // Get documents linked to this investor
    const { data: investorDocs } = await supabase
      .from('documents')
      .select(`
        id, document_id, name, type, category, status,
        file_url, file_size, file_type,
        uploaded_by, upload_date, notes,
        deals (id, deal_id, name, status)
      `)
      .eq('company_id', companyId)
      .eq('investor_id', investorRecord.id)
      .order('upload_date', { ascending: false });

    // Also get documents linked to deals the investor is allocated to
    const { data: investorAllocations } = await supabase
      .from('allocations')
      .select('deal_id')
      .eq('company_id', companyId)
      .eq('investor_id', investorRecord.id);

    const dealIds = (investorAllocations || []).map((a: any) => a.deal_id);
    let dealDocs: any[] = [];
    if (dealIds.length > 0) {
      const { data: dd } = await supabase
        .from('documents')
        .select(`
          id, document_id, name, type, category, status,
          file_url, file_size, file_type,
          uploaded_by, upload_date, notes,
          deals (id, deal_id, name, status)
        `)
        .eq('company_id', companyId)
        .in('deal_id', dealIds)
        .is('investor_id', null) // deal-level docs (not investor-specific)
        .order('upload_date', { ascending: false });
      dealDocs = dd || [];
    }

    // Combine and deduplicate
    const allDocs = [...(investorDocs || []), ...dealDocs];
    const seen = new Set<string>();
    const documents = allDocs.filter((d: any) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    // Calculate stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newCount = documents.filter((d: any) => new Date(d.upload_date) >= sevenDaysAgo).length;
    const requiresAttention = documents.filter((d: any) => d.status === 'Draft' || d.status === 'Pending').length;
    const activeDealDocs = documents.filter((d: any) => d.deals?.status === 'Active').length;

    return NextResponse.json({
      documents: documents.map((d: any) => ({
        id: d.id,
        documentId: d.document_id,
        name: d.name,
        type: d.type,
        category: d.category,
        status: d.status,
        fileUrl: d.file_url,
        fileSize: d.file_size,
        fileType: d.file_type,
        uploadedBy: d.uploaded_by,
        uploadDate: d.upload_date,
        notes: d.notes,
        linkedDeal: d.deals?.name || null,
        dealId: d.deals?.deal_id || null,
        dealStatus: d.deals?.status || null,
      })),
      stats: {
        total: documents.length,
        newCount,
        requiresAttention,
        active: activeDealDocs,
      },
    });
  } catch (error) {
    console.error('[INVESTOR_DOCUMENTS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
