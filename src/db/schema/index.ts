import { pgTable, pgSchema, unique, uuid, text, timestamp, foreignKey, check, pgPolicy, varchar, index, boolean, numeric, time, date, integer, jsonb, pgView, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Supabase auth schema reference (not managed by us, used for FK relations)
const authSchema = pgSchema("auth");
export const usersInAuth = authSchema.table("users", {
	id: uuid().primaryKey().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_key").on(table.email),
]);

export const firms = pgTable("firms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const firmMemberships = pgTable("firm_memberships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	firmId: uuid("firm_id"),
	role: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.firmId],
			foreignColumns: [firms.id],
			name: "firm_memberships_firm_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "firm_memberships_user_id_fkey"
		}).onDelete("cascade"),
	check("firm_memberships_role_check", sql`role = ANY (ARRAY['PRIMARY_ADMIN'::text, 'ADMIN'::text, 'INVESTOR'::text])`),
]);

export const documentCategories = pgTable("document_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("document_categories_name_key").on(table.name),
	pgPolicy("Enable read access for all users - document_categories", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const emailInvites = pgTable("email_invites", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_email_invites_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_email_invites_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "email_invites_company_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow inserts for API", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("Admins can view company invites", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can update company invites", { as: "permissive", for: "update", to: ["public"] }),
	check("email_invites_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying])::text[])`),
]);

export const documentStatuses = pgTable("document_statuses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("document_statuses_name_key").on(table.name),
	pgPolicy("Enable read access for all users - document_statuses", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: varchar("document_id", { length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
	dealId: uuid("deal_id"),
	investorId: uuid("investor_id"),
	fileUrl: varchar("file_url", { length: 500 }),
	fileSize: varchar("file_size", { length: 50 }),
	fileType: varchar("file_type", { length: 50 }),
	uploadedBy: varchar("uploaded_by", { length: 255 }),
	uploadDate: timestamp("upload_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	status: varchar({ length: 50 }).notNull(),
	notifyInvestor: boolean("notify_investor").default(false),
	notes: text(),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdBy: varchar("created_by", { length: 255 }),
	companyId: uuid("company_id"),
}, (table) => [
	index("idx_documents_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_documents_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_company_status").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_deal_id").using("btree", table.dealId.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_document_id").using("btree", table.documentId.asc().nullsLast().op("text_ops")),
	index("idx_documents_investor_id").using("btree", table.investorId.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_search").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	index("idx_documents_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_documents_upload_date").using("btree", table.uploadDate.desc().nullsFirst().op("timestamp_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "documents_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "documents_deal_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.investorId],
			foreignColumns: [investors.id],
			name: "documents_investor_id_fkey"
		}).onDelete("set null"),
	unique("documents_document_id_key").on(table.documentId),
	pgPolicy("Enable read access by company", { as: "permissive", for: "select", to: ["public"], using: sql`(company_id IS NOT NULL)` }),
	pgPolicy("Enable insert by company", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update by company", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete by company", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Enable insert for all users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for all users", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete for all users", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const documentTypes = pgTable("document_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("document_types_name_key").on(table.name),
	pgPolicy("Enable read access for all users - document_types", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const positions = pgTable("positions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firmId: uuid("firm_id"),
	investorId: uuid("investor_id"),
	contractId: uuid("contract_id"),
	principalContributed: numeric("principal_contributed"),
	ownershipPercentage: numeric("ownership_percentage"),
	monthlyInterestShare: numeric("monthly_interest_share"),
	status: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.firmId],
			foreignColumns: [firms.id],
			name: "positions_firm_id_fkey"
		}),
	foreignKey({
			columns: [table.investorId],
			foreignColumns: [users.id],
			name: "positions_investor_id_fkey"
		}),
]);

export const broadcasts = pgTable("broadcasts", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	adminId: uuid("admin_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	fileUrl: varchar("file_url", { length: 500 }),
	fileName: varchar("file_name", { length: 255 }),
}, (table) => [
	index("idx_broadcasts_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_broadcasts_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [users.id],
			name: "broadcasts_admin_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "broadcasts_company_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Anyone can view company broadcasts", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Admins can create broadcasts", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can update their broadcasts", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete their broadcasts", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const ledgerTransactions = pgTable("ledger_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firmId: uuid("firm_id"),
	investorId: uuid("investor_id"),
	contractId: uuid("contract_id"),
	type: text(),
	amount: numeric(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.firmId],
			foreignColumns: [firms.id],
			name: "ledger_transactions_firm_id_fkey"
		}),
	foreignKey({
			columns: [table.investorId],
			foreignColumns: [users.id],
			name: "ledger_transactions_investor_id_fkey"
		}),
	check("ledger_transactions_type_check", sql`type = ANY (ARRAY['deposit'::text, 'investment'::text, 'interest_credit'::text, 'principal_credit'::text, 'withdrawal'::text, 'marketplace_sale'::text, 'marketplace_purchase'::text, 'marketplace_fee'::text, 'commission_recorded'::text])`),
]);

export const marketplaceListings = pgTable("marketplace_listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firmId: uuid("firm_id"),
	positionId: uuid("position_id"),
	sellerId: uuid("seller_id"),
	price: numeric(),
	accruedInterest: numeric("accrued_interest"),
	status: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.firmId],
			foreignColumns: [firms.id],
			name: "marketplace_listings_firm_id_fkey"
		}),
	foreignKey({
			columns: [table.positionId],
			foreignColumns: [positions.id],
			name: "marketplace_listings_position_id_fkey"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [users.id],
			name: "marketplace_listings_seller_id_fkey"
		}),
	check("marketplace_listings_status_check", sql`status = ANY (ARRAY['ACTIVE'::text, 'SOLD'::text, 'CANCELLED'::text])`),
]);

