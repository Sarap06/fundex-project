# Company Dashboard Redesign Spec (Pixel-Perfect Clone)

> Reference: `e13e55b867e3a5e2574d39bacdcc638f.webp` (Nueansa financial dashboard)
> Target: `/app/(dashboard)/company/page.tsx` and its layout

---

## What Changes

*   **Goal**: Achieve an *exact*, pixel-perfect replica of the provided image, down to the colors, fonts, margins, and hardcoded widgets. 
*   **Layout**: Top horizontal navbar (no sidebar). 
*   **Background**: Very soft off-white (`#FDFDFD`), not warm stone.
*   **Cards**: `rounded-[20px]` or `` with solid white background (`#FFFFFF`) and very faint `shadow-sm`.
*   **Accent Color**: Vibrant Orange (`#FF5722`), completely replacing all green/gold.
*   **Typography**: Clean, geometric sans-serif everywhere (e.g., `Inter`, `Satoshi`, or `Poppins`). No slab serifs.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOPBAR (sticky, white, border-bottom)                               │
│ [F logo + Fundex]  Dashboard  Deals  Investors  Documents  Broadcast│
│                                          [bell] [search] [avatar]   │
├─────────────────────────────────────────────────────────────────────┤
│ WARM STONE BACKGROUND                                               │
│                                                                     │
│ ┌─ Greeting ──────────────────────────────────────────────────────┐ │
│ │ Good Morning, {firstName}!              [Last Month v] [Export] │ │
│ │ Today is {fullDate}                                             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ KPI Row ───────────────────────────────────────────────────────┐ │
│ │ TOTAL AUM       │ ACTIVE DEALS    │ ACTIVE INVESTORS │ ALLOCATED│ │
│ │ $2.45M          │ 5               │ 12               │ $1.8M   │ │
│ │ +9.5% from last │ Growth Rate ↑4% │ Growth Rate ↑2%  │ ↑5.3%   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ Capital Flow Chart (wider) ─────────┐ ┌─ Company Overview ─────┐ │
│ │ Monthly Capital Flow                  │ │ Company                │ │
│ │ $104,627  +18% from last month        │ │                        │ │
│ │ ■ Inflows  ■ Outflows                 │ │ {companyName}          │ │
│ │ ┌──────────────────────────┐          │ │ Code: {company_code}   │ │
│ │ │  [Recharts bar chart]    │          │ │                        │ │
│ │ │  green inflows above 0   │          │ │ ● Your Role            │ │
│ │ │  dark outflows below 0   │          │ │   Firm Partner          │ │
│ │ └──────────────────────────┘          │ │                        │ │
│ └───────────────────────────────────────┘ │ ● Members: {count}     │ │
│                                           │ ● Deals: {count}       │ │
│                                           └────────────────────────┘ │
│                                                                     │
│ ┌─ Recent Activity (wider) ────────────┐ ┌─ Recent Broadcasts ────┐ │
│ │ Recent Activity                       │ │ Broadcasts         ... │ │
│ │ [search] [Filter]                     │ │                        │ │
│ │ ┌────────────────────────────────┐    │ │ ● Q4 Distribution...   │ │
│ │ │ □ Activity  │ Type │ Date │ .. │    │ │   Admin · 2h ago       │ │
│ │ │ □ New allo..│ Deal │ Apr 7│ .. │    │ │                        │ │
│ │ │ □ Payment ..│ Payout│Apr 5│ .. │    │ │ ● New deal announc..   │ │
│ │ └────────────────────────────────┘    │ │   Admin · 1d ago       │ │
│ └───────────────────────────────────────┘ └────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section-by-Section Spec

### 1. Top Navigation Bar

**Replaces**: Current `<header className="bg-primary sticky top-0">` green bar + sidebar

```
Position:     sticky top-0 z-40
Background:   white (#FFFFFF)
Border:       border-b border-stone-200/80 (very subtle)
Height:       ~64px
Padding:      px-8
Max-width:    full width, content centered at max-w-screen-2xl
Shadow:       none (border is enough)
```

