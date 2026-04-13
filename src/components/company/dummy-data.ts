/**
 * Dummy data for the company dashboard.
 * Used as fallback when real API data returns zeros/empty.
 * Content reflects Fundex's private lending / real estate investment domain.
 * Automatically replaced when real data flows in.
 */

export const DUMMY_STATS = {
  totalAUM: 2450000,
  allocatedCapital: 1850000,
  monthlyInterest: 18750,
  fundedAllocations: 14,
  pendingAllocations: 3,
  activeDeals: 8,
  totalDeals: 12,
  totalTarget: 5000000,
  totalRaised: 3200000,
  activeInvestors: 24,
  totalInvestors: 31,
  totalInvested: 2450000,
};

/** Display-ready growth rates for demo view */
export const DUMMY_GROWTH = {
  totalAUM: '+9.5%',
  allocatedCapital: '+4.1%',
  activeInvestors: '+1.8%',
  monthlyReturns: '+5.3%',
};

export const DUMMY_FLOW_DATA = [
  { month: 'Oct 01', inflows: 82000, outflows: 41000 },
  { month: 'Oct 15', inflows: 35000, outflows: 98000 },
  { month: 'Nov 01', inflows: 61000, outflows: 52000 },
  { month: 'Nov 15', inflows: 28000, outflows: 34000 },
  { month: 'Dec 01', inflows: 187000, outflows: 65000 },
  { month: 'Dec 15', inflows: 120000, outflows: 45000 },
  { month: 'Jan 01', inflows: 93000, outflows: 38000 },
  { month: 'Jan 15', inflows: 85000, outflows: 72000 },
  { month: 'Feb 01', inflows: 55000, outflows: 41000 },
];

export const DUMMY_TRANSACTIONS = [
  {
    id: '1',
    type: 'allocation_created',
    description: 'Bridge Loan — 742 Brickell Ave',
    dealName: 'Riverside Commons',
    investorName: 'John Mitchell',
    timestamp: '2025-11-21T10:30:00Z',
    amount: -250000,
    category: 'Allocation',
  },
  {
    id: '2',
    type: 'deal_created',
    description: 'Investor Funding — Sarah Chen',
    dealName: 'Oakwood Residences',
    investorName: 'Sarah Chen',
    timestamp: '2025-11-29T14:15:00Z',
    amount: 175000,
    category: 'Funding',
  },
  {
    id: '3',
    type: 'investor_created',
    description: 'Fix & Flip — 318 Coral Way',
    dealName: 'Palm Vista',
    investorName: 'Michael Torres',
    timestamp: '2025-12-02T09:00:00Z',
    amount: -180000,
    category: 'Allocation',
  },
  {
    id: '4',
    type: 'document_uploaded',
    description: 'Q4 Distribution — Harbor Point',
    dealName: 'Harbor Point',
    investorName: 'Emily Brooks',
    timestamp: '2025-12-05T16:45:00Z',
    amount: 42500,
    category: 'Distribution',
  },
  {
    id: '5',
    type: 'allocation_created',
    description: 'Construction Draw — Sunset Towers',
    dealName: 'Sunset Towers',
    investorName: 'David Park',
    timestamp: '2025-12-08T11:20:00Z',
    amount: -325000,
    category: 'Allocation',
  },
];

export const DUMMY_BROADCASTS = [
  {
    id: '1',
    title: 'Q4 Portfolio Performance Update',
    message: 'Our Q4 portfolio returned 12.3% across all active deals, outperforming market benchmarks by 2.1 percentage points.',
    created_at: '2025-12-20T09:00:00Z',
    admin_name: 'Marcus Webb',
  },
  {
    id: '2',
    title: 'New Deal: Riverside Commons',
    message: 'Excited to announce our newest deal — Riverside Commons, a 24-unit multifamily project in South Miami.',
    created_at: '2025-12-18T14:30:00Z',
    admin_name: 'Sarah Chen',
    file_url: 'https://example.com/riverside-deck.pdf',
    file_name: 'riverside-deck.pdf',
  },
  {
    id: '3',
    title: 'Distribution Schedule Update',
    message: 'Next quarterly distribution will be processed on January 15, 2026. Please verify your banking details.',
    created_at: '2025-12-15T10:00:00Z',
    admin_name: 'Marcus Webb',
  },
  {
    id: '4',
    title: 'Year-End Tax Documents',
    message: 'K-1 forms for the 2025 tax year will be available in your documents portal by February 28.',
    created_at: '2025-12-10T08:00:00Z',
    admin_name: 'Emily Brooks',
  },
];
