# Broadcast Channel Implementation - Migration Summary

This file contains the migration that needs to be applied to your Supabase database. Copy and paste this entire file into your Supabase SQL editor.

## What This Migration Includes

1. **Adds columns to deals table:**
   - `enable_broadcast_channel` - Boolean flag to show deal in broadcast channels
   - `enable_inbox_channel` - Boolean flag to enable inbox for this deal

2. **Creates broadcast_updates table:**
   - Stores updates sent to investors for specific deals
   - Supports manual and scheduled updates
   - Tracks file attachments
   - Configuration for requiring acknowledgment

3. **Creates broadcast_update_recipients table:**
   - Tracks which investors received which updates
   - Records delivery status (pending, sent, opened, acknowledged)
   - Tracks timestamps for each status

4. **Creates broadcast_communication_timeline table:**
   - Logs all communication events for a deal
   - Used to display the communication history on the deal channel page

## How to Apply

1. Go to Supabase dashboard → SQL Editor
2. Copy the entire content below (starting after this comment section)
3. Paste into a new SQL query
4. Execute the query

---

## SQL Migration

The migration is located at:
`supabase/migrations/20260401000000_add_broadcast_channels_to_deals.sql`

Copy the entire content of that file and paste it into your Supabase SQL editor.
