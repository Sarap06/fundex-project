import { getServiceClient } from './access';
import { getDealInvestors } from './deal-service';

// ─── QUERIES (company-scoped) ─────────────────────────────────────────

/**
 * Get all broadcasts for a company.
 */
export async function getBroadcastsByCompany(companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get broadcast updates for a specific deal.
 */
export async function getDealBroadcastUpdates(dealId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('broadcast_updates')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get communication timeline for a deal.
 */
export async function getDealTimeline(dealId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('broadcast_communication_timeline')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get acknowledgment status for a broadcast update.
 */
export async function getBroadcastAcknowledgments(broadcastUpdateId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('broadcast_update_recipients')
    .select('*')
    .eq('broadcast_update_id', broadcastUpdateId);

  if (error) throw error;
  return data || [];
}

/**
 * Send an update to all investors in a deal.
 * Creates the broadcast_update record and recipient records.
 */
export async function sendDealUpdate(
  dealId: string,
  companyId: string,
  update: {
    admin_id: string;
    title: string;
    message: string;
    file_url?: string;
    file_name?: string;
    file_size?: string;
    file_type?: string;
    require_acknowledgment?: boolean;
  }
) {
  const supabase = getServiceClient();

  // Create broadcast update
  const { data: broadcastUpdate, error: updateError } = await supabase
    .from('broadcast_updates')
    .insert({
      deal_id: dealId,
      ...update,
      update_type: 'manual',
      is_sent: true,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (updateError) throw updateError;

  // Get deal investors and create recipient records
  const investors = await getDealInvestors(dealId, companyId);

  if (investors.length > 0) {
    const recipients = investors.map(inv => ({
      broadcast_update_id: broadcastUpdate.id,
      investor_id: inv.id,
      investor_source: inv.source,
      email: inv.email,
      delivery_status: 'sent',
      sent_at: new Date().toISOString(),
    }));

    await supabase.from('broadcast_update_recipients').insert(recipients);
  }

  // Log to communication timeline
  await supabase.from('broadcast_communication_timeline').insert({
    deal_id: dealId,
    broadcast_update_id: broadcastUpdate.id,
    event_type: 'update_sent',
    title: `Update sent: ${update.title}`,
    description: `Sent to ${investors.length} investor(s)`,
    triggered_by_user_id: update.admin_id,
  });

  return { broadcastUpdate, recipientCount: investors.length };
}
