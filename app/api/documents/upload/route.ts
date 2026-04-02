import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Auto-generate document ID
async function generateDocumentId(): Promise<string> {
  const count = await supabaseServiceRole
    .from('documents')
    .select('id', { count: 'exact' });
  
  const docCount = (count.count || 0) + 1;
  return `DOC-${String(docCount).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const allocationId = formData.get('allocationId') as string;
    const userId = formData.get('userId') as string;
    const dealId = formData.get('dealId') as string | null;
    const investorId = formData.get('investorId') as string | null;

    if (!file || !companyId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    
    // Store in consistent location: documents/${companyId}/allocations/${fileName}
    const filePath = `documents/${companyId}/allocations/${fileName}`;

    // Upload to documents bucket
    const { error: uploadError } = await supabaseServiceRole.storage
      .from('documents')
      .upload(filePath, Buffer.from(buffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, message: 'Failed to upload file', error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseServiceRole.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Generate document ID
    const documentId = await generateDocumentId();

    // Extract file extension for type
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

    // Create document entry in database with correct schema
    const { data: docData, error: dbError } = await supabaseServiceRole
      .from('documents')
      .insert([
        {
          document_id: documentId,
          name: file.name,
          type: 'Allocation Document',
          category: 'allocations',
          deal_id: dealId || null,
          investor_id: investorId || null,
          file_url: urlData.publicUrl,
          file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          file_type: fileExtension,
          uploaded_by: userId,
          upload_date: new Date().toISOString(),
          status: 'active',
          notify_investor: false,
          notes: `Uploaded from allocation ${allocationId}`,
          tags: ['allocation', 'auto-upload'],
          created_by: userId,
          company_id: companyId,
        },
      ])
      .select();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to create document entry', error: dbError.message },
        { status: 500 }
      );
    }

    if (!docData || docData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No document returned' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded successfully',
        document: docData[0],
        file: {
          name: file.name,
          size: file.size,
          url: urlData.publicUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/documents/upload:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
