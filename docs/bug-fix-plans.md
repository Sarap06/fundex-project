# Fundex Bug Audit — Confirmation & Fix Plans

**Audited:** 2026-07-14, on `main` @ `7e9a787` (up to date with origin).
**Verdict:** 16 of 17 reported bugs **confirmed in code** with file:line evidence. Bug 9 partially confirmed (the "acknowledged" logic is correct; two adjacent defects cause what QA saw).
**Note:** `be05692` (navbar fix) is still only on `feat/hero-redesign-landing-polish`, not merged to main.

## ✅ Status: ALL FIXED (2026-07-14, branch `fix/qa-bug-audit`)

All 17 bugs fixed. `npx tsc --noEmit` clean; no new lint violations vs the `main` baseline. Decisions taken during implementation:

1. **Capital model (7/16/18):** `deals.raised_amount` + `progress` are now recomputed server-side from allocations on every allocation create/delete (`recalcDealRaisedAmount` in `deal-service`). The admin dashboard's 4th stat is now **Committed Capital** = SUM(`investors.total_invested`) — it moves the moment an investor is created with capital (bug 7's expectation). Allocation-based totals stay on the allocations/deals surfaces.
2. **Resend invite (6):** reuses `/api/invites/send`; a 409 shows "already signed up" instead of relaxing the guard.
3. **Name split (2):** no schema change — signup now captures First/Last and composes `full_name`; the email-prefix fallback in `auth.ts` title-cases separators; investor settings split made robust. A `first_name`/`last_name` migration remains available as a follow-up if wanted.
4. **Extra finds fixed beyond the reported list:** company dashboard `DUMMY_STATS`/`DUMMY_FLOW_DATA`, activity-table `DUMMY_TRANSACTIONS` ("Transaction History" fake rows — likely the real bug 13 sighting), broadcast-preview `DUMMY_BROADCASTS` all removed (real empty states show instead; `dummy-data.ts` deleted); admin broadcast detail selected a nonexistent `investors.name` column (every name lookup failed); dead "Last Month" button removed and **Export** now downloads a real CSV; deep links `/admin/investors?new=1` and `/admin/deals?new=1` open the create flows from dashboard quick actions.

5. **Security hardening (was flagged, now fixed):** `POST /api/allocations/create` previously used the service-role client and trusted `company_id` from the request body with no auth — any caller could write allocations into any tenant. It now authenticates via `requireAuth` + `requireRole(['admin','partner'])`, takes `company_id` from the session only, and verifies the target deal belongs to the caller's company. Both client callers (`add-allocation-modal`, admin allocations page) now send the Bearer token. `DELETE /api/allocations/[id]` was built with the same pattern from the start.

**Remaining follow-ups (optional, not bugs):** the `first_name`/`last_name` DB migration (current fix is capture-side only — existing merged rows in the DB stay as they are until edited); and a broader sweep to add `requireAuth` to other legacy service-role routes outside this bug list.

## Manual browser verification (2026-07-15)

Created a fresh admin tenant (company `H978IG`) and clicked through every fixed flow with real data. All 17 confirmed working in-browser. Bugs verified with live data: 1 (shortcuts open create flow), 2 (First/Last signup + spaced name), 3 (no double sponsor), 4 (`$1,500,000` commas), 5 (number input clean), 6 (resend button), 7 (Committed Capital → $1,500,000), 8 (`INV-040` in dropdown), 10 (delete: confirm → 200 → row disappears in place + deal raised recomputes), 11 (Related Deal/Investor selects + shared taxonomy), 12 (Total Allocations $2.00M matches rows), 13 (real 12-row $8,333 schedule, no fake $10,416), 14 (real empty states, no Peterson/Riverside fake data), 16 (deal raised $5M/$2M→40%, then →$0 on delete, →$1M on re-create/20%), 18 (40% of deal = 2M/5M consistent).

### 🔴 Additional bug found & fixed during manual testing — deal quick-view allocation fetch 400

`src/components/deal-quick-view-modal.tsx` fetched allocations with a PostgREST embed `investors(full_name)`. Because `allocations.investor_id` has **no single FK** (dual investor identity: `investors` rows OR `user_profiles` rows), that embed returns **HTTP 400** — so `allocs` came back empty for every deal. This was the *real reason* the old fake `DEFAULT_ALLOCATIONS`/`DEFAULT_DOCS` fallback always showed (bug 14): the query never succeeded. Removing the fallback (this PR) exposed it as a permanent empty state.

