import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ValidateTokenResponse {
  valid: boolean;
  companyCode?: string;
  email?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const { data: invite, error: inviteError } = await supabase
      .from('email_invites')
      .select('id, email, company_id, status, expires_at')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { valid: false, error: 'This invitation has already been used or expired' },
        { status: 400 }
      );
    }

    const expiresAt = new Date(invite.expires_at);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('company_code')
      .eq('id', invite.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { valid: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    const response: ValidateTokenResponse = {
      valid: true,
      companyCode: company.company_code,
      email: invite.email,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
