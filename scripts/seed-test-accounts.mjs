/**
 * Seed script for two test admin accounts:
 *  - heiwoippimmuttei-4040@yopmail.com  (company_id: 4b9ba501-dad5-4cbe-a348-600110080952)
 *  - tobiloba.a.salau@gmail.com         (company_id: 96d13a4f-bf80-4a52-b2a8-740582aaa9f4)
 *
 * Seeds: investors, deals, allocations, deal_investors, broadcast_updates, investor auth accounts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qguouojbgqpbjsosimvo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndW91b2piZ3FwYmpzb3NpbXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc4NDY5NywiZXhwIjoyMDg4MzYwNjk3fQ.KQRFZkPNYnstXvrheMjC8OsjWhbw9FyHbQYoIhbqXZI';
const PASSWORD = 'Testing21@';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Company IDs ──────────────────────────────────────────────────────────────
const HEIWO_COMPANY = '4b9ba501-dad5-4cbe-a348-600110080952';
const HEIWO_ADMIN   = 'dcd19806-aa87-4622-a9d9-6c63b92ab9cd';

const TOBI_COMPANY  = '96d13a4f-bf80-4a52-b2a8-740582aaa9f4';
const TOBI_ADMIN    = 'f53ecfd7-c8d2-4a7d-a9a9-915ceb5a96c3';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) { console.log(`  ✓ ${msg}`); }
function err(msg, e) { console.error(`  ✗ ${msg}`, e?.message ?? e); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function makeDealId() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `D-${year}-${rand}`;
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

const TODAY = new Date().toISOString().split('T')[0];

// ─── Create auth investor + user_profile ──────────────────────────────────────
async function createInvestorAccount(email, fullName, companyId) {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === email);
  if (found) {
    log(`Auth account already exists: ${email} (${found.id})`);
    // Ensure user_profile exists
    await supabase.from('user_profiles').upsert({
      user_id: found.id,
      full_name: fullName,
      email,
      role: 'investor',
      company_id: companyId,
      status: 'approved',
    }, { onConflict: 'user_id' });
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) { err(`createUser ${email}`, error); return null; }
  const userId = data.user.id;

  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: userId,
    full_name: fullName,
    email,
    role: 'investor',
    company_id: companyId,
    status: 'approved',
  });
  if (profileError) { err(`user_profile ${email}`, profileError); return null; }

  log(`Investor auth account: ${email} (${userId})`);
  return userId;
}

// ─── Insert manual investor ───────────────────────────────────────────────────
async function insertInvestor(companyId, name, email, status, initialInvestment, totalInvested, numInvestments) {
  const { data, error } = await supabase.from('investors').insert({
    full_name: name,
    email,
    status,
    company_id: companyId,
    initial_investment: initialInvestment,
    total_invested: totalInvested,
    number_of_investments: numInvestments,
    phone: `+1${Math.floor(2000000000 + Math.random() * 7999999999)}`,
    onboarded_date: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
  }).select('id').single();
  await sleep(300); // avoid COUNT(*) race condition in investor_id trigger
  if (error) { err(`investor ${name}`, error); return null; }
  log(`Manual investor: ${name} (${data.id})`);
  return data.id;
}

// ─── Insert deal ─────────────────────────────────────────────────────────────
async function insertDeal(companyId, createdBy, { name, type, locationCity, locationState, status, targetAmount, raisedAmount, rate, termMonths, borrower, propertyType, closeDate, collateralType }) {
  const { data, error } = await supabase.from('deals').insert({
    deal_id: makeDealId(),
    name,
    type,
    location: `${locationCity}, ${locationState}`,
    location_city: locationCity,
    location_state: locationState,
    status,
    target_amount: targetAmount,
    raised_amount: raisedAmount,
    progress: Math.round((raisedAmount / targetAmount) * 100),
    interest_rate: rate,
    term: `${termMonths} months`,
    term_length_months: termMonths,
    close_date: closeDate,
    funding_close_date: closeDate,
    first_payout_date: addMonths(TODAY, 1),
    borrower_name: borrower,
    property_type: propertyType,
    collateral_type: collateralType,
    company_id: companyId,
    created_by: createdBy,
    enable_broadcast_channel: true,
    enable_investor_inbox: true,
    document_status: status === 'Active' ? 'Complete' : 'Pending',
    default_investor_audience: 'All Investors',
  }).select('id').single();
  if (error) { err(`deal ${name}`, error); return null; }
  log(`Deal: ${name} (${data.id})`);
  return data.id;
}

// ─── Insert allocation + deal_investor ────────────────────────────────────────
async function insertAllocation(companyId, investorId, dealId, { amount, rate, termMonths, frequency, fundingStatus, status }) {
  const paymentStart = addMonths(TODAY, 1);
  const { data, error } = await supabase.from('allocations').insert({
    company_id: companyId,
    investor_id: investorId,
    deal_id: dealId,
    allocation_amount: amount,
    allocation_percentage: 0,
    commit_date: TODAY,
    expected_funding_date: addMonths(TODAY, 7),
    annual_rate: rate,
    term_length: termMonths,
    term_unit: 'months',
    payment_frequency: frequency,
    payment_start_date: paymentStart,
    funding_status: fundingStatus,
    status,
    notes: 'Seeded test allocation',
  }).select('id').single();
  if (error) { err(`allocation investor=${investorId} deal=${dealId}`, error); return null; }
  log(`  Allocation: $${amount.toLocaleString()} @ ${rate}% (${data.id})`);

  // Also add to deal_investors
  const { error: diError } = await supabase.from('deal_investors').insert({
    deal_id: dealId,
    investor_id: investorId,
    investor_source: 'investors',
  });
  if (diError && !diError.message.includes('duplicate')) {
    err(`deal_investors investor=${investorId}`, diError);
  }

  return data.id;
}

// ─── Link auth investor to deal ───────────────────────────────────────────────
async function linkAuthInvestorToDeal(investorUserId, dealId) {
  const { error } = await supabase.from('deal_investors').insert({
    deal_id: dealId,
    investor_id: investorUserId,
    investor_source: 'user_profiles',
  });
  if (error && !error.message.includes('duplicate')) {
    err(`deal_investors auth investor=${investorUserId}`, error);
  } else {
    log(`  Auth investor linked to deal ${dealId}`);
  }
}

// ─── Insert broadcast update ──────────────────────────────────────────────────
async function insertBroadcastUpdate(companyId, dealId, adminId, { title, content, type }) {
  const { data, error } = await supabase.from('broadcast_updates').insert({
    company_id: companyId,
    deal_id: dealId,
    created_by: adminId,
    title,
    content,
    update_type: type,
    status: 'sent',
    sent_at: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
    recipient_count: Math.floor(2 + Math.random() * 4),
  }).select('id').single();
  if (error) { err(`broadcast_update ${title}`, error); return null; }
  log(`  Broadcast: "${title}"`);
  return data.id;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED HEIWOIPPIMMUTTEI ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════════
async function seedHeiwo() {
  console.log('\n📦 Seeding heiwoippimmuttei-4040@yopmail.com (Acme Corporation)\n');
  const cId = HEIWO_COMPANY;
  const adminId = HEIWO_ADMIN;

  // ── Deals ──
  const deal1 = await insertDeal(cId, adminId, {
    name: 'Miami Beach Resort',
    type: 'Bridge Loan',
    locationCity: 'Miami Beach',
    locationState: 'FL',
    status: 'Active',
    targetAmount: 2500000,
    raisedAmount: 2100000,
    rate: 12.00,
    termMonths: 18,
    borrower: 'Coastal Properties LLC',
    propertyType: 'Resort / Hotel',
    closeDate: addMonths(TODAY, 6),
    collateralType: 'Real Estate',
  });

  const deal2 = await insertDeal(cId, adminId, {
    name: 'Dallas Office Park',
    type: 'Construction Loan',
    locationCity: 'Dallas',
    locationState: 'TX',
    status: 'Funding',
    targetAmount: 1800000,
    raisedAmount: 620000,
    rate: 10.50,
    termMonths: 24,
    borrower: 'DFW Development Group',
    propertyType: 'Commercial Office',
    closeDate: addMonths(TODAY, 3),
    collateralType: 'Real Estate',
  });

  const deal3 = await insertDeal(cId, adminId, {
    name: 'Austin Residential Portfolio',
    type: 'Hard Money',
    locationCity: 'Austin',
    locationState: 'TX',
    status: 'Active',
    targetAmount: 850000,
    raisedAmount: 850000,
    rate: 13.50,
    termMonths: 12,
    borrower: 'Hill Country Homes Inc',
    propertyType: 'Residential',
    closeDate: addMonths(TODAY, 9),
    collateralType: 'Real Estate',
  });

  // ── Manual Investors ──
  const inv1 = await insertInvestor(cId, 'James Mitchell', 'james.mitchell.invest@randmail.co', 'Active', 150000, 150000, 1);
  const inv2 = await insertInvestor(cId, 'Patricia Wong', 'patricia.wong.fund@randmail.co', 'Active', 250000, 250000, 2);
  const inv3 = await insertInvestor(cId, "Kevin O'Brien", 'kevin.obrien.cap@randmail.co', 'Onboarding', 100000, 0, 0);
  const inv4 = await insertInvestor(cId, 'Rachel Kim', 'rachel.kim.inv@randmail.co', 'Active', 500000, 500000, 3);

  // ── Auth Investor Accounts ──
  const authInv1 = await createInvestorAccount('alex.turner.heiwo@testfundex.io', 'Alex Turner', cId);
  const authInv2 = await createInvestorAccount('samantha.reyes.heiwo@testfundex.io', 'Samantha Reyes', cId);

  // ── Allocations (manual investors) ──
  if (inv1 && deal1) await insertAllocation(cId, inv1, deal1, { amount: 150000, rate: 12, termMonths: 18, frequency: 'Monthly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv2 && deal1) await insertAllocation(cId, inv2, deal1, { amount: 250000, rate: 12, termMonths: 18, frequency: 'Monthly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv3 && deal2) await insertAllocation(cId, inv3, deal2, { amount: 100000, rate: 10.5, termMonths: 24, frequency: 'Quarterly', fundingStatus: 'Pending', status: 'pending' });
  if (inv4 && deal3) await insertAllocation(cId, inv4, deal3, { amount: 300000, rate: 13.5, termMonths: 12, frequency: 'Monthly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv4 && deal2) await insertAllocation(cId, inv4, deal2, { amount: 200000, rate: 10.5, termMonths: 24, frequency: 'Monthly', fundingStatus: 'Pending', status: 'pending' });
  if (inv2 && deal3) await insertAllocation(cId, inv2, deal3, { amount: 100000, rate: 13.5, termMonths: 12, frequency: 'Quarterly', fundingStatus: 'Funded', status: 'confirmed' });

  // ── Link auth investors to deals ──
  if (authInv1 && deal1) await linkAuthInvestorToDeal(authInv1, deal1);
  if (authInv1 && deal3) await linkAuthInvestorToDeal(authInv1, deal3);
  if (authInv2 && deal2) await linkAuthInvestorToDeal(authInv2, deal2);
  if (authInv2 && deal1) await linkAuthInvestorToDeal(authInv2, deal1);

  // ── Broadcast Updates ──
  if (deal1) {
    await insertBroadcastUpdate(cId, deal1, adminId, { title: 'Q1 Interest Payment Processed', content: 'Dear investors, your Q1 interest payment of 12% annual rate has been successfully processed and distributed to your accounts. The Miami Beach Resort project is proceeding ahead of schedule with occupancy at 87%.', type: 'Financial Update' });
    await insertBroadcastUpdate(cId, deal1, adminId, { title: 'Renovation Phase 2 Complete', content: 'We are pleased to announce the completion of Phase 2 renovations at Miami Beach Resort. All beachfront suites have been upgraded and are now open for bookings. Property valuation has increased 8% since project inception.', type: 'Milestone Update' });
  }
  if (deal2) {
    await insertBroadcastUpdate(cId, deal2, adminId, { title: 'Funding Progress Update', content: 'The Dallas Office Park development has reached 34% of its funding target. Construction permits have been approved and groundbreaking is scheduled for next month. We are actively seeking additional investors for the remaining $1.18M.', type: 'General Update' });
  }
  if (deal3) {
    await insertBroadcastUpdate(cId, deal3, adminId, { title: 'Portfolio Fully Funded', content: 'The Austin Residential Portfolio has reached its full funding target of $850,000. All 6 properties in the portfolio are currently generating rental income. First interest payment will be distributed on schedule.', type: 'Milestone Update' });
  }

  console.log('\n✅ Heiwoippimmuttei account seeded successfully');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED TOBILOBA ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════════
async function seedTobi() {
  console.log('\n📦 Seeding tobiloba.a.salau@gmail.com (tobiloba\'s Company)\n');
  const cId = TOBI_COMPANY;
  const adminId = TOBI_ADMIN;

  // ── Deals ──
  const deal1 = await insertDeal(cId, adminId, {
    name: 'Chicago Luxury Condos',
    type: 'Bridge Loan',
    locationCity: 'Chicago',
    locationState: 'IL',
    status: 'Active',
    targetAmount: 3200000,
    raisedAmount: 2880000,
    rate: 11.00,
    termMonths: 12,
    borrower: 'Lakefront Developments LLC',
    propertyType: 'Luxury Condominiums',
    closeDate: addMonths(TODAY, 4),
    collateralType: 'Real Estate',
  });

  const deal2 = await insertDeal(cId, adminId, {
    name: 'Phoenix Strip Mall',
    type: 'Hard Money',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    status: 'Funding',
    targetAmount: 1200000,
    raisedAmount: 375000,
    rate: 14.00,
    termMonths: 9,
    borrower: 'Southwest Commercial Group',
    propertyType: 'Retail / Strip Mall',
    closeDate: addMonths(TODAY, 2),
    collateralType: 'Real Estate',
  });

  const deal3 = await insertDeal(cId, adminId, {
    name: 'Seattle Tech Campus',
    type: 'Construction Loan',
    locationCity: 'Seattle',
    locationState: 'WA',
    status: 'Active',
    targetAmount: 5000000,
    raisedAmount: 3200000,
    rate: 9.50,
    termMonths: 36,
    borrower: 'Pacific Northwest Builders',
    propertyType: 'Commercial Office / Tech',
    closeDate: addMonths(TODAY, 18),
    collateralType: 'Real Estate',
  });

  // ── Manual Investors ──
  const inv1 = await insertInvestor(cId, 'Thomas Anderson', 'thomas.anderson.tobi@randmail.co', 'Active', 400000, 400000, 2);
  const inv2 = await insertInvestor(cId, 'Diana Prince', 'diana.prince.fund@randmail.co', 'Active', 180000, 180000, 1);
  const inv3 = await insertInvestor(cId, 'Marcus Johnson', 'marcus.johnson.cap@randmail.co', 'Onboarding', 75000, 0, 0);
  const inv4 = await insertInvestor(cId, 'Olivia Parker', 'olivia.parker.inv@randmail.co', 'Active', 650000, 650000, 3);

  // ── Auth Investor Accounts ──
  const authInv1 = await createInvestorAccount('daniel.lee.tobi@testfundex.io', 'Daniel Lee', cId);
  const authInv2 = await createInvestorAccount('natalie.cruz.tobi@testfundex.io', 'Natalie Cruz', cId);

  // ── Allocations ──
  if (inv1 && deal1) await insertAllocation(cId, inv1, deal1, { amount: 400000, rate: 11, termMonths: 12, frequency: 'Monthly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv2 && deal1) await insertAllocation(cId, inv2, deal1, { amount: 180000, rate: 11, termMonths: 12, frequency: 'Quarterly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv3 && deal2) await insertAllocation(cId, inv3, deal2, { amount: 75000, rate: 14, termMonths: 9, frequency: 'Monthly', fundingStatus: 'Pending', status: 'pending' });
  if (inv4 && deal3) await insertAllocation(cId, inv4, deal3, { amount: 500000, rate: 9.5, termMonths: 36, frequency: 'Monthly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv4 && deal1) await insertAllocation(cId, inv4, deal1, { amount: 150000, rate: 11, termMonths: 12, frequency: 'Monthly', fundingStatus: 'Funded', status: 'confirmed' });
  if (inv2 && deal3) await insertAllocation(cId, inv2, deal3, { amount: 100000, rate: 9.5, termMonths: 36, frequency: 'Quarterly', fundingStatus: 'Review', status: 'review' });

  // ── Link auth investors to deals ──
  if (authInv1 && deal1) await linkAuthInvestorToDeal(authInv1, deal1);
  if (authInv1 && deal3) await linkAuthInvestorToDeal(authInv1, deal3);
  if (authInv2 && deal2) await linkAuthInvestorToDeal(authInv2, deal2);
  if (authInv2 && deal1) await linkAuthInvestorToDeal(authInv2, deal1);

  // ── Broadcast Updates ──
  if (deal1) {
    await insertBroadcastUpdate(cId, deal1, adminId, { title: 'Unit Sales Exceeding Projections', content: 'Excellent news — Chicago Luxury Condos pre-sales have exceeded our initial projections by 22%. All penthouse units are sold and 78% of standard units have signed purchase agreements. Your investment is performing well above benchmark.', type: 'Milestone Update' });
    await insertBroadcastUpdate(cId, deal1, adminId, { title: 'December Interest Distributed', content: 'Your December interest payment at 11% annual rate has been distributed. The project remains on track for its Q2 completion date. Attached is the monthly financial summary for your records.', type: 'Financial Update' });
  }
  if (deal2) {
    await insertBroadcastUpdate(cId, deal2, adminId, { title: 'Zoning Approval Received', content: 'Phoenix Strip Mall has received final zoning approval from the City of Phoenix. Construction is scheduled to begin within 30 days. We are in the final stages of our funding round — 31% funded to date.', type: 'General Update' });
  }
  if (deal3) {
    await insertBroadcastUpdate(cId, deal3, adminId, { title: 'Phase 1 Foundation Complete', content: 'The Seattle Tech Campus Phase 1 foundation work has been completed on time and under budget. Steel framing begins next week. The project is 64% funded and construction is proceeding per the master schedule.', type: 'Milestone Update' });
    await insertBroadcastUpdate(cId, deal3, adminId, { title: 'Major Tenant Signed', content: 'We are thrilled to announce that a Fortune 500 technology company has signed a 10-year anchor lease for 40% of the Seattle Tech Campus. This significantly de-risks the investment and increases projected returns.', type: 'General Update' });
  }

  console.log('\n✅ Tobiloba account seeded successfully');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('🌱 Starting seed for test accounts...');
  console.log(`   Password for all investor accounts: ${PASSWORD}`);

  await seedHeiwo();
  await seedTobi();

  console.log('\n🎉 All done!\n');
  console.log('Investor login accounts:');
  console.log('  Heiwo company:');
  console.log('    alex.turner.heiwo@testfundex.io      / Testing21@');
  console.log('    samantha.reyes.heiwo@testfundex.io   / Testing21@');
  console.log('  Tobiloba company:');
  console.log('    daniel.lee.tobi@testfundex.io        / Testing21@');
  console.log('    natalie.cruz.tobi@testfundex.io      / Testing21@');
}

main().catch(console.error);