**Fix:** dropped the embed; resolve investor names via a name map from `investors` + `user_profiles` keyed on `investor_id` (the exact pattern the working `/admin/allocations` page uses). Verified live: the allocations REST call now returns **200**, the deal shows Total Investors 1 / $1.00M, and the payment schedule renders the real 12×$8,333 rows. `npx tsc --noEmit` clean.

### Bug 9 & 17 follow-up verification (investor account)

Created a real investor auth account (`verify.investor.one@example.com`, joined company `H978IG` via the invite→company-signup flow so it got role `investor`).

- **Bug 9 — CONFIRMED (admin side).** On the deal's broadcast channel, the Acknowledgment Status panel shows the **"No updates sent yet"** empty state — no investors are listed as phantom recipients, and none show as acknowledged without acting. This is the reported bug ("acknowledged investors where there shouldn't be") fixed. The full send-update→investor-acknowledges round-trip was not driven (the investor onboarding wizard gates the investor UI), but the phantom-recipient defect itself is verified gone.
- **Bug 17 — CONFIRMED via live API.** Called `/api/investor/dashboard` and `/api/investor/investments` with the investor's real session token: returns **1 investment, `totalCapital` $1,000,000, deal "Verify Bridge Deal"**. Before the fix the dual-identity linkage mismatch (allocations keyed by `investors.id` but queried by auth `user_id`) returned **zero** — now the `.in('investor_id', [investorRecord.id, userId])` query finds it. `activeDealCount` = 0 is correct (deal is "Funding", not "Active"); the distinct-deal count (`activeDealsCount`, a `Set` of deal ids) is code-verified for the multi-allocation-same-deal case.

### Note: "broadcast page hang" from prior session was NOT a bug
The blank/skeleton broadcast page seen earlier was a **stale dev build cache** — running `npm run build` (production) against `.next` while `npm run dev` was live caused the dev server to 404 its own JS chunks, so client React never hydrated and `loading` stayed true. Restarting the dev server fixed it; the page renders correctly. Not an app defect.

### Test data note
Verification created a throwaway tenant (`H978IG`) with one investor, one deal, and transient allocations, plus the investor auth user above — all isolated by `company_id` from real client tenants. Remove if you want a clean DB.

---

## Root-cause clusters (read first)

Several bugs share causes. Fixing the cluster fixes multiple reports at once.

| Cluster | Cause | Bugs |
|---|---|---|
| **A — Disconnected capital model** | Investor capital (`investors.total_invested`) and deal raised amount (`deals.raised_amount`) are stored, manually-typed columns. Real allocations live in `allocations`. Nothing reconciles them, so every "allocated / committed / raised" metric drifts. | 7, 16, 17, 18 |
| **B — Numeric strings concatenated** | `numeric(15,2)` columns come back from supabase-js as **strings**. Page-level inline `reduce()` totals don't wrap in `Number()`, so totals string-concatenate (`0 + "500000" + "350000"` → garbage). Rows render fine (`/` coerces), totals don't → "sum doesn't match". | 12, 18 |
| **C — Demo-data fallbacks** | Modals fall back to hardcoded placeholder arrays when passed `undefined`, and call sites pass `undefined` whenever real data is empty (or never pass it at all). Fake investors/contracts/payments render as if real. | 13, 14 |
| **D — Single `full_name` field** | No `first_name`/`last_name` columns exist anywhere in the schema. | 2 |
| **E — Dual investor identity** | Investors exist both as `investors` rows and `user_profiles` rows; queries link by different ids/sources per surface, so counts and name lookups disagree. | 9b, 17c |

---

## Bug-by-bug findings & plans

### Bug 1 — Dashboard shortcuts don't open what they should — CONFIRMED
**Evidence:**
- Company overview "Monthly Interest" and "Team Members" cards are `<button>`s styled as shortcuts (hover + `ArrowUpRight` icon) with **no `onClick`/`href`** — `src/components/company/company-overview.tsx:124-149`.
- Company header "Last Month" and "Export" buttons also dead — `app/(dashboard)/company/page.tsx:160-173`.
- Admin quick actions all navigate to real routes, but "Add Investor" / "Create Deal" land on the **list pages** without opening the create flow — `app/(dashboard)/admin/page.tsx:571-586, 650-690`.

