import { relations } from "drizzle-orm/relations";
import { firms, firmMemberships, users, companies, emailInvites, documents, deals, investors, positions, usersInAuth, broadcasts, ledgerTransactions, marketplaceListings, dealInvestors, investorSurveys, userProfiles, broadcastUpdates, joinRequests, broadcastUpdateRecipients, allocations, sponsors, broadcastCommunicationTimeline, activityLogs } from "./schema";

export const firmMembershipsRelations = relations(firmMemberships, ({one}) => ({
	firm: one(firms, {
		fields: [firmMemberships.firmId],
		references: [firms.id]
	}),
	user: one(users, {
		fields: [firmMemberships.userId],
		references: [users.id]
	}),
}));

export const firmsRelations = relations(firms, ({many}) => ({
	firmMemberships: many(firmMemberships),
	positions: many(positions),
	ledgerTransactions: many(ledgerTransactions),
	marketplaceListings: many(marketplaceListings),
}));

export const usersRelations = relations(users, ({many}) => ({
	firmMemberships: many(firmMemberships),
	positions: many(positions),
	ledgerTransactions: many(ledgerTransactions),
	marketplaceListings: many(marketplaceListings),
}));

export const emailInvitesRelations = relations(emailInvites, ({one}) => ({
	company: one(companies, {
		fields: [emailInvites.companyId],
		references: [companies.id]
	}),
}));

export const companiesRelations = relations(companies, ({one, many}) => ({
	emailInvites: many(emailInvites),
	documents: many(documents),
	broadcasts: many(broadcasts),
	investorSurveys: many(investorSurveys),
	userProfiles: many(userProfiles),
	usersInAuth: one(usersInAuth, {
		fields: [companies.adminId],
		references: [usersInAuth.id]
	}),
	joinRequests: many(joinRequests),
	allocations: many(allocations),
	investors: many(investors),
	deals: many(deals),
	activityLogs: many(activityLogs),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	company: one(companies, {
		fields: [documents.companyId],
		references: [companies.id]
	}),
	deal: one(deals, {
		fields: [documents.dealId],
		references: [deals.id]
	}),
	investor: one(investors, {
		fields: [documents.investorId],
		references: [investors.id]
	}),
}));

export const dealsRelations = relations(deals, ({one, many}) => ({
	documents: many(documents),
	dealInvestors: many(dealInvestors),
	broadcastUpdates: many(broadcastUpdates),
	allocations: many(allocations),
	broadcastCommunicationTimelines: many(broadcastCommunicationTimeline),
	company: one(companies, {
		fields: [deals.companyId],
		references: [companies.id]
	}),
	activityLogs: many(activityLogs),
}));

export const investorsRelations = relations(investors, ({one, many}) => ({
	documents: many(documents),
	allocations: many(allocations),
	company: one(companies, {
		fields: [investors.companyId],
		references: [companies.id]
	}),
	sponsor: one(sponsors, {
		fields: [investors.sponsorId],
		references: [sponsors.id]
	}),
	activityLogs: many(activityLogs),
}));

export const positionsRelations = relations(positions, ({one, many}) => ({
	firm: one(firms, {
		fields: [positions.firmId],
		references: [firms.id]
	}),
	user: one(users, {
		fields: [positions.investorId],
		references: [users.id]
	}),
	marketplaceListings: many(marketplaceListings),
}));

export const broadcastsRelations = relations(broadcasts, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [broadcasts.adminId],
		references: [usersInAuth.id]
	}),
	company: one(companies, {
		fields: [broadcasts.companyId],
		references: [companies.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	broadcasts: many(broadcasts),
	investorSurveys: many(investorSurveys),
	userProfiles: many(userProfiles),
	companies: many(companies),
	joinRequests: many(joinRequests),
}));