export const dealInvestors = pgTable("deal_investors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dealId: uuid("deal_id").notNull(),
	investorId: uuid("investor_id").notNull(),
	investorSource: varchar("investor_source", { length: 50 }).default('user_profiles'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_deal_investors_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_deal_investors_deal_id").using("btree", table.dealId.asc().nullsLast().op("uuid_ops")),
	index("idx_deal_investors_investor_id").using("btree", table.investorId.asc().nullsLast().op("uuid_ops")),
	index("idx_deal_investors_source").using("btree", table.investorSource.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "deal_investors_deal_id_fkey"
		}).onDelete("cascade"),
	unique("deal_investors_deal_id_investor_id_investor_source_key").on(table.dealId, table.investorId, table.investorSource),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Enable insert for all users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for all users", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete for all users", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const investorSurveys = pgTable("investor_surveys", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	companyId: uuid("company_id").notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	countryCode: varchar("country_code", { length: 5 }).default('+1').notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	secondCountryCode: varchar("second_country_code", { length: 5 }),
	secondPhoneNumber: varchar("second_phone_number", { length: 20 }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "investor_surveys_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "investor_surveys_user_id_fkey"
		}).onDelete("cascade"),
	unique("investor_surveys_user_id_key").on(table.userId),
	pgPolicy("Investors can view their own survey", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("Investors can insert their survey", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Investors can update their survey", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can view company investor surveys", { as: "permissive", for: "select", to: ["public"] }),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	email: varchar({ length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	role: varchar({ length: 20 }).default('pending'),
	companyId: uuid("company_id"),
	status: varchar({ length: 20 }).default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_profiles_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_profiles_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "user_profiles_company_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_profiles_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_profiles_user_id_key").on(table.userId),
	pgPolicy("Users can view their own profile", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can insert their own profile", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update their own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Allow reading profiles for company members", { as: "permissive", for: "select", to: ["public"] }),
	check("user_profiles_role_check", sql`(role)::text = ANY ((ARRAY['admin'::character varying, 'partner'::character varying, 'investor'::character varying, 'pending'::character varying])::text[])`),
	check("user_profiles_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])`),
]);

export const companies = pgTable("companies", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	companyCode: varchar("company_code", { length: 10 }).notNull(),
	adminId: uuid("admin_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_companies_admin_id").using("btree", table.adminId.asc().nullsLast().op("uuid_ops")),
	index("idx_companies_code").using("btree", table.companyCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [users.id],
			name: "companies_admin_id_fkey"
		}).onDelete("cascade"),
	unique("companies_company_code_key").on(table.companyCode),
	pgPolicy("Anyone can view companies by code", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Admins can insert companies", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can update their company", { as: "permissive", for: "update", to: ["public"] }),
]);

