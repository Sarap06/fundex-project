/** Admin access code required for admin signup */
export const ADMIN_ACCESS_CODE = '100630';

/** Avatar color palette used for activity log entries */
export const AVATAR_COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
] as const;

/** Application base URL */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/** User roles */
export const ROLES = {
  ADMIN: 'admin',
  PARTNER: 'partner',
  INVESTOR: 'investor',
  PENDING: 'pending',
} as const;

/** User statuses */
export const USER_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/** Deal types */
export const DEAL_TYPES = [
  'Bridge Loan',
  'Construction',
  'Acquisition',
  'Development',
  'Refinancing',
] as const;

/** Deal statuses */
export const DEAL_STATUSES = [
  'Active',
  'Closed',
  'Pending',
  'Draft',
] as const;
