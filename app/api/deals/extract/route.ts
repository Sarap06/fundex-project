import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { extractDealFromPdf } from '@/services/deal-extraction-service';

// PDF vision extraction can take a while on multi-page scans.
export const maxDuration = 120;

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const BUCKET = 'documents';

/**
 * POST /api/deals/extract
 * Auth: admin/partner only (deal creators). Does NOT create a deal.
 *
 * Two ways to send the PDF:
 *  - JSON `{ storagePath }` — the browser uploads the PDF straight to Supabase
 *    Storage first, then sends only the path here. This is REQUIRED in production:
 *    Vercel functions cap the request body at 4.5MB, so a 7MB scan POSTed directly
 *    is rejected at the edge with FUNCTION_PAYLOAD_TOO_LARGE before this code runs.
 *  - multipart/form-data `file` — direct upload, used as a small-file / local-dev
 *    fallback where the 4.5MB limit doesn't apply.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);

    if (ctx.role !== 'admin' && ctx.role !== 'partner') {
      return NextResponse.json({ error: 'Only admins can create deals.' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    let buffer: Buffer;
    let filename = 'contract.pdf';
    let cleanupPath: string | null = null;

    if (contentType.includes('application/json')) {
      // Storage-path flow — download the PDF server-side (no request-body limit).
      const body = await request.json().catch(() => null);
      const storagePath: unknown = body?.storagePath;

      if (!storagePath || typeof storagePath !== 'string') {
        return NextResponse.json({ error: 'A PDF file is required.' }, { status: 400 });
      }

      // Tenant/uploader scoping: a caller may only reference a temp file they
      // uploaded under their own prefix — never an arbitrary object in the bucket.
      const expectedPrefix = `deal-extractions/${ctx.userId}/`;
      if (!storagePath.startsWith(expectedPrefix) || storagePath.includes('..')) {
        return NextResponse.json({ error: 'Invalid file reference.' }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
      if (error || !data) {
        return NextResponse.json({ error: 'Uploaded file could not be found.' }, { status: 404 });
      }

      buffer = Buffer.from(await data.arrayBuffer());
      filename = storagePath.split('/').pop() || filename;
      cleanupPath = storagePath;
    } else {
      // Multipart fallback (small files / local dev).
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
      buffer = Buffer.from(await blob.arrayBuffer());
      filename = blob.name || filename;
    }

    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'PDF is too large (max 20MB).' }, { status: 413 });
    }

    const result = await extractDealFromPdf(buffer, { filename });

    // Best-effort cleanup of the temp upload; the wizard re-uploads the file to
    // the permanent deal path on save, so this staging copy is disposable.
    if (cleanupPath) {
      getSupabaseAdmin().storage.from(BUCKET).remove([cleanupPath]).catch(() => {});
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[DEAL_EXTRACT] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to extract deal from PDF.' }, { status: 500 });
  }
}
