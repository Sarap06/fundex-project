import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/broadcasts/deals/[dealId]/documents
 * Returns all documents linked to a deal
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

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Create authenticated Supabase client if token is provided
    const queryClient = token 
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          }
        )
      : supabase;

    // Verify deal exists
    const { data: deal, error: dealError } = await queryClient
      .from('deals')
      .select('id')
      .eq('id', dealId)
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
  } catch (error) {
    console.error('Error in get documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
