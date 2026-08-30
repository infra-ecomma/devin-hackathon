---
name: product-ux-review
description: "Product-aware UX/UI review that reads the actual codebase, maps data models to displayed UI, audits interaction-level CSS, evaluates information architecture at the product level, and produces findings with file paths and code changes. Unlike design-critique (which evaluates visual patterns from screenshots), this skill understands what the product KNOWS and what it SHOWS — catching empty real estate, orphaned CTAs, missing affordances, underutilized data, and broken interaction states. Triggers on: UX review, UX audit, product review, usability review, interaction audit, improve the UX, the app feels wrong, something is off, why does this feel bad, review the product, review the app, full review, site review. Also fires as part of design-engine Category E when the project is a web application."
user_invocable: true
argument: scope - What to review (e.g., 'full app', 'dashboard page', 'campaign detail flow'). If blank, reviews the full application.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# Product UX/UI Review

You are a senior product designer conducting a comprehensive review. You don't just
evaluate how things look — you understand what the product does, what data it has,
what users need, and whether the interface serves those needs.

**The core question this skill answers:** "Given what this product knows and what
users are trying to accomplish, is the interface making the right information
available in the right place with the right interaction patterns?"

Design-critique evaluates visual patterns. This skill evaluates whether the product
is actually working for its users.

---

## How This Differs from design-critique

| design-critique | product-ux-review |
|----------------|-------------------|
| Evaluates screenshots | Reads the codebase |
| Scores visual patterns | Maps data model to UI surface |
| Checks color/typography/layout | Checks affordances, states, workflows |
| Finds "this looks wrong" | Finds "this page knows about $79K budget but shows a donut with the number 3" |
| Produces visual scores | Produces findings with file paths and code changes |
| Runs on any design | Requires a codebase to analyze |

**Use both together.** design-critique catches visual problems. product-ux-review
catches product problems. A complete review runs both.

---

## Methodology & Rigor

This skill combines four established UX evaluation methods:

1. **Heuristic Evaluation** — Nielsen's 10 heuristics as a scoring backbone, but
   applied by reading code rather than observing users. Each finding is rated on
   Nielsen's 0-4 severity scale (not invented severity labels).

2. **Cognitive Walkthrough** — For every major workflow, ask the four critical
   questions at each step: (1) Will the user try to achieve the right outcome?
   (2) Is it clear what to do? (3) Will they notice the correct action is available?
   (4) Does the system confirm success?

3. **Data Utilization Mapping** — Original to this skill. For every page: what data
   does the code fetch vs. what does the UI display vs. what's missing? This is the
   gap that no screenshot-based review can detect.

4. **CSS Affordance Audit** — Systematic grep-based verification that every interactive
   element has the required interaction states (cursor, hover, focus-visible, active,
   disabled, transitions) with exact timing values and contrast ratios.

### Confidence Levels for Findings

Every finding must declare its confidence level:

| Level | Label | Meaning | Evidence Required |
|-------|-------|---------|-------------------|
| **C1** | Certain | Verified by reading code + confirmed in UI | File path, line number, code snippet |
| **C2** | High | Verified by reading code, not yet confirmed in running UI | File path, line number, expected behavior |
| **C3** | Probable | Inferred from code patterns, not directly verified | Pattern match, explanation of inference |

**Rule: P0 and P1 findings must be C1 or C2.** Do not classify something as critical
unless you've read the actual code that produces it.

### Severity Rating (Nielsen 0-4 Scale)

Use the industry-standard scale, not ad-hoc labels:

| Rating | Level | Definition | Factors |
|--------|-------|-----------|---------|
| **0** | Not a problem | Disagree this is a usability issue | — |
| **1** | Cosmetic | Fix only if extra time available | Low frequency, easy workaround, one-time occurrence |
| **2** | Minor | Low priority fix | Occasional, moderate impact, users recover |
| **3** | Major | High priority, fix in next sprint | Common, significant impact, difficult recovery |
| **4** | Catastrophe | Must fix before release/next deploy | Very common, blocks task, persistent |

**Severity = f(Frequency × Impact × Persistence):**
- **Frequency:** What % of users hit this? (<5% rare, 5-25% occasional, 25-75% common, >75% universal)
- **Impact:** Can users recover? (easy / difficult / impossible)
- **Persistence:** Does it happen once or every interaction?

---

## Phase 1: Understand the Product (MANDATORY — never skip)

Before judging anything, understand what the product does. This is the step that
generic design reviews skip, and it's why they miss the most important problems.

### Step 1: Map the Data Model

```bash
# Find data models, types, schemas, database definitions
grep -rn "type\|interface\|schema\|model\|Table\|Entity" src/ --include="*.ts" -l | head -20
# For Prisma/Drizzle/etc:
find . -name "schema.prisma" -o -name "schema.ts" -o -name "*.schema.ts" 2>/dev/null
# For Supabase:
find . -name "database.types.ts" -o -name "*.types.ts" 2>/dev/null | head -10
```

For each major entity (User, Account, Campaign, Project, etc.), document:
- What fields exist in the data model
- Which fields are currently displayed in the UI
- Which fields are NOT displayed but could provide value
- Relationships between entities (a Brand has Campaigns, a Campaign has Metrics)

**This is the single most important step.** It reveals every instance of "the app
knows this but doesn't show it."

### Step 2: Map the Routes and Pages

```bash
# Next.js App Router:
find app/ -name "page.tsx" -o -name "page.js" 2>/dev/null
# Next.js Pages Router:
find pages/ -name "*.tsx" -o -name "*.js" 2>/dev/null | grep -v "_app\|_document\|api/"
# React Router:
grep -rn "Route\|path:" src/ --include="*.tsx" --include="*.jsx" | head -20
```

For each page/route:
- What entity does this page display?
- What data does the page fetch? (look for queries, API calls, hooks)
- What actions can the user take on this page?
- What's the page's purpose in the user's workflow?

### Step 3: Identify User Workflows (Cognitive Walkthrough Prep)

Trace the primary user journeys through the app:
1. **Onboarding flow:** First visit → account setup → first meaningful action
2. **Core workflow:** The thing users do most often (create, manage, analyze)
3. **Review flow:** How users check status, monitor progress, evaluate results
4. **Admin flow:** Settings, configuration, team management

For each workflow, map: Entry point → Steps → Decision points → Completion → What next?

**At each step, ask the four cognitive walkthrough questions:**
1. Will the user try to achieve the right outcome? (Do they know what this step does?)
2. Is it clear what to do? (Is the action obvious?)
3. Will they notice the correct action is available? (Is the control visible and discoverable?)
4. Does the system confirm success? (Is feedback clear for a first-time user?)

If any question gets a "no" or "uncertain," that's a finding.

### Step 4: Identify the Product Category

This determines what benchmarks to evaluate against:

| Category | Benchmark Products | Key UX Expectations |
|----------|-------------------|-------------------|
| SaaS Dashboard | Stripe, Linear, Vercel, Datadog | 5-7 KPIs per viewport, summary → charts → detail hierarchy, real-time status |
| Project Management | Linear, Notion, Asana | Workflow visualization, status tracking, bulk actions, keyboard shortcuts |
| Analytics Tool | Mixpanel, PostHog, Amplitude | Data exploration, filtering, comparison, drill-down |
| Marketing Tool | HubSpot, Mailchimp | Campaign management, performance metrics, ROI visibility, timeline views |
| CRM | Salesforce, HubSpot, Pipedrive | Contact management, pipeline visualization, activity tracking |
| E-commerce Admin | Shopify, Stripe | Order management, inventory, financial overview |

---

## Phase 2: Audit the Interface (8 Dimensions)

Each dimension is evaluated by reading the actual code, not just looking at screenshots.
Every finding must include: file path, severity (0-4), confidence (C1-C3), and a specific fix.

### Dimension 1: Data Utilization (The #1 SaaS UX Failure)

**What to check:** Does each page display the data it has access to, or is it
wasting real estate?

**Audit process:**
```bash
# For each major page, find what data it fetches:
grep -rn "useQuery\|useSWR\|fetch\|supabase\|prisma\|getServerSideProps\|loader" app/ --include="*.tsx" --include="*.ts" | head -30
```

For each page, produce a **Data Utilization Map:**

```
PAGE: /dashboard
FETCHES: brands (4), campaigns (8), total budget ($79K), active count, metrics
DISPLAYS: brand count, campaign count, budget number, brand pills
MISSING:
  - Campaign performance trend (data exists, not charted)
  - Budget utilization rate (budget vs. spend — data exists)
  - Top performing campaign (data exists, not highlighted)
  - Recent activity timeline (data exists, not shown)
  - KPI delta vs. last period (data exists, not calculated)
UTILIZATION: ~30%. 70% of available data is invisible to the user.
```

**Scoring rubric:**
- 9-10: 90%+ utilization. Every meaningful data point is surfaced appropriately.
- 7-8: 70-89%. Minor gaps — maybe a missing trend arrow or delta.
- 4-6: 50-69%. Significant data hidden. Users must navigate elsewhere for information this page could show.
- 1-3: Below 50%. Page is a shell. Rich data exists but the UI shows almost nothing.

