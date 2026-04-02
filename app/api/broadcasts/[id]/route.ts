import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    const { id: broadcastId } = await params;

    if (!broadcastId) {
      return NextResponse.json(
        { error: 'Broadcast ID is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: broadcast, error: fetchError } = await supabase
      .from('broadcasts')
      .select('admin_id, file_url, company_id')
      .eq('id', broadcastId)
      .single();

    if (fetchError || !broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    if (broadcast.admin_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own broadcasts' },
        { status: 403 }
      );
    }

    if (broadcast.file_url) {
      try {
        const filePathMatch = broadcast.file_url.match(/broadcasts\/[^/]+\/[^/]+$/);
        if (filePathMatch) {
          const filePath = filePathMatch[0];
          await authSupabase.storage
            .from('broadcast-docs')
            .remove([filePath]);
        }
      } catch (err) {
        console.error('Error deleting file from storage:', err);
      }
    }

    const { error: deleteError } = await authSupabase
      .from('broadcasts')
      .delete()
      .eq('id', broadcastId);

    if (deleteError) {
      console.error('Error deleting broadcast:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete broadcast' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in delete broadcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
