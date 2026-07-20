import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmailViaBrevo } from '@/lib/brevo';

// Public lead-capture endpoint for the landing-page "Book a Demo" section.
// No auth by design — it is a marketing contact form, not tenant data.

const bookDemoSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('A valid email is required').max(200),
  date: z.string().trim().min(1, 'Date is required').max(80),
  time: z.string().trim().min(1, 'Time is required').max(40),
  company: z.string().trim().max(160).optional(),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bookDemoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { name, email, date, time, company } = parsed.data;
    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      date: escapeHtml(date),
      time: escapeHtml(time),
      company: company ? escapeHtml(company) : '',
    };

    const teamInbox = process.env.BREVO_SENDER_EMAIL;
    if (!teamInbox) {
      console.error('[BOOK_DEMO] BREVO_SENDER_EMAIL is not configured');
      return NextResponse.json(
        { success: false, message: 'Booking is temporarily unavailable. Please try again later.' },
        { status: 500 }
      );
    }

    // 1) Notify the Fundex team so someone follows up.
    const teamHtml = `
      <h2 style="font-family:sans-serif;color:#005F02;">New demo request</h2>
      <p style="font-family:sans-serif;font-size:15px;color:#111;">
        <strong>${safe.name}</strong> requested a demo.
      </p>
      <table style="font-family:sans-serif;font-size:14px;color:#111;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Name</td><td>${safe.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Email</td><td>${safe.email}</td></tr>
        ${safe.company ? `<tr><td style="padding:4px 12px 4px 0;color:#555;">Company</td><td>${safe.company}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Preferred date</td><td>${safe.date}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Preferred time</td><td>${safe.time}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#777;">Reply directly to ${safe.email} to confirm.</p>
    `;

    // 2) Confirm to the visitor.
    const visitorHtml = `
      <h2 style="font-family:sans-serif;color:#005F02;">Your Fundex demo is booked</h2>
      <p style="font-family:sans-serif;font-size:15px;color:#111;">Hi ${safe.name},</p>
      <p style="font-family:sans-serif;font-size:15px;color:#111;">
        Thanks for booking a demo. We've noted your preferred slot:
      </p>
      <p style="font-family:sans-serif;font-size:16px;color:#005F02;font-weight:600;">
        ${safe.date} at ${safe.time}
      </p>
      <p style="font-family:sans-serif;font-size:15px;color:#111;">
        Our team will reach out shortly to confirm the details. If you need to change anything, just reply to this email.
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:#555;">— The Fundex Team</p>
    `;

    const [teamSent, visitorSent] = await Promise.all([
      sendEmailViaBrevo(teamInbox, `New demo request from ${safe.name}`, teamHtml),
      sendEmailViaBrevo(email, 'Your Fundex demo is booked', visitorHtml),
    ]);

    // The team notification is the one that must land for the request to matter.
    if (!teamSent) {
      return NextResponse.json(
        { success: false, message: 'We could not submit your request. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Demo booked — check your inbox for confirmation.",
      visitorEmailSent: visitorSent,
    });
  } catch (error) {
    console.error('[BOOK_DEMO] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
