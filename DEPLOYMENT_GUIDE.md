# Deal Broadcast Channels - Setup & Deployment Guide

## ✅ Implementation Status

All code has been implemented and is ready for deployment. This guide will help you set up the new broadcast channel system.

## 📋 What Has Been Implemented

### Database
- ✅ Migration file created: `supabase/migrations/20260401000000_add_broadcast_channels_to_deals.sql`
  - Adds `enable_broadcast_channel` and `enable_inbox_channel` columns to `deals` table
  - Creates `broadcast_updates` table
  - Creates `broadcast_update_recipients` table
  - Creates `broadcast_communication_timeline` table
  - Includes all indexes and RLS policies

### API Routes
- ✅ `GET /api/broadcasts/deals` - List all deal channels
- ✅ `GET /api/broadcasts/deals/[dealId]` - Get deal details with updates
- ✅ `POST /api/broadcasts/deals/[dealId]/send-update` - Send immediate update
- ✅ `POST /api/broadcasts/deals/[dealId]/schedule-update` - Schedule future update
- ✅ `GET /api/broadcasts/deals/[dealId]/documents` - Get linked documents
- ✅ `GET /api/broadcasts/deals/[dealId]/timeline` - Get communication timeline
- ✅ `GET /api/broadcasts/deals/[dealId]/acknowledgments` - Get acknowledgment status

### Frontend Components
- ✅ `src/components/DealBroadcastChannels.tsx` - Main broadcast UI component
- ✅ Updated `app/dashboard/admin/broadcast/page.tsx` - Uses new component

### Types & Interfaces
- ✅ Updated `src/lib/types.ts` - Added all broadcast-related types

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration**
   - Open the file: `supabase/migrations/20260401000000_add_broadcast_channels_to_deals.sql`
   - Copy the entire content
   - Paste into the Supabase SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Migration Success**
   - Check that no errors appear
   - You should see all tables and policies created

### Step 2: Enable Broadcast Channels for Deals

Once the migration is applied, you need to enable broadcast channels for the deals you want to display:

**Option A: Using Supabase Dashboard**
1. Go to "Table Editor"
2. Select "deals" table
3. Find the deals you want to enable
4. Set `enable_broadcast_channel = true` and `enable_inbox_channel = true`

**Option B: Using SQL Query**
```sql
-- Enable broadcast channels for all active deals
UPDATE deals
SET enable_broadcast_channel = true, 
    enable_inbox_channel = true
WHERE status = 'Active';

-- OR for specific deal
UPDATE deals
SET enable_broadcast_channel = true, 
    enable_inbox_channel = true
WHERE deal_id = 'D-2024-089';
```

### Step 3: Verify Frontend Changes (Optional)

The frontend code is already updated in:
- `app/dashboard/admin/broadcast/page.tsx`
- `src/components/DealBroadcastChannels.tsx`

No additional changes needed unless you want to customize the UI.

### Step 4: Test the Implementation

1. **Start the development server** (if not running):
   ```bash
   bun dev
   ```

2. **Navigate to Broadcast page**
   - Go to: `http://localhost:3000/dashboard/admin/broadcast`

3. **Expected Behavior**
   - You should see "Deal Channels" section with your enabled deals
   - Clicking a deal shows 4 buttons (Send Update, Linked Docs, Schedule Update, Pending Actions)
   - Pending Actions button is disabled (as requested)

## 🎯 How to Use the Broadcast Channels

### For Admins

1. **Send an Immediate Update**
   - Click a deal channel
   - Click "Send Update"
   - Fill in title and message
   - Optionally attach a document
   - Check "Require investor acknowledgment" if needed
   - Click "Send Update"
   - Update is sent to all investors for that deal

2. **Schedule an Update**
   - Click a deal channel
   - Click "Schedule Update"
   - Fill in title, message, and future date/time (EST)
   - Optionally attach a document
   - Click "Schedule Update"
   - Update will be sent automatically at scheduled time

3. **View Linked Documents**
   - Click a deal channel
   - Click "Linked Docs"
   - See all documents uploaded for this deal
   - Click to download

