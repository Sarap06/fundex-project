import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

/**
 * Deal extraction service.
 *
 * Reads a real-estate lending contract (mortgage + note, often a *scanned*
 * PDF with no text layer) and returns structured fields that map 1:1 onto the
 * Create-Deal wizard's `initialData` shape (snake_case DB field names).
 *
 * Vision LLM — NOT a text parser: these documents are frequently scanned
 * images, so pdf-parse/pdfplumber return nothing. A vision-capable model reads
 * the page images directly and pulls the fields out of the legalese.
 *
 * Provider-agnostic by design: the single `extractDealFromPdf()` entry point
 * hides the model behind an interface so we can swap OpenAI for Claude later
 * without touching the API route or the UI. OpenAI (GPT-4o) is wired first.
 */

// The field values the model returns — every field nullable so the model can
// signal "not found in the document" rather than hallucinate a value.
const ExtractedFields = z.object({
  name: z.string().nullable().describe('A short, human deal name, e.g. "Miami-Dade Balloon Mortgage". Invent a sensible one from the property/borrower if the document has no explicit title.'),
  type: z.enum(['Bridge Loan', 'Construction', 'Acquisition', 'Development', 'Refinance']).nullable().describe('Best-fit deal type. A balloon/interest-only mortgage note is typically a Bridge Loan.'),
  borrower_name: z.string().nullable().describe('The Mortgagor / Borrower / Maker (the party who owes the money).'),
  borrower_contact: z.string().nullable().describe('Borrower email, phone, or mailing address if present.'),
  property_address: z.string().nullable().describe('Street address of the mortgaged property (Exhibit A "Property Address").'),
  location_city: z.string().nullable().describe('City of the property, e.g. "Miami".'),
  location_state: z.string().nullable().describe('Two-letter US state code of the property, e.g. "FL".'),
  property_type: z.string().nullable().describe('Property/collateral type if stated, e.g. "Condominium", "Multi-family".'),
  loan_purpose: z.string().nullable().describe('Stated purpose of the loan, if any.'),
  target_amount: z.number().nullable().describe('Principal / loan amount in dollars as a plain number (450000 for $450,000.00).'),
  interest_rate: z.number().nullable().describe('Annual interest rate as a percentage number (23.3 for "23.30 per cent per annum").'),
  term_length_months: z.number().nullable().describe('Loan term in whole months, computed from the note date to maturity (Oct 2024 -> Oct 2025 = 12).'),
  first_payout_date: z.string().nullable().describe('Date of the first scheduled payment in strict YYYY-MM-DD format.'),
  funding_close_date: z.string().nullable().describe('Maturity / final balloon payment date in strict YYYY-MM-DD format.'),
  collateral_type: z.string().nullable().describe('Type of collateral, e.g. "Real Estate / Mortgage".'),
  collateral_address: z.string().nullable().describe('Address of the collateral property (usually same as property_address).'),
  estimated_property_value: z.number().nullable().describe('Appraised / estimated property value in dollars, if stated.'),
  loan_to_value_ratio: z.number().nullable().describe('LTV as a percentage number, if stated or derivable.'),
  asset_notes: z.string().nullable().describe('Folio number, legal description, and any other collateral detail worth keeping.'),
  notes: z.string().nullable().describe('Other salient terms: monthly payment amount, interest-only vs amortizing, late fee, prepayment, balloon nature.'),
});

const ExtractionResult = z.object({
  fields: ExtractedFields,
  low_confidence: z
    .array(z.string())
    .describe('Names of fields (matching the keys above) that were guessed, inferred, or unclear in the source and should be reviewed by the admin.'),
  summary: z
    .string()
    .describe('One or two sentences describing what the document is and the key terms extracted.'),
});

export type ExtractedDealFields = z.infer<typeof ExtractedFields>;
export type DealExtractionResult = z.infer<typeof ExtractionResult>;

