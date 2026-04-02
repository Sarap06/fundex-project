import { createClient } from '@supabase/supabase-js';

/**
 * Helper function to log activities (can be used from both client and server)
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
  metadata?: Record<string, any>;
}) {
  try {
    // Get random color from palette
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create Supabase client with service role for server-side logging
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

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
        investor_avatar_color: investorName ? avatarColor : undefined,
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
    // Don't throw - activity logging should not break the main operation
    return null;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
