# Company-Scoped Data Implementation Guide

## Overview
This guide explains how to implement company-scoped data isolation for Investors, Deals, and Documents. All data is now filtered by `company_id` to ensure multi-tenant data separation.

## Files Created/Modified

### 1. Database Migration
**File:** `supabase/migrations/20260326000004_add_company_id_foreign_keys.sql`

This migration:
- Adds `company_id` column to `investors`, `deals`, and `documents` tables
- Creates indexes on `company_id` for fast queries
- Creates composite indexes for filtering by company + other fields
- Updates RLS policies to ensure company-scoped data access

### 2. Utility Functions
**File:** `src/lib/company-data.ts`

Contains functions for company-scoped data operations:

#### Investor Functions
- `getInvestorsByCompany(companyId)` - Fetch all investors for a company
- `getInvestorByIdAndCompany(investorId, companyId)` - Fetch specific investor
- `createInvestorForCompany(companyId, investorData)` - Create new investor
- `getCompanyStatistics(companyId)` - Get company stats (count of investors, deals, docs)

#### Deal Functions
- `getDealsByCompany(companyId)` - Fetch all deals for a company
- `getDealByIdAndCompany(dealId, companyId)` - Fetch specific deal
- `createDealForCompany(companyId, dealData)` - Create new deal

#### Document Functions
- `getDocumentsByCompany(companyId)` - Fetch all documents for a company
- `getDocumentsByDealAndCompany(dealId, companyId)` - Fetch documents for a deal
- `getDocumentsByInvestorAndCompany(investorId, companyId)` - Fetch documents for an investor
- `getDocumentByIdAndCompany(documentId, companyId)` - Fetch specific document
- `createDocumentForCompany(companyId, documentData)` - Create new document

### 3. API Routes

#### Deals API
**File:** `src/app/api/deals/route.ts`

```
GET    /api/deals?company_id=UUID                    - Get all deals for company
GET    /api/deals?company_id=UUID&id=UUID            - Get specific deal
POST   /api/deals?company_id=UUID                    - Create deal for company
PATCH  /api/deals?company_id=UUID&id=UUID            - Update deal
DELETE /api/deals?company_id=UUID&id=UUID            - Delete deal
```

#### Investors API
**File:** `src/app/api/investors/route.ts`

```
GET    /api/investors?company_id=UUID                    - Get all investors for company
GET    /api/investors?company_id=UUID&id=UUID            - Get specific investor
POST   /api/investors?company_id=UUID                    - Create investor for company
PATCH  /api/investors?company_id=UUID&id=UUID            - Update investor
DELETE /api/investors?company_id=UUID&id=UUID            - Delete investor
```

#### Documents API
**File:** `src/app/api/documents/route.ts`

```
GET    /api/documents?company_id=UUID                    - Get all documents for company
GET    /api/documents?company_id=UUID&id=UUID            - Get specific document
GET    /api/documents?company_id=UUID&deal_id=UUID       - Get documents for deal
GET    /api/documents?company_id=UUID&investor_id=UUID   - Get documents for investor
POST   /api/documents?company_id=UUID                    - Create document for company
PATCH  /api/documents?company_id=UUID&id=UUID            - Update document
DELETE /api/documents?company_id=UUID&id=UUID            - Delete document
```

## Usage Examples

### 1. In Components (Using Utility Functions)

```typescript
import { getDealsByCompany, createDealForCompany } from '@/lib/company-data';

export default function DealsComponent() {
  const companyId = 'your-company-uuid';
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const data = await getDealsByCompany(companyId);
        setDeals(data);
      } catch (error) {
        console.error('Failed to load deals:', error);
      }
    };
    loadDeals();
  }, [companyId]);

  const handleCreateDeal = async (dealData) => {
    try {
      const newDeal = await createDealForCompany(companyId, dealData);
      setDeals([...deals, newDeal]);
    } catch (error) {
      console.error('Failed to create deal:', error);
    }
  };

  return (
    // Your component JSX
  );
}
```

### 2. API Usage in Components

```typescript
// Fetch all investors for company
const response = await fetch(`/api/investors?company_id=${companyId}`);
const investors = await response.json();

// Create new deal
const dealResponse = await fetch(`/api/deals?company_id=${companyId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deal_id: 'D-2024-001',
    name: 'New Deal',
    type: 'Bridge Loan',
    status: 'Funding',
    target_amount: 1000000,
  }),
});
const newDeal = await dealResponse.json();