**Left section:**
- Fundex "F" logo (gold square `bg-fundex-gold`, dark "F" letter) + "Fundex" wordmark in `font-display font-bold text-lg text-stone-900`
- This replaces the sidebar logo

**Center section — Nav links:**
- `Dashboard` | `Deals` | `Investors` | `Documents` | `Broadcast`
- Text: `text-sm font-medium text-stone-500`
- Active state: `text-stone-900` with a **2px gold underline** (`border-b-2 border-fundex-gold`) below the text, offset ~4px from baseline
- Hover: `text-stone-700`
- Spacing: `gap-8` between links
- These are actual `<Link>` elements routing to `/company`, `/company/deals`, etc.
- "Dashboard" is active on `/company` (home)

**Right section:**
- Bell icon (notifications) — `text-stone-500 hover:text-stone-700`, 20px
- Search icon — same styling, 20px
- Divider: `h-6 w-px bg-stone-200` vertical line
- User avatar: 36px circle with initials (first+last), `bg-fundex-gold/20 text-fundex-forest font-semibold text-sm`
- User first name: `text-sm font-medium text-stone-700` next to avatar

**Mobile (below md):**
- Logo + hamburger icon (Sheet component for nav links)
- Avatar remains visible

---

### 2. Greeting Section

**Replaces**: The green header bar title "Company Dashboard" and subtitle

```
Position:     First content block after topbar
Padding:      pt-8 pb-2 (tight — KPIs follow closely)
Layout:       flex justify-between items-start
```

**Left side:**
- Greeting: `"Good Morning, {firstName}!"` — computed from time of day
  - Before 12pm: "Good Morning"
  - 12pm–5pm: "Good Afternoon"
  - After 5pm: "Good Evening"
- Font: `text-3xl font-display font-bold text-stone-900 tracking-tight`
- Subtitle: `"Today is {dayOfWeek}, {month} {day}, {year}"` — `text-sm text-stone-500 mt-1`
- Data source: `profile.full_name.split(' ')[0]` for first name

**Right side:**
- "Last Month" dropdown — ` border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700` with ChevronDown icon
  - Options: "This Week", "Last Month", "Last Quarter", "YTD", "All Time"
  - Controls the time range for KPI stats below
- "Export" button — ` bg-fundex-gold text-fundex-forest px-5 py-2 text-sm font-semibold` with Download icon
  - Downloads a CSV/PDF summary report

---

### 3. KPI Stat Cards Row

**Replaces**: The profile card showing name/email/role/company (that content moves to the Company Overview card)

```
Layout:       grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5
Margin:       mt-6
```

**Card design (matches reference exactly):**
```
Container:     bg-white shadow-sm p-6
              First card has NO background tint
              Cards 2-4 have a very faint warm tint: bg-gradient-to-br from-fundex-cream/20 to-white
```

**Card 1 — Total AUM (featured, larger text):**
- Label: `"Total AUM"` — `text-sm font-medium text-stone-500`
- Value: `"$2.45M"` — `text-4xl font-bold tabular-nums tracking-tight text-stone-900`
  - Uses `Intl.NumberFormat` with `notation: 'compact'`
- Change: `"+9.5% from last month"` — `text-sm text-emerald-600 font-medium mt-2`
  - Green if positive, red if negative
- No icon, no colored background block
- Data: SUM of `allocations.allocation_amount` WHERE `funding_status = 'Funded'` AND `deal.status = 'Active'`, scoped by `company_id`

**Card 2 — Active Deals:**
- Label: `"Active Deals"` — same small muted style
- Three-dot menu icon top-right: `text-stone-400 hover:text-stone-600`
- Value: `"5"` — `text-3xl font-bold tabular-nums text-stone-900`
- Sublabel: `"Growth Rate"` — `text-xs text-stone-400`
- Change: `"↑ 4.1%"` — `text-sm font-medium text-emerald-600` with TrendingUp icon (14px)
- Data: COUNT of `deals` WHERE `status = 'Active'` AND `company_id` matches

