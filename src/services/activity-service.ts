import { getServiceClient } from './access';

const AVATAR_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899',
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// ─── LOGGING (single entry point for all activity logging) ────────────

/**
 * Log an activity. Use this for ALL mutations — never insert into
 * activity_logs or broadcast_communication_timeline directly.
 */
export async function logActivity({
  companyId,
  activityType,
  title,
  description,
  investorId,
  investorName,
  dealId,
  dealName,
  allocationId,
  userId,
  metadata = {},
}: {
  companyId: string;
  activityType: string;
  title: string;
  description?: string;
  investorId?: string;
  investorName?: string;
  dealId?: string;
  dealName?: string;
  allocationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceClient();

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        company_id: companyId,
        activity_type: activityType,
        title,
        description,
        investor_id: investorId,
        investor_name: investorName,
        investor_initials: investorName ? getInitials(investorName) : undefined,
        investor_avatar_color: investorName ? getRandomColor() : undefined,
        deal_id: dealId,
        deal_name: dealName,
        allocation_id: allocationId,
        user_id: userId,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

// ─── QUERIES ──────────────────────────────────────────────────────────

/**
 * Get recent activities for a company.
 */
export async function getRecentActivities(companyId: string, limit = 20) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