// Update document
const updateResponse = await fetch(
  `/api/documents?company_id=${companyId}&id=${documentId}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Published' }),
  }
);
const updatedDocument = await updateResponse.json();
```

### 3. Create New Investor for Company

```typescript
import { createInvestorForCompany } from '@/lib/company-data';

const newInvestor = await createInvestorForCompany('company-uuid', {
  investor_id: 'INV-2024-001',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  status: 'Active',
  initial_investment: 50000,
  tags: ['Real Estate', 'Verified'],
});
```

### 4. Create Document for Deal with Company

```typescript
import { createDocumentForCompany } from '@/lib/company-data';

const document = await createDocumentForCompany('company-uuid', {
  document_id: 'DOC-2024-001',
  name: 'Offering Memorandum.pdf',
  type: 'Offering',
  category: 'Deal Documents',
  deal_id: 'deal-uuid',
  status: 'Published',
  file_url: 's3://bucket/path/to/file.pdf',
  file_type: 'application/pdf',
  uploaded_by: 'admin@company.com',
});
```

## How to Get Company ID

The company ID should come from:

1. **User Session/Profile:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
// Fetch user profile to get company_id
const { data: profile } = await supabase
  .from('user_profiles')
  .select('company_id')
  .eq('user_id', user.id)
  .single();

const companyId = profile.company_id;
```

2. **Dashboard Context:**
```typescript
// From your existing admin dashboard which loads company
const { company } = useAdminContext(); // or from state management
const companyId = company.id;
```

3. **Route Parameters:**
```typescript
// If company ID is in URL params
const { company_id } = useSearchParams();
```

## Data Flow Diagram

```
┌─────────────────────┐
│ User/Admin          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ Component/Page          │
│ (Gets companyId)        │
└──────────┬──────────────┘
           │
           ▼ (uses companyId)
┌────────────────────────────┐
│ API Route or Utility Fn    │
│ /api/deals?company_id=...  │
│ getDealsByCompany(...)     │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ Supabase Query             │
│ .eq('company_id', companyId)
│ .select(...)               │
└──────────┬─────────────────┘
           │
           ▼
┌──────────────────────┐
│ Company-Filtered     │
│ Data Returned        │
└──────────────────────┘
```

## Data Structure Examples

### Investor with company_id
```typescript
{
  id: 'uuid',
  investor_id: 'INV-001',
  full_name: 'John Doe',
  email: 'john@example.com',
  company_id: 'company-uuid',  // NEW FIELD
  status: 'Active',
  total_invested: 100000,
  // ... other fields
}
```

### Deal with company_id
```typescript
{
  id: 'uuid',
  deal_id: 'D-2024-001',
  name: 'Downtown Complex',
  company_id: 'company-uuid',  // NEW FIELD
  status: 'Funding',
  target_amount: 1000000,
  // ... other fields
}
```

### Document with company_id
```typescript
{
  id: 'uuid',
  document_id: 'DOC-001',
  name: 'Offering Memorandum.pdf',
  company_id: 'company-uuid',  // NEW FIELD
  deal_id: 'deal-uuid',
  status: 'Published',
  // ... other fields
}
```

## Migration Steps

1. **Run the migration:**
   ```bash
   npx supabase migration up
   ```
   Or apply the SQL file directly in Supabase dashboard

2. **Update existing data (if needed):**
   ```sql
   -- Associates all investors with a company (optional - if you have company mapping)
   UPDATE investors SET company_id = 'your-company-uuid' WHERE company_id IS NULL;
   ```

3. **Update your components:**
   - Pass `company_id` to all data fetching functions
   - Use the new API endpoints with `company_id` query parameter
   - Update forms to include `company_id` when creating records

4. **Test:**
   - Verify that each company only sees their data
   - Test creating, updating, deleting records with different company IDs
   - Confirm RLS policies are working (optional - useful in production)

## Security Notes

1. **Always validate company_id** - The company_id should come from authenticated user's context, never from client input alone
2. **RLS Policies** - The migration includes RLS policies, but ensure proper user-to-company mapping exists
3. **API Security** - Consider adding authentication middleware to verify the user belongs to the company_id they're requesting

Example of adding security check:
```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to company
    const { data: userCompany } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (userCompany?.company_id !== companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Proceed with data fetching...
  } catch (error) {
    // Handle error
  }
}
```

## Next Steps

1. Update your dashboard pages to use the new API endpoints
2. Add company_id to all create/update forms
3. Implement proper user-to-company mapping if not already done
4. Add authentication checks to API routes for production security
5. Update existing data with company associations as needed
