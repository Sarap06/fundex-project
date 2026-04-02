# Activity Logging System

The activity logging system now automatically tracks key events in your Fundex application and displays them in real-time on the Recent Activity section of the admin dashboard.

## What's Being Tracked

### Current Activities

1. **Investor Events**
   - `investor_added` - When a new investor is onboarded
   - `investor_accepted` - When an investor status changes to "Active"
   - `investor_status_changed` - When investor status is updated (e.g., Onboarding → Pending)

2. **Deal Events**
   - `deal_created` - When a new deal is created
   - `deal_status_changed` - When deal status is updated (e.g., Funding → Active)

3. **Allocation Events**
   - `allocation_created` - When an investor allocates capital to a deal
   - `allocation_funded` - (Ready to implement) When an allocation funding status changes

## How It Works

### Database Schema

A new `activity_logs` table stores all activities with the following key fields:
- `activity_type` - Type of activity (enumerated values)
- `investor_id`, `deal_id`, `allocation_id` - Links to related entities
- `title` - Short description (e.g., "Sarah Johnson has been added")
- `description` - More detailed description
- `investor_name`, `investor_initials`, `investor_avatar_color` - Denormalized for display
- `deal_name` - Denormalized deal name
- `metadata` - JSON object for any additional context
- `created_at` - Timestamp

### API Endpoints

1. **Log Activity** - `POST /api/activities/log`
   ```json
   {
     "companyId": "uuid",
     "activityType": "investor_added",
     "title": "String",
     "description": "String",
     "investorId": "uuid",
     "investorName": "String",
     "dealId": "uuid",
     "dealName": "String",
     "allocationId": "uuid",
     "userId": "uuid",
     "metadata": {}
   }
   ```

2. **Get Recent Activities** - `GET /api/activities/recent?companyId=uuid&limit=10`
   - Returns last N activities for a company

### Integration Points

Activities are automatically logged in these API endpoints:

1. **`POST /src/app/api/investors/route.ts`** - When investor created
2. **`PATCH /src/app/api/investors/route.ts`** - When investor status changes
3. **`POST /src/app/api/deals/route.ts`** - When deal created
4. **`PATCH /src/app/api/deals/route.ts`** - When deal status changes
5. **`POST /app/api/allocations/create/route.ts`** - When allocation created

## How to Extend

### Add More Activity Types

1. Update the `activity_type` enum in the migration:
   ```sql
   -- In 20260402000000_create_activity_logs_table.sql
   activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
     'investor_added',
     'your_new_type',
     ...
   ))
   ```

2. Add logging to the relevant API endpoint:
   ```typescript
   await logActivity({
     companyId,
     activityType: 'your_new_type',
     title: 'A descriptive title',
     description: 'More details about what happened',
     // ... other fields
   });
   ```

### Log Activities from Frontend

You can log activities directly from the frontend using the helper function:

```typescript
import { logActivity } from '@/lib/activity-logger';

await logActivity({
  companyId: 'your-company-id',
  activityType: 'custom_event',
  title: 'Something happened',
  description: 'Description of what happened',
  investorName: 'Investor name if applicable',
  dealName: 'Deal name if applicable',
  metadata: { /* any additional data */ },
});
```

### Real-time Updates (Optional)

Currently, activities are fetched when the dashboard loads. To enable real-time updates:

1. Set up Supabase Realtime subscriptions in the dashboard component
2. Listen to changes on the `activity_logs` table
3. Update the `recentActivities` state when new activities are detected

Example:
```typescript
useEffect(() => {
  if (!company?.id) return;

  const channel = supabase
    .channel('activities')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: `company_id=eq.${company.id}`,
      },
      (payload) => {
        // Add new activity to the top of the list
        setRecentActivities(prev => [transformActivity(payload.new), ...prev]);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [company?.id]);
```

## Display on UI

Recent activities are displayed in the admin dashboard with:
- User avatar (initials + colored background)
- Activity title and description
- Deal name (in teal color)
- Time relative to now (e.g., "2h ago")

The component handles empty states gracefully - if no activities exist, the Recent Activity card will be empty.

## Migration Steps

To use this system in your database:

1. Run the migration:
   ```bash
   supabase migration up
   ```
   Or apply the SQL from `supabase/migrations/20260402000000_create_activity_logs_table.sql`

2. Ensure all API endpoints are updated (they already are)

3. Restart your dev server:
   ```bash
   npm run dev
   ```

4. Test by creating a new investor or deal - it should appear in Recent Activity

## Files Modified

- [supabase/migrations/20260402000000_create_activity_logs_table.sql](supabase/migrations/20260402000000_create_activity_logs_table.sql) - Database schema
- [app/api/activities/log/route.ts](app/api/activities/log/route.ts) - Activity logging endpoint
- [app/api/activities/recent/route.ts](app/api/activities/recent/route.ts) - Get recent activities endpoint
- [src/lib/activity-logger.ts](src/lib/activity-logger.ts) - Frontend helper
- [app/dashboard/admin/page.tsx](app/dashboard/admin/page.tsx) - Dashboard component (updated to fetch real data)
- [src/app/api/investors/route.ts](src/app/api/investors/route.ts) - Log investor activities
- [src/app/api/deals/route.ts](src/app/api/deals/route.ts) - Log deal activities
- [app/api/allocations/create/route.ts](app/api/allocations/create/route.ts) - Log allocation activities