**Card 3 — Active Investors:**
- Same structure as Card 2
- Value: count of investors with `status = 'Active'`
- Change percentage computed against previous period

**Card 4 — Allocated Capital:**
- Same structure as Card 2
- Value: SUM of `allocations.allocation_amount` WHERE `funding_status = 'Funded'`
- Formatted as `$1.8M` or `$850K` depending on size

**Number formatting rules (all cards):**
- Always use comma separators: `$1,475,000` not `$1475000`
- For millions: `$2.45M` in compact display
- Use `tabular-nums` for aligned digits
- Use `tracking-tight` on large numbers

---

### 4. Capital Flow Chart (Left, ~65% width)

**Replaces**: Nothing (new content — the current company dashboard has no charts)

```
Layout:       Two-column grid: lg:grid-cols-[1fr_380px] gap-5
              This card takes the left/wider column
Card:          bg-white shadow-sm p-6 md:p-7
```

**Header row (flex justify-between):**
- Title: `"Monthly Capital Flow"` — `text-base font-bold text-stone-900`
- Legend: Two squares (gold for inflows, dark for outflows) + labels — `text-xs text-stone-500`
- Date range dropdown: pill-style, shows current range, same style as "Last Month" in greeting

**Featured metric below header:**
- Value: `"$104,627"` — `text-3xl font-bold tabular-nums tracking-tight text-stone-900`
- Change: `"+18% from last month"` — `text-sm text-emerald-600 font-medium` inline next to value

