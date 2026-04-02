# Deal Broadcast Channels - Implementation Guide

## Overview

The broadcast channel system has been redesigned to organize communications around individual deals. Admins can now send targeted updates to investors involved in specific deals, schedule updates for future delivery, track document distribution, and monitor investor acknowledgments.

## Key Features

### 1. **Deal Channels View**
- Main screen displays all deals with broadcast channels enabled
- Shows deal name, location, and number of investors
- Quick access to deal communications

### 2. **Deal Communication Hub**
Each deal channel includes 4 main actions:

#### 📤 Send Update
- Send immediate updates to all investors in the deal
- Include title, message, and optional file attachment
- Option to require investor acknowledgment
- Automatic delivery tracking

#### 📎 Linked Documents
- View all documents uploaded during deal creation
- Quick access to download all deal documents
- Shows document type, category, and upload date

#### 📅 Schedule Update
- Schedule updates to be sent at a specific date/time (EST)
- Same functionality as Send Update but with future delivery
- Updates will be sent automatically at scheduled time
- Helps plan communications in advance

#### ⚠️ Pending Actions
- Currently non-functional (placeholder for future use)
- Will display pending investor actions and approvals

### 3. **Communication Timeline**
- Chronological view of all deal communications
- Shows update sent, documents uploaded, acknowledgments received
- Track who triggered each action and when
- Full audit trail of deal communications

### 4. **Update Status Dashboard**
Shows statistics for the latest update:
- Total updates sent to investors
- Number of opened updates
- Number of acknowledged updates
- Number still pending

## Database Schema

### New Tables

#### `broadcast_updates`
Stores updates sent to investors for specific deals.

```sql
- id: UUID (primary key)
- deal_id: UUID (foreign key to deals)
- admin_id: UUID (who sent the update)
- title: VARCHAR(255)
- message: TEXT
- update_type: VARCHAR(50) ('manual' or 'scheduled')
- file_url: VARCHAR(500) (optional)
- file_name: VARCHAR(255) (optional)
- file_size: VARCHAR(50) (optional)
- file_type: VARCHAR(50) (optional)
- scheduled_date: TIMESTAMP WITH TIME ZONE (for scheduled updates)
- scheduled_est_time: TIME (in EST timezone)
- is_sent: BOOLEAN
- sent_at: TIMESTAMP WITH TIME ZONE
- require_acknowledgment: BOOLEAN
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

#### `broadcast_update_recipients`
Tracks delivery status of each update to each investor.

```sql
- id: UUID (primary key)
- broadcast_update_id: UUID (foreign key to broadcast_updates)
- investor_id: UUID
- investor_source: VARCHAR(50) ('user_profiles' or 'investors')
- email: VARCHAR(255)
- delivery_status: VARCHAR(50) ('pending', 'sent', 'failed', 'opened', 'acknowledged')
- sent_at: TIMESTAMP WITH TIME ZONE
- opened_at: TIMESTAMP WITH TIME ZONE
- acknowledged_at: TIMESTAMP WITH TIME ZONE
- acknowledgment_notes: TEXT
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

#### `broadcast_communication_timeline`
Logs all communication events for audit trail.

```sql
- id: UUID (primary key)
- deal_id: UUID (foreign key to deals)
- broadcast_update_id: UUID (optional, foreign key to broadcast_updates)
- event_type: VARCHAR(100)
- title: VARCHAR(255)
- description: TEXT
- triggered_by_user_id: UUID
- metadata: JSONB
- created_at: TIMESTAMP WITH TIME ZONE
```

### Modified Tables

#### `deals` (added columns)
- `enable_broadcast_channel: BOOLEAN DEFAULT false`
- `enable_inbox_channel: BOOLEAN DEFAULT false`

## API Endpoints

### Get All Deal Channels
```
GET /api/broadcasts/deals?companyId={companyId}&status={status}
```
Returns all deals with broadcast channels enabled.

**Query Parameters:**
- `companyId` (required): Company ID
- `status` (optional): Filter by deal status