export const broadcastUpdates = pgTable("broadcast_updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dealId: uuid("deal_id").notNull(),
	adminId: uuid("admin_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	updateType: varchar("update_type", { length: 50 }).default('manual').notNull(),
	fileUrl: varchar("file_url", { length: 500 }),
	fileName: varchar("file_name", { length: 255 }),
	fileSize: varchar("file_size", { length: 50 }),
	fileType: varchar("file_type", { length: 50 }),
	scheduledDate: timestamp("scheduled_date", { withTimezone: true, mode: 'string' }),
	scheduledEstTime: time("scheduled_est_time"),
	isSent: boolean("is_sent").default(false),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	requireAcknowledgment: boolean("require_acknowledgment").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_broadcast_updates_admin_id").using("btree", table.adminId.asc().nullsLast().op("uuid_ops")),
	index("idx_broadcast_updates_deal_id").using("btree", table.dealId.asc().nullsLast().op("uuid_ops")),
	index("idx_broadcast_updates_deal_sent").using("btree", table.dealId.asc().nullsLast().op("bool_ops"), table.isSent.asc().nullsLast().op("bool_ops")),
	index("idx_broadcast_updates_scheduled").using("btree", table.scheduledDate.asc().nullsLast().op("timestamptz_ops"), table.isSent.asc().nullsLast().op("timestamptz_ops")).where(sql`(((update_type)::text = 'scheduled'::text) AND (is_sent = false))`),
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "broadcast_updates_deal_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Enable read access for all authenticated users", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("Enable insert for authenticated users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for authenticated users", { as: "permissive", for: "update", to: ["public"] }),
]);

export const joinRequests = pgTable("join_requests", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	companyId: uuid("company_id"),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	assignedRole: varchar("assigned_role", { length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_join_requests_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_join_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "join_requests_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "join_requests_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view their own requests", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("Admins can view company requests", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can create join requests", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can update company requests", { as: "permissive", for: "update", to: ["public"] }),
	check("join_requests_assigned_role_check", sql`(assigned_role)::text = ANY ((ARRAY['partner'::character varying, 'investor'::character varying])::text[])`),
	check("join_requests_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])`),
]);

export const broadcastUpdateRecipients = pgTable("broadcast_update_recipients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	broadcastUpdateId: uuid("broadcast_update_id").notNull(),
	investorId: uuid("investor_id").notNull(),
	investorSource: varchar("investor_source", { length: 50 }).default('user_profiles').notNull(),
	email: varchar({ length: 255 }).notNull(),
	deliveryStatus: varchar("delivery_status", { length: 50 }).default('pending').notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	openedAt: timestamp("opened_at", { withTimezone: true, mode: 'string' }),
	acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
	acknowledgmentNotes: text("acknowledgment_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_broadcast_update_recipients_investor").using("btree", table.investorId.asc().nullsLast().op("text_ops"), table.investorSource.asc().nullsLast().op("text_ops")),
	index("idx_broadcast_update_recipients_pending").using("btree", table.deliveryStatus.asc().nullsLast().op("text_ops")).where(sql`((delivery_status)::text <> 'acknowledged'::text)`),
	index("idx_broadcast_update_recipients_update_id").using("btree", table.broadcastUpdateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.broadcastUpdateId],
			foreignColumns: [broadcastUpdates.id],
			name: "broadcast_update_recipients_broadcast_update_id_fkey"
		}).onDelete("cascade"),
	unique("broadcast_update_recipients_broadcast_update_id_investor_id_key").on(table.broadcastUpdateId, table.investorId, table.investorSource),
	pgPolicy("Enable read access for all authenticated users", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("Enable insert for authenticated users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for authenticated users", { as: "permissive", for: "update", to: ["public"] }),
]);

