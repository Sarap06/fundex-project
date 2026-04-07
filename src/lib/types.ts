export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'partner' | 'investor' | 'pending';
  company_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  company_code: string;
  admin_id: string;
  created_at: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  admin_id: string;
  admin_name?: string;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  assigned_role: 'partner' | 'investor' | null;
  created_at: string;
}

export interface InvestorSurvey {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  email: string;
  country_code: string;
  phone_number: string;
  second_country_code?: string;
  second_phone_number?: string;
  region?: string;
  completed_at: string;
}

export interface FirmSurvey {
  id: string;
  user_id: string;
  company_id: string;
  firm_name: string;
  business_type: string;
  team_size: string;
  active_investors: string;
  annual_deal_volume: string;
  user_role: string;
  bank_connected: boolean;
  completed_at: string;
}

export interface Deal {
  id: string;
  deal_id: string;
  name: string;
  type: string;
  location: string;
  location_state?: string;
  location_city?: string;
  status: string;
  target_amount: number;
  raised_amount: number;
  progress: number;
  investor_count: number;
  enable_broadcast_channel: boolean;
  enable_inbox_channel: boolean;
  term?: string;
  interest_rate?: number;
  close_date?: string;
  next_milestone?: string;
  milestone_type?: string;
  borrower_name?: string;
  borrower_contact?: string;
  property_address?: string;
  property_type?: string;
  loan_purpose?: string;
  documents_status?: string;
  notes?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export interface BroadcastUpdate {
  id: string;
  deal_id: string;
  admin_id: string;
  title: string;
  message: string;
  update_type: 'manual' | 'scheduled';
  file_url?: string;
  file_name?: string;
  file_size?: string;
  file_type?: string;
  scheduled_date?: string;
  scheduled_est_time?: string;
  is_sent: boolean;
  sent_at?: string;
  require_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
}

export interface BroadcastUpdateRecipient {
  id: string;
  broadcast_update_id: string;
  investor_id: string;
  investor_source: 'user_profiles' | 'investors';
  email: string;
  delivery_status: 'pending' | 'sent' | 'failed' | 'opened' | 'acknowledged';
  sent_at?: string;
  opened_at?: string;
  acknowledged_at?: string;
  acknowledgment_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastCommunicationTimeline {
  id: string;
  deal_id: string;
  broadcast_update_id?: string;
  event_type: string;
  title: string;
  description?: string;
  triggered_by_user_id?: string;
  triggered_by_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BroadcastDocument {
  id: string;
  document_id: string;
  name: string;
  type: string;
  category: string;
  file_url: string;
  file_size: string;
  file_type: string;
  uploaded_by: string;
  upload_date: string;
}