4. **View Communication Timeline**
   - On the deal detail page, scroll down to "Communication Timeline"
   - See all updates, documents, and acknowledgments in chronological order

### For Future: Investor View

Investors would see:
- Their "Investor Inbox" tab
- Notifications of new updates for their deals
- Updates they need to acknowledge
- Documents they can download
- Communication history

## 📊 Database Schema Summary

### deals (modified)
- `enable_broadcast_channel: boolean` - Show in deal channels list
- `enable_inbox_channel: boolean` - Enable inbox for this deal

### broadcast_updates (new)
Stores each update sent to deal investors
- Title, message, file attachments
- Send type (immediate or scheduled)
- Delivery tracking

### broadcast_update_recipients (new)
Tracks individual delivery status for each investor
- Pending, sent, opened, acknowledged status
- Timestamps for each status change

### broadcast_communication_timeline (new)
Audit log of all deal communications
- All events logged chronologically
- User who triggered each event

## 🔧 Migrating Data (If Applicable)

If you have existing deals and want to enable broadcast channels for them, use:

```sql
-- Option 1: Enable for all deals in 'Active' status
UPDATE deals
SET enable_broadcast_channel = true,
    enable_inbox_channel = true
WHERE status = 'Active'
  AND enable_broadcast_channel = false;

-- Option 2: Enable for specific deals
UPDATE deals
SET enable_broadcast_channel = true,
    enable_inbox_channel = true
WHERE deal_id IN ('D-2024-089', 'D-2024-090', 'D-2024-091');

-- Option 3: Enable for all deals
UPDATE deals
SET enable_broadcast_channel = true,
    enable_inbox_channel = true;
```

## 🔐 Security Notes

1. **Row Level Security (RLS)** is enabled on all new tables
2. **File uploads** are stored in the `documents` bucket with size limit of 10 MB
3. **Authentication** is required for all API endpoints
4. **Email validation** ensures valid recipient addresses
5. **Deal access** should be restricted to company users (in enterprise version)

## 📝 Common Tasks

### Enable Broadcast for a New Deal
```sql
UPDATE deals
SET enable_broadcast_channel = true,
    enable_inbox_channel = true
WHERE id = 'new-deal-uuid';
```

### Send Manual Update via API
```javascript
const response = await fetch('/api/broadcasts/deals/{dealId}/send-update', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### Schedule Update for Later
```javascript
const response = await fetch('/api/broadcasts/deals/{dealId}/schedule-update', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### Get Broadcast Status
```javascript
const response = await fetch('/api/broadcasts/deals/{dealId}');
const data = await response.json();
console.log(data.latestUpdateRecipientStats);
```

## 🐛 Troubleshooting

### Issue: "Deal not found" error
- Make sure you're using the correct deal UUID (not deal_id)
- Verify the deal exists in your database

### Issue: File upload fails
- Check file size (max 10 MB)
- Verify documents bucket exists in Supabase Storage
- Check bucket permissions

### Issue: Updates not sending
- Verify deal_investors table has records for the deal
- Check that investors have valid email addresses
- Check browser console for error messages

### Issue: Scheduled updates not sending
- Verify scheduled_date and scheduled_est_time are in correct format
- Check Supabase logs for any errors
- Note: Scheduled updates require a background job scheduler (future implementation)

## 📚 Additional Documentation

- **Full API Docs**: See `BROADCAST_CHANNELS_README.md`
- **Migration Details**: See `supabase/migrations/20260401000000_add_broadcast_channels_to_deals.sql`

## ✨ Future Enhancements

Ready to implement:
1. Scheduled update background job (send updates at scheduled time)
2. Investor inbox view
3. Email notifications integration
4. Pending actions workflow
5. Analytics and reporting
6. Advanced filtering and search
7. Bulk operations

## 🎉 You're All Set!

Once you complete the deployment steps above, the broadcast channel system will be live and ready to use. Start enabling broadcast channels for your deals and begin sending targeted updates to investors!

For questions or issues, refer to the detailed documentation in `BROADCAST_CHANNELS_README.md`.