export const allocations = pgTable("allocations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	investorId: uuid("investor_id").notNull(),
	dealId: uuid("deal_id").notNull(),
	sponsorId: uuid("sponsor_id"),
	allocationAmount: numeric("allocation_amount", { precision: 15, scale:  2 }).notNull(),
	allocationPercentage: numeric("allocation_percentage", { precision: 5, scale:  2 }).notNull(),
	commitDate: date("commit_date").notNull(),
	expectedFundingDate: date("expected_funding_date").notNull(),
	annualRate: numeric("annual_rate", { precision: 5, scale:  2 }).notNull(),
	termLength: integer("term_length").notNull(),
	termUnit: varchar("term_unit", { length: 50 }).default('months'),
	paymentFrequency: varchar("payment_frequency", { length: 50 }).notNull(),
	paymentStartDate: date("payment_start_date").notNull(),
	fundingStatus: varchar("funding_status", { length: 50 }).default('Pending').notNull(),
	notes: text(),
	monthlyInterest: numeric("monthly_interest", { precision: 15, scale:  2 }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	documents: jsonb().default({}),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_allocations_company_deal").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.dealId.asc().nullsLast().op("uuid_ops")),
	index("idx_allocations_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_allocations_company_investor").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.investorId.asc().nullsLast().op("uuid_ops")),
	index("idx_allocations_company_status").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_allocations_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_allocations_deal_id").using("btree", table.dealId.asc().nullsLast().op("uuid_ops")),
	index("idx_allocations_funding_status").using("btree", table.fundingStatus.asc().nullsLast().op("text_ops")),
	index("idx_allocations_investor_id").using("btree", table.investorId.asc().nullsLast().op("uuid_ops")),
	index("idx_allocations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "allocations_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [userProfiles.userId],
			name: "allocations_created_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "allocations_deal_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.investorId],
			foreignColumns: [investors.id],
			name: "allocations_investor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sponsorId],
			foreignColumns: [sponsors.id],
			name: "allocations_sponsor_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Enable insert for all users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for all users", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete for all users", { as: "permissive", for: "delete", to: ["public"] }),
	check("allocations_funding_status_check", sql`(funding_status)::text = ANY ((ARRAY['Funded'::character varying, 'Pending'::character varying, 'Review'::character varying])::text[])`),
	check("allocations_payment_frequency_check", sql`(payment_frequency)::text = ANY ((ARRAY['Monthly'::character varying, 'Quarterly'::character varying, 'Semi-Annual'::character varying, 'Annual'::character varying])::text[])`),
	check("allocations_status_check", sql`(status)::text = ANY ((ARRAY['confirmed'::character varying, 'pending'::character varying, 'review'::character varying])::text[])`),
]);

// Manual payout tracking. A row exists only once an admin marks a payout
// Completed or Missed — "Pending" is the absence of a row. Expected payouts are
// computed on the fly (src/services/payout-service.ts); this table persists the
// exceptions. One row per (company, investor, payroll date).
export const investorPayouts = pgTable("investor_payouts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	// references investors.id OR user_profiles.user_id (dual identity, no FK)
	investorId: uuid("investor_id").notNull(),
	investorSource: varchar("investor_source", { length: 50 }),
	dueDate: date("due_date").notNull(),
	expectedAmount: numeric("expected_amount", { precision: 15, scale: 2 }).default('0').notNull(),
	status: varchar({ length: 20 }).notNull(),
	actualAmount: numeric("actual_amount", { precision: 15, scale: 2 }),
	paidDate: date("paid_date"),
	note: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_investor_payouts_company_date").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.dueDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "investor_payouts_company_id_fkey"
		}).onDelete("cascade"),
	unique("investor_payouts_unique").on(table.companyId, table.investorId, table.dueDate),
	check("investor_payouts_status_check", sql`(status)::text = ANY ((ARRAY['completed'::character varying, 'missed'::character varying])::text[])`),
]);

export const broadcastCommunicationTimeline = pgTable("broadcast_communication_timeline", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dealId: uuid("deal_id").notNull(),
	broadcastUpdateId: uuid("broadcast_update_id"),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	triggeredByUserId: uuid("triggered_by_user_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_broadcast_communication_timeline_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_broadcast_communication_timeline_deal_id").using("btree", table.dealId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.broadcastUpdateId],
			foreignColumns: [broadcastUpdates.id],
			name: "broadcast_communication_timeline_broadcast_update_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "broadcast_communication_timeline_deal_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Enable read access for all authenticated users", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("Enable insert for authenticated users", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const sponsors = pgTable("sponsors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	company: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("Allow all to read sponsors", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Allow all to insert sponsors", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Allow all to update sponsors", { as: "permissive", for: "update", to: ["public"] }),
]);

