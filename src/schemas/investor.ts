import { z } from 'zod';

export const createInvestorSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  status: z.enum(['Active', 'Onboarding', 'Pending']).default('Onboarding'),
  initial_investment: z.number().min(0).optional(),
  sponsor_name: z.string().optional(),
  sponsor_company: z.string().optional(),
});

export type CreateInvestorInput = z.infer<typeof createInvestorSchema>;
