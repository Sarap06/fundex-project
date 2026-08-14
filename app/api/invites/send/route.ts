import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InviteRequest {
  email: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  role?: 'investor' | 'partner';
}

async function sendEmailViaBrevo(
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME;

    console.log('🔵 [BREVO] Starting email send...', {
      toEmail,
      subject,
      hasApiKey: !!apiKey,
      senderEmail,
    });

    if (!apiKey || !senderEmail || !senderName) {
      console.error('❌ [BREVO] Missing Brevo environment variables', {
        hasApiKey: !!apiKey,
        hasEmail: !!senderEmail,
        hasName: !!senderName,
      });
      throw new Error('Brevo configuration missing');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const responseData = await response.json();
    console.log('📬 [BREVO] Response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });

    if (!response.ok) {
      console.error('❌ [BREVO] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
      });
      return false;
    }

    console.log('✅ [BREVO] Email sent successfully!', {
      to: toEmail,
      messageId: responseData?.messageId,
    });
    return true;
  } catch (error) {
    console.error('❌ [BREVO] Exception:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: InviteRequest = await request.json();
    const { email, companyId, companyCode, companyName, role = 'investor' } = body;

    if (!email || !companyId || !companyCode) {
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await authSupabase
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (userProfile.role !== 'admin' || userProfile.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Only admins can send invites' },
        { status: 403 }
      );
    }

    // Check if user is already registered
    const { data: existingUser } = await authSupabase
      .from('user_profiles')
      .select('id, role, status')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: `This email is already registered as ${existingUser.role} (${existingUser.status})` },
        { status: 409 }
      );
    }

    // Store invite in DB with role (upsert — update role if invite already exists)
    const { data: existingInvite } = await authSupabase
      .from('email_invites')
      .select('id')
      .eq('email', email)
      .eq('company_id', companyId)
      .single();

    if (existingInvite) {
      await authSupabase
        .from('email_invites')
        .update({ role, status: 'pending' })
        .eq('id', existingInvite.id);
    } else {
      await authSupabase
        .from('email_invites')
        .insert({ company_id: companyId, email, role, status: 'pending' });
    }

    // Resolve the base URL for the invite link. Prefer the configured app URL,
    // but fall back to the deployment's own request host so invite emails never
    // point at localhost in production when NEXT_PUBLIC_APP_URL is unset — which
    // is exactly what made investors land on localhost and lose access.
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const requestOrigin = request.headers.get('origin')?.replace(/\/$/, '');
    const derivedUrl =
      forwardedHost && !forwardedHost.includes('localhost')
        ? `${forwardedProto}://${forwardedHost}`
        : requestOrigin;
    const appUrl = configuredUrl || derivedUrl || 'http://localhost:3000';
    const inviteLink = `${appUrl}/auth/signup?code=${companyCode}&email=${encodeURIComponent(email)}&type=company`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; background-color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 0.5px; }
            .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; }
            .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 8px 8px; }
            .content p { color: #1f2937; margin: 16px 0; line-height: 1.6; font-size: 15px; }
            .company-info { background: white; padding: 24px; margin: 24px 0; border-radius: 6px; border-left: 5px solid #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .company-info strong { color: #1f2937; display: block; margin-bottom: 12px; font-size: 16px; }
            .company-info ul { color: #1f2937; margin: 0; padding-left: 20px; }
            .company-info li { margin: 8px 0; color: #1f2937; font-size: 14px; }
            .button-container { text-align: center; margin: 28px 0; }
            .button { display: inline-block; background: white; color: #10b981; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 2px solid #10b981; }
            .button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); background: #f0fdf4; }
            .code-block { background: #f3f4f6; padding: 16px; border-radius: 6px; word-break: break-all; color: #1f2937; border: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 13px; }
            .footer { font-size: 12px; color: #6b7280; margin-top: 32px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 4px 0; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to funDEX</h1>
              <p>You're Invited to Join ${companyName}</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have been invited to join <strong>${companyName}</strong> on funDEX - our unified investment management platform.</p>
              
              <div class="company-info">
                <strong>Company Details</strong>
                <ul>
                  <li><strong>Company Name:</strong> ${companyName}</li>
                  <li><strong>Company Code:</strong> <span style="color: #10b981; font-weight: bold; font-size: 15px;">${companyCode}</span></li>
                </ul>
              </div>

              <div class="button-container">
                <a href="${inviteLink}" class="button">Complete Your Signup</a>
              </div>

              <p style="color: #1f2937; margin-top: 24px; font-weight: 500;">Or copy and paste this link in your browser:</p>
              <div class="code-block">${inviteLink}</div>
            </div>
            <div class="footer">
              <p style="color: #6b7280; margin: 8px 0;"><strong>© 2024 funDEX</strong>. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailSent = await sendEmailViaBrevo(
      email,
      `You're Invited to Join ${companyName}`,
      htmlContent
    );

    console.log('📧 [ROUTE] Email send result:', { email, emailSent });

    if (!emailSent) {
      console.error('📧 [ROUTE] Email failed to send, returning 500');
      return NextResponse.json(
        { error: 'Failed to send email. Please check your Brevo API configuration.' },
        { status: 500 }
      );
    }

    console.log('📧 [ROUTE] Success! Returning 200');
    return NextResponse.json(
      { success: true, message: 'Invitation sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in send invite:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
