import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/investor/transactions
 * Returns transaction history for the authenticated investor,
 * combining allocation events with activity logs.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, company_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id || profile.role !== 'investor') {
      return NextResponse.json({ error: 'Not an investor' }, { status: 403 });
    }

    const companyId = profile.company_id;

    const { data: investorRecord } = await supabase
      .from('investors')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', profile.email)
      .single();

    if (!investorRecord) {
      return NextResponse.json({ transactions: [] });
    }

    // Get allocations to derive transaction-like events
    const { data: allocations } = await supabase
      .from('allocations')
      .select(`
        id, allocation_amount, monthly_interest, annual_rate,
        term_length, payment_start_date, commit_date, expected_funding_date,
        funding_status, status, notes,
        deals (id, deal_id, name, status)
      `)
      .eq('company_id', companyId)
      .eq('investor_id', investorRecord.id)
      .order('created_at', { ascending: false });

    const now = new Date();
    const transactions: any[] = [];
    let txCounter = 1;

    for (const a of (allocations || [])) {
      const amount = Number(a.allocation_amount || 0);
      const monthlyInt = Number(a.monthly_interest || 0);
      const dealName = a.deals?.name || 'Unknown Deal';
      const dealId = a.deals?.deal_id || '';

      // Contribution event (when allocation was committed)
      if (a.commit_date) {
        transactions.push({
          id: `TXN-${String(txCounter++).padStart(4, '0')}`,
          date: a.commit_date,
          type: 'contribution',
          dealName,
          dealId,
          amount,
          status: a.funding_status === 'Funded' ? 'completed' : 'pending',
          paymentMethod: 'Wire Transfer',
          source: 'Personal Account',
          destination: dealName,
        });
      }

      // Interest income events (for funded allocations)
      if (a.payment_start_date && a.funding_status === 'Funded') {
        const startDate = new Date(a.payment_start_date);
        const termMonths = Number(a.term_length || 0);

        for (let i = 1; i <= termMonths; i++) {
          const paymentDate = new Date(startDate);
          paymentDate.setMonth(paymentDate.getMonth() + i);
          if (paymentDate > now) {
            // Include one upcoming payment
            transactions.push({
              id: `TXN-${String(txCounter++).padStart(4, '0')}`,
              date: paymentDate.toISOString().split('T')[0],
              type: 'interest_income',
              dealName,
              dealId,
              amount: monthlyInt,
              status: 'pending',
              monthlyRate: Number(a.annual_rate || 0),
              paymentNumber: i,
              totalPayments: termMonths,
            });
            break;
          }
          transactions.push({
            id: `TXN-${String(txCounter++).padStart(4, '0')}`,
            date: paymentDate.toISOString().split('T')[0],
            type: 'interest_income',
            dealName,
            dealId,
            amount: monthlyInt,
            status: 'completed',
            monthlyRate: Number(a.annual_rate || 0),
            paymentNumber: i,
            totalPayments: termMonths,
          });
        }
      }
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[INVESTOR_TRANSACTIONS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
