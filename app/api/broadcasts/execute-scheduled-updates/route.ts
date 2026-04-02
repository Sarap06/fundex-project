import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (Vercel Cron uses a header)
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // For development, allow requests without auth. Remove in production.
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Find all scheduled updates that are due to be sent
    // Convert EST time to UTC for comparison
    const now = new Date();
    
    console.log(`[Scheduled Updates] Checking for updates to send at ${now.toISOString()}`);

    const { data: scheduledUpdates, error: scheduledError } = await supabase
      .from('broadcast_updates')
      .select('*')
      .eq('is_sent', false)
      .eq('update_type', 'scheduled')
      .lte('scheduled_date', now.toISOString().split('T')[0])
      .not('scheduled_date', 'is', null);

    if (scheduledError) {
      console.error('Error fetching scheduled updates:', scheduledError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled updates', details: scheduledError },
        { status: 500 }
      );
    }

    if (!scheduledUpdates || scheduledUpdates.length === 0) {
      console.log('[Scheduled Updates] No updates to send');
      return NextResponse.json(
        { success: true, processed: 0, message: 'No scheduled updates to send' },
        { status: 200 }
      );
    }

    let processed = 0;
    let errors = [];

    // Process each scheduled update
    for (const update of scheduledUpdates) {
      try {
        // Check if the scheduled time has passed (simple time comparison)
        const [scheduledHour, scheduledMinute] = (update.scheduled_est_time || '00:00').split(':').map(Number);
        const nowHour = now.getHours();
        const nowMinute = now.getMinutes();
        
        // Simple check: if current time >= scheduled time on the scheduled date, send it
        const timeHasPassed = (nowHour > scheduledHour) || (nowHour === scheduledHour && nowMinute >= scheduledMinute);
        const dateMatches = now.toISOString().split('T')[0] >= update.scheduled_date.split('T')[0];
        
        if (!dateMatches || !timeHasPassed) {
          console.log(`[Scheduled Updates] Update ${update.id} not yet due (scheduled: ${update.scheduled_date} ${update.scheduled_est_time})`);
          continue;
        }

        console.log(`[Scheduled Updates] Sending update ${update.id} for deal ${update.deal_id}`);

        // Get all investors for this deal
        const { data: dealInvestors, error: investorsError } = await supabase
          .from('deal_investors')
          .select('investor_id, investor_source')
          .eq('deal_id', update.deal_id);

        if (investorsError) {
          console.error(`Error fetching investors for deal ${update.deal_id}:`, investorsError);
          errors.push({ updateId: update.id, error: 'Failed to fetch investors' });
          continue;
        }

        // Fetch investor emails
        let investorEmails: Array<{ id: string; email: string; source: string }> = [];

        if (dealInvestors && dealInvestors.length > 0) {
          const userProfileIds = dealInvestors
            .filter((di) => di.investor_source === 'user_profiles')
            .map((di) => di.investor_id);

          const investorIds = dealInvestors
            .filter((di) => di.investor_source === 'investors')
            .map((di) => di.investor_id);

          if (userProfileIds.length > 0) {
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('id, email')
              .in('id', userProfileIds);

            if (profiles) {
              investorEmails.push(
                ...profiles.map((p) => ({ id: p.id, email: p.email, source: 'user_profiles' }))
              );
            }
          }

          if (investorIds.length > 0) {
            const { data: investors } = await supabase
              .from('investors')
              .select('id, email')
              .in('id', investorIds);

            if (investors) {
              investorEmails.push(
                ...investors.map((i) => ({ id: i.id, email: i.email, source: 'investors' }))
              );
            }
          }
        }

        // Create recipient records
        if (investorEmails.length > 0) {
          const recipientRecords = investorEmails.map((investor) => ({
            broadcast_update_id: update.id,
            investor_id: investor.id,
            investor_source: investor.source,
            email: investor.email,
            delivery_status: 'sent',
            sent_at: now.toISOString(),
          }));

          const { error: recipientError } = await supabase
            .from('broadcast_update_recipients')
            .insert(recipientRecords);

          if (recipientError) {
            console.error(`Error creating recipient records for update ${update.id}:`, recipientError);
            errors.push({ updateId: update.id, error: 'Failed to create recipient records' });
            continue;
          }
        }

        // Create timeline entry
        const { error: timelineError } = await supabase.from('broadcast_communication_timeline').insert({
          deal_id: update.deal_id,
          broadcast_update_id: update.id,
          event_type: 'update_sent',
          title: `Scheduled Update - ${update.title}`,
          description: update.message.substring(0, 200),
          triggered_by_user_id: update.admin_id,
        });

        if (timelineError) {
          console.error(`Error creating timeline entry for update ${update.id}:`, timelineError);
          errors.push({ updateId: update.id, error: 'Failed to create timeline entry' });
        }

        // Mark update as sent
        const { error: updateError } = await supabase
          .from('broadcast_updates')
          .update({
            is_sent: true,
            sent_at: now.toISOString(),
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating broadcast_update ${update.id}:`, updateError);
          errors.push({ updateId: update.id, error: 'Failed to update sent status' });
          continue;
        }

        console.log(`[Scheduled Updates] Successfully sent update ${update.id}`);
        processed++;
      } catch (err) {
        console.error(`Error processing update ${update.id}:`, err);
        errors.push({ updateId: update.id, error: String(err) });
      }
    }

    return NextResponse.json(
      {
        success: true,
        processed,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${processed} scheduled update(s)`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in execute-scheduled-updates:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