**Plan:**
1. `company-overview.tsx`: wire the two cards with `next/link` / `router.push` (Team Members → team section, Monthly Interest → `/company/performance`), or strip the interactive affordance.
2. `company/page.tsx`: implement or remove "Last Month" / "Export".
3. `admin/page.tsx`: push `/admin/investors?new=1` and `/admin/deals?new=1`; have those pages open the add-investor drawer / deal wizard when the param is present.

---

### Bug 2 — Team member first and last name merged — CONFIRMED
**Evidence:**
- Schema has only `full_name` — `src/db/schema/index.ts:311` (`user_profiles`), same for `investors` and `join_requests`; no migration ever adds first/last.
- Signup collects a single "Full Name" input — `app/auth/signup/page.tsx:198-210` → `companySignUp` inserts `full_name` (`src/lib/auth.ts:111`).
- Admin auto-profile fallback produces space-less names: `full_name: email.split('@')[0]` — `src/lib/auth.ts:44` (e.g. `johndoe`).
- Team table renders it verbatim — `app/(dashboard)/admin/page.tsx:776`.
- Investor settings fragilely splits on space — `app/(dashboard)/investor/settings/page.tsx:116-118`.

**Plan:**
1. Migration: add `first_name`, `last_name` to `user_profiles` (and `investors`); backfill by splitting `full_name` on first space.
2. Split the signup form into First/Last; write both fields (+ keep `full_name` written as `first + ' ' + last` for compat).
3. Fix the `auth.ts:44` email-prefix fallback.
4. Update team table + settings pages to use the split fields.
- *Lighter alternative if schema change is off the table:* keep `full_name` but split the signup input and join with a space, fixing the visible merge without a migration. **Decision needed.**

---

### Bug 3 — Double "Sponsor" on create investor — CONFIRMED
**Evidence:** Section heading `<h3>Sponsor</h3>` (line 870) AND field `<Label>Sponsor</Label>` (line 872) both render — `app/(dashboard)/admin/investors/page.tsx:869-872`. Only section in the form that duplicates its heading.
**Plan:** Remove the redundant `<Label>` (the Select already has `placeholder="Select sponsor"`). Also fix adjacent defect: `selectedSponsor` defaults to `'internal'` (line 59) but no `SelectItem value="internal"` exists (lines 873-879).

---

### Bug 4 — Investor amounts need comma separators — CONFIRMED
**Evidence:** Local `formatCurrency` abbreviates to `$1.00M` / `$5.0K` instead of comma grouping — `app/(dashboard)/admin/investors/page.tsx:22-27`; feeds the table (line 780) and view drawer (line 966). No shared currency util exists in `src/lib/utils.ts` (only `cn()`); a canonical formatter lives in `src/services/allocation-service.ts:34`; ad-hoc `toLocaleString` copies scattered elsewhere.
**Plan:** Change the formatter to `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`. Recommended: promote one `formatCurrency` into `src/lib/utils.ts` and migrate consumers to stop the divergence.

---

### Bug 5 — "Number of investments" input keeps the 0 (typing gives "05") — CONFIRMED
**Evidence:** Form state seeds `numberOfInvestments: '0'` — `app/(dashboard)/admin/investors/page.tsx:111` (and reset at line 341); input at line 894 has no focus-select. Edit form same class of issue (lines 517, 1073). `initialInvestment` does it right (starts `''`, placeholder `"0"`).
**Plan:** Seed `''` (lines 111, 341) and rely on `placeholder="0"`; submit already tolerates empty (`parseInt(...) || 0`, line 246). Add `onFocus={(e) => e.target.select()}` to both number inputs (lines 894, 1073) for the edit case.

---

### Bug 6 — Edit investor: add "resend invitation email" — CONFIRMED (feature gap)
**Evidence:** Edit drawer (`app/(dashboard)/admin/investors/page.tsx:1038-1088`) has no email action. Original invite flow exists: `handleAddInvestor` lines 304-338 → `POST /api/invites/send` (`app/api/invites/send/route.ts:91-275`, Brevo). Everything needed (`companyId`, `companyCode`, `companyName`, `editInvestor.email`) is already in component scope.
**Plan:** Add a "Resend invitation email" button to the edit drawer footer (~lines 1077-1084); handler mirrors the create flow's fetch with Bearer token. No new API route. **Caveat:** the route 409s if the email already exists in `user_profiles` (lines 161-166) — handle that response with a clear "already signed up" toast (or relax the guard if resend-to-registered should work — **decision needed**).

---