export const investors = pgTable("investors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	investorId: varchar("investor_id", { length: 50 }).notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	status: varchar({ length: 50 }).notNull(),
	sponsorId: uuid("sponsor_id"),
	initialInvestment: numeric("initial_investment", { precision: 15, scale:  2 }).default('0'),
	totalInvested: numeric("total_invested", { precision: 15, scale:  2 }).default('0'),
	numberOfInvestments: integer("number_of_investments").default(0),
	averageReturn: numeric("average_return", { precision: 5, scale:  2 }),
	notes: text(),
	tags: text().array().default(["RAY"]),
	onboardedDate: timestamp("onboarded_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	companyId: uuid("company_id"),
}, (table) => [
	index("idx_investors_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_investors_company_status").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("investors_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("investors_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("investors_sponsor_id_idx").using("btree", table.sponsorId.asc().nullsLast().op("uuid_ops")),
	index("investors_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "investors_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sponsorId],
			foreignColumns: [sponsors.id],
			name: "investors_sponsor_id_fkey"
		}),
	unique("investors_investor_id_key").on(table.investorId),
	unique("investors_email_key").on(table.email),
	pgPolicy("Allow all to read investors", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Allow all to insert investors", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Allow all to update investors", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Allow all to delete investors", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Enable read access by company", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Enable insert by company", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update by company", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete by company", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Enable insert for all users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for all users", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete for all users", { as: "permissive", for: "delete", to: ["public"] }),
	check("investors_status_check", sql`(status)::text = ANY ((ARRAY['Active'::character varying, 'Onboarding'::character varying, 'Pending'::character varying])::text[])`),
]);