**Chart:**
- **Recharts `<BarChart>`** (NOT custom SVG — use the library that's already installed)
- Grouped/stacked bars:
  - **Fundex gold** (`#C0B87A`) for capital inflows (investments funded, new allocations)
  - **Stone-800** (`#292524`) for outflows (distributions, payouts)
- Horizontal zero line: dashed, `stroke-stone-300`
- Bars above zero = inflows, bars below = outflows
- Y-axis: dollar amounts with $K suffix
- X-axis: dates or months depending on selected range
- Tooltip on hover: white card with date, inflow amount (gold dot + green arrow), outflow amount (dark dot + red arrow)
- Active bar: highlighted with a subtle border/glow and a vertical dashed guideline
- Grid lines: very faint `stroke-stone-100`
- Data: Aggregated from `allocations` (inflows) and distributions/payouts (outflows) by period, filtered by `company_id`

---

### 5. Company Overview Card (Right, ~35% width)

**Replaces**: The current profile card (name, email, role, company) + welcome message

```
Position:     Right column of the two-column grid (same row as chart)
Card:          bg-white shadow-sm p-6
```

**Header row:**
- Title: `"Company"` — `text-base font-bold text-stone-900`
- Three-dot menu: `text-stone-400` (options: Copy Company Code, Edit Profile)

**Company identity:**
- Company name: `text-xl font-bold text-stone-900 mt-4` — `{company.name}`
- Company code: `text-sm text-stone-500` — `"Code: {company.company_code}"` with a copy-to-clipboard icon button next to it

**Ring/donut chart:**
- **Recharts `<PieChart>` with `<Pie innerRadius outerRadius>`**
- Shows capital allocation breakdown:
  - **Gold segment**: Funded allocations
  - **Stone-800 segment**: Unfunded/pending
- Center label: `"Available Capital"` small text + `"$850K"` bold number
- This visualizes how much of total capital is deployed vs available

**Bottom metrics (two items side by side):**
- Left: `{memberCount} Members` — with a small gold left-border accent bar (3px tall gold bar to the left of the number)
  - Sublabel: "Team" — `text-xs text-stone-400`
  - Arrow-up-right icon for "View all"
- Right: `{dealCount} Active Deals` — same accent bar style
  - Sublabel: "Portfolio"
  - Arrow-up-right icon

**Your role badge (inside the card):**
- `"Firm Partner"` — pill badge: ` bg-fundex-gold/15 text-fundex-forest text-xs font-semibold px-3 py-1`
- Positioned below company name

---

### 6. Recent Activity Table (Left, bottom row)

**Replaces**: Nothing (new — the current company dashboard has no activity feed)

```
Layout:       Same two-column grid as above: lg:grid-cols-[1fr_380px] gap-5
Card:          bg-white shadow-sm p-6
```

**Header row (flex justify-between):**
- Title: `"Recent Activity"` — `text-base font-bold text-stone-900`
- Search input: ` border border-stone-200 pl-9 pr-3 py-2.5 text-sm` with Search icon inside — placeholder `"Search by name or deal..."`
- Filter button: ` border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700` with Filter icon

**Table:**
```
Columns:      [checkbox] | Activity | Type | Date | Amount | [... menu]
Borders:      No row borders — use spacing (py-4) and very faint dividers (divide-stone-100)
Header row:   text-xs font-medium text-stone-400 uppercase tracking-wider
Body rows:    text-sm text-stone-700
Hover:        bg-stone-50/50 transition
```

- **Activity column**: Icon (small colored circle with activity icon inside, 32px) + text description
  - Icon colors: gold for allocations, emerald for payments, blue for documents, stone for general
- **Type column**: Badge/pill — ` border border-stone-200 px-3 py-1 text-xs font-medium`
  - Types: "Allocation", "Payment", "Document", "Deal Update"
- **Date column**: `text-sm tabular-nums text-stone-500` — formatted as "Apr 7, 2026"
- **Amount column**: `text-sm font-semibold tabular-nums` — green for positive (`text-emerald-600`), red for negative (`text-red-500`), with +/- prefix
- **Menu column**: Three-dot icon for row actions

**Data source**: `activity_logs` table filtered by `company_id`, ordered by `created_at DESC`, limit 10
- Falls back to showing deal/allocation/investor mutations if no activity logs exist

---

### 7. Recent Broadcasts Card (Right, bottom row)

**Replaces**: The current `<Broadcasts>` component rendered in broadcast tab

```
Position:     Right column of bottom row
Card:          bg-white shadow-sm p-6
```

**Header row:**
- Title: `"Broadcasts"` — `text-base font-bold text-stone-900`
- Three-dot menu: links to full `/company/broadcast` page
- Or: `"View All →"` link in `text-sm font-medium text-fundex-forest`

**Broadcast list (compact, 3-4 items):**
- Each item:
  - Gold dot indicator (8px circle `bg-fundex-gold`) for unread, stone for read
  - Title: `text-sm font-semibold text-stone-900 line-clamp-1`
  - Subtitle: `"{admin_name} · {timeAgo}"` — `text-xs text-stone-400`
  - If file attached: small Paperclip icon next to subtitle
- Spacing: `space-y-1`, each item gets `py-3` with `divide-y divide-stone-100`
- Click: navigates to `/company/broadcast` with that broadcast expanded

**Data source**: `broadcasts` table filtered by `company_id`, ordered by `created_at DESC`, limit 4

---

## Design Tokens (New)

These values replace/supplement the current Fundex tokens for this page:

```css
/* Page background */
--company-bg: #F5F3EF;              /* warm stone, not cold gray */

/* Cards */
--card-bg: #FFFFFF;
--card-radius: 1rem;                /* 16px =  */
--card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);

/* Accent — Fundex gold as primary action color (replaces orange from reference) */
--accent: #C0B87A;                  /* fundex-gold */
--accent-hover: #B0A86A;            /* slightly darker */
--accent-tint: rgba(192,184,122,0.12); /* for badge backgrounds */

/* Text hierarchy */
--text-primary: #1C1917;            /* stone-900 */
--text-secondary: #78716C;          /* stone-500 */
--text-muted: #A8A29E;              /* stone-400 */

/* Chart colors */
--chart-inflow: #C0B87A;            /* fundex gold */
--chart-outflow: #292524;           /* stone-800 */

/* Positive/negative indicators */
--positive: #059669;                /* emerald-600 */
--negative: #DC2626;                /* red-600 */
```

**Important**: These are used on the company page only. The admin and investor dashboards will be migrated separately. This ensures we can validate the new design direction before touching the other dashboards.

---

## Typography Rules

| Element | Font | Size | Weight | Color | Extra |
|---------|------|------|--------|-------|-------|
| Greeting heading | Trench Slab (`font-display`) | `text-3xl` / `text-4xl` on md | `font-bold` | `stone-900` | `tracking-tight` |
| Section titles | General Sans | `text-base` | `font-bold` | `stone-900` | — |
| Nav links | General Sans | `text-sm` | `font-medium` | `stone-500` / `stone-900` active | — |
| Stat labels | General Sans | `text-sm` | `font-medium` | `stone-500` | — |
| Stat values (large) | General Sans | `text-3xl` / `text-4xl` featured | `font-bold` | `stone-900` | `tabular-nums tracking-tight` |
| Stat sublabels | General Sans | `text-xs` | `font-medium` | `stone-400` | — |
| Change indicators | General Sans | `text-sm` | `font-medium` | `emerald-600` or `red-500` | — |
| Table headers | General Sans | `text-xs` | `font-medium` | `stone-400` | `uppercase tracking-wider` |
| Table body | General Sans | `text-sm` | `font-normal` | `stone-700` | — |
| User name (topbar) | General Sans | `text-sm` | `font-medium` | `stone-700` | — |
| Badge text | General Sans | `text-xs` | `font-semibold` | varies | — |

---

## File Changes Required

### New files:
```
app/(dashboard)/company/layout.tsx          — New layout: topbar + warm bg, NO sidebar
src/components/company/topbar.tsx           — Top navigation bar component
src/components/company/stat-card.tsx        — Reusable stat card (matches reference)
src/components/company/capital-flow-chart.tsx — Recharts bar chart
src/components/company/company-overview.tsx — Right-side company info + donut
src/components/company/activity-table.tsx   — Recent activity table
src/components/company/broadcast-preview.tsx — Compact broadcast list
```

### Modified files:
```
app/(dashboard)/layout.tsx                  — Add bypass for /company routes (like /investor already has)
app/(dashboard)/company/page.tsx            — Complete rewrite to new layout
```

### Layout bypass change in `(dashboard)/layout.tsx`:

Currently the layout only bypasses `/investor`:
```tsx
// Current (line 51-53):
if (pathname.startsWith('/investor')) {
  return <>{children}</>;
}
```

Must also bypass `/company`:
```tsx
// New:
if (pathname.startsWith('/investor') || pathname.startsWith('/company')) {
  return <>{children}</>;
}
```

This way `/company` uses its own `company/layout.tsx` with the topbar instead of the sidebar.

---

## Routing Change

Current: Client-side tabs via `useState('home' | 'investors' | ...)` — no URL changes, no deep linking.

New: Each section is a route under `/company/`:

| Route | Page | Status |
|-------|------|--------|
| `/company` | Dashboard home (this spec) | Build now |
| `/company/deals` | Deals list (read-only for partners) | Phase 2 |
| `/company/investors` | Investor directory | Phase 2 |
| `/company/documents` | Document library | Phase 2 |
| `/company/broadcast` | Full broadcast view (existing `<Broadcasts>` component) | Move existing |

The topbar nav links route to these pages via `<Link href="/company/deals">`.

Phase 2 pages should show a proper "coming soon" state that matches the new design: a centered illustration + text inside a ` bg-white` card, not the current raw icon + text.

---

## Loading State

**Replaces**: Current spinning Clock icon with "Loading..."

New loading state uses skeleton placeholders:

```
┌──────────────────────────────────────────────┐
│ Topbar: renders immediately (no data needed) │
├──────────────────────────────────────────────┤
│ Greeting: ████████████████  (pulse shimmer)  │
│           ██████████                          │
│                                               │
│ ┌─ ████ ─┐ ┌─ ████ ─┐ ┌─ ████ ─┐ ┌─ ████ ─┐│
│ │ ██████ │ │ ██████ │ │ ██████ │ │ ██████ ││
│ └────────┘ └────────┘ └────────┘ └────────┘│
│                                               │
│ ┌─ Chart skeleton (pulse) ─┐ ┌─ Side ──────┐│
│ │ █████████████████████████ │ │ ████████████ ││
│ │ █ █ █ █ █ █ █ █ █ █ █ █ │ │ ████████████ ││
│ └───────────────────────────┘ └──────────────┘│
└──────────────────────────────────────────────┘
```

Use `<Skeleton>` from shadcn/ui (`src/components/ui/skeleton.tsx`). Each card shows a skeleton of the same dimensions as its loaded state. The topbar renders immediately since it only needs the user's name (show initials/avatar placeholder if name hasn't loaded).

