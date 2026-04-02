import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SendUpdateRequest {
  dealId: string;
  title: string;
  message: string;
  requireAcknowledgment: boolean;
}

/**
 * POST /api/broadcasts/deals/[dealId]/send-update
 * Sends an immediate update to all investors involved in a deal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;
    const contentType = request.headers.get('content-type');

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    let title = '';
    let message = '';
    let requireAcknowledgment = false;
    let file: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title') as string;
      message = formData.get('message') as string;
      requireAcknowledgment = formData.get('requireAcknowledgment') === 'true';
      file = formData.get('file') as File | null;
    } else {
      const body: SendUpdateRequest = await request.json();
      title = body.title;
      message = body.message;
      requireAcknowledgment = body.requireAcknowledgment;
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      );
    }

    // Create authenticated Supabase client with token
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Extract user ID from JWT token (decode without verification for admin_id field)
    let userId: string | null = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = decoded.sub || null;
      }
    } catch (err) {
      console.error('Error decoding token:', err);
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - unable to extract user info' },
        { status: 401 }
      );
    }

    // Verify deal exists
    const { data: deal, error: dealError } = await supabase
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

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: string | null = null;
    let fileType: string | null = null;

    // Handle file upload if present
    if (file) {
      try {
        const fileName = `${dealId}/${Date.now()}_${file.name}`;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } = await authSupabase.storage
          .from('documents')
          .upload(fileName, uint8Array, {
            contentType: file.type,
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
          );
        }

        const { data: urlData } = authSupabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
        fileSize = `${(file.size / 1024).toFixed(2)} KB`;
        fileType = file.type;
      } catch (err) {
        console.error('File processing error:', err);
        return NextResponse.json(
          { error: 'Failed to process file' },
          { status: 500 }
        );
      }
    }

    // Create broadcast update record
    const { data: broadcastUpdate, error: updateError } = await authSupabase
      .from('broadcast_updates')
      .insert({
        deal_id: dealId,
        admin_id: userId,
        title,
        message,
        update_type: 'manual',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        is_sent: true,
        sent_at: new Date().toISOString(),
        require_acknowledgment: requireAcknowledgment,
      })
      .select()
      .single();

    if (updateError || !broadcastUpdate) {
      console.error('Error creating broadcast update:', updateError);
      return NextResponse.json(
        { error: 'Failed to create update' },
        { status: 500 }
      );
    }

    // Get all investors for this deal
    const { data: dealInvestors, error: investorsError } = await supabase
      .from('deal_investors')
      .select(
        `
        investor_id,
        investor_source
      `
      )
      .eq('deal_id', dealId);

    if (investorsError) {
      console.error('Error fetching investors:', investorsError);
      return NextResponse.json(
        { error: 'Failed to fetch deal investors' },
        { status: 500 }
      );
    }

    console.log(`[Broadcast] Deal ${dealId} has ${dealInvestors?.length || 0} investors`);
    if (dealInvestors && dealInvestors.length > 0) {
      console.log('[Broadcast] Investor details:', dealInvestors);
    }

    // Fetch investor emails based on source
    let investorEmails: Array<{ id: string; email: string; source: string }> = [];

    if (dealInvestors && dealInvestors.length > 0) {
      const userProfileIds = dealInvestors
        .filter((di) => di.investor_source === 'user_profiles')
        .map((di) => di.investor_id);

      const investorIds = dealInvestors
        .filter((di) => di.investor_source === 'investors')
        .map((di) => di.investor_id);

      console.log(`[Broadcast] Found ${userProfileIds.length} user_profiles and ${investorIds.length} investors`);

      if (userProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email')
          .in('id', userProfileIds);

        console.log(`[Broadcast] Fetched ${profiles?.length || 0} user profiles`);
        if (profiles) {
          investorEmails.push(
            ...profiles.map((p) => ({ id: p.id, email: p.email, source: 'user_profiles' }))
          );
        }
      }

      if (investorIds.length > 0) {
        const { data: investors } = await supabase
          .from('investors')
          .select('id, email')
          .in('id', investorIds);

        console.log(`[Broadcast] Fetched ${investors?.length || 0} investors`);
        if (investors) {
          investorEmails.push(
            ...investors.map((i) => ({ id: i.id, email: i.email, source: 'investors' }))
          );
        }
      }
    }

    console.log(`[Broadcast] Total investor emails collected: ${investorEmails.length}`);

    // Create recipient records
    if (investorEmails.length > 0) {
      const recipientRecords = investorEmails.map((investor) => ({
        broadcast_update_id: broadcastUpdate.id,
        investor_id: investor.id,
        investor_source: investor.source,
        email: investor.email,
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
      }));

      console.log(`[Broadcast] Inserting ${recipientRecords.length} recipient records`);

      const { error: recipientError } = await authSupabase
        .from('broadcast_update_recipients')
        .insert(recipientRecords);

      if (recipientError) {
        console.error('Error creating recipient records:', recipientError);
      }
    } else {
      console.warn(`[Broadcast] No investor emails found for deal ${dealId}. Check deal_investors table.`);
    }

    // Create timeline entry
    const { error: timelineError } = await authSupabase.from('broadcast_communication_timeline').insert({
      deal_id: dealId,
      broadcast_update_id: broadcastUpdate.id,
      event_type: 'update_sent',
      title: `Official Update - ${title}`,
      description: message.substring(0, 200),
      triggered_by_user_id: userId,
    });

    if (timelineError) {
      console.error('Error creating timeline entry:', timelineError);
    }

    return NextResponse.json(
      {
        success: true,
        update: broadcastUpdate,
        recipientCount: investorEmails.length,
        message: investorEmails.length > 0 
          ? `Update sent to ${investorEmails.length} investor(s)` 
          : 'Update created but no investors found for this deal. Check if investors are linked in the deal_investors table.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
