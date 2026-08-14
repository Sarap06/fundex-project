import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { extractDealFromPdf } from '@/services/deal-extraction-service';

// PDF vision extraction can take a while on multi-page scans.
export const maxDuration = 120;

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/deals/extract
 * Body: multipart/form-data with a single `file` (PDF).
 * Auth: admin/partner only (deal creators).
 * Returns extracted deal fields (snake_case, wizard-ready) — does NOT create a deal.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);

    if (ctx.role !== 'admin' && ctx.role !== 'partner') {
      return NextResponse.json({ error: 'Only admins can create deals.' }, { status: 403 });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: 'A PDF file is required.' }, { status: 400 });
    }
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'A PDF file is required.' }, { status: 400 });
    }

    const blob = file as File;
    if (blob.type && blob.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'PDF is too large (max 20MB).' }, { status: 413 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const result = await extractDealFromPdf(buffer, { filename: blob.name });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[DEAL_EXTRACT] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to extract deal from PDF.' }, { status: 500 });
  }
}