export const dealTypes = pgTable("deal_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("deal_types_name_key").on(table.name),
	pgPolicy("Enable read access for all users - deal_types", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const dealStatuses = pgTable("deal_statuses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("deal_statuses_name_key").on(table.name),
	pgPolicy("Enable read access for all users - deal_statuses", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const milestoneTypes = pgTable("milestone_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("milestone_types_name_key").on(table.name),
	pgPolicy("Enable read access for all users - milestone_types", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const deals = pgTable("deals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dealId: varchar("deal_id", { length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	location: varchar({ length: 255 }),
	locationState: varchar("location_state", { length: 2 }),
	locationCity: varchar("location_city", { length: 100 }),
	status: varchar({ length: 50 }).notNull(),
	targetAmount: numeric("target_amount", { precision: 15, scale:  2 }),
	raisedAmount: numeric("raised_amount", { precision: 15, scale:  2 }).default('0'),
	progress: integer().default(0),
	investorCount: integer("investor_count").default(0),
	term: varchar({ length: 50 }),
	interestRate: numeric("interest_rate", { precision: 5, scale:  2 }),
	closeDate: date("close_date"),
	nextMilestone: varchar("next_milestone", { length: 255 }),
	milestoneType: varchar("milestone_type", { length: 50 }),
	borrowerName: varchar("borrower_name", { length: 255 }),
	borrowerContact: varchar("borrower_contact", { length: 255 }),
	propertyAddress: text("property_address"),
	propertyType: varchar("property_type", { length: 100 }),
	loanPurpose: text("loan_purpose"),
	documentsStatus: varchar("documents_status", { length: 50 }),
	notes: text(),
	tags: text().array(),
	createdBy: varchar("created_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	companyId: uuid("company_id"),
	collateralType: varchar("collateral_type", { length: 100 }),
	collateralAddress: text("collateral_address"),
	estimatedPropertyValue: numeric("estimated_property_value", { precision: 15, scale:  2 }),
	loanToValueRatio: numeric("loan_to_value_ratio", { precision: 5, scale:  2 }),
	assetNotes: text("asset_notes"),
	minimumInvestment: numeric("minimum_investment", { precision: 15, scale:  2 }),
	termLengthMonths: integer("term_length_months"),
	fundingCloseDate: date("funding_close_date"),
	firstPayoutDate: date("first_payout_date"),
	payoutCycle: integer("payout_cycle").default(1),
	defaultInvestorAudience: varchar("default_investor_audience", { length: 100 }),
	enableBroadcastChannel: boolean("enable_broadcast_channel").default(true),
	enableInvestorInbox: boolean("enable_investor_inbox").default(true),
	requireInvestorAcknowledgment: boolean("require_investor_acknowledgment").default(false),
	automatedInvestorMessage: text("automated_investor_message"),
	sendAutomatedMessage: boolean("send_automated_message").default(false),
	internalApprovalDeadline: date("internal_approval_deadline"),
	milestoneNotes: text("milestone_notes"),
	documentStatus: varchar("document_status", { length: 50 }).default('Pending'),
	requiredDocumentTypes: text("required_document_types").array().default(["RAY['Loan Agreement'::text", "'Term Sheet'::text", "'Offering Memorandum'::tex"]),
	investorNotes: text("investor_notes"),
}, (table) => [
	index("idx_deals_collateral_type").using("btree", table.collateralType.asc().nullsLast().op("text_ops")),
	index("idx_deals_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_deals_company_status").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_deals_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_deals_deal_id").using("btree", table.dealId.asc().nullsLast().op("text_ops")),
	index("idx_deals_document_status").using("btree", table.documentStatus.asc().nullsLast().op("text_ops")),
	index("idx_deals_funding_close_date").using("btree", table.fundingCloseDate.asc().nullsLast().op("date_ops")),
	index("idx_deals_investor_acknowledgment").using("btree", table.requireInvestorAcknowledgment.asc().nullsLast().op("bool_ops")),
	index("idx_deals_location").using("btree", table.locationState.asc().nullsLast().op("text_ops"), table.locationCity.asc().nullsLast().op("text_ops")),
	index("idx_deals_search").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	index("idx_deals_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_deals_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "deals_company_id_fkey"
		}).onDelete("cascade"),
	unique("deals_deal_id_key").on(table.dealId),
	pgPolicy("Enable read access by company", { as: "permissive", for: "select", to: ["public"], using: sql`(company_id IS NOT NULL)` }),
	pgPolicy("Enable insert by company", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update by company", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete by company", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Enable insert for all users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable update for all users", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Enable delete for all users", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	activityType: varchar("activity_type", { length: 50 }).notNull(),
	investorId: uuid("investor_id"),
	dealId: uuid("deal_id"),
	allocationId: uuid("allocation_id"),
	userId: uuid("user_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	metadata: jsonb().default({}),
	investorName: varchar("investor_name", { length: 255 }),
	investorInitials: varchar("investor_initials", { length: 5 }),
	investorAvatarColor: varchar("investor_avatar_color", { length: 7 }),
	dealName: varchar("deal_name", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_activity_logs_company_created").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_activity_logs_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_activity_logs_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_activity_logs_deal_id").using("btree", table.dealId.asc().nullsLast().op("uuid_ops")),
	index("idx_activity_logs_investor_id").using("btree", table.investorId.asc().nullsLast().op("uuid_ops")),
	index("idx_activity_logs_type").using("btree", table.activityType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.allocationId],
			foreignColumns: [allocations.id],
			name: "activity_logs_allocation_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "activity_logs_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "activity_logs_deal_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.investorId],
			foreignColumns: [investors.id],
			name: "activity_logs_investor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userProfiles.userId],
			name: "activity_logs_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Enable read access for authenticated users", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("Enable insert for authenticated users", { as: "permissive", for: "insert", to: ["public"] }),
	check("activity_logs_activity_type_check", sql`(activity_type)::text = ANY ((ARRAY['investor_added'::character varying, 'investor_accepted'::character varying, 'investor_status_changed'::character varying, 'deal_created'::character varying, 'deal_status_changed'::character varying, 'allocation_created'::character varying, 'allocation_funded'::character varying, 'allocation_updated'::character varying, 'document_requested'::character varying, 'document_uploaded'::character varying])::text[])`),
]);
export const dealInvestorDetails = pgView("deal_investor_details", {	id: uuid(),
	dealId: varchar("deal_id", { length: 50 }),
	name: varchar({ length: 255 }),
	type: varchar({ length: 50 }),
	status: varchar({ length: 50 }),
	targetAmount: numeric("target_amount", { precision: 15, scale:  2 }),
	raisedAmount: numeric("raised_amount", { precision: 15, scale:  2 }),
	investorNotes: text("investor_notes"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	selectedInvestorCount: bigint("selected_investor_count", { mode: "number" }),
	selectedInvestorNames: text("selected_investor_names"),
	selectedInvestorEmails: text("selected_investor_emails"),
}).as(sql`SELECT d.id, d.deal_id, d.name, d.type, d.status, d.target_amount, d.raised_amount, d.investor_notes, count(DISTINCT di.investor_id) AS selected_investor_count, string_agg(DISTINCT COALESCE(up.full_name, inv.full_name)::text, ', '::text) AS selected_investor_names, string_agg(DISTINCT COALESCE(up.email, inv.email)::text, ', '::text) AS selected_investor_emails FROM deals d LEFT JOIN deal_investors di ON d.id = di.deal_id LEFT JOIN user_profiles up ON di.investor_id = up.id AND di.investor_source::text = 'user_profiles'::text LEFT JOIN investors inv ON di.investor_id = inv.id AND di.investor_source::text = 'investors'::text GROUP BY d.id, d.deal_id, d.name, d.type, d.status, d.target_amount, d.raised_amount, d.investor_notes`);