---

## Data Fetching Strategy

Current: Everything is fetched client-side with `useEffect` + `supabase.from(...)` directly in the page component.

New approach for this page:

1. **Auth check**: Still happens client-side (existing pattern). Redirect to `/auth/login` if no session, redirect to `/admin` if not `partner` role.
2. **Dashboard data**: Fetch via API routes, not direct Supabase queries from the client.
   - `GET /api/company/dashboard-stats?companyId={id}&range={period}` — returns KPI stats
   - `GET /api/activities/recent?companyId={id}&limit=10` — already exists
   - `GET /api/broadcasts?companyId={id}&limit=4` — already exists (used by Broadcasts component)
3. **Allocations for chart**: `GET /api/company/capital-flow?companyId={id}&range={period}` — new endpoint that aggregates inflow/outflow by period

This keeps the page component thin and moves data aggregation to the service layer (per CLAUDE.md conventions).

---

## Interaction Details

### Topbar nav
- Active link determined by `usePathname()`
- Gold underline animates in with `transition-all duration-200`
- On mobile: links collapse into a hamburger Sheet

### Time range dropdown
- Controls KPI cards + chart simultaneously
- Changing it refetches data with the new range
- Shows a brief skeleton/pulse on the values while loading (not a full page loader)

### Export button
- Downloads a PDF or CSV of the current dashboard view
- Shows a loading spinner inside the button while generating
- Uses fundex-gold background — the only filled/primary button on the page

