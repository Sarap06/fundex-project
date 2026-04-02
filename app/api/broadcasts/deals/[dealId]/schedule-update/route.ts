import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ScheduleUpdateRequest {
  dealId: string;
  title: string;
  message: string;
  scheduledDate: string; // ISO date string
  scheduledEstTime: string; // HH:mm format in EST
  requireAcknowledgment: boolean;
}

/**
 * POST /api/broadcasts/deals/[dealId]/schedule-update
 * Schedules an update to be sent to all investors in a deal at a specific date/time (EST)
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
    let scheduledDate = '';
    let scheduledEstTime = '';
    let requireAcknowledgment = false;
    let file: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title') as string;
      message = formData.get('message') as string;
      scheduledDate = formData.get('scheduledDate') as string;
      scheduledEstTime = formData.get('scheduledEstTime') as string;
      requireAcknowledgment = formData.get('requireAcknowledgment') === 'true';
      file = formData.get('file') as File | null;
    } else {
      const body: ScheduleUpdateRequest = await request.json();
      title = body.title;
      message = body.message;
      scheduledDate = body.scheduledDate;
      scheduledEstTime = body.scheduledEstTime;
      requireAcknowledgment = body.requireAcknowledgment;
    }

    if (!title || !message || !scheduledDate || !scheduledEstTime) {
      return NextResponse.json(
        { error: 'Title, message, scheduled date, and time are required' },
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
        const uploadFileName = `${dealId}/${Date.now()}_${file.name}`;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } = await authSupabase.storage
          .from('documents')
          .upload(uploadFileName, uint8Array, {
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
          .getPublicUrl(uploadFileName);

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

    // Create scheduled broadcast update record
    const { data: broadcastUpdate, error: updateError } = await authSupabase
      .from('broadcast_updates')
      .insert({
        deal_id: dealId,
        admin_id: userId,
        title,
        message,
        update_type: 'scheduled',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        scheduled_date: scheduledDate,
        scheduled_est_time: scheduledEstTime,
        is_sent: false,
        require_acknowledgment: requireAcknowledgment,
      })
      .select()
      .single();

    if (updateError || !broadcastUpdate) {
      console.error('Error creating scheduled update:', updateError);
      return NextResponse.json(
        { error: 'Failed to schedule update' },
        { status: 500 }
      );
    }

    // NOTE: Timeline entry will be created when the scheduled update is actually sent
    // by a background job at the scheduled time. This ensures the timeline only shows
    // events that have already occurred, not future scheduled events.

    return NextResponse.json(
      {
        success: true,
        update: broadcastUpdate,
        message: 'Update scheduled successfully. Will be sent on the scheduled date and time.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error scheduling update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
