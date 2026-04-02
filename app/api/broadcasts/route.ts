import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const { data: broadcasts, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching broadcasts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch broadcasts' },
        { status: 500 }
      );
    }

    const adminIds = [...new Set(broadcasts?.map((b: Record<string, unknown>) => b.admin_id) || [])];

    if (adminIds.length === 0) {
      return NextResponse.json(broadcasts || [], { status: 200 });
    }

    const { data: adminProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', adminIds);

    if (profileError) {
      console.error('Error fetching admin profiles:', profileError);
      return NextResponse.json(broadcasts || [], { status: 200 });
    }

    const adminMap = new Map(
      (adminProfiles || []).map((profile: Record<string, unknown>) => [profile.user_id, profile.full_name])
    );

    const enrichedBroadcasts = (broadcasts || []).map((broadcast: Record<string, unknown>) => ({
      ...broadcast,
      admin_name: adminMap.get(broadcast.admin_id) || 'Unknown Admin'
    }));

    return NextResponse.json(enrichedBroadcasts, { status: 200 });
  } catch (error) {
    console.error('Error in get broadcasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface CreateBroadcastRequest {
  companyId: string;
  title: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let companyId: string = '';
    let title: string = '';
    let message: string = '';
    let file: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      companyId = formData.get('companyId') as string;
      title = formData.get('title') as string;
      message = formData.get('message') as string;
      file = formData.get('file') as File | null;
    } else {
      const body: CreateBroadcastRequest = await request.json();
      companyId = body.companyId;
      title = body.title;
      message = body.message;
    }

    if (!companyId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: userProfile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found:', { 
        userId: user.id, 
        email: user.email,
        error: profileError?.message
      });
      
      return NextResponse.json(
        { 
          error: 'User profile not found. Make sure you have completed signup.',
        },
        { status: 404 }
      );
    }

    const role = userProfile.role;
    const companyId_in_profile = userProfile.company_id;

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create broadcasts. Your role is: ' + role },
        { status: 403 }
      );
    }

    if (companyId_in_profile !== companyId) {
      return NextResponse.json(
        { error: `Company mismatch. Your company: ${companyId_in_profile}, Requested: ${companyId}` },
        { status: 403 }
      );
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }

      fileName = file.name;
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = `broadcasts/${companyId}/${uniqueFileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await authSupabase.storage
        .from('broadcast-docs')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = authSupabase.storage
        .from('broadcast-docs')
        .getPublicUrl(filePath);

      fileUrl = publicUrlData.publicUrl;
    }

    const { data: broadcast, error: broadcastError } = await authSupabase
      .from('broadcasts')
      .insert([
        {
          company_id: companyId,
          admin_id: user.id,
          title,
          message,
          file_url: fileUrl,
          file_name: fileName,
        },
      ])
      .select()
      .single();

    if (broadcastError) {
      console.error('Database error:', broadcastError);
      return NextResponse.json(
        { error: 'Failed to create broadcast' },
        { status: 500 }
      );
    }

    return NextResponse.json(broadcast, { status: 201 });
  } catch (error) {
    console.error('Error in create broadcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