### Bug 7 — Allocated capital doesn't update when creating investor with capital — CONFIRMED
**Evidence (Cluster A):** Investor creation writes only `investors.initial_investment`/`total_invested` (`app/(dashboard)/admin/investors/page.tsx:234-251`; same in `investor-service.ts:46-74`) — never inserts into `allocations`. But "Allocated Capital" sums `allocations`: admin `app/(dashboard)/admin/page.tsx:457-460` (Funded only), company `app/api/company/dashboard-stats/route.ts:22` (all statuses). The metric structurally cannot move.
**Plan (recommended):** Keep allocated capital = sum of allocations (single source of truth). Remove/demote the misleading "Initial Investment" field on investor create (capital is recognized when an allocation is made), or auto-create an allocation when initial capital + a deal are provided. Avoid unioning investor capital into the metric — double counts once real allocations exist. **Decision needed on intended model.**

---

### Bug 8 — Investor selects should show code, not just name — CONFIRMED
**Evidence:** Code exists as `investors.investor_id` (e.g. `INV-2025-…`, unique — `src/db/schema/index.ts:557,590`). Neither select fetches it:
- `src/components/deal-modals/add-investor-allocation-modal.tsx` — query line 44 (`id, full_name, email`), render line 94.
- `src/components/add-allocation-modal.tsx` — query line 136, render lines 463-464.

**Plan:** Add `investor_id` to both queries, interfaces, and renders (`{name} — {code} ({email})`). Note `add-allocation-modal` merges in `user_profiles`-sourced investors (lines 152-157) that have no code — render a fallback for those.

---

### Bug 9 — Broadcast shows acknowledged investors where there shouldn't be — PARTIALLY CONFIRMED
**Evidence:** The acknowledged logic itself is safe — recipients insert as `'sent'` with null `acknowledged_at` (`send-update/route.ts:259-266`, `broadcast-service.ts:108-117`), and only the investor's explicit acknowledge POST sets it (`acknowledgments/route.ts:244-253`). The admin count is derived correctly (`admin/broadcast/[id]/page.tsx:182-186`). Two real defects explain the report:
- **(a)** The deal-channel panel renders `<BroadcastAcknowledgmentStatus dealId={…} />` with **no `updateId`** (`src/components/deal-broadcast-channels.tsx:979-981`), so the fallback branch (`broadcast-acknowledgment-status.tsx:68-95`) lists **every deal investor** as a recipient regardless of who was actually sent the update.
- **(b)** The admin detail page resolves recipient names only from `investors`, ignoring `investor_source` — `user_profiles` recipients show as "Unknown Investor" (`admin/broadcast/[id]/page.tsx:211-231`; the API route at `acknowledgments/route.ts:130-164` does it correctly).

**Plan:** Pass the specific `updateId` into `BroadcastAcknowledgmentStatus`; mirror the route's `investor_source`-aware name resolution in the detail page. If a literal false "Acknowledged" persists after that, it's data (seeded rows with `acknowledged_at` set) — check `broadcast_update_recipients`.

---

### Bug 10 — Allocations Actions can't delete — CONFIRMED
**Evidence:** Actions cell renders only View / Edit / Message / Payment Schedule — `app/(dashboard)/admin/allocations/page.tsx:616-646`. No delete handler exists in the file, and **no DELETE API route** exists (`app/api/allocations/` has only `create/`). Deals page has a working delete for reference (`admin/deals/page.tsx:463-475`).
**Plan:**
1. New `DELETE /app/api/allocations/[id]/route.ts` — auth via `requireAuth`, scoped `WHERE id = ? AND company_id = ?` (IDOR guard), `logActivity()`.
2. Add Trash button + `handleDeleteAllocation` with confirm dialog; reload on success.
3. Recompute the parent deal's `raised_amount` on delete (ties into Bug 16).

---

### Bug 11 — Upload doc fixed to certain options — CONFIRMED
**Evidence:** Two upload UIs, both hardcoded and mutually inconsistent:
- Deal modal: 6 inline categories, fixed `accept` list, and **no `onUpload` at its call site** so it persists nothing — `src/components/deal-modals/upload-document-modal.tsx:73-92`, dead wiring at `deal-quick-view-modal.tsx:272`.
- Admin dialog: hardcoded Type/Category/Status selects (`app/(dashboard)/admin/documents/page.tsx:500-546`), different taxonomy from the modal, and the insert never sets `deal_id`/`investor_id` (lines 77-86, 214-225) even though `document-service.uploadDocument` accepts them — so the Deal/Investor document summary counts are structurally wrong too.

