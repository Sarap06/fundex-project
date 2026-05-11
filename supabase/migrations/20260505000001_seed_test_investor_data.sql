-- ============================================================
-- SEED: Test data for investor yaulunneijefeu-6185@yopmail.com
-- Admin company:   riddassafrauce-9160@yopmail.com
--
-- What this creates:
--   Deal 1  — Active Bridge Loan    (TX, 12-mo term, 6 payments done)
--   Deal 2  — Active Construction   (CA, 24-mo term, 3 payments done)
--   Deal 3  — Closed Acquisition    (FL, 6-mo term, ALL 6 payments done)
--   Deal 4  — Funding/Pending       (CO, 18-mo term, not yet deployed)
--
-- Expected dashboard values (May 2026):
--   totalCommittedCapital  = $1,200,000  (all 4 allocations)
--   activeDeployedCapital  = $750,000    (Deals 1+2, confirmed+funded+Active)
--   capitalInDeployment    = $300,000    (Deal 4, pending status)
--   currentMonthlyIncome   = $6,875      ($2,500 + $4,375)
--   totalEarned            = $37,875     ($15,000 + $13,125 + $9,750)
--   avgLtv                 ≈ 62%         (weighted: 65%×$250k + 60%×$500k) / $750k
--   collateral.totalValue  = $11,000,000 ($3M deal1 + $8M deal2)
--   weightedAvgAnnualRate  ≈ 11%         (12%×$250k + 10.5%×$500k) / $750k
--   next30Days payment     = $6,875      (both active deals pay ~Jun 1)
--   remainingExpected      = $106,875    (6 left×$2,500 + 21 left×$4,375)
-- ============================================================

DO $$
DECLARE
  v_company_id   UUID;
  v_investor_id  UUID;
  v_user_id      UUID;  -- auth user_id for deal_investors (user_profiles source)
  v_deal1_id     UUID;
  v_deal2_id     UUID;
  v_deal3_id     UUID;
  v_deal4_id     UUID;
