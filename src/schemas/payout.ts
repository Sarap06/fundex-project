import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

// Mark an investor's payout for a given payroll date as Completed or Missed.
// Reverting to Pending is a DELETE with just the identity fields.
export const markPayoutSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  investor_source: z.string().max(50).optional().nullable(),
  due_date: isoDate,
  status: z.enum(['completed', 'missed']),
  // amount actually paid; defaults to expected when omitted on completion
  actual_amount: z.number().min(0).optional().nullable(),
  paid_date: isoDate.optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export type MarkPayoutInput = z.infer<typeof markPayoutSchema>;

// Revert a marked payout back to Pending (delete the persisted row).
export const revertPayoutSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  due_date: isoDate,
});

export type RevertPayoutInput = z.infer<typeof revertPayoutSchema>;