**What "utilization" means:** Not "show every field." For each piece of data the
page has access to, is there a clear reason it's hidden? If the reason is "we
didn't build it" rather than "users don't need it," that's a finding.

**KPI card standard (research-backed):** When pages should display KPIs, each card
must include these 5 elements in hierarchy order:
1. **Metric value** (largest, primary focus)
2. **Baseline/comparison** (vs. target or prior period)
3. **Sparkline** (historical context — tiny inline chart)
4. **Trend icon + delta** (↑/↓ with percentage)
5. **Label** (what is being measured)

A KPI card with just a number and label is a 2/5. A card with all five elements is
production-grade. Research shows 5-7 KPI cards maximum per viewport before cognitive
overload sets in.

### Dimension 2: Information Architecture & Content Hierarchy

**What to check:** Is information organized by user mental model or by developer
convenience? Does the page hierarchy match task priority?

**The "5-second test":** For each major page, ask: "Can a user answer 'Is everything
okay?' within 5 seconds of landing on this page?" If not, the IA is failing.

**Information scent audit (Pirolli & Card):** At every navigation point, does the
label/visual cue give the user enough information to predict what they'll find if
they click? Poor information scent = users click randomly. Strong scent = users
navigate confidently.

**Above-the-fold audit:**
- What's visible without scrolling on a 1080p screen?
- Is the #1 most important piece of information in the top-left quadrant?
- Are KPIs/status indicators immediately visible, or buried below charts?
- Does the page follow the standard SaaS hierarchy: summary cards → charts → detail tables?

**Page-level expectations by type:**

| Page Type | Above the Fold | Expected Content | Common Failure |
|-----------|---------------|-----------------|---------------|
| **Dashboard** | 3-5 KPI cards, status overview | KPIs → charts → lists | Every metric shown equally (no hierarchy) |
| **Detail page** | Entity name + status + key metrics | Header summary → related entities → details | Name + tag + nothing else |
| **List page** | Count + filters + first 5-10 items | Filter bar → column-sortable table → pagination | No inline preview, must click each item |
| **Settings** | Most-used settings first | Grouped by frequency, not alphabetically | Flat list of everything |