BEGIN

  -- ── 1. Resolve company from admin email ───────────────────
  SELECT company_id INTO v_company_id
  FROM user_profiles
  WHERE email = 'riddassafrauce-9160@yopmail.com'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found or has no company_id';
  END IF;

  -- ── 2. Resolve investor record ────────────────────────────
  SELECT id INTO v_investor_id
  FROM investors
  WHERE email = 'yaulunneijefeu-6185@yopmail.com'
    AND company_id = v_company_id
  LIMIT 1;

  IF v_investor_id IS NULL THEN
    RAISE EXCEPTION 'Investor not found. Make sure Smith Jackson exists in the investors table for company %', v_company_id;
  END IF;

  -- Get auth user_id for deal_investors (user_profiles source uses user_id, not profile id)
  SELECT user_id INTO v_user_id
  FROM user_profiles
  WHERE email = 'yaulunneijefeu-6185@yopmail.com'
    AND company_id = v_company_id
  LIMIT 1;

  -- ── 3. Clean up any previous seed runs ───────────────────
  DELETE FROM deal_investors
  WHERE deal_id IN (
    SELECT id FROM deals
    WHERE company_id = v_company_id
      AND deal_id IN ('SEED-D-001', 'SEED-D-002', 'SEED-D-003', 'SEED-D-004')
  );

  DELETE FROM allocations
  WHERE company_id = v_company_id
    AND investor_id = v_investor_id
    AND deal_id IN (
      SELECT id FROM deals
      WHERE company_id = v_company_id
        AND deal_id IN ('SEED-D-001', 'SEED-D-002', 'SEED-D-003', 'SEED-D-004')
    );

  DELETE FROM deals
  WHERE company_id = v_company_id
    AND deal_id IN ('SEED-D-001', 'SEED-D-002', 'SEED-D-003', 'SEED-D-004');

  -- ── 4. Create Deals ───────────────────────────────────────

  -- Deal 1: Active Bridge Loan — earning for 6 months
  -- Smith Jackson allocation: $250,000 @ 12% = $2,500/month
  -- Collateral: $3,000,000 property, LTV 65%
  INSERT INTO deals (
    deal_id, name, type, location_state, location_city, status,
    target_amount, raised_amount, progress, investor_count,
    interest_rate, term,
    close_date, first_payout_date,
    borrower_name,
    collateral_address, estimated_property_value, loan_to_value_ratio,
    company_id,
    enable_broadcast_channel, enable_investor_inbox,
    created_at, updated_at
  ) VALUES (
    'SEED-D-001',
    'Riverside Bridge Loan',
    'Bridge Loan',
    'TX', 'Dallas',
    'Active',
    2000000, 2000000, 100, 4,
    12.0, '12 months',
    '2025-11-01', '2025-12-01',
    'Riverside Capital LLC',
    '1200 Riverside Drive, Dallas, TX 75201',
    3000000, 65.0,
    v_company_id,
    true, true,
    NOW(), NOW()
  )
  RETURNING id INTO v_deal1_id;

  -- Deal 2: Active Construction Loan — earning for 3 months
  -- Smith Jackson allocation: $500,000 @ 10.5% = $4,375/month
  -- Collateral: $8,000,000 property, LTV 60%
  INSERT INTO deals (
    deal_id, name, type, location_state, location_city, status,
    target_amount, raised_amount, progress, investor_count,
    interest_rate, term,
    close_date, first_payout_date,
    borrower_name,
    collateral_address, estimated_property_value, loan_to_value_ratio,
    company_id,
    enable_broadcast_channel, enable_investor_inbox,
    created_at, updated_at
  ) VALUES (
    'SEED-D-002',
    'Metro Office Complex',
    'Construction',
    'CA', 'Los Angeles',
    'Active',
    5000000, 5000000, 100, 8,
    10.5, '24 months',
    '2026-02-01', '2026-03-01',
    'Metro Developments Inc',
    '500 Figueroa St, Los Angeles, CA 90071',
    8000000, 60.0,
    v_company_id,
    true, true,
    NOW(), NOW()
  )
  RETURNING id INTO v_deal2_id;

  -- Deal 3: CLOSED Acquisition — 6-month term, all payments received
  -- Smith Jackson allocation: $150,000 @ 13% = $1,625/month × 6 = $9,750 total earned
  -- Tests fundedConfirmedAllocations (historical earnings, closed deal)
  INSERT INTO deals (
    deal_id, name, type, location_state, location_city, status,
    target_amount, raised_amount, progress, investor_count,
    interest_rate, term,
    close_date, first_payout_date,
    borrower_name,
    collateral_address, estimated_property_value, loan_to_value_ratio,
    company_id,
    enable_broadcast_channel, enable_investor_inbox,
    created_at, updated_at
  ) VALUES (
    'SEED-D-003',
    'Harbor Point Residential',
    'Acquisition',
    'FL', 'Tampa',
    'Closed',
    1500000, 1500000, 100, 3,
    13.0, '6 months',
    '2026-01-01', '2025-08-01',
    'Harbor Point Partners',
    '800 Harbor Blvd, Tampa, FL 33602',
    2200000, 68.0,
    v_company_id,
    true, true,
    NOW(), NOW()
  )
  RETURNING id INTO v_deal3_id;

  -- Deal 4: Funding stage — not yet deployed
  -- Smith Jackson allocation: $300,000 @ 11%, pending status
  -- Tests capitalInDeployment
  INSERT INTO deals (
    deal_id, name, type, location_state, location_city, status,
    target_amount, raised_amount, progress, investor_count,
    interest_rate, term,
    close_date, first_payout_date,
    borrower_name,
    collateral_address, estimated_property_value, loan_to_value_ratio,
    company_id,
    enable_broadcast_channel, enable_investor_inbox,
    created_at, updated_at
  ) VALUES (
    'SEED-D-004',
    'Westside Development Project',
    'Development',
    'CO', 'Denver',
    'Funding',
    3000000, 900000, 30, 2,
    11.0, '18 months',
    '2026-10-01', '2026-11-01',
    'Westside Development Corp',
    '200 Westside Ave, Denver, CO 80202',
    4500000, 62.0,
    v_company_id,
    true, true,
    NOW(), NOW()
  )
  RETURNING id INTO v_deal4_id;

  -- ── 5. Create Allocations ─────────────────────────────────
  -- monthly_interest is auto-set by DB trigger: (amount × rate/100) / 12

  -- Allocation 1 → Deal 1 (Active)
  -- $250,000 @ 12% → trigger sets monthly_interest = $2,500
  -- payment_start_date Nov 1 2025, term 12 months → 6 payments done by May 2026
  INSERT INTO allocations (
    company_id, investor_id, deal_id,
    allocation_amount, allocation_percentage,
    commit_date, expected_funding_date,
    annual_rate, term_length, term_unit,
    payment_frequency, payment_start_date,
    funding_status, status, notes
  ) VALUES (
    v_company_id, v_investor_id, v_deal1_id,
    250000, 12.5,
    '2025-10-15', '2025-11-01',
    12.0, 12, 'months',
    'Monthly', '2025-11-01',
    'Funded', 'confirmed',
    'Riverside Bridge Loan — test seed'
  );

  -- Allocation 2 → Deal 2 (Active)
  -- $500,000 @ 10.5% → trigger sets monthly_interest = $4,375
  -- payment_start_date Feb 1 2026, term 24 months → 3 payments done by May 2026
  INSERT INTO allocations (
    company_id, investor_id, deal_id,
    allocation_amount, allocation_percentage,
    commit_date, expected_funding_date,
    annual_rate, term_length, term_unit,
    payment_frequency, payment_start_date,
    funding_status, status, notes
  ) VALUES (
    v_company_id, v_investor_id, v_deal2_id,
    500000, 10.0,
    '2026-01-20', '2026-02-01',
    10.5, 24, 'months',
    'Monthly', '2026-02-01',
    'Funded', 'confirmed',
    'Metro Office Complex — test seed'
  );

  -- Allocation 3 → Deal 3 (Closed)
  -- $150,000 @ 13% → trigger sets monthly_interest = $1,625
  -- payment_start_date Jul 1 2025, term 6 months → all 6 payments done (Jan 2026 last)
  -- Tests historical earnings via fundedConfirmedAllocations
  INSERT INTO allocations (
    company_id, investor_id, deal_id,
    allocation_amount, allocation_percentage,
    commit_date, expected_funding_date,
    annual_rate, term_length, term_unit,
    payment_frequency, payment_start_date,
    funding_status, status, notes
  ) VALUES (
    v_company_id, v_investor_id, v_deal3_id,
    150000, 10.0,
    '2025-06-10', '2025-07-01',
    13.0, 6, 'months',
    'Monthly', '2025-07-01',
    'Funded', 'confirmed',
    'Harbor Point Residential — completed deal, test seed'
  );

  -- Allocation 4 → Deal 4 (Funding, pending deployment)
  -- $300,000 @ 11% → pending, not yet earning
  -- Tests capitalInDeployment
  INSERT INTO allocations (
    company_id, investor_id, deal_id,
    allocation_amount, allocation_percentage,
    commit_date, expected_funding_date,
    annual_rate, term_length, term_unit,
    payment_frequency, payment_start_date,
    funding_status, status, notes
  ) VALUES (
    v_company_id, v_investor_id, v_deal4_id,
    300000, 10.0,
    '2026-05-01', '2026-10-01',
    11.0, 18, 'months',
    'Monthly', '2026-10-01',
    'Pending', 'pending',
    'Westside Development — awaiting funding, test seed'
  );

  -- ── 6. Create deal_investors entries ────────────────────
  -- Links investor to deals for broadcast inbox deal context panel.
  -- Uses user_profiles.user_id (NOT investors.id) with investor_source = 'user_profiles'.
  IF v_user_id IS NOT NULL THEN
    INSERT INTO deal_investors (deal_id, investor_id, investor_source, company_id)
    VALUES
      (v_deal1_id, v_user_id, 'user_profiles', v_company_id),
      (v_deal2_id, v_user_id, 'user_profiles', v_company_id),
      (v_deal3_id, v_user_id, 'user_profiles', v_company_id),
      (v_deal4_id, v_user_id, 'user_profiles', v_company_id)
    ON CONFLICT (deal_id, investor_id, investor_source) DO NOTHING;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed complete!';
  RAISE NOTICE '  Company:   %', v_company_id;
  RAISE NOTICE '  Investor:  %', v_investor_id;
  RAISE NOTICE '  Deal 1 (Active):   %', v_deal1_id;
  RAISE NOTICE '  Deal 2 (Active):   %', v_deal2_id;
  RAISE NOTICE '  Deal 3 (Closed):   %', v_deal3_id;
  RAISE NOTICE '  Deal 4 (Funding):  %', v_deal4_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Expected investor dashboard values:';
  RAISE NOTICE '  Total Capital:        $1,200,000';
  RAISE NOTICE '  Capital Deployed:     $750,000';
  RAISE NOTICE '  Funds Deploying:      $300,000';
  RAISE NOTICE '  Monthly Income:       $6,875';
  RAISE NOTICE '  Collateral Value:     $11,000,000';
  RAISE NOTICE '  Avg LTV:              ~62%%';
  RAISE NOTICE '  Weighted Avg Rate:    ~11%%';
  RAISE NOTICE '  Total Earned (hist):  $37,875';
  RAISE NOTICE '  Remaining Expected:   $106,875';
  RAISE NOTICE '========================================';

END $$;
