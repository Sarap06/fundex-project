import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/broadcasts/deals/[dealId]/documents
 * Returns all documents linked to a deal (tenant-scoped, service-role reads to
 * avoid the anon/token-race 404 that made deals fail to load on first click).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    const ctx = await requireAuth(request);
    const queryClient = getSupabaseAdmin();

    // Verify deal exists and belongs to the caller's company
    const { data: deal, error: dealError } = await queryClient
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('company_id', ctx.companyId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get all documents for this deal
    const { data: documents, error: documentsError } = await queryClient
      .from('documents')
      .select(
        `
        id,
        document_id,
        name,
        type,
        category,
        file_url,
        file_size,
        file_type,
        uploaded_by,
        upload_date
      `
      )
      .eq('deal_id', dealId)
      .order('upload_date', { ascending: false });

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        documents: documents || [],
        count: documents?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error in get documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
