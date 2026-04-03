import { z } from 'zod';

export const createAllocationSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  deal_id: z.string().uuid('Invalid deal ID'),
  allocation_amount: z.number().min(1, 'Amount must be greater than 0'),
  allocation_percentage: z.number().min(0).max(100).optional(),
  annual_rate: z.number().min(0).max(100).optional(),
  term_length: z.string().optional(),
  payment_frequency: z.enum(['Monthly', 'Quarterly', 'Annually']).default('Monthly'),
  commit_date: z.string().optional(),
  expected_funding_date: z.string().optional(),
  payment_start_date: z.string().optional(),
  status: z.enum(['confirmed', 'pending', 'review']).default('pending'),
  funding_status: z.enum(['Funded', 'Pending', 'Review']).default('Pending'),
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