const SYSTEM_PROMPT = `You are a meticulous paralegal that extracts structured deal data from private real-estate lending documents (mortgages, promissory notes, term sheets). The documents are often SCANNED images. Read every page carefully.

Rules:
- Only extract what is ACTUALLY FILLED IN. If a field is not present, return null for it — never invent, estimate, or derive numbers.
- Blank placeholders count as absent. If the only thing in a field is a form label, caption, or highlighted placeholder such as "Borrower(s)", "Lender(s)", "Property Address", "Legal Description", or "Folio Number" with no real value written in, return null — never return the label text as the value.
- Do NOT compute or infer values that are not written in the document. In particular, if the property/appraised value or loan-to-value ratio is not explicitly stated, return null for it — do not calculate LTV or back into a property value from the loan amount.
- Money values are plain numbers with no symbols or commas (e.g. 450000). Read digits carefully on scanned pages (e.g. distinguish 8 from 3).
- Percentages are plain numbers (e.g. 23.3).
- Dates are strict YYYY-MM-DD.
- Compute term_length_months from the note/effective date to the maturity date when both are present (this is the one permitted derivation).
- List every field you inferred, guessed, or were unsure about in low_confidence so a human can verify.`;

export interface ExtractDealOptions {
  filename?: string;
}

/**
 * Extract deal fields from a PDF buffer using OpenAI's vision-capable model.
 * Throws on configuration or API errors; the caller maps those to HTTP codes.
 */
export async function extractDealFromPdf(
  pdf: Buffer,
  options: ExtractDealOptions = {}
): Promise<DealExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err: any = new Error('OPENAI_API_KEY is not configured on the server.');
    err.status = 503;
    throw err;
  }

  const client = new OpenAI({ apiKey });
  const filename = options.filename?.replace(/[^\w.-]/g, '_') || 'contract.pdf';
  const base64 = pdf.toString('base64');

  const completion = await client.chat.completions.parse({
    model: process.env.OPENAI_DEAL_MODEL || 'gpt-4o',
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract the deal fields from this lending contract. Return null for anything not stated in the document.',
          },
          {
            type: 'file',
            file: {
              filename,
              file_data: `data:application/pdf;base64,${base64}`,
            },
          },
        ] as any,
      },
    ],
    response_format: zodResponseFormat(ExtractionResult, 'deal_extraction'),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    const err: any = new Error('The model did not return structured deal data.');
    err.status = 502;
    throw err;
  }

  return sanitizeResult(parsed);
}

// Known form-label / placeholder strings that models sometimes echo back when a
// field is blank on the document. Compared case-insensitively after trimming.
const PLACEHOLDER_VALUES = new Set([
  'borrower', 'borrower(s)', 'borrowers', 'lender', 'lender(s)', 'lenders',
  'property address', 'legal description', 'folio number', 'folio no',
  'mortgage', 'mortgagor', 'mortgagee', 'n/a', 'na', 'none', 'not stated',
  'not specified', 'not applicable', 'unknown', 'tbd',
]);

/**
 * Post-process guard: models don't always honour "return null for blanks" —
 * they emit "." , a form label, or punctuation for absent fields. Deterministically
 * null those out so the wizard never pre-fills junk. Also drops any field the model
 * flagged as low-confidence AND left empty from the low_confidence list.
 */
function sanitizeResult(result: DealExtractionResult): DealExtractionResult {
  const fields = { ...result.fields } as Record<string, unknown>;

  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    // Empty, punctuation-only (e.g. ".", ":"), or a known placeholder label.
    if (
      trimmed === '' ||
      /^[.,:;\-–—_/\\|]+$/.test(trimmed) ||
      PLACEHOLDER_VALUES.has(trimmed.toLowerCase().replace(/^[:.\s]+/, '').trim())
    ) {
      fields[key] = null;
    }
  }

  return { ...result, fields: fields as DealExtractionResult['fields'] };
}
