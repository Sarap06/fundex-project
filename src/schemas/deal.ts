import { z } from 'zod';

export const createDealSchema = z.object({
  name: z.string().min(2, 'Deal name must be at least 2 characters'),
  type: z.enum(['Bridge Loan', 'Construction', 'Acquisition', 'Development', 'Refinancing']),
  location: z.string().min(1, 'Location is required'),
  location_state: z.string().optional(),
  location_city: z.string().optional(),
  target_amount: z.number().min(1, 'Target amount must be greater than 0'),
  term: z.string().optional(),
  interest_rate: z.number().min(0).max(100).optional(),
  close_date: z.string().optional(),
  borrower_name: z.string().optional(),
  borrower_contact: z.string().optional(),
  property_address: z.string().optional(),
  property_type: z.string().optional(),
  loan_purpose: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