export const ledgerTransactionsRelations = relations(ledgerTransactions, ({one}) => ({
	firm: one(firms, {
		fields: [ledgerTransactions.firmId],
		references: [firms.id]
	}),
	user: one(users, {
		fields: [ledgerTransactions.investorId],
		references: [users.id]
	}),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({one}) => ({
	firm: one(firms, {
		fields: [marketplaceListings.firmId],
		references: [firms.id]
	}),
	position: one(positions, {
		fields: [marketplaceListings.positionId],
		references: [positions.id]
	}),
	user: one(users, {
		fields: [marketplaceListings.sellerId],
		references: [users.id]
	}),
}));

export const dealInvestorsRelations = relations(dealInvestors, ({one}) => ({
	deal: one(deals, {
		fields: [dealInvestors.dealId],
		references: [deals.id]
	}),
}));

export const investorSurveysRelations = relations(investorSurveys, ({one}) => ({
	company: one(companies, {
		fields: [investorSurveys.companyId],
		references: [companies.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [investorSurveys.userId],
		references: [usersInAuth.id]
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({one, many}) => ({
	company: one(companies, {
		fields: [userProfiles.companyId],
		references: [companies.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [userProfiles.userId],
		references: [usersInAuth.id]
	}),
	allocations: many(allocations),
	activityLogs: many(activityLogs),
}));

export const broadcastUpdatesRelations = relations(broadcastUpdates, ({one, many}) => ({
	deal: one(deals, {
		fields: [broadcastUpdates.dealId],
		references: [deals.id]
	}),
	broadcastUpdateRecipients: many(broadcastUpdateRecipients),
	broadcastCommunicationTimelines: many(broadcastCommunicationTimeline),
}));

export const joinRequestsRelations = relations(joinRequests, ({one}) => ({
	company: one(companies, {
		fields: [joinRequests.companyId],
		references: [companies.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [joinRequests.userId],
		references: [usersInAuth.id]
	}),
}));

export const broadcastUpdateRecipientsRelations = relations(broadcastUpdateRecipients, ({one}) => ({
	broadcastUpdate: one(broadcastUpdates, {
		fields: [broadcastUpdateRecipients.broadcastUpdateId],
		references: [broadcastUpdates.id]
	}),
}));

export const allocationsRelations = relations(allocations, ({one, many}) => ({
	company: one(companies, {
		fields: [allocations.companyId],
		references: [companies.id]
	}),
	userProfile: one(userProfiles, {
		fields: [allocations.createdBy],
		references: [userProfiles.userId]
	}),
	deal: one(deals, {
		fields: [allocations.dealId],
		references: [deals.id]
	}),
	investor: one(investors, {
		fields: [allocations.investorId],
		references: [investors.id]
	}),
	sponsor: one(sponsors, {
		fields: [allocations.sponsorId],
		references: [sponsors.id]
	}),
	activityLogs: many(activityLogs),
}));

export const sponsorsRelations = relations(sponsors, ({many}) => ({
	allocations: many(allocations),
	investors: many(investors),
}));

export const broadcastCommunicationTimelineRelations = relations(broadcastCommunicationTimeline, ({one}) => ({
	broadcastUpdate: one(broadcastUpdates, {
		fields: [broadcastCommunicationTimeline.broadcastUpdateId],
		references: [broadcastUpdates.id]
	}),
	deal: one(deals, {
		fields: [broadcastCommunicationTimeline.dealId],
		references: [deals.id]
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	allocation: one(allocations, {
		fields: [activityLogs.allocationId],
		references: [allocations.id]
	}),
	company: one(companies, {
		fields: [activityLogs.companyId],
		references: [companies.id]
	}),
	deal: one(deals, {
		fields: [activityLogs.dealId],
		references: [deals.id]
	}),
	investor: one(investors, {
		fields: [activityLogs.investorId],
		references: [investors.id]
	}),
	userProfile: one(userProfiles, {
		fields: [activityLogs.userId],
		references: [userProfiles.userId]
	}),
}));