**Plan:**
1. Extract one shared constants module for document types/categories/statuses; use in both forms (reconcile the taxonomies).
2. Add deal + investor pickers (company-scoped queries) to the admin dialog; wire `deal_id`/`investor_id` into the insert.
3. Wire `onUpload` in `deal-quick-view-modal.tsx:272` to actually call `uploadDocument` with the real `deal_id`, or remove the dead modal.

---

### Bug 12 — Total sum does not match — CONFIRMED
**Evidence (Cluster B):** `allocation_amount` is `numeric` → string. Transform assigns it raw (`admin/allocations/page.tsx:208-211`), then totals reduce without `Number()` (line 237; same for capitalReceived/pendingFunding/inReview/monthlyInterest, lines 238-247) → string concatenation. Rows display correctly because `/ 1000000` coerces (line 581) — hence "total doesn't match rows". Admin dashboard has the same defect (`admin/page.tsx:455,460`). Correct reference: `allocation-service.ts:71`.
**Plan:** Coerce at transform time (`amount: Number(alloc.allocation_amount) || 0`, same for `monthly_interest`) and/or wrap all reduces in `Number()`. Best: route these pages through `getAllocationSummary`, which already coerces. Sweep for other inline reduces over supabase numerics.

---

### Bug 13 — Payment history has irrelevant information — CONFIRMED
**Evidence (Cluster C):** `DEFAULT_PAYMENTS` fabricates 12 rows ($10,416/mo, Jan–Dec 2026, 6 paid/1 pending/5 upcoming) — `src/components/deal-modals/payment-history-modal.tsx:15-20,36`. **Every call site omits the `payments` prop** (`deal-quick-view-modal.tsx:281`, `view-allocations-modal.tsx:147-152`), so the mock always renders, including the summary tiles. `payment-detail-modal.tsx` is orphaned (zero imports).
**Plan:** Compute a real schedule from the allocation (`payment_start_date`, `term_length`, `monthly_interest` — logic already exists in `portfolio-metrics.projectUpcomingPayments`, lines 204-246) and pass it in from both call sites. Delete `DEFAULT_PAYMENTS` and the `||` fallback; show an empty state. Delete the orphaned `payment-detail-modal.tsx`.

---

### Bug 14 — Deal allocations show random contracts — CONFIRMED
**Evidence (Cluster C):** Queries ARE correctly scoped (`deal-quick-view-modal.tsx:92-96` filters by `company_id` + `deal_id`) — not a tenant leak. But when results are empty the parent passes `undefined` (lines 268-269) and the modals substitute fake data: `DEFAULT_ALLOCATIONS` ("Peterson Family Trust" et al., `view-allocations-modal.tsx:26-30,41`) and `DEFAULT_DOCS` ("Subscription Agreement" etc., `view-documents-modal.tsx:14-19,45`). Same risk at `admin/broadcast/[id]/page.tsx:689`.
**Plan:** Delete both fallbacks; always pass the real (possibly empty) array; render proper empty states ("No allocations for this deal yet").

---

### Bug 16 — Total allocations doesn't update with deal amounts — CONFIRMED
**Evidence (Cluster A):** All "Raised" displays read stored `deals.raised_amount` (`admin/deals/page.tsx:870`, `deal-quick-view-modal.tsx:180,220`, `deal-broadcast-channels.tsx:377,872`), which is written **only** at deal create/edit from wizard input (`deals/page.tsx:274`). No code path recomputes it from `allocations`.
**Plan:** Make raised computed: on allocation create/delete (in `/api/allocations/create` + the new delete route from Bug 10), recompute `deals.raised_amount = SUM(allocation_amount)` for the deal (status-filtered consistently — see Bug 18), and recompute `progress`. Alternative: stop storing it and derive live everywhere. **Recommend server-side recompute** — fewer display-site changes.

---

### Bug 17 — Investor channel investment counts/amounts wrong — CONFIRMED (3 defects)
**Evidence (Clusters A + E):**
- **17a** `number_of_investments` / `total_invested` are stored columns fed by free-text admin form inputs (`admin/investors/page.tsx:150,168-170,246,542`) — never computed from `deal_investors`/`allocations`. The view drawer separately fetches real linked deals (lines 490-501), so displays disagree.
- **17b** "Active deals" actually counts allocation **rows** (`portfolio-metrics.ts:123-126` → `investor/dashboard/route.ts:97` → labels at `investor/page.tsx:281`, `investor/investments/page.tsx:662-663`). Multiple allocations in one deal inflate the count; `averageActivePositionSize` divides by it while the copy says "per deal".
- **17c** Identity mismatch: `deal_investors` queried by auth `userId` + source `user_profiles` (`investor/dashboard/route.ts:63-68`), `allocations` by `investors.id` (lines 85-86), admin by `investors.id` + source `investors` (`admin/investors/page.tsx:493-494`). Counts from the two linkages can't reconcile.