**Response:**
```json
{
  "deals": [
    {
      "id": "uuid",
      "deal_id": "D-2024-089",
      "name": "Downtown Austin Office Complex",
      "type": "Bridge Loan",
      "location": "Austin, TX",
      "status": "Active",
      "target_amount": 12500000,
      "raised_amount": 9200000,
      "progress": 74,
      "investor_count": 184,
      "enable_broadcast_channel": true,
      "enable_inbox_channel": true,
      "created_at": "2024-03-25T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Deal Details with Updates
```
GET /api/broadcasts/deals/{dealId}
```
Returns deal details, updates, and delivery statistics.

**Response:**
```json
{
  "deal": { /* deal object */ },
  "updates": [
    {
      "id": "uuid",
      "title": "Official Update",
      "message": "The Salamanca Bridge Loan...",
      "update_type": "manual",
      "file_url": "https://...",
      "is_sent": true,
      "sent_at": "2024-03-25T12:00:00Z",
      "require_acknowledgment": true,
      "created_at": "2024-03-25T12:00:00Z"
    }
  ],
  "investorCount": 184,
  "latestUpdateRecipientStats": {
    "total": 184,
    "acknowledged": 162,
    "opened": 178,
    "pending": 6
  }
}
```

### Send Immediate Update
```
POST /api/broadcasts/deals/{dealId}/send-update
```
Sends an immediate update to all investors in a deal.

**Request Body (multipart/form-data):**
```
- title: string (required)
- message: string (required)
- requireAcknowledgment: boolean
- file: File (optional)
```

**Response:**
```json
{
  "success": true,
  "update": { /* update object */ },
  "recipientCount": 184
}
```

### Schedule Update
```
POST /api/broadcasts/deals/{dealId}/schedule-update
```
Schedules an update to be sent at a specific date/time (EST).

**Request Body (multipart/form-data):**
```
- title: string (required)
- message: string (required)
- scheduledDate: string (required, ISO date format)
- scheduledEstTime: string (required, HH:mm format in EST)
- requireAcknowledgment: boolean
- file: File (optional)
```

**Response:**
```json
{
  "success": true,
  "update": { /* update object */ },
  "message": "Update scheduled successfully"
}
```

### Get Linked Documents
```
GET /api/broadcasts/deals/{dealId}/documents
```
Returns all documents linked to a deal.

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "Contract Agreement",
      "type": "pdf",
      "category": "legal",
      "file_url": "https://...",
      "file_size": "2.5 MB",
      "uploaded_by": "John Doe",
      "upload_date": "2024-03-20T10:00:00Z"
    }
  ],
  "count": 5
}
```

### Get Communication Timeline
```
GET /api/broadcasts/deals/{dealId}/timeline
```
Returns all communication events for a deal.

**Response:**
```json
{
  "timeline": [
    {
      "id": "uuid",
      "event_type": "update_sent",
      "title": "Official Update - Contract status...",
      "description": "The Salamanca Bridge Loan contract...",
      "triggered_by_name": "John Doe",
      "created_at": "2024-03-25T12:00:00Z"
    }
  ],
  "count": 15
}
```

### Get Acknowledgment Status
```
GET /api/broadcasts/deals/{dealId}/acknowledgments?updateId={updateId}
```
Returns acknowledgment status for all investors.

**Query Parameters:**
- `updateId` (optional): Specific update ID (defaults to latest)

**Response:**
```json
{
  "updateId": "uuid",
  "requireAcknowledgment": true,
  "recipients": [
    {
      "id": "uuid",
      "investor_name": "John Smith",
      "email": "john@example.com",
      "delivery_status": "acknowledged",
      "sent_at": "2024-03-25T12:00:00Z",
      "acknowledged_at": "2024-03-25T14:30:00Z",
      "acknowledgment_notes": "Noted"
    }
  ],
  "stats": {
    "total": 184,
    "acknowledged": 162,
    "opened": 178,
    "pending": 6
  }
}
```

## How to Enable Broadcast Channel for a Deal

To enable broadcast channels for a deal, update the `deals` table:

```sql
UPDATE deals
SET enable_broadcast_channel = true, enable_inbox_channel = true
WHERE id = 'deal-id-here';
```

Only deals with `enable_broadcast_channel = true` will appear in the Deal Channels list.

## Front-end Components

### BroadcastChannels Component
Located at: `src/components/DealBroadcastChannels.tsx`

Used in: `app/dashboard/admin/broadcast/page.tsx`

**Props:**
```typescript
interface BroadcastChannelsProps {
  companyId: string;
  userRole?: string;
  userName?: string;
  userId?: string;
}
```

**Features:**
- Displays all deal channels
- Send immediate updates
- Schedule updates
- View documents
- Timeline view
- Acknowledgment tracking

## File Upload

Updates can include file attachments which are uploaded to:
- **Supabase Storage Bucket:** `documents`
- **Path Format:** `{dealId}/{timestamp}_{filename}`
- **Max File Size:** 10 MB
- **Allowed Types:** Any (validated by file size only)

## Timeline Events

The system creates timeline entries for:
- `update_sent`: When an update is sent
- `update_scheduled`: When an update is scheduled
- `document_uploaded`: When documents are uploaded
- Custom events: Any other communication milestone

## Acknowledgment Workflow

When `require_acknowledgment` is set to `true`:
1. Recipients receive the update
2. Status is set to "sent"
3. When recipient views update, status changes to "opened"
4. Admin can collect acknowledgments
5. Status changes to "acknowledged" when investor confirms

## Error Handling

All API endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters)
- `401`: Unauthorized (not authenticated)
- `404`: Deal/Update not found
- `500`: Server error

## Future Enhancements

The "Pending Actions" button is reserved for future features such as:
- Investor action items
- Approval workflows
- Milestone tracking
- Feedback collection

## Database Considerations

- All tables have RLS (Row Level Security) enabled
- Indexes created for common queries
- Foreign keys enforce referential integrity
- Timestamps automatically managed
- Supports both `user_profiles` and `investors` table sources

## Notes

- All times for scheduled updates must be in EST timezone
- Timeline automatically populated when events occur
- Acknowledgments are optional and controlled per update
- File uploads are private and stored in documents bucket
- System supports up to 10 MB file attachments
