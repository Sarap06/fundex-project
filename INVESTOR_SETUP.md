# Investor Management Setup Guide

## Overview
This guide walks you through setting up the Investor management system with Supabase integration.

## What Was Created

### 1. Database Migration
**File**: `supabase/migrations/20260325000000_create_investors_table.sql`

The migration creates:
- **sponsors** table - Store sponsor information (name, company)
- **investors** table - Store investor details with all required fields
- **Indexes** - For optimized queries (email, status, sponsor_id, created_at)
- **RLS Policies** - Row Level Security for data protection
- **Triggers** - Auto-generate investor IDs and update timestamps

### 2. Investors Page
**File**: `app/dashboard/admin/investors/page.tsx`

Features:
- List all investors with real-time data from Supabase
- Search by name, email, or investor ID
- Filter by status (Active, Onboarding, Pending)
- Add Investor drawer with comprehensive form
- Stats cards showing Total, Active, Onboarding, and Pending investors
- Full integration with Supabase database

### 3. Supabase Client
**File**: `src/lib/supabase.ts`

Already exists in your project - provides connection to Supabase

## Setup Steps

### Step 1: Run the Migration

Option A - Using Supabase Dashboard:
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260325000000_create_investors_table.sql`
5. Paste into the SQL editor
6. Click **Run**

Option B - Using Supabase CLI (if installed):
```bash
supabase db push
```

### Step 2: Verify Tables in Supabase

1. Go to **Table Editor** in Supabase Dashboard
2. You should see:
   - `sponsors` table with 5 default rows (Internal, Derek – 818 Consulting, Maria – Summit Partners, Referral, John – Ventures Capital)
   - `investors` table (empty, ready for data)

### Step 3: Test the Investors Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/dashboard/admin/investors`

3. You should see:
   - Empty table with "No investors found" message
   - Add Investor button in top right
   - Stats cards showing 0 investors

### Step 4: Add Your First Investor

1. Click **Add Investor** button
2. Fill in the form:
   - **Full Name**: John Smith
   - **Email**: john.smith@example.com
   - **Phone**: (555) 123-4567
   - **Status**: Active
   - **Sponsor**: Select one or add new
   - **Initial Investment**: 500000 (for $500K)
   - **Number of Investments**: 3
   - **Notes**: Optional
   - **Tags**: Select any (VIP, High Net Worth, etc.)
3. Click **Create Investor**

### Step 5: Verify Data Display

1. After creation, you should see:
   - New investor appears in the table
   - Stats cards update (Total Investors: 1, Active: 1)
   - Investor ID auto-generated (INV-001, INV-002, etc.)
   - Onboarded date shows current date

## Database Schema

### Sponsors Table
```sql
id: UUID (Primary Key)
name: VARCHAR(255) - Sponsor name
company: VARCHAR(255) - Company name (optional)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Investors Table
```sql
id: UUID (Primary Key)
investor_id: VARCHAR(50) UNIQUE - Auto-generated (INV-001, INV-002, etc.)
full_name: VARCHAR(255) - Required
email: VARCHAR(255) UNIQUE - Required
phone: VARCHAR(20) - Optional
status: VARCHAR(50) - Active, Onboarding, or Pending
sponsor_id: UUID FOREIGN KEY - Reference to sponsors table
initial_investment: DECIMAL(15, 2) - In dollars
total_invested: DECIMAL(15, 2) - Calculated/updated field
number_of_investments: INTEGER - Count of investments
average_return: DECIMAL(5, 2) - Percentage (optional)
notes: TEXT - Optional notes
tags: TEXT[] - Array of tags (VIP, High Net Worth, etc.)
onboarded_date: TIMESTAMP - When investor was created
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## Form Fields & Validation

### Basic Information Section
- **Full Name** *required - Text input
- **Email Address** *required - Email input (must be unique)
- **Phone Number** optional - Phone input with placeholder format

### Investor Status Section
- **Status** *required - Dropdown (Active, Onboarding, Pending)
- Default value: Onboarding

### Sponsor Section
- **Sponsor** optional - Dropdown with:
  - Internal
  - Derek – 818 Consulting
  - Maria – Summit Partners
  - Referral
  - John – Ventures Capital
  - + Add New Sponsor (inline form)

### Investment Details Section (Optional)
- **Initial Investment Amount** - Number input in dollars
- **Number of Investments** - Number input
- **Notes** - Textarea for additional notes

### Tags Section (Optional)
- Clickable tag buttons: VIP, High Net Worth, New Investor, Accredited, Institutional

## Features Implemented

✅ **Real-time Data Sync**
- Investors automatically loaded from Supabase
- New investors immediately visible in the list
- Stats update automatically

✅ **Search & Filter**
- Search by name, email, or investor ID
- Filter by status tabs
- Combined search + filter functionality

✅ **Auto-generation**
- Investor IDs auto-generated (INV-001, INV-002, etc.)
- Onboarded dates set to current timestamp
- Updated timestamps on every change

✅ **Data Validation**
- Email uniqueness enforced at database level
- Required fields marked with *
- Email format validation
- Numeric validation for investment amounts

✅ **Security**
- Row Level Security (RLS) policies enabled
- Only authenticated users can read/write
- Sponsors table public read-only

## Next Steps

1. **Update Admin Dashboard**
   - Update the Investors stat card to pull real data
   - Add link to Investors page

2. **Create Additional Pages**
   - Deals page
   - Allocations page
   - Documents page

3. **Connect to Dashboard Stats**
   - Update Recent Activity with real investor data
   - Connect stats cards to investor count

4. **Add More Features**
   - Edit investor functionality
   - Delete investor functionality
   - Export investor data
   - Bulk actions

## Troubleshooting

### "Missing Supabase environment variables"
- Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after updating `.env.local`

### "Table 'investors' does not exist"
- Run the migration SQL in Supabase SQL Editor
- Verify table appears in Table Editor

### "Email already exists"
- Email must be unique per investor
- Try a different email address

### Investors not loading
- Check Supabase RLS policies are enabled
- Verify user is authenticated
- Check browser console for specific errors

### Add Investor form not submitting
- Verify all required fields are filled (Full Name, Email, Status)
- Check for validation errors in the console
- Ensure email format is valid

## Migration Rollback (If Needed)

If you need to rollback, run in Supabase SQL Editor:
```sql
DROP TABLE IF EXISTS investors;
DROP TABLE IF EXISTS sponsors;
DROP TRIGGER IF EXISTS investor_id_trigger ON investors;
DROP TRIGGER IF EXISTS investors_updated_at_trigger ON investors;
DROP TRIGGER IF EXISTS sponsors_updated_at_trigger ON sponsors;
DROP FUNCTION IF EXISTS generate_investor_id();
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Support

For issues or questions, check:
1. Supabase logs in Dashboard (Logs tab)
2. Browser console (F12 → Console)
3. Network tab for API errors
4. Verify RLS policies allow your user permissions
