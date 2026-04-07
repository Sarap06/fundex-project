-- Add role column to email_invites for admin-assigned roles
ALTER TABLE email_invites ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'investor';