**CTA placement audit (Fitts's Law):**

Fitts's Law: `MT = a + b × log₂(2D/W)` where D = distance to target, W = target width.
Translation: bigger targets closer to the user's current focus = faster interaction.

```bash
# Find all primary action buttons and their locations
grep -rn "Button\|button\|<a\|onClick\|href" app/ --include="*.tsx" | grep -i "create\|add\|new\|delete\|save\|submit" | head -30
```

For each primary CTA, check:
- Is it context-adjacent (near the content it acts on)?
- Or is it floating in no-man's-land between sections?
- Is it in the natural eye-flow path (F-pattern: top-left → right → down)?
- Is it ≥ 44×44px (WCAG 2.5.5 / Apple HIG minimum)?
- On mobile, is it in the bottom 60% of the screen (thumb zone)?

**Findings format:**
```
FINDING: "Create campaign" CTA orphaned between brand pills and campaign list
SEVERITY: 3 (Major — common, impacts discoverability, persistent)
CONFIDENCE: C1 (verified in code and UI)
FILE: app/dashboard/page.tsx (line 142)
PROBLEM: CTA is positioned between two unrelated sections. Users scanning the
  brand pills don't expect an action here. Users scanning the campaign list
  look for actions within or above the list header.
FIX: Move "Create campaign" to the campaign list section header, right-aligned
  next to the section title. Pattern: [Campaigns (8)] ............. [+ Create campaign]
HEURISTIC VIOLATED: #6 (Recognition rather than recall), #7 (Flexibility and efficiency)
```

### Dimension 3: Interactive Affordances (CSS-Level Audit)

**What to check:** Does every interactive element look interactive and respond to
interaction? This is the dimension that catches "buttons without cursor:pointer."

**Systematic CSS audit — run ALL of these:**
```bash
# 1. Find all interactive elements
grep -rn "onClick\|href\|button\|Button\|Link\|<a " app/ --include="*.tsx" -l

# 2. Check for cursor:pointer
grep -rn "cursor:" src/ --include="*.css" --include="*.scss" --include="*.tsx"

# 3. Check for hover states
grep -rn ":hover\|hover:" src/ --include="*.css" --include="*.scss" --include="*.tsx"

# 4. Check for focus-visible states (keyboard accessibility)
grep -rn "focus-visible\|:focus\b" src/ --include="*.css" --include="*.scss"

# 5. Check for disabled states
grep -rn "disabled\|:disabled\|isDisabled\|aria-disabled" src/ --include="*.tsx" --include="*.css"

# 6. Check for transitions on interactive elements
grep -rn "transition\|animation" src/ --include="*.css" --include="*.scss" | head -20

# 7. Check for prefers-reduced-motion (accessibility)
grep -rn "prefers-reduced-motion" src/ --include="*.css" --include="*.scss" | wc -l

# 8. Check for divs/spans with onClick but no role (ARIA violation)
grep -rn "<div.*onClick\|<span.*onClick" src/ --include="*.tsx" | grep -v "role="
```

**Complete interactive element specification (research-backed values):**

| Property | Specification | Failure Condition |
|----------|--------------|-------------------|
| `cursor: pointer` | Every clickable element (buttons, links, cards, pills, tabs) | Default cursor on clickable = affordance failure (Severity 3) |
| `cursor: not-allowed` | Every disabled element | Missing = users don't know it's disabled until they click (Severity 2) |
| `:hover` state | Change ≥1 property: background (±5-10%), color, shadow, or transform | No hover change = element doesn't feel interactive (Severity 2) |
| `:focus-visible` | 2px+ outline, 3:1 contrast ratio vs background, 1-2px offset | Missing = keyboard users are blind (Severity 3, WCAG 2.4.13) |
| `:active` state | scale(0.95-0.98) or inset shadow or background darken 10-15% | No press feedback = feels unresponsive (Severity 1) |
| `:disabled` | opacity 0.4-0.6, cursor: not-allowed, aria-disabled="true" | Visually identical to enabled = confusing (Severity 2) |
| `transition` | color/bg: 150ms ease, transform: 200ms ease-out, shadow: 150ms ease | Instant state changes feel jarring (Severity 1) |
| Touch target | ≥ 44×44 CSS px (WCAG 2.5.5), ≥ 8px gap between targets | Undersized = hard to click, especially mobile (Severity 2-3) |
| `prefers-reduced-motion` | Every @keyframes must have a reduced-motion override | Motion-sensitive users experience nausea/vertigo (Severity 3, WCAG) |

**Selected vs. Hover differentiation:**
Selected state (current page, active tab) must be visually distinct from hover.
Selected = persistent background + accent border. Hover = subtle background shift.
If `aria-current="page"` is missing from active nav items, that's an accessibility finding.

**For each interactive element found without proper states:**
```
FINDING: Time range buttons (7d/30d/90d/All/Custom) missing cursor:pointer and hover
SEVERITY: 3 (Major — affects every interactive session, persistent)
CONFIDENCE: C1 (verified: div with onClick, no cursor class)
FILE: app/components/TimeRangeSelector.tsx (line 28)
CSS CLASS: .time-btn — has background and padding but no interaction states
FIX: Add to .time-btn:
  cursor: pointer;
  transition: background-color 150ms ease, transform 200ms ease-out;
  &:hover { background: var(--surface-hover); }
  &:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  &:active { transform: scale(0.98); }
  &[aria-selected="true"] { background: var(--accent-bg); border-bottom: 2px solid var(--accent); }
HEURISTIC VIOLATED: #4 (Consistency and standards)
```

### Dimension 4: Empty States & Edge Cases

**What to check:** What happens when there's no data? What happens with 1 item?
100 items? Error states? Loading states?

```bash
# Find loading states
grep -rn "loading\|isLoading\|skeleton\|Skeleton\|spinner\|Spinner" app/ --include="*.tsx" | head -20

# Find empty state handling
grep -rn "empty\|no data\|no results\|length === 0\|\.length\)" app/ --include="*.tsx" | head -20

# Find error handling (error boundaries, catch blocks, fallback UI)
grep -rn "error\|Error\|catch\|fallback\|ErrorBoundary" app/ --include="*.tsx" | head -20
```

**Four empty state types to audit:**

| Type | Trigger | Required Components | Common Failure |
|------|---------|-------------------|---------------|
| **First-use** | User signed up, no data yet | Illustration + headline + body + single prominent CTA | Blank page, no guidance |
| **No-results** | Search/filter returned nothing | Context-specific message + alternative suggestions | Generic "No results" |
| **Error** | Something broke | Human-readable explanation + retry action + support link | Technical error code or silent failure |
| **Partial data** | Some data exists, some doesn't | Graceful degradation + indication of what's missing | Broken layout or undefined errors |

**Empty state quality checklist:**
- [ ] Headline explains the situation (not just "Empty")
- [ ] Body text tells user what will appear here once they take action
- [ ] Single prominent CTA guides to next action
- [ ] Copy is specific to context (not reused generic component everywhere)
- [ ] Illustration/icon conveys the situation visually (not decorative)

**Loading state audit:**

| Pattern | When to Use | Perceived Speed |
|---------|------------|----------------|
| **Skeleton screens** | Content loading (page transition, data tables) | 30% faster perceived than spinners (research-backed) |
| **Spinners** | Momentary operations (save, submit, delete) | Acceptable for < 3 seconds |
| **Progress bars** | Operations > 5 seconds with knowable progress | Set expectations, reduce abandonment |
| **Optimistic UI** | Low-risk actions (likes, toggles, settings) | Feels instant — but must have rollback on failure |

**Skeleton screen implementation standard:**
- Left-to-right shimmer animation, 2-5 second cycle, linear easing
- Match the layout of the actual content (same grid, same heights)
- Must include `prefers-reduced-motion` override (static gray, opacity 0.5)

### Dimension 5: Page Real Estate Utilization

**What to check:** Is the page using its space well, or are there large empty areas
that could show useful data?

**The "prime real estate" audit:**
For each major page, identify the areas of highest visual prominence (above fold,
center of viewport, adjacent to primary content) and check:
- Is the highest-prominence area showing the highest-value content?
- Are there large empty spaces that could show charts, KPIs, or summary data?
- Is the page "content-complete" — would a new user see this page and know what
  the product is about?

**Detail page audit (the most common failure in SaaS):**

Detail pages (showing one Brand, one Campaign, one Project) are almost always
underutilized. The standard detail page anatomy should be:

1. **Header:** Entity name + primary status indicator + quick actions (edit, delete, share)
2. **Executive summary:** 3-5 KPI cards with metric, delta, sparkline, trend
3. **Related entities:** Child items, parent context, linked objects
4. **Detail sections:** Tabs (3-5 max) or scroll-based accordion
5. **Metadata footer:** Created date, modified date, ownership

**For each detail page, check:**
- Does the header show just a name, or a name + key metrics + status?
- Is there an executive summary section? (Research: users need to answer "how is this
  going?" within 5 seconds)
- Are there charts or visualizations, or just text and numbers?
- Is the action bar sticky or immediately accessible?
- What would a stakeholder want to see at a glance?

**Dashboard real estate standard:**
- Overview sections at <40% information density (research: 63% faster pattern recognition)
- 5-7 KPI cards maximum per viewport (cognitive limit before overload)
- Hierarchy: summary cards → charts → detail tables (this order, always)
- Global filters (date range, category) update all widgets simultaneously

**Findings format:**
```
FINDING: Brand detail page wastes 60% of above-fold space
SEVERITY: 3 (Major — every brand detail view affected, persistent)
CONFIDENCE: C1 (verified: page.tsx fetches 12 fields, renders 4)
FILE: app/brands/[id]/page.tsx
CURRENT STATE: Shows brand name, category tag, URL, sub-brand/campaign counts,
  and a donut chart of campaign status. That's it.
AVAILABLE DATA (from data model): Campaign performance metrics, budget allocation
  vs. spend, conversion data, historical trends, active vs. completed campaigns.
FIX: Add executive summary row with 4 KPI cards (metric + delta + sparkline):
  1. Total spend vs. budget (utilization %)
  2. Avg. campaign performance (trend arrow)
  3. Active campaigns with health indicator
  4. Key metric delta vs. last period
  Add performance trend chart below KPI cards.
EFFORT: 4-6 hours (new BrandSummary component + data aggregation query)
HEURISTIC VIOLATED: #8 (Aesthetic and minimalist design — wasted space is not minimal)
```

### Dimension 6: Navigation & Wayfinding

**What to check:** Can users always tell where they are, where they can go, and
how to get back?

```bash
# Find navigation components
grep -rn "nav\|Nav\|sidebar\|Sidebar\|breadcrumb\|Breadcrumb" app/ --include="*.tsx" -l
# Check active state implementation
grep -rn "active\|isActive\|pathname\|usePathname\|useRouter\|aria-current" app/ --include="*.tsx" | head -20
# Check for command palette / Cmd+K
grep -rn "command\|cmdk\|CommandMenu\|CommandPalette\|Cmd.*K\|hotkey" app/ --include="*.tsx" | head -10
```

**Navigation type decision (research-backed):**

| Situation | Choose | Reason |
|-----------|--------|--------|
| < 5 nav items | Top nav | Compact, saves space |
| 5-10 items | Sidebar | Easier vertical scan |
| > 10 items or deep hierarchy | Sidebar | Necessary for usability |
| Content-focused (docs, blog) | Top nav | Minimal footprint |
| Enterprise/complex SaaS | Sidebar | Always visible, frequent switching |

**Active state specification:**
- Active nav item MUST have background highlight (not just bold text or color change)
- Must use `aria-current="page"` for screen readers
- Selected state must contrast ≥ 3:1 with normal state
- Must be visually distinct from hover state

**Navigation checklist:**
- [ ] Current location is visually obvious (background highlight, not just bold)
- [ ] `aria-current="page"` on active nav item
- [ ] Breadcrumbs exist for pages deeper than 2 levels
- [ ] Back navigation works predictably (browser back = expected page)
- [ ] Navigation labels are domain-specific, not generic ("Campaigns" not "Items")
- [ ] Sidebar expanded on desktop, collapsed on mobile
- [ ] Navigation order reflects task frequency (most-used first)
- [ ] Skip-to-content link exists as first focusable element
- [ ] Command palette (Cmd+K) for feature discoverability (optional but high-value)

**Focus management for SPA navigation:**
Single-page apps don't auto-manage focus on route change. Check:
- Does focus move to `<main>` or first `<h1>` after navigation?
- Does the page title update? (document.title)
- Are screen readers notified of the route change? (aria-live region)

### Dimension 7: Workflow Completeness

**What to check:** Can users complete their core tasks without hitting dead ends,
confusion points, or missing features?

Trace each major workflow from Phase 1 Step 3 through the actual UI. At each step,
apply the cognitive walkthrough questions.

**For each step in the workflow, check:**
- Is the next step obvious? (Can the user figure out what to do next?)
- Is there a CTA for the next action?
- After completing an action, does the UI confirm success AND guide to next step?
- Are there dead ends where the user accomplishes something but doesn't know
  what to do next?
- Does the success confirmation use `role="status"` or `aria-live="polite"` for
  screen reader announcement?

**Common workflow failures in SaaS (check all):**

| Failure | Severity | Why It Matters |
|---------|----------|---------------|
| Create flow ends with success toast but no link to created item | 3 | User must navigate manually to find what they just made |
| Edit flow has no cancel button or back path | 2 | User trapped in edit mode with no escape |
| Delete flow has no confirmation or no consequence explanation | 3 | Accidental deletion, no undo |
| Bulk actions exist but no checkbox column or select-all | 2 | Feature exists but is undiscoverable |
| Filters can be set but can't be saved or shared | 1 | Power users recreate filters every session |
| Export exists but is buried in overflow menu | 2 | Users can't find a feature they need |
| Search doesn't cover all searchable fields | 2 | Users search for something that exists but get no results |
| Form validation on keystroke instead of blur | 2 | Hostile UX — shows errors while user is still typing |
| Required fields not marked until submission fails | 3 | Wastes user time, creates frustration |

**Form validation timing (research-backed):**
- Validate on **blur** (field exit), NOT on keystroke — +22% completion rate
- Remove error immediately when user corrects the field
- Show "positive validation" (green check) when field passes
- 31% of sites still lack inline validation (Baymard Institute)

### Dimension 8: Microinteraction Quality

**What to check:** Do small interactions feel polished or cheap?

**Button feedback audit:**

| State | Required Behavior | CSS Specification |
|-------|-------------------|-------------------|
| Resting | Clear affordance (looks clickable) | cursor: pointer, defined background |
| Hover | Visual change on mouse enter | background ±5-10%, transition 150ms ease |
| Focus | Visible keyboard focus ring | outline: 2px solid, offset 1px, 3:1 contrast |
| Active/Pressed | Depression feedback on click | scale(0.95-0.98) or inset shadow, 100ms |
| Loading | Spinner or progress in button | Disable button, show inline spinner, aria-busy="true" |
| Disabled | Clearly non-interactive | opacity 0.4-0.6, cursor: not-allowed |
| Destructive | Different color + confirmation | Red/danger variant, confirm dialog before action |

**Loading pattern audit:**

| Pattern | Specification | Audit Check |
|---------|--------------|-------------|
| Skeleton shimmer | 2-5s cycle, linear, left-to-right, matches content layout | Grep for "skeleton" or "shimmer" in CSS |
| Spinner | 1-2s rotation, linear easing | Grep for "@keyframes.*spin\|rotate" |
| Reduced motion | Every animation has prefers-reduced-motion override | Count @keyframes vs prefers-reduced-motion |
| Optimistic UI | Only for low-risk reversible actions | Check if used for destructive operations (bad) |

**Toast/notification pattern audit:**
- Success toasts: auto-dismiss 3-5 seconds, `role="status"`, `aria-live="polite"`
- Error toasts: persist until dismissed, `role="alert"`, `aria-live="assertive"`
- Positioned consistently (top-right is standard)
- Include enough context to be useful (not just "Error")

**Transition timing reference (Material Design standards):**

| Animation Type | Duration | Easing |
|---------------|----------|--------|
| Hover state change | 150ms | ease |
| Button press | 100ms | ease-in-out |
| Modal entrance | 300ms | ease-out |
| Modal exit | 200ms | ease-in |
| Page transition | 250-300ms | ease |
| Skeleton shimmer | 2-5s cycle | linear |
| Maximum for any UI transition | 400ms | — (beyond this feels sluggish) |

---

## Phase 3: Score and Prioritize

After auditing all 8 dimensions, produce scores and a prioritized finding list.

### Scoring Table

| # | Dimension | Score (1-10) | Severity 3-4 Count | Key Finding |
|---|-----------|-------------|-------------------|-------------|
| 1 | Data Utilization | /10 | | |
| 2 | Information Architecture | /10 | | |
| 3 | Interactive Affordances | /10 | | |
| 4 | Empty States & Edge Cases | /10 | | |
| 5 | Page Real Estate | /10 | | |
| 6 | Navigation & Wayfinding | /10 | | |
| 7 | Workflow Completeness | /10 | | |
| 8 | Microinteraction Quality | /10 | | |
| **Total** | | **/80** | | |

**Score interpretation:**

| Range | Assessment | Industry Comparison |
|-------|-----------|-------------------|
| 65-80 | Excellent | Top-tier SaaS (Stripe, Linear level) |
| 50-64 | Good | Competitive, some gaps |
| 35-49 | Below Average | Significant UX debt, users notice |
| 20-34 | Poor | Users actively frustrated |
| Below 20 | Critical | Product feels broken or prototype-level |

### Priority Classification

Combine severity (0-4) × confidence (C1-C3) to determine implementation priority:

| | C1 (Certain) | C2 (High) | C3 (Probable) |
|---|---|---|---|
| **Severity 4** | P0 — Fix immediately | P0 — Fix immediately | P1 — Verify then fix |
| **Severity 3** | P1 — Next sprint | P1 — Next sprint | P2 — Verify first |
| **Severity 2** | P2 — Scheduled fix | P2 — Scheduled fix | P3 — Backlog |
| **Severity 1** | P3 — When convenient | P3 — When convenient | Backlog |

### Mandatory Audit Report Structure

Every review must produce this deliverable:

```
1. EXECUTIVE SUMMARY
   - Total score (/80) with dimension breakdown
   - Top 5 findings by priority (P0 first)
   - Estimated total effort to resolve P0-P1 findings
   - Risk assessment if findings are not addressed

2. DATA UTILIZATION MAPS
   - One map per major page
   - Fetches vs. Displays vs. Missing
   - Utilization percentage

3. FINDINGS REGISTRY
   For each finding:
   - ID (UX-001, UX-002...)
   - Title (one sentence)
   - Severity (0-4 with justification: frequency × impact × persistence)
   - Confidence (C1/C2/C3 with evidence source)
   - Priority (P0-P3)
   - File path and line number
   - Problem description (what's wrong, why it matters)
   - Fix specification (exact changes, new components needed)
   - Effort estimate (hours)
   - Heuristic violated (which of Nielsen's 10)
   - Dimension (#1-8)

4. DIMENSION DETAIL
   - Per-dimension score with justification
   - Per-dimension top findings

5. IMPLEMENTATION ROADMAP
   - Phase 1: Quick wins (see format below)
   - Phase 2: Structural changes
   - Phase 3: Feature-level changes
```

---

## Phase 4: Produce the Implementation Roadmap

Every finding must be actionable. No vague suggestions.

### Quick Wins (< 2 hours each)

Format for each:
```
ID: UX-003
WHAT: Add cursor:pointer and hover states to time range selector buttons
FILE: app/components/TimeRangeSelector.tsx (line 28)
CHANGE: Add to .time-btn class:
  cursor: pointer;
  transition: background-color 150ms ease, transform 200ms ease-out;
  &:hover { background-color: var(--surface-hover); }
  &:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  &:active { transform: scale(0.98); }
DIMENSION: #3 (Interactive Affordances)
SEVERITY: 3 → PRIORITY: P1
EFFORT: 15 minutes
```

### Structural Changes (2-8 hours each)

Format for each:
```
ID: UX-007
WHAT: Add executive summary section to brand detail page
FILES: app/brands/[id]/page.tsx, components/BrandSummary.tsx (new)
REQUIRES:
  - Create BrandSummary component with 4 KPI cards (metric + delta + sparkline + trend + label)
  - Query: aggregate campaign metrics for this brand
  - Data: total spend, budget utilization, avg performance, trend
DESIGN: 4-column KPI grid above existing content. Cards follow the 5-element standard.
DIMENSION: #1 (Data Utilization), #5 (Page Real Estate)
SEVERITY: 3 → PRIORITY: P1
EFFORT: 4-6 hours
```

### Feature-Level Changes (8+ hours)

Format for each:
```
ID: UX-012
WHAT: Add performance charts to dashboard and detail pages
FILES: Multiple components + chart library integration
REQUIRES:
  - Chart library (recharts recommended for React)
  - Time-series data aggregation utility
  - Responsive chart containers with skeleton loading
  - 4 chart types: trend line, bar comparison, donut status, area spend
  - prefers-reduced-motion: static chart snapshots
DIMENSION: #1 (Data Utilization), #5 (Page Real Estate)
SEVERITY: 3 → PRIORITY: P1
EFFORT: 16-24 hours
```

---

## Phase 5: Verification Pass (MANDATORY — never skip)

Before presenting findings, run these verification checks:

### Check 1: Finding Accuracy
For every P0 and P1 finding, re-read the file you cited. Confirm:
- [ ] The file path is correct and the file exists
- [ ] The line number is approximately correct
- [ ] The code actually does what you said it does
- [ ] The fix you proposed is technically feasible in this codebase

### Check 2: Severity Calibration
Review all severity ratings together. Ask:
- [ ] Are there any Severity 4 findings? If not, is that actually correct? (Most SaaS apps have at least one)
- [ ] Is the severity consistent? (Two similar findings shouldn't differ by 2+ severity levels)
- [ ] Did frequency, impact, and persistence all factor into each rating?

### Check 3: Coverage Completeness
- [ ] Every major page has a Data Utilization Map
- [ ] Every dimension has at least one finding or an explicit "no issues found"
- [ ] Interaction CSS was grepped (not guessed from screenshots)
- [ ] At least one workflow was traced step-by-step with cognitive walkthrough questions

### Check 4: Actionability
- [ ] Every finding has a file path
- [ ] Every fix is specific enough for a developer to implement without asking questions
- [ ] Effort estimates are realistic (not everything is "15 minutes")
- [ ] The roadmap has a clear Phase 1 → 2 → 3 progression

---

## Phase 6: Competitive Benchmark (Optional but Recommended)

If time allows, compare the product against 2-3 competitors on the same 8 dimensions.

| Dimension | This Product | Competitor A | Competitor B | Industry Avg |
|-----------|-------------|-------------|-------------|-------------|
| Data Utilization | 4/10 | 7/10 | 8/10 | 6/10 |
| Information Architecture | 5/10 | 7/10 | 6/10 | 6/10 |
| Interactive Affordances | 3/10 | 8/10 | 7/10 | 6/10 |
| ... | ... | ... | ... | ... |

**SUS score estimation:** Based on your /80 score, estimate the SUS equivalent.
The average SUS across all products is 68. Scores ≥ 80 = Grade B (Good).
Scores < 60 = Grade F. This gives stakeholders a familiar benchmark.

---

## Phase 7: Deliver the Report (MANDATORY)

Every review must produce **two outputs** — a saved file AND a chat summary.

### Output 1: Saved Report File

Write the full audit report as a markdown file in the project directory:

```bash
# Save to the project root (adjust path if needed)
# Filename: ux-audit-YYYY-MM-DD.md
```

The file must contain the **complete** Mandatory Audit Report Structure from Phase 3:
1. Executive Summary (score, top 5 findings, effort estimate, risk assessment)
2. Data Utilization Maps (one per major page)
3. Findings Registry (every finding with ID, severity, confidence, file path, fix spec)
4. Dimension Detail (per-dimension scores and top findings)
5. Implementation Roadmap (quick wins → structural → feature-level)

**Include the competitive benchmark** (Phase 6) if it was produced.

**This file is the permanent artifact.** It survives context resets, can be shared with
the team, and serves as the implementation checklist. Without it, the audit is ephemeral.

### Output 2: Chat Summary

After saving the file, present a concise summary in the chat:

```
## UX Audit Complete — [Score]/80

**Top 5 Findings:**
1. [P0] Finding title — file path — severity/confidence
2. [P1] Finding title — file path — severity/confidence
3. ...

**Dimension Scores:** D1: X | D2: X | D3: X | D4: X | D5: X | D6: X | D7: X | D8: X

**Quick Win Count:** N findings fixable in < 2 hours
**Estimated Total Effort:** X hours for P0-P1 findings

📄 Full report saved to: [path/to/ux-audit-YYYY-MM-DD.md]
```

**The chat summary is the quick read. The file is the reference.** Always produce both.

---

## Integration with design-engine

This skill runs as part of the **Category E: Design Review** chain in design-engine.

**Chain position:**
```
image-analysis (color audit) → product-ux-review (product audit) → design-critique (visual audit) → interface-design (reference mode) → responsive-design
```

**What this skill feeds forward:**
- Data utilization maps → design-critique uses for "aesthetic and minimalist design" (heuristic #8)
- Interactive affordance findings → design-critique uses for "discoverability" (dimension #5)
- Page real estate analysis → design-shotgun uses to inform redesign directions
- Severity-rated findings → implementation roadmap in final deliverable

**What this skill receives:**
- From image-analysis: color palette, contrast ratios, section breakdown
- From Phase 0: project context, available skills, OpenTabs status

---

## Anti-Patterns

1. **Reviewing without reading the code.** This skill's entire value is that it
   understands the product. If you skip Phase 1 (data model, routes, workflows),
   you're just doing a worse version of design-critique.

2. **Listing problems without file paths.** Every finding must include the specific
   file and line. "The dashboard is sparse" is not a finding. "app/dashboard/page.tsx
   fetches 8 campaign objects but only renders a count" is a finding.

3. **Ignoring interaction-level CSS.** cursor:pointer, hover states, focus states,
   disabled states — these are invisible in screenshots but critical to feel. Grep
   the CSS, don't guess.

4. **Evaluating the design without understanding the domain.** A campaign management
   tool has different UX requirements than a social media app. Know the product
   category and its benchmark products before scoring.

5. **Producing visual-only findings.** "The color contrast is low" is design-critique's
   job. This skill's job is: "The brand detail page fetches performance data but
   only shows a status donut. Add KPI cards for spend, performance, and trend."

6. **Rating severity by gut feel.** Use the Nielsen 0-4 scale with the three
   factors (frequency × impact × persistence). "This feels like a P1" is not
   acceptable. "This affects >75% of users, blocks task discovery, and occurs
   every session = Severity 3 = P1" is acceptable.

7. **Skipping the verification pass.** Phase 5 exists because Claude Code has a
   proven failure mode: it reports findings from memory instead of from the actual
   code. Re-read every file you cited before presenting findings.

8. **Proposing fixes without understanding the tech stack.** If the app uses Tailwind,
   your fix should use Tailwind classes. If it uses CSS modules, use CSS modules.
   Read the existing patterns before writing fix specifications.

---

## Reference: Nielsen's 10 Heuristics (for finding classification)

Each finding should reference the violated heuristic:

| # | Heuristic | What This Skill Checks For |
|---|-----------|---------------------------|
| 1 | Visibility of system status | Loading states, progress indicators, real-time feedback |
| 2 | Match between system and real world | Domain-appropriate language, user mental model alignment |
| 3 | User control and freedom | Undo, cancel, back navigation, escape from modals |
| 4 | Consistency and standards | Same patterns across pages, platform conventions |
| 5 | Error prevention | Confirmation dialogs, disabled invalid actions, constraints |
| 6 | Recognition rather than recall | Labels, breadcrumbs, visible options, CTA placement |
| 7 | Flexibility and efficiency | Keyboard shortcuts, command palette, bulk actions, filters |
| 8 | Aesthetic and minimalist design | Data density, real estate utilization, noise removal |
| 9 | Help users recognize, diagnose, recover from errors | Error messages, inline validation, recovery paths |
| 10 | Help and documentation | Onboarding, tooltips, contextual help, empty state guidance |

---

## Reference: ARIA Audit Quick-Check

When auditing interactive elements, also check these ARIA requirements:

| Component | Semantic HTML | Required ARIA (if custom) | Keyboard |
|-----------|-------------|--------------------------|----------|
| Button | `<button>` | role="button", tabindex="0" | Enter/Space to activate |
| Link | `<a href>` | role="link" | Enter to follow |
| Tab group | — | role="tablist" + role="tab" + aria-selected | Arrow keys to switch |
| Dialog | — | role="dialog", aria-modal="true", aria-labelledby | Escape to close, focus trap |
| Menu | — | role="menu" + role="menuitem" | Arrow keys, Escape |
| Combobox | — | role="combobox", aria-expanded, aria-controls | Arrows, Escape, Enter |
| Active page | — | aria-current="page" on nav item | — |
| Error field | — | aria-invalid="true", aria-describedby | — |
| Live update | — | aria-live="polite" (status) or "assertive" (alert) | — |
| Skip nav | `<a href="#main">` | — | Tab to reveal, Enter to skip |

**First rule of ARIA:** If a native HTML element does the job, use it. Bad ARIA is
worse than no ARIA — sites with ARIA average 41% more accessibility errors than
sites without (WebAIM research).

---

# SKILL v2.0 — Expansion Layer (2026-04-07)

Everything above this line is v1.0 (the 8-dimension heuristic-driven audit). Everything below this line is v2.0 — added after the TBK Ads audit (2026-04-07) exposed that the v1 skill was missing domain playbooks, strategy-platform framing, schema-parity auditing, business-model checks, multi-tenancy lenses, retention narratives, and the hard requirement to dispatch parallel Explore agents in Phase 1. v2.0 extends v1 — it does not replace it. When v2 conflicts with v1, v2 wins.

v2.0 adds: Phase 0 (Product Type Classification), Dimensions 9–16, a mandatory parallel-discovery rule, 8 domain playbooks, a schema-vs-UI parity protocol, a business-model audit, a multi-tenancy/collab audit, a primitives-library audit, a copy/microcopy audit, a discoverability audit, and a Day-1/7/30 retention narrative that every audit must produce. v2.1 adds the meta-design sibling cross-cite and theory-bank tag convention. v2.2 (2026-04-08) adds Dimension 17 (Journey-Level Boundary Audit) — invokes the standalone `journey-audit` skill to trace user journeys across system boundaries, catching implicit contracts, race conditions, and production-only failures that file-level dimensions structurally miss.

---

## Phase 0: Product Type Classification (MANDATORY — run before Phase 1)

Before judging any product, classify what kind of product it is. The same feature gap can be a P0 on one product type and Not-A-Problem on another. The TBK Ads audit failure mode (marking "no Google Ads API write" as P0 when the product is a strategy platform by design) happened because v1 had no classification step.

Classify the product on two axes:

**Axis A — Functional category (pick one):**
1. **Planning/Strategy tool** — outputs are documents, templates, briefs, playbooks. Value = synthesis and recommendation quality. Examples: TBK Ads, Notion AI, Perplexity Pages, strategy consulting tools.
2. **Execution platform** — outputs are actions taken in external systems. Value = speed, throughput, reliability. Examples: Google Ads UI, Linear, Buffer, Zapier.
3. **Measurement/Reporting tool** — outputs are dashboards, reports, alerts. Value = data freshness, analytical depth, clarity. Examples: GA4, Metabase, Datadog.
4. **Hybrid platform** — spans two or more above. Value = closed-loop completeness. Examples: HubSpot, Skai, Smartly.
5. **Collaboration/Workflow tool** — outputs are coordinated team activity. Value = multi-user mechanics, permissions, activity feeds. Examples: Figma, Slack, Linear.
6. **Creation tool** — outputs are user-created artifacts (docs, designs, code, media). Value = editing experience, iteration speed. Examples: Figma, VS Code, Canva.
7. **Marketplace/Network** — outputs are matches between parties. Value = liquidity, trust, search. Examples: Upwork, Airbnb.
8. **Dev tool / Infrastructure** — outputs are developer productivity. Value = latency, reliability, ergonomics. Examples: Vercel, Stripe, Datadog.

**Axis B — Vertical (pick the closest):**
Paid ads · Analytics · CRM · Support/helpdesk · Fintech/payments · Healthtech/EHR · EdTech/LMS · E-commerce · Dev tools · HR/people · Legal · Real estate · Content/media · Other.

**Document the classification explicitly at the top of the audit report before any finding is written.** Every P0/P1 must be defensible against the classification: "this is a P0 for a [category] + [vertical] product because a reasonable peer (X, Y, Z) ships it." If you can't name three peers that ship the thing you're calling a P0, downgrade it.

### The Strategy-Platform Legitimacy Rule

If Axis A = Planning/Strategy tool:
- **Execution gaps are NOT automatic P0s.** Not shipping a Google Ads API write, a campaign launcher, or a bulk sync is legitimate product scoping, not a bug. Judge against strategy-platform peers (e.g., for paid ads: consulting deliverables, agency briefs, Google's own keyword planner + templates), not execution platforms (Skai, Smartly, Optmyzr).
- **Measurement/reporting quality becomes the P0 lane instead.** A strategy tool must analyze imported data exceptionally well, because that's where the value-capture happens.
- **The strategic artifacts must be the best in class.** Structure quality, keyword taxonomy, ad-copy variation, brief conversation depth, template diff/version comparison — these are all P0 for a strategy tool and P2 for an execution platform.
- **The imported data loop must be frictionless.** If the user has to import manually, the import UX, column mapping, error surfacing, and re-import flow must be great.

Apply the equivalent rule to every other product type. An analytics tool is not broken for lacking write-back to the source system. A creation tool is not broken for lacking real-time collaboration if the positioning is single-player. Do not invent missing features that the product didn't promise.

---

## Phase 1 Addendum: Parallel Discovery Is Mandatory (rule D1)

v1 describes Phase 1 as a sequential "understand the product" pass. For any non-trivial audit (more than ~5 pages, more than ~3 entities, or any product with a real data model) this is banned. Discovery must dispatch 3+ Explore agents in parallel along orthogonal lenses. Single-threaded discovery misses half the findings — this is the lesson from the TBK Ads audit on 2026-04-07 and from the TBK Ads Meta-Design Audit on the same day.

**Minimum four lenses for any commercial SaaS:**

1. **Routes / IA / Navigation** — every page.tsx, layout.tsx, middleware.ts, breadcrumb component, sidebar, onboarding redirect. Output: full route map, post-signin journey, hierarchy consistency, empty-state coverage, orphan routes, dashboard content vs. user expectations, URL patterns (RESTful vs. opaque).

2. **Components / Design Tokens** — components/ui primitives, globals.css, tailwind config, theme tokens, dark mode wiring, skeleton primitives, spinner reuse, toast system, chart color sourcing, icon library, typography scale enforcement. Output: primitive completeness, token vs. hardcoded values, inconsistencies, density/compact mode, button variant coverage.

3. **Forms / Mobile / Accessibility** — every form file, every modal, every dialog, chat component, destructive actions, auth flows. Output: client vs. server validation, inline error mapping, aria-describedby, required markers, multi-step draft persistence, disabled-during-submit, focus traps, aria-labels on icon buttons, mobile breakpoints, table scroll affordance.

4. **Domain UX** — pick the lens matching Axis B (paid-ads, analytics, CRM, support, fintech, healthtech, etc.). Use the matching playbook below. Output: is the data model matching how practitioners actually think? Which stages of the canonical workflow are present/missing/stubbed? What are the dead-code fields? What would make a paying customer churn on day 7?

**Optional fifth lens (for larger audits):**
5. **Business model / Multi-tenancy** — pricing, billing, seats, trials, paywalls, team/workspace schema, roles, invites, comments, activity log UI.

Each agent must be told: (a) the absolute path to the codebase, (b) exactly which directories and file types to inspect, (c) that it must cite file paths and line numbers, (d) that it must classify findings as Missing / Broken / Exists-but-Not-Wired with P0/P1/P2 severity, and (e) the product-type classification from Phase 0 so it calibrates severities correctly.

**After the agents return: grep-verify every count, path, and line number any agent reported before drafting the report** (rule D2). Use the verified number, not the agent's number.

---

## Dimension 9 — Closed-Loop Completeness (Type-Adjusted)

v1 dimension 7 ("Workflow Completeness") asks whether user workflows can be finished inside the product. v2 extends this with type-awareness.

For each product type, the "loop" is different:

| Product type | The loop | P0 question |
|---|---|---|
| Planning/Strategy | Brief → Analyze → Synthesize → Output → Iterate | Can the user iterate on the synthesis? Is there version/diff history on generated artifacts? |
| Execution | Plan → Act → Verify → Adjust | Can the user act inside the product, verify the action took, and adjust without leaving? |
| Measurement | Ingest → Slice → Detect → Alert → Share | Is the data fresh? Can the user slice it? Are anomalies surfaced? Can insights be shared? |
| Hybrid | All of the above | Is each stage present or does the product dump the user into another tool? |
| Collaboration | Invite → Co-create → Comment → Resolve → Record | Are multi-user mechanics actually wired or is it single-player? |
| Creation | Create → Preview → Revise → Export → Share | Does preview match export? Is revision non-destructive? |
| Marketplace | List → Match → Transact → Rate | Is liquidity visible? Is trust signaled? |
| Dev tool | Configure → Invoke → Observe → Debug | Is the feedback loop tight? Are failures diagnosable without leaving? |

**Write the loop explicitly in the audit report** and mark each stage Present / Partial / Stub / Missing with evidence. The composite score on this dimension drives the product's retention narrative.

---

## Dimension 10 — Schema-vs-UI Parity (the dead-code lens)

v1 mentions "exists-but-not-wired" but doesn't systematize it. v2 requires a mechanical grep-based parity protocol.

**Protocol:**

1. Enumerate every entity, column, and enum in the schema file(s). For Drizzle/Prisma: parse the schema. For Supabase: read the migrations. For plain SQL: read the DDL. Output a flat list: `table.column : type`.
2. For each column, grep the UI layer for reads: `grep -rE "(column_name|columnName)" src/app src/components src/lib/actions`.
3. Classify each column: **Read-and-displayed** (found in a JSX render), **Read-but-buried** (found in actions/selectors but never rendered), **Never read** (not referenced outside the schema file).
4. For each enum, do the same. Enum values that never appear in a UI render are candidate dead code.
5. Output a parity table in the audit:

| Column/Enum | Status | Evidence | Finding |
|---|---|---|---|
| campaignMetrics.qualityScore | Never rendered | Schema only | P1: schema promises feature never built |
| alerts (entire table) | Never read | Schema only | P0 for a measurement-type product, P2 for strategy |
| importedPerformance.entity_type = "search_term" | Stored, never displayed | Import route reads it | P1: search-term reporting dead |

**Dead code is always a finding.** The severity depends on product type (the same dead alerts table is P0 for a measurement tool, P2 for a strategy tool). The finding is real either way because it signals either incomplete execution or stale planning — both are product debt.

---

## Dimension 11 — Business Model Audit

v1 never checks pricing, billing, seats, or paywalls. For any commercial SaaS, this is a required dimension.

**Checklist (cite files+lines or state "absent"):**

- Is there a pricing page? (`grep -rE "pricing|plans|subscription" src/app`)
- Is Stripe (or equivalent) wired? (`grep -rE "stripe|paddle|lemonsqueezy" package.json src/`)
- Are there plan tiers or feature gates? Where enforced?
- Is there a trial period? How is it enforced (time-based, usage-based, feature-based)?
- Is there usage metering (rate limits, quotas)? Is it shown to the user?
- Is there a seat/team model? Can users be invited? What do seats cost?
- Is there a billing settings page? Past invoices? Payment method update?
- Is there dunning logic for failed payments?
- Is there a paywall or upsell CTA on gated features?
- Is there a checkout flow for the user (or is everything free/manual)?

**Absence is a finding for a commercial product, but not a bug for a pre-revenue internal tool.** Always classify the product's commercial state at Phase 0 (pre-revenue / free beta / paid / enterprise) before judging.

---

## Dimension 12 — Multi-Tenancy & Collaboration Audit

v1 has no collaboration lens. For any B2B SaaS this is mandatory.

**Checklist:**

- Is there a `workspace`, `team`, `organization`, or `account` entity in the schema, or is everything tied to a single `userId`?
- Can a resource (brand, project, document, dashboard) have multiple owners/editors/viewers?
- Is there an invite flow? Can users be added by email? Are invites auditable?
- Are roles defined (admin/member/viewer/guest) and enforced in the data access layer?
- Are there comments on resources? Mentions? Notifications?
- Is there an activity log / audit trail, and does it have a UI view (not just a table)?
- Can resources be shared externally (read-only link, embed, public view)?
- Is there ownership transfer (e.g., when an employee leaves)?
- Are resources soft-deleted or hard-deleted? Is there a trash/recovery flow?
- Does the auth provider (Clerk, Supabase, Auth0, Firebase) have teams/orgs configured?

**An agency-facing product with no team model is P0.** A solo-user tool can legitimately skip teams. Classify in Phase 0.

---

## Dimension 13 — Primitives Library Audit

v1 dimension 2 checks IA; v1 dimension 8 checks microinteractions. Neither checks whether there's a real component library or whether forms/modals are re-declared per page.

**Checklist:**

- Is there a `components/ui` (or equivalent) folder with named primitives?
- Confirm presence of: `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Dialog`/`Modal`, `Popover`, `Tooltip`, `Toast`, `Skeleton`, `Spinner`, `EmptyState`, `Badge`, `Avatar`, `Card`, `Table`, `Tabs`, `Accordion`, `Separator`, `Alert`, `Label`, `Breadcrumbs`, `Pagination`, `Command`/`CommandPalette`, `Icon`.
- For each absent primitive, grep for its implementation pattern: e.g., `<input` raw HTML, `<button` without the Button component, ad-hoc `dialog` divs with focus traps. Each re-declaration is a finding.
- Are primitives token-wired? Grep for hex codes inside `components/ui`: `grep -rE "#[0-9a-fA-F]{3,6}" src/components/ui` — any hit is a finding.
- Are variants defined via a central system (cva, class-variance-authority, or equivalent) or inline classes?
- Is there a Storybook or equivalent? If yes, how many primitives are covered?
- Are primitives documented with prop tables?

**Missing primitives are near-always P1.** They produce cascading inconsistency across every form and modal in the app.

---

## Dimension 14 — Copy & Microcopy Audit

v1 has no copy dimension. For most SaaS products, copy is worth more than visual polish.

**Checklist:**

- Helper text under every important input? (`grep -rE "aria-describedby|helper|hint" src/components/forms`)
- Error messages: specific ("Budget must be ≥ $10/day") vs. generic ("Something went wrong")? Grep error strings.
- Empty-state copy: does it explain what the feature does + what to do next, or just say "no data"?
- CTA verbs: imperative and specific ("Create campaign", "Connect Google Ads") vs. vague ("Submit", "OK")?
- Confirmation copy on destructive actions: names the thing being deleted? Explains consequences? Requires typing the name back?
- Loading states: named ("Generating strategy…") vs. generic ("Loading…")?
- Success toasts: named ("Campaign 'Fall Sale' created") vs. generic ("Saved")?
- Time formatting: relative ("2 hours ago") vs. absolute? Consistent app-wide?
- Number/currency formatting: locale-aware, consistent decimal precision, thousands separators?
- Sentence case vs. title case: consistent?

Record 3–5 specific copy findings and cite the file+line.

---

## Dimension 15 — Discoverability Audit

v1 dimension 6 (Navigation & Wayfinding) checks that nav exists. It doesn't check whether features can actually be *found*.

**Checklist:**

- For each feature the user might want, answer: "Starting from `/dashboard`, how many clicks to reach it? Is it discoverable without someone telling me?"
- Are there features hidden behind collapsed sidebar branches? (TBK Ads example: Structure View only reachable by expanding a brand node.)
- Are there pages that exist in the routing but are never linked from any other page? Grep for the route pattern and count links.
- Is there a command palette (Cmd/Ctrl+K)? Does it index all pages, not just some?
- Is there search across primary entities (brands, campaigns, contacts, whatever)?
- Are there tooltips or hover hints on icon-only buttons explaining what they do?
- Is there onboarding or a feature tour pointing users to high-value screens the first time they see them?
- Is there a "What's new" or changelog pointer when new features ship?
- Are keyboard shortcuts listed anywhere? (`grep -rE "keyboard|shortcuts|hotkey"`)

**Any feature not reachable in ≤3 clicks from `/dashboard` without prior knowledge is a finding.**

---

## Dimension 16 — Data Freshness & Staleness

v1 dimension 1 (Data Utilization) checks whether data is displayed. v2 extends with: *when was this data last refreshed, and does the user know?*

**Checklist:**

- For every metric/chart/table shown to the user, answer: where does this data come from, and when was it last updated?
- Is there a visible "Last updated" timestamp on each dashboard/report?
- Is there a manual refresh button? Does the user know they can refresh?
- Is the data live (websocket/polling), eventually consistent (query on navigation), or static (imported once)?
- If static: is there a prominent indicator telling the user so? Is there a clear path to trigger a re-ingest?
- Are there scheduled syncs? Where is the schedule configured? Is sync health visible to the user?
- On sync failure, is the user notified? Is there a retry?
- If the product has both live and static data, are they visually distinguished?

**Static data presented without a staleness indicator is always a finding** because the user will make decisions assuming freshness.

---

## Dimension 17 — Journey-Level Boundary Audit

v2 dimensions 1–16 examine the product page by page and component by component. That catches UX gaps, missing affordances, dead schema columns, and craft issues. It does not catch bugs that live at system boundaries — the handoff between frontend and API, API and database, backend and third-party service, webhook and state activation. These boundary-crossing failures are invisible to any audit that reads one file at a time, because both sides of the boundary look correct in isolation.

This dimension invokes the standalone `journey-audit` skill with workflow context pre-populated.

**When to run:** Mandatory for any product that has a payment flow or multi-step onboarding. Recommended for all products with 3+ system boundaries in their primary user journey.

**Scope:** Audit the product's **primary onboarding-to-first-value journey**. If the product has a payment/checkout flow, that journey is mandatory. If time permits, audit a second journey (sharing, collaboration, or export).

**How to invoke:**

1. Identify the primary journey from Phase 1 discovery output. The journey is the sequence from the user's entry point (landing page, invite link, API key page) through every intermediate step to the success state (first dashboard load, first report generated, first analysis complete).

2. Run the `journey-audit` skill with these pre-populated inputs:
   - **Journey name:** from Phase 1 discovery
   - **Product type:** Axis A + Axis B from Phase 0
   - **Known symptoms:** any drop-off or abandonment signals found during discovery

3. The journey-audit skill runs its full 6-phase playbook (scope → map → audit boundaries → journey-type checklist → production conditions → deliver).

4. Journey-audit findings use the workflow's **F x I x P x R severity formula** instead of the skill's standalone P0/P1/P2 mapping:
   - **Frequency:** Journey findings score 4-5 (every user hits the primary journey).
   - **Impact:** Boundary failures that block completion score 5. Friction-only failures score 2-3.
   - **Persistence:** Implicit contracts score 4-5 (no workaround — the system is structurally broken).
   - **Reversibility:** Post-payment dead-ends and half-created states score 5 (trust-destroying, potentially irrecoverable without support intervention).

5. Journey-audit findings should cite **theory-bank tags** where applicable:
   - `[doherty]` — latency-induced abandonment at slow boundaries
   - `[jakob-law]` — violated expectations when the system behaves differently from what the user experienced on peer products
   - `[norman-gulf]` — evaluation gap when the system gives no feedback after a boundary crossing (user can't tell if it worked)
   - `[nielsen-error]` — missing error recovery at boundary failure points
   - `[tesler]` — complexity hidden behind an implicit contract instead of surfaced to the user

6. **Findings feed the retention narrative.** Any P0 journey finding (F x I x P x R >= 48) that blocks first-value or causes post-payment dead-ends becomes a Day-1 churn risk in Phase 6. Journey findings that cause friction without blocking (score 24-47) become Day-7 churn risks.

**What this dimension catches that Dimensions 1–16 don't:**
- Implicit data contracts between systems (no shared type, no validation, both sides assume)
- Race conditions at handoff points (redirect arrives before session exists)
- Silent failure modes (webhook returns 500, Stripe retries, user never gets subscription)
- Production-only timing issues (local dev is fast; production under load is not)
- State leakage across journey attempts (stale cookies, abandoned database rows, cached auth tokens)
- Missing error recovery at boundary crossings (user stuck in half-state with no way forward)

**What this dimension does NOT cover (already covered by Dimensions 1–16):**
- Single-file logic errors (Dimension 7 — Workflow Completeness)
- Missing UI elements (Dimension 1 — Data Utilization)
- Visual design issues (meta-design skill)
- Schema dead code (Dimension 10 — Schema-vs-UI Parity)

---

## Domain Playbooks

Every domain has a canonical workflow and a set of features users will look for immediately. The audit must compare the product against the matching playbook and grade each stage Present / Partial / Stub / Missing.

When v2 adds a domain playbook, the matching Axis-B vertical gets a 20–40 line inline spec: the canonical loop, the table-stakes features, the "peers-already-ship-this" list, and the day-7 churn triggers. Eight starter playbooks below.

### Playbook — Paid Ads (Google Ads, Meta Ads, Skai, Smartly, Optmyzr)

**Canonical loop:** Brief → Campaign structure → Keyword/audience research → Creative → Budget & bid → Launch → Measure → Optimize → Report.

**Table-stakes features:**
- Brand/account/campaign/ad-group/ad/keyword entity hierarchy
- Brief collection (objective, budget, geo, language, audience, conversion type, timeline)
- Keyword research with live volume, CPC, competition, and a picker UI (user sees and filters before baking into strategy)
- Ad-copy generation with headline/description variants and character counters
- Negative keyword management as a first-class editable list
- Search-term report (what actual queries drove clicks) with one-click "add to negatives" or "expand to keyword"
- Performance dashboard: impressions, clicks, CTR, CPC, CPA, ROAS, conversion volume, quality score, impression share loss (budget/rank), spend pacing vs. daily budget
- Budget pacing indicator with "on track / over / under"
- Anomaly alerts: CPC spike, CTR drop, QS drop, IS loss, budget exhausted, conversion drop, ROAS below target
- Trend analysis: % change vs. prior period, MoM growth, forecast
- Multi-level drill-down (account → campaign → ad group → keyword/ad) with performance at every level
- Template/version diff on regenerated strategy
- Export: PDF/DOCX for client delivery + CSV/Google Ads Editor format for operator upload

**Strategy-platform vs. execution-platform split:**
- Strategy platforms can skip: campaign push, live bid adjustment, scheduled syncs, Google Ads Editor format export (PDF/DOCX is enough).
- Strategy platforms must nail: brief depth, keyword research UI, structure quality, ad-copy variant quality, imported performance analysis, template diff.

**Day-7 churn triggers (strategy positioning):**
- User cannot see or filter the keyword list before it gets baked into the strategy.
- Regenerating a strategy produces a new doc but no diff vs. the old one.
- Imported performance data has no "last synced" indicator and no refresh.
- Dashboard shows campaign counts instead of performance metrics.
- No keyword-level performance (user can only see campaign-level).

### Playbook — Analytics (GA4, Mixpanel, Amplitude, PostHog, Metabase)

**Canonical loop:** Define event → Instrument → Ingest → Slice → Detect → Alert → Share.

**Table-stakes:** Event taxonomy editor, user/session/cohort definitions, funnels, retention curves, SQL or formula editor, segment builder, dashboard sharing (read-only links, embeds), scheduled reports, anomaly detection, annotations on time series, data freshness indicators, role-scoped access, warehouse sync/reverse-ETL, raw event explorer.

**Day-7 churn triggers:** Funnel drop-offs unexplained, no way to share a specific view, slow query UX, opaque data freshness, no annotation support.

### Playbook — CRM (Salesforce, HubSpot, Pipedrive, Attio, Close)

**Canonical loop:** Lead → Contact/account → Opportunity → Activity → Deal stage → Close → Retain/expand.

**Table-stakes:** Contact/company merge, duplicate detection, pipeline kanban with drag-between-stages, activity timeline (calls, emails, meetings), email sync (bidirectional), calendar sync, task management, pipeline reporting, list views with filters/save, custom fields, import mapper, enrichment integration, mobile parity, team visibility controls.

**Day-7 churn triggers:** No email sync, no duplicate detection, pipeline requires page refresh, mobile is broken, list views can't be saved.

### Playbook — Support/Helpdesk (Zendesk, Intercom, Help Scout, Linear Issues)

**Canonical loop:** Ticket in → Triage → Assign → Resolve → Measure → Iterate (KB + macros).

**Table-stakes:** Inbox views (assigned to me, unassigned, by priority, SLA breach), macros/saved replies, internal notes, @mentions, SLA tracking, CSAT surveys, knowledge base with article analytics, escalation rules, round-robin assignment, customer-side status page, integrations with chat/email/social.

**Day-7 churn triggers:** No SLA tracking, slow inbox, macros don't support variables, no CSAT.

### Playbook — Fintech/Payments (Stripe, Mercury, Ramp, Brex)

**Canonical loop:** Onboard → Verify → Transact → Reconcile → Report → Comply.

**Table-stakes:** KYC/KYB flows with status visibility, account overview with balance and pending, transaction ledger with search/filter/export, card management (issue, freeze, limits), ACH/wire initiation with confirmations, reconciliation tools, receipt capture, role-based spend controls, audit log, 2FA everywhere, webhook/API for integrations.

**Day-7 churn triggers:** Unclear verification status, slow search on transactions, no export, surprise fees, weak audit trail.

**PROHIBITED ACTIONS in any audit:** Never enter real financial data into a fintech product during testing. Screenshots only.

### Playbook — Healthtech/EHR (Epic, Athena, One Medical, Heidi, Abridge)

**Canonical loop:** Intake → Chart → Order → Document → Bill → Refer.

**Table-stakes:** Patient search (fast, typo-tolerant), problem list, medication list, allergy list with interaction checks, encounter templates, voice/AI scribe, CPT/ICD code helper, e-prescribe, order sets, secure messaging, task inbox, audit log, HIPAA-compliant access patterns.

**Day-7 churn triggers:** Slow patient search, clumsy documentation, no voice input, weak interop with labs/imaging, no mobile support for on-call.

### Playbook — Dev Tools (Vercel, Linear, Sentry, Datadog, GitHub)

**Canonical loop:** Code → Build → Deploy → Observe → Debug → Iterate.

**Table-stakes:** CLI that matches the dashboard, API that matches the CLI, fast build/deploy feedback, log streaming, error search with stack traces, GitHub/GitLab integration, role-scoped access, webhooks, per-env config, secrets management, status page, fast command palette.

**Day-7 churn triggers:** CLI and dashboard drift, slow logs, no search on errors, opaque builds, weak secrets UX.

### Playbook — E-commerce/DTC (Shopify, Stripe, Recharge, Klaviyo)

**Canonical loop:** Product → Listing → Cart → Checkout → Fulfill → Retain.

**Table-stakes:** Product catalog with variants, inventory sync, fast checkout (one-page, guest, Apple/Google Pay), order management with statuses, refund flow, shipping rate rules, tax rules, email marketing triggers, abandoned cart, subscription management, coupon/discount engine, analytics (conversion rate, AOV, LTV).

**Day-7 churn triggers:** Slow checkout, clumsy inventory, no subscription support, weak analytics, can't customize templates.

### When your vertical isn't covered

Write the playbook first. Take 20 minutes to research three real peer products, list their canonical loop and table-stakes features, then audit against it. Save the new playbook back into the skill (append to this section) so the next audit has it.

---

## Mandatory Output — Day-1 / Day-7 / Day-30 Retention Narrative

Every audit must include a prose narrative (not a table) at the end of the report answering:

- **Day 1:** What does a new user see, do, and feel on their first session? Do they reach a first-value moment ("I just created my first X and it looks great")? What friction is in the way?
- **Day 7:** What would cause a paying customer to churn between day 2 and day 7? Name three specific product gaps that map to cancellation. For each, say how much it would cost to close the gap and what the minimum viable fix looks like.
- **Day 30:** What keeps a power user coming back? Are there habits the product is building? Are there artifacts (dashboards, templates, workspaces) accumulating value over time? If nothing accumulates, the product has no retention moat.

This narrative is the thing an exec will actually read. The findings table supports it; it doesn't replace it.

---

## Mandatory Output — Strategy vs. Execution Scoring

Every audit must declare explicitly, at the top of the report:

```
Axis A (Functional category): [Planning/Strategy | Execution | Measurement | Hybrid | Collaboration | Creation | Marketplace | Dev tool]
Axis B (Vertical): [Paid ads | Analytics | CRM | Support | Fintech | Healthtech | EdTech | E-commerce | Dev tools | HR | Legal | Real estate | Content | Other]
Commercial state: [Pre-revenue | Free beta | Paid | Enterprise]
Peer reference set: [three named competitors]
Strategy-vs-execution split: [Strategy only | Execution only | Both | Measurement only]
```

Every P0 finding in the report must be defensible against this classification. If a reviewer could reasonably say "that's not a bug, the product is scoped as strategy-only," the finding is wrong and must be downgraded.

---

## Corrections to v1 — What v1 Got Wrong

- v1 had no Phase 0. Strategy/measurement/hybrid products got scored against execution-platform expectations. **Fixed in v2: Phase 0 classification is mandatory.**
- v1 described Phase 1 sequentially. Single-threaded discovery misses half the findings. **Fixed in v2: parallel Explore agents on 4+ orthogonal lenses are mandatory.**
- v1 mentioned "exists-but-not-wired" as a concept but had no protocol. **Fixed in v2: Dimension 10 adds a mechanical grep-based schema-vs-UI parity protocol.**
- v1 had no business-model, multi-tenancy, primitives, copy, discoverability, or freshness lenses. **Fixed in v2: Dimensions 11–16 added.**
- v1 had no domain knowledge. Audits had to invent peer benchmarks from scratch every time. **Fixed in v2: eight starter playbooks with canonical loops and day-7 churn triggers.**
- v1's output was a findings table. Execs don't read tables. **Fixed in v2: the Day-1/7/30 retention narrative is a mandatory output.**
- v1 had no calibration against commercial state. Pre-revenue tools got the same P0 bar as paid SaaS. **Fixed in v2: commercial state is declared at Phase 0 and modulates severity.**

---

## Integration with the /product-ux-audit workflow

v2 is designed to be invoked by the `/product-ux-audit` workflow (see `Organizing Claude Code/workflows/Curated/Product-UX-Audit/`). When invoked via the workflow, this skill runs as **Phase 5a — experience lens**, immediately followed by **Phase 5b — craft lens (`meta-design` skill)**. The two skills share Phase 0 calibration, the theory bank, and the F × I × P × R severity formula. They differ in what they grade.

**product-ux-review owns:** information architecture, flow, heuristic walkthrough, data utilization, schema parity, domain playbook, retention narrative (Day 1 / 7 / 30), copy/microcopy, empty-state recovery semantics.

**meta-design owns:** design tokens, typography system, vertical rhythm, hierarchy/visual weight, color contrast (WCAG quantitative), density, grid/alignment, the 9-state visual system, motion, iconography, imagery/data viz, empty/error/loading craft, dark mode parity, responsive/touch targets, brand coherence.

**Joint findings** (e.g. a button that is neither dominant enough nor labeled correctly) are tagged `LENS = both` when Phase 5a and 5b outputs are merged.

When invoked standalone outside the workflow, this skill may still reference theory-bank.md tags if the workflow folder is accessible. Every P0 and P1 should carry at least one `[tag]` from `Organizing Claude Code/workflows/Curated/Product-UX-Audit/theory-bank.md` (36 entries, 9 parts). This is a hard requirement inside the workflow and a strong convention standalone.

The workflow is the recommended entry point for any audit over 5 pages. Standalone invocation is fine for single-screen reviews, but the craft axis will be under-audited without the sibling meta-design pass.

---

**End of SKILL v2.0 addendum. v1 methodology above remains the foundational layer — v2 extends it, not replaces it. v2.1 (2026-04-07) adds the meta-design sibling cross-cite and the theory-bank tag convention. v2.2 (2026-04-08) adds Dimension 17 (Journey-Level Boundary Audit) for cross-system contract and race condition detection.**
