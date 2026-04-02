import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  getDocumentsByCompany, 
  getDocumentByIdAndCompany, 
  createDocumentForCompany,
  getDocumentsByDealAndCompany,
  getDocumentsByInvestorAndCompany
} from '@/lib/company-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const documentId = searchParams.get('id');
    const dealId = searchParams.get('deal_id');
    const investorId = searchParams.get('investor_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Fetch specific document
    if (documentId) {
      const document = await getDocumentByIdAndCompany(documentId, companyId);
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(document);
    }

    // Fetch documents for a specific deal
    if (dealId) {
      const documents = await getDocumentsByDealAndCompany(dealId, companyId);
      return NextResponse.json(documents);
    }

    // Fetch documents for a specific investor
    if (investorId) {
      const documents = await getDocumentsByInvestorAndCompany(investorId, companyId);
      return NextResponse.json(documents);
    }

    // Fetch all documents for company
    const documents = await getDocumentsByCompany(companyId);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error in documents API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const document = await createDocumentForCompany(companyId, data);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const documentId = searchParams.get('id');

    if (!companyId || !documentId) {
      return NextResponse.json(
        { error: 'company_id and id are required' },
        { status: 400 }
      );
    }

    // Verify document belongs to company
    const existingDocument = await getDocumentByIdAndCompany(documentId, companyId);
    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseClient();
    const updateData = await request.json();

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const documentId = searchParams.get('id');

    if (!companyId || !documentId) {
      return NextResponse.json(
        { error: 'company_id and id are required' },
        { status: 400 }
      );
    }

    // Verify document belongs to company
    const existingDocument = await getDocumentByIdAndCompany(documentId, companyId);
    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