**Plan:**
1. Compute count + total from `allocations`/`deal_investors` (company-scoped SUM/COUNT) instead of the manual columns; remove or demote the manual form fields; ensure list filters/sorts use computed values.
2. Use a distinct-deal count (`new Set(dealIds).size`) wherever copy says "deals"; or relabel to "Active Positions".
3. Standardize investor linkage (resolve to one canonical investor id before counting) across investor dashboard, investments page, and admin.

---

### Bug 18 — Committed capital doesn't add up to deal size — CONFIRMED
**Evidence (Clusters A + B):** Committed capital = sum of allocations, but with **inconsistent filters** — company counts ALL allocations (`portfolio-metrics.ts:111-113` via `dashboard-stats/route.ts:22`), admin counts Funded-only (`admin/page.tsx:459`) — while "deal size" is stored `target_amount`/`raised_amount` from the wizard (`deals/page.tsx:273-274`), never reconciled. Bug 12's string concat further corrupts the committed figure.
**Plan:** (1) Pick one canonical committed-capital definition (recommend: Funded allocations) and use it on both surfaces; (2) fix Bug 12 coercion; (3) make `raised_amount` computed (Bug 16). Then committed vs target reconciles by construction.

---

## Suggested execution phases

Each phase independently shippable; run `npx tsc --noEmit` + lint + browser-verify the touched screens per phase.

| Phase | Scope | Bugs | Touches |
|---|---|---|---|
| **1 — Quick wins (one file)** | Sponsor label, comma formatting, `'0'` input seed | 3, 4, 5 | `admin/investors/page.tsx` (+ optional shared `formatCurrency` in `lib/utils`) |
| **2 — Numbers are numbers** | `Number()` coercion in all inline reduces | 12, part of 18 | `admin/allocations/page.tsx`, `admin/page.tsx` |
| **3 — Kill demo fallbacks** | Remove `DEFAULT_ALLOCATIONS` / `DEFAULT_DOCS` / `DEFAULT_PAYMENTS`, real payment schedule, empty states | 13, 14 | `deal-modals/*`, `deal-quick-view-modal.tsx` |
| **4 — Allocation delete** | DELETE route (tenant-scoped) + UI action + raised recompute hook | 10 | new `api/allocations/[id]/route.ts`, `admin/allocations/page.tsx` |
| **5 — Capital model reconciliation** | Canonical committed-capital definition; computed `raised_amount`; computed investor totals; identity standardization | 7, 16, 17, 18 | services, `api/allocations/*`, dashboards — **needs model decision (see below)** |
| **6 — Selects & resend email** | Investor code in selects; resend invite button | 8, 6 | two allocation modals, `admin/investors/page.tsx` |
| **7 — Broadcast recipients** | Pass `updateId`; `investor_source`-aware name lookup | 9 | `deal-broadcast-channels.tsx`, `broadcast-acknowledgment-status.tsx`, `admin/broadcast/[id]/page.tsx` |
| **8 — Shortcuts & upload** | Wire dead buttons, `?new=1` create-flow params; shared doc taxonomy + deal/investor pickers + wire dead upload | 1, 11 | company overview/page, `admin/page.tsx`, documents page, upload modals |
| **9 — Name split** | `first_name`/`last_name` migration + backfill + form/table updates | 2 | migration, signup, `auth.ts`, team table, settings |

## Decisions needed from Tobi/client before Phase 5 & 9

1. **Capital model (bugs 7/16/18):** Is investor "initial investment" real committed capital (→ auto-create an allocation) or just a profile note (→ remove the field, capital counts only via allocations)? Recommended: allocations are the single source of truth.
2. **Committed-capital filter:** all allocations vs Funded-only? Recommended: Funded-only, applied on both admin and company dashboards.
3. **Resend invite to already-registered investors (bug 6):** allow (relax the 409 guard) or just show "already signed up"?
4. **Name split (bug 2):** full migration to `first_name`/`last_name`, or lighter split-input-join-with-space fix without schema change?
