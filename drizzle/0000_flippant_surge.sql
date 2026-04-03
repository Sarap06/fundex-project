-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "firms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "firm_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"firm_id" uuid,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "firm_memberships_role_check" CHECK (role = ANY (ARRAY['PRIMARY_ADMIN'::text, 'ADMIN'::text, 'INVESTOR'::text]))
);
--> statement-breakpoint
ALTER TABLE "firm_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "document_categories_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "document_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_invites" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"company_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"accepted_at" timestamp with time zone,
	CONSTRAINT "email_invites_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "email_invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "document_statuses_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "document_statuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(100) NOT NULL,
	"deal_id" uuid,
	"investor_id" uuid,
	"file_url" varchar(500),
	"file_size" varchar(50),
	"file_type" varchar(50),
	"uploaded_by" varchar(255),
	"upload_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(50) NOT NULL,
	"notify_investor" boolean DEFAULT false,
	"notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_by" varchar(255),
	"company_id" uuid,
	CONSTRAINT "documents_document_id_key" UNIQUE("document_id")
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "document_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "document_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid,
	"investor_id" uuid,
	"contract_id" uuid,
	"principal_contributed" numeric,
	"ownership_percentage" numeric,
	"monthly_interest_share" numeric,
	"status" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "positions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"company_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"file_url" varchar(500),
	"file_name" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "broadcasts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid,
	"investor_id" uuid,
	"contract_id" uuid,
	"type" text,
	"amount" numeric,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ledger_transactions_type_check" CHECK (type = ANY (ARRAY['deposit'::text, 'investment'::text, 'interest_credit'::text, 'principal_credit'::text, 'withdrawal'::text, 'marketplace_sale'::text, 'marketplace_purchase'::text, 'marketplace_fee'::text, 'commission_recorded'::text]))
);
--> statement-breakpoint
ALTER TABLE "ledger_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid,
	"position_id" uuid,
	"seller_id" uuid,
	"price" numeric,
	"accrued_interest" numeric,
	"status" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "marketplace_listings_status_check" CHECK (status = ANY (ARRAY['ACTIVE'::text, 'SOLD'::text, 'CANCELLED'::text]))
);
--> statement-breakpoint
ALTER TABLE "marketplace_listings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deal_investors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"investor_id" uuid NOT NULL,
	"investor_source" varchar(50) DEFAULT 'user_profiles',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "deal_investors_deal_id_investor_id_investor_source_key" UNIQUE("deal_id","investor_id","investor_source")
);
--> statement-breakpoint
ALTER TABLE "deal_investors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "investor_surveys" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"company_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"country_code" varchar(5) DEFAULT '+1' NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"second_country_code" varchar(5),
	"second_phone_number" varchar(20),
	"completed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "investor_surveys_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "investor_surveys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'pending',
	"company_id" uuid,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_role_check" CHECK ((role)::text = ANY ((ARRAY['admin'::character varying, 'partner'::character varying, 'investor'::character varying, 'pending'::character varying])::text[])),
	CONSTRAINT "user_profiles_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_code" varchar(10) NOT NULL,
	"admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "companies_company_code_key" UNIQUE("company_code")
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "broadcast_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"update_type" varchar(50) DEFAULT 'manual' NOT NULL,
	"file_url" varchar(500),
	"file_name" varchar(255),
	"file_size" varchar(50),
	"file_type" varchar(50),
	"scheduled_date" timestamp with time zone,
	"scheduled_est_time" time,
	"is_sent" boolean DEFAULT false,
	"sent_at" timestamp with time zone,
	"require_acknowledgment" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "broadcast_updates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "join_requests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"company_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"assigned_role" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "join_requests_assigned_role_check" CHECK ((assigned_role)::text = ANY ((ARRAY['partner'::character varying, 'investor'::character varying])::text[])),
	CONSTRAINT "join_requests_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "join_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "broadcast_update_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broadcast_update_id" uuid NOT NULL,
	"investor_id" uuid NOT NULL,
	"investor_source" varchar(50) DEFAULT 'user_profiles' NOT NULL,
	"email" varchar(255) NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"acknowledgment_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "broadcast_update_recipients_broadcast_update_id_investor_id_key" UNIQUE("broadcast_update_id","investor_id","investor_source")
);
--> statement-breakpoint
ALTER TABLE "broadcast_update_recipients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"investor_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"sponsor_id" uuid,
	"allocation_amount" numeric(15, 2) NOT NULL,
	"allocation_percentage" numeric(5, 2) NOT NULL,
	"commit_date" date NOT NULL,
	"expected_funding_date" date NOT NULL,
	"annual_rate" numeric(5, 2) NOT NULL,
	"term_length" integer NOT NULL,
	"term_unit" varchar(50) DEFAULT 'months',
	"payment_frequency" varchar(50) NOT NULL,
	"payment_start_date" date NOT NULL,
	"funding_status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"notes" text,
	"monthly_interest" numeric(15, 2),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"documents" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "allocations_funding_status_check" CHECK ((funding_status)::text = ANY ((ARRAY['Funded'::character varying, 'Pending'::character varying, 'Review'::character varying])::text[])),
	CONSTRAINT "allocations_payment_frequency_check" CHECK ((payment_frequency)::text = ANY ((ARRAY['Monthly'::character varying, 'Quarterly'::character varying, 'Semi-Annual'::character varying, 'Annual'::character varying])::text[])),
	CONSTRAINT "allocations_status_check" CHECK ((status)::text = ANY ((ARRAY['confirmed'::character varying, 'pending'::character varying, 'review'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "broadcast_communication_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"broadcast_update_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"triggered_by_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "broadcast_communication_timeline" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sponsors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "investors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investor_id" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"status" varchar(50) NOT NULL,
	"sponsor_id" uuid,
	"initial_investment" numeric(15, 2) DEFAULT '0',
	"total_invested" numeric(15, 2) DEFAULT '0',
	"number_of_investments" integer DEFAULT 0,
	"average_return" numeric(5, 2),
	"notes" text,
	"tags" text[] DEFAULT '{"RAY"}',
	"onboarded_date" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"company_id" uuid,
	CONSTRAINT "investors_investor_id_key" UNIQUE("investor_id"),
	CONSTRAINT "investors_email_key" UNIQUE("email"),
	CONSTRAINT "investors_status_check" CHECK ((status)::text = ANY ((ARRAY['Active'::character varying, 'Onboarding'::character varying, 'Pending'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "investors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "deal_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "deal_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deal_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "deal_statuses_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "deal_statuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "milestone_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "milestone_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "milestone_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"location" varchar(255),
	"location_state" varchar(2),
	"location_city" varchar(100),
	"status" varchar(50) NOT NULL,
	"target_amount" numeric(15, 2),
	"raised_amount" numeric(15, 2) DEFAULT '0',
	"progress" integer DEFAULT 0,
	"investor_count" integer DEFAULT 0,
	"term" varchar(50),
	"interest_rate" numeric(5, 2),
	"close_date" date,
	"next_milestone" varchar(255),
	"milestone_type" varchar(50),
	"borrower_name" varchar(255),
	"borrower_contact" varchar(255),
	"property_address" text,
	"property_type" varchar(100),
	"loan_purpose" text,
	"documents_status" varchar(50),
	"notes" text,
	"tags" text[],
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"company_id" uuid,
	"collateral_type" varchar(100),
	"collateral_address" text,
	"estimated_property_value" numeric(15, 2),
	"loan_to_value_ratio" numeric(5, 2),
	"asset_notes" text,
	"minimum_investment" numeric(15, 2),
	"term_length_months" integer,
	"funding_close_date" date,
	"first_payout_date" date,
	"default_investor_audience" varchar(100),
	"enable_broadcast_channel" boolean DEFAULT true,
	"enable_investor_inbox" boolean DEFAULT true,
	"require_investor_acknowledgment" boolean DEFAULT false,
	"automated_investor_message" text,
	"send_automated_message" boolean DEFAULT false,
	"internal_approval_deadline" date,
	"milestone_notes" text,
	"document_status" varchar(50) DEFAULT 'Pending',
	"required_document_types" text[] DEFAULT '{"RAY['Loan Agreement'::text","'Term Sheet'::text","'Offering Memorandum'::tex"}',
	"investor_notes" text,
	CONSTRAINT "deals_deal_id_key" UNIQUE("deal_id")
);
--> statement-breakpoint
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"investor_id" uuid,
	"deal_id" uuid,
	"allocation_id" uuid,
	"user_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"investor_name" varchar(255),
	"investor_initials" varchar(5),
	"investor_avatar_color" varchar(7),
	"deal_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "activity_logs_activity_type_check" CHECK ((activity_type)::text = ANY ((ARRAY['investor_added'::character varying, 'investor_accepted'::character varying, 'investor_status_changed'::character varying, 'deal_created'::character varying, 'deal_status_changed'::character varying, 'allocation_created'::character varying, 'allocation_funded'::character varying, 'allocation_updated'::character varying, 'document_requested'::character varying, 'document_uploaded'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "firm_memberships" ADD CONSTRAINT "firm_memberships_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_memberships" ADD CONSTRAINT "firm_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_invites" ADD CONSTRAINT "email_invites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_investors" ADD CONSTRAINT "deal_investors_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_surveys" ADD CONSTRAINT "investor_surveys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_surveys" ADD CONSTRAINT "investor_surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_updates" ADD CONSTRAINT "broadcast_updates_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_update_recipients" ADD CONSTRAINT "broadcast_update_recipients_broadcast_update_id_fkey" FOREIGN KEY ("broadcast_update_id") REFERENCES "public"."broadcast_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_communication_timeline" ADD CONSTRAINT "broadcast_communication_timeline_broadcast_update_id_fkey" FOREIGN KEY ("broadcast_update_id") REFERENCES "public"."broadcast_updates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_communication_timeline" ADD CONSTRAINT "broadcast_communication_timeline_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investors" ADD CONSTRAINT "investors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investors" ADD CONSTRAINT "investors_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_invites_company_id" ON "email_invites" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_email_invites_email" ON "email_invites" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_category" ON "documents" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_company_id" ON "documents" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_company_status" ON "documents" USING btree ("company_id" uuid_ops,"status" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_deal_id" ON "documents" USING btree ("deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_document_id" ON "documents" USING btree ("document_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_investor_id" ON "documents" USING btree ("investor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_search" ON "documents" USING gin ("tags" array_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "documents" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_upload_date" ON "documents" USING btree ("upload_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcasts_company_id" ON "broadcasts" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcasts_created_at" ON "broadcasts" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_deal_investors_created_at" ON "deal_investors" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_deal_investors_deal_id" ON "deal_investors" USING btree ("deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_deal_investors_investor_id" ON "deal_investors" USING btree ("investor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_deal_investors_source" ON "deal_investors" USING btree ("investor_source" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_profiles_company_id" ON "user_profiles" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_profiles_role" ON "user_profiles" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX "idx_companies_admin_id" ON "companies" USING btree ("admin_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_companies_code" ON "companies" USING btree ("company_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_updates_admin_id" ON "broadcast_updates" USING btree ("admin_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_updates_deal_id" ON "broadcast_updates" USING btree ("deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_updates_deal_sent" ON "broadcast_updates" USING btree ("deal_id" bool_ops,"is_sent" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_updates_scheduled" ON "broadcast_updates" USING btree ("scheduled_date" timestamptz_ops,"is_sent" timestamptz_ops) WHERE (((update_type)::text = 'scheduled'::text) AND (is_sent = false));--> statement-breakpoint
CREATE INDEX "idx_join_requests_company_id" ON "join_requests" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_join_requests_status" ON "join_requests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_update_recipients_investor" ON "broadcast_update_recipients" USING btree ("investor_id" text_ops,"investor_source" text_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_update_recipients_pending" ON "broadcast_update_recipients" USING btree ("delivery_status" text_ops) WHERE ((delivery_status)::text <> 'acknowledged'::text);--> statement-breakpoint
CREATE INDEX "idx_broadcast_update_recipients_update_id" ON "broadcast_update_recipients" USING btree ("broadcast_update_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_company_deal" ON "allocations" USING btree ("company_id" uuid_ops,"deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_company_id" ON "allocations" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_company_investor" ON "allocations" USING btree ("company_id" uuid_ops,"investor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_company_status" ON "allocations" USING btree ("company_id" uuid_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_created_at" ON "allocations" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_deal_id" ON "allocations" USING btree ("deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_funding_status" ON "allocations" USING btree ("funding_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_investor_id" ON "allocations" USING btree ("investor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_allocations_status" ON "allocations" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_communication_timeline_created_at" ON "broadcast_communication_timeline" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_broadcast_communication_timeline_deal_id" ON "broadcast_communication_timeline" USING btree ("deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_investors_company_id" ON "investors" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_investors_company_status" ON "investors" USING btree ("company_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "investors_created_at_idx" ON "investors" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "investors_email_idx" ON "investors" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "investors_sponsor_id_idx" ON "investors" USING btree ("sponsor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "investors_status_idx" ON "investors" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_collateral_type" ON "deals" USING btree ("collateral_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_company_id" ON "deals" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_company_status" ON "deals" USING btree ("company_id" uuid_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_created_at" ON "deals" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_deal_id" ON "deals" USING btree ("deal_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_document_status" ON "deals" USING btree ("document_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_funding_close_date" ON "deals" USING btree ("funding_close_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_investor_acknowledgment" ON "deals" USING btree ("require_investor_acknowledgment" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_location" ON "deals" USING btree ("location_state" text_ops,"location_city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_search" ON "deals" USING gin ("tags" array_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_status" ON "deals" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_type" ON "deals" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_company_created" ON "activity_logs" USING btree ("company_id" timestamptz_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_company_id" ON "activity_logs" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_deal_id" ON "activity_logs" USING btree ("deal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_investor_id" ON "activity_logs" USING btree ("investor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_type" ON "activity_logs" USING btree ("activity_type" text_ops);--> statement-breakpoint
CREATE VIEW "public"."deal_investor_details" AS (SELECT d.id, d.deal_id, d.name, d.type, d.status, d.target_amount, d.raised_amount, d.investor_notes, count(DISTINCT di.investor_id) AS selected_investor_count, string_agg(DISTINCT COALESCE(up.full_name, inv.full_name)::text, ', '::text) AS selected_investor_names, string_agg(DISTINCT COALESCE(up.email, inv.email)::text, ', '::text) AS selected_investor_emails FROM deals d LEFT JOIN deal_investors di ON d.id = di.deal_id LEFT JOIN user_profiles up ON di.investor_id = up.id AND di.investor_source::text = 'user_profiles'::text LEFT JOIN investors inv ON di.investor_id = inv.id AND di.investor_source::text = 'investors'::text GROUP BY d.id, d.deal_id, d.name, d.type, d.status, d.target_amount, d.raised_amount, d.investor_notes);--> statement-breakpoint
CREATE POLICY "Enable read access for all users - document_categories" ON "document_categories" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow inserts for API" ON "email_invites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Admins can view company invites" ON "email_invites" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update company invites" ON "email_invites" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users - document_statuses" ON "document_statuses" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access by company" ON "documents" AS PERMISSIVE FOR SELECT TO public USING ((company_id IS NOT NULL));--> statement-breakpoint
CREATE POLICY "Enable insert by company" ON "documents" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update by company" ON "documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete by company" ON "documents" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "documents" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for all users" ON "documents" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for all users" ON "documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete for all users" ON "documents" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users - document_types" ON "document_types" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Anyone can view company broadcasts" ON "broadcasts" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Admins can create broadcasts" ON "broadcasts" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update their broadcasts" ON "broadcasts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete their broadcasts" ON "broadcasts" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "deal_investors" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for all users" ON "deal_investors" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for all users" ON "deal_investors" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete for all users" ON "deal_investors" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Investors can view their own survey" ON "investor_surveys" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Investors can insert their survey" ON "investor_surveys" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Investors can update their survey" ON "investor_surveys" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can view company investor surveys" ON "investor_surveys" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own profile" ON "user_profiles" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can insert their own profile" ON "user_profiles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Allow reading profiles for company members" ON "user_profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Anyone can view companies by code" ON "companies" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Admins can insert companies" ON "companies" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update their company" ON "companies" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all authenticated users" ON "broadcast_updates" AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "broadcast_updates" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for authenticated users" ON "broadcast_updates" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own requests" ON "join_requests" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Admins can view company requests" ON "join_requests" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can create join requests" ON "join_requests" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update company requests" ON "join_requests" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all authenticated users" ON "broadcast_update_recipients" AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "broadcast_update_recipients" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for authenticated users" ON "broadcast_update_recipients" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "allocations" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for all users" ON "allocations" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for all users" ON "allocations" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete for all users" ON "allocations" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all authenticated users" ON "broadcast_communication_timeline" AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "broadcast_communication_timeline" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Allow all to read sponsors" ON "sponsors" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow all to insert sponsors" ON "sponsors" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Allow all to update sponsors" ON "sponsors" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Allow all to read investors" ON "investors" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow all to insert investors" ON "investors" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Allow all to update investors" ON "investors" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Allow all to delete investors" ON "investors" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access by company" ON "investors" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Enable insert by company" ON "investors" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update by company" ON "investors" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete by company" ON "investors" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "investors" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for all users" ON "investors" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for all users" ON "investors" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete for all users" ON "investors" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users - deal_types" ON "deal_types" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users - deal_statuses" ON "deal_statuses" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users - milestone_types" ON "milestone_types" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access by company" ON "deals" AS PERMISSIVE FOR SELECT TO public USING ((company_id IS NOT NULL));--> statement-breakpoint
CREATE POLICY "Enable insert by company" ON "deals" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update by company" ON "deals" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete by company" ON "deals" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "deals" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for all users" ON "deals" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable update for all users" ON "deals" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable delete for all users" ON "deals" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "activity_logs" AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "activity_logs" AS PERMISSIVE FOR INSERT TO public;
*/