### Stat card hover
- Subtle `hover:shadow-md` transition
- Cursor remains default (cards are not clickable links)
- Three-dot menu on cards 2-4: shows "View Details" option linking to the relevant sub-page

### Chart interactions
- Hover on bar: shows tooltip with date + inflow/outflow breakdown
- Hovered bar gets a subtle gold border highlight
- Vertical dashed guideline appears through hovered bar
- Click on bar: no action (view-only for partners)

### Activity table rows
- Hover: `bg-stone-50/50` background
- Checkbox: for future bulk actions (disabled for now, but structure in place)
- Three-dot menu: "View Deal", "View Investor" options

### Broadcast items
- Click: navigates to `/company/broadcast`
- Unread indicator: gold dot pulses gently once on mount (CSS animation)

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `< 640px` (mobile) | Single column everything. Topbar: logo + hamburger. KPIs stack 1-col. Chart full width. Company overview full width below chart. Activity table scrolls horizontally. |
| `640px – 1023px` (tablet) | KPIs: 2x2 grid. Chart + overview still stack. Activity table visible. |
| `>= 1024px` (desktop) | Full layout as shown in the ASCII diagram. Two-column grid for chart+overview and activity+broadcasts. |

---

## What Stays the Same

- **Auth flow**: Supabase auth, role check for `partner`, redirect logic
- **Data sources**: Same tables (`allocations`, `deals`, `investors`, `broadcasts`, `activity_logs`)
- **Company scoping**: All queries filtered by `company_id` — no change to multi-tenant isolation
- **Broadcasts component**: The full `<Broadcasts>` component continues to work on `/company/broadcast` — we're just adding a compact preview on the dashboard home
- **Brand identity**: Fundex logo, Trench Slab for display, General Sans for body, green as brand color (logo, badges), gold as accent/action color
