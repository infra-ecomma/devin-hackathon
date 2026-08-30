---
name: design-prototype
description: "Generates interactive HTML prototypes from design system and IA specifications. Produces single-file HTML/CSS/JS prototypes of key pages with working navigation, interactive states, realistic mock data, variant generation for A/B decisions, and multi-viewport responsive verification."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Agent, WebSearch, WebFetch
version: 1.0
maintainer: TBK Labs
updated: 2026-04-10
type: skill
---

## When to use

Design specifications are prose. Prose is ambiguous. A 400-line Interface Specification describing "metric-first cards with inline sparklines" mean...
Generates interactive HTML prototypes from the Design System, IA, and Interface
Specifications. Produces single-file HTML/CSS/JS prototypes of key pages with
working navigation, interactive states, and realistic mock data. Supports variant
generation for A/B design decisions and optional Figma file generation. Renders
at multiple viewports for responsive verification. Triggers on: prototype, build
a prototype, interactive mockup, preview the design, make it clickable, show me
what it looks like, design preview, HTML prototype, variant comparison.

> **CHAIN:** Next in workflow → aidesigner-frontend


# design-prototype — See It Before You Build It

## 1. Why This Skill Exists

Design specifications are prose. Prose is ambiguous. A 400-line Interface Specification describing "metric-first cards with inline sparklines" means different things to different developers. A prototype eliminates ambiguity — it's the design made tangible before production code is written.

The prototype serves three purposes:

1. **Verification** — Does the design system, IA, and interface spec actually work when rendered? Do the content hierarchies make sense with real-ish data? Does the navigation flow?
2. **Stakeholder communication** — Non-technical stakeholders can click through a prototype. They can't read a design spec.
3. **Variant comparison** — For key design decisions identified in interface-design, produce side-by-side variants so the team can choose based on seeing, not imagining.

This skill does NOT produce production code. That's `code-generation`. Prototypes are single-file HTML/CSS/JS with no build step, no framework, no real data. They're disposable artifacts — their value is in what they reveal, not in what they ship.

## 2. Hard Gates

**Gate 1.** A Design System Specification must exist (`.claude/DESIGN-SYSTEM.md`). The prototype uses the exact tokens from the design system — it's a preview of the real thing, not an approximation.

**Gate 2.** An IA Specification must exist (`.claude/IA-SPEC.md`). The prototype renders the actual page structure and navigation, not a freeform layout.

**Gate 3.** Prototypes must be single-file HTML. No external dependencies, no build step, no CDN links that might break. A prototype that doesn't open in any browser with a double-click is not a prototype.

**Gate 4.** Navigation must work. Clicking a nav item must show the corresponding page/view. Clicking a list row must show the detail. The prototype demonstrates the IA, not just the visual design.

**Gate 5.** Mock data must be domain-specific. From the Classification Card's data model, populate the prototype with realistic entities. "Campaign: Summer Brand Awareness" not "Item 1."

## 3. Prerequisites

**Required:**
- Design System Specification (`.claude/DESIGN-SYSTEM.md`) — tokens for styling
- IA Specification (`.claude/IA-SPEC.md`) — pages, navigation, content hierarchy

**Strongly recommended:**
- Interface Specification (`.claude/INTERFACE-SPEC.md`) — visual design decisions, signatures
- Classification Card (`.claude/CLASSIFICATION.md`) — domain context, data model for mock data

**Optional:**
- Design Intent Documents — for reference visual comparison
- Domain Intelligence Report — for domain-specific data patterns

## 4. The Prototyping Process

### Phase 1: Scope Definition

Not every page needs a prototype. Define the prototype scope:

**Always prototype:**
- The primary landing page (dashboard/overview)
- One entity list → entity detail drill-down flow
- The navigation system (sidebar/top-nav with working links)
- At least one form interaction
- At least one empty state and one loading state

**Prototype if relevant:**
- Comparison views (if the product has them)
- Settings page (if it has non-trivial UI)
- Onboarding flow (if defined in IA)
- Mobile viewport of the primary page

### Phase 2: Token Injection

Convert Design System tokens into CSS custom properties at the top of the prototype file:

```html
<style>
  :root {
    /* Colors — from DESIGN-SYSTEM.md */
    --color-primary-500: [value];
    /* ... all color tokens */

    /* Spacing — from DESIGN-SYSTEM.md */
    --space-xs: [value];
    /* ... all spacing tokens */

    /* Typography — from DESIGN-SYSTEM.md */
    --text-sm: [value];
    /* ... all type tokens */

    /* Shape — from DESIGN-SYSTEM.md */
    --radius-md: [value];
    /* ... all shape tokens */

    /* Motion — from DESIGN-SYSTEM.md */
    --duration-fast: [value];
    /* ... all motion tokens */
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-instant: 0ms;
      --duration-fast: 0ms;
      --duration-normal: 0ms;
      --duration-slow: 0ms;
    }
  }
</style>
```

**Every visual value in the prototype must reference a token.** This ensures the prototype accurately previews what the production code will look like.

### Phase 3: Page Construction

For each page in scope, build the HTML structure following the IA spec's content hierarchy and wireframe.

#### Structure Pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Product Name] — Prototype</title>
  <style>
    /* === RESET === */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* === TOKENS === */
    :root { /* ... from Phase 2 */ }

    /* === GLOBAL === */
    body {
      font-family: var(--font-sans);
      font-size: var(--text-base);
      color: var(--color-neutral-900);
      background: var(--color-neutral-50);
      line-height: var(--leading-normal);
    }

    /* === LAYOUT === */
    .app { display: flex; min-height: 100vh; }
    .sidebar { /* from IA nav architecture */ }
    .main { /* from IA page layout */ }

    /* === NAVIGATION === */
    /* Styles from INTERFACE-SPEC.md signature decisions */

    /* === COMPONENTS === */
    /* Per-component styles from INTERFACE-SPEC.md */

    /* === STATES === */
    .skeleton { /* loading skeleton animation */ }
    .empty-state { /* empty state pattern */ }
    .error-state { /* error state pattern */ }

    /* === RESPONSIVE === */
    @media (max-width: 1279px) { /* tablet */ }
    @media (max-width: 767px) { /* mobile */ }

    /* === TRANSITIONS === */
    /* From INTERFACE-SPEC.md motion specification */
  </style>
</head>
<body>
  <div class="app">
    <!-- Navigation from IA-SPEC.md -->
    <nav class="sidebar">
      <!-- Working nav links that show/hide page sections -->
    </nav>

    <main class="main">
      <!-- Page content sections — one per page in scope -->
      <!-- Only active page is visible -->
      <section id="page-overview" class="page active">
        <!-- From IA-SPEC.md content hierarchy for this page -->
      </section>

      <section id="page-entity-list" class="page">
        <!-- Entity list with clickable rows -->
      </section>

      <section id="page-entity-detail" class="page">
        <!-- Entity detail with back navigation -->
      </section>

      <!-- Additional pages as needed -->
    </main>
  </div>

  <script>
    // === NAVIGATION ===
    // Show/hide pages based on nav clicks and drill-down interactions

    // === INTERACTIONS ===
    // Click handlers for list rows, buttons, panels

    // === STATE SIMULATION ===
    // Toggle loading, empty, error states for demonstration

    // === RESPONSIVE BEHAVIOR ===
    // Sidebar collapse on mobile, layout adjustments
  </script>
</body>
</html>
```

### Phase 4: Interactive Behavior

The prototype must be interactive — not just a screenshot in HTML.

**Required interactions:**

| Interaction | Implementation |
|-------------|---------------|
| Navigation | Click nav item → show corresponding page section |
| Drill-down | Click list row → show detail view with entity data |
| Back navigation | Click back button → return to list view |
| Panel open/close | Click trigger → slide panel in/out (if Interface Spec uses panels) |
| Hover states | CSS `:hover` on all interactive elements |
| Active states | CSS `:active` on buttons and clickable elements |
| Focus states | CSS `:focus-visible` on all interactive elements |
| Tab order | Logical tab order through interactive elements |
| Sort simulation | Click table header → reorder rows (visual only) |
| Filter toggle | Click filter → show/hide filtered state |
| State demo | Button/controls to toggle loading/empty/error states |

**State demonstration controls:**
Add a small floating control panel (bottom-right corner) that lets the viewer toggle:
- Loading state (shows skeletons)
- Empty state (shows empty state messaging)
- Error state (shows error state)
- Mobile viewport simulation (constrains width)

```html
<div class="demo-controls">
  <button onclick="toggleState('loading')">Loading</button>
  <button onclick="toggleState('empty')">Empty</button>
  <button onclick="toggleState('error')">Error</button>
  <button onclick="toggleViewport('mobile')">Mobile</button>
</div>
```

### Phase 5: Mock Data Population

Populate the prototype with domain-specific data from the Classification Card.

**Mock data rules:**
- Entity names must be realistic for the domain (not "Item 1", "Test User")
- Numerical data must be plausible (not all round numbers, not all identical)
- Include edge cases in the data: long names, zero values, negative trends
- Dates should be recent and realistic
- Status distribution should be realistic (not all "active" or all "error")

```javascript
// Example for an ad platform
const mockCampaigns = [
  { name: "Summer Brand Awareness - Google", spend: 12450, roas: 3.2, status: "active", trend: "up" },
  { name: "Q2 Retargeting - Meta", spend: 8900, roas: 4.1, status: "active", trend: "stable" },
  { name: "Product Launch - YouTube (paused due to creative review)", spend: 3200, roas: 1.8, status: "paused", trend: "down" },
  { name: "Holiday Prep 2026", spend: 0, roas: 0, status: "draft", trend: "none" },
  // ... more with varied data
];
```

### Phase 6: Variant Generation (when applicable)

For key design decisions identified in the Interface Specification, generate alternative prototypes.

**When to generate variants:**
- Interface Spec has a signature decision with a noted alternative
- The team is debating between two approaches (sidebar vs top-nav, panel vs page navigation, etc.)
- The critique identified an area where two solutions could work

**Variant structure:**
Generate separate HTML files (or sections within one file) for each variant. Include:

```markdown
## Variant A: [Name]
File: prototype-variant-a.html
Decision tested: [which Interface Spec signature or decision]
Hypothesis: [what this variant tests — e.g., "side panel preserves list context for faster comparison"]

## Variant B: [Name]
File: prototype-variant-b.html
Decision tested: [same decision]
Hypothesis: [alternative — e.g., "full-page detail provides more space for complex entity data"]

## Comparison Guide
| Aspect | Variant A | Variant B |
|--------|-----------|-----------|
| Click depth for primary task | [count] | [count] |
| Context preservation | [yes/no and how] | [yes/no and how] |
| Data density | [high/medium/low] | [high/medium/low] |
| Mobile adaptation | [how it works] | [how it works] |
| Recommended for | [use case] | [use case] |
```

### Phase 7: Multi-Viewport Rendering

Render the prototype at the breakpoints defined in the IA Specification's responsive strategy.

If browser tools are available:
1. Open the prototype in a browser
2. Screenshot at each breakpoint: 1440px, 1280px, 1024px, 768px, 375px
3. Save screenshots for critique review

If browser tools are not available:
- Ensure the CSS media queries handle all breakpoints
- Document what changes at each breakpoint
- The state demo control panel includes viewport width simulation

### Phase 8: Output

```markdown
# Prototype Manifest
Generated: [date]
Pages prototyped: [count]
Variants: [count]
Viewports tested: [list]

## Files
| File | Contents | Interactive? |
|------|----------|-------------|
| prototype.html | Main prototype with all pages | Yes — nav, drill-down, states |
| prototype-variant-a.html | [decision] variant A | Yes |
| prototype-variant-b.html | [decision] variant B | Yes |

## How to Use
1. Open prototype.html in any browser
2. Click navigation items to switch between pages
3. Click list rows to drill down to detail views
4. Use the demo controls (bottom-right) to toggle states
5. Resize the browser window to see responsive behavior

## Known Limitations
- Data is static (mock) — no real API calls
- Some transitions are simplified compared to Interface Spec
- [any other limitations]

## Variant Decision Required
[If variants were generated, list the decision(s) the team needs to make]
```

## 5. AIDesigner Integration (when MCP available)

If the `aidesigner` MCP server is connected, use it to generate higher-quality visual prototypes. AIDesigner produces polished HTML/CSS with better visual design than Claude generates natively — same specs, better rendering.

### Detection
```bash
# Check if aidesigner MCP is available (look for generate_design tool)
# If available: use AIDesigner for visual rendering, Claude for logic/interactivity
# If not available: proceed with Claude-native HTML generation (Phase 3-6 above)
```

### Integration Pattern

**Step 1: Build repo_context from design specs**

Construct the `repo_context` parameter by concatenating the key upstream artifacts:
```
repo_context = [
  CLASSIFICATION.md (product type, density, data model),
  DESIGN-SYSTEM.md (tokens, color, typography, spacing),
  IA-SPEC.md (page structure, navigation, content hierarchy),
  INTERFACE-SPEC.md (signature decisions, component specs, motion)
]
```

**Step 2: Generate base design via AIDesigner**

Call `generate_design` with:
- `prompt`: A specific description of the page being prototyped, derived from the IA Spec. Include the page name, content zones, key components, and data model entities. NOT a vague "make a dashboard" — reference exact spec decisions.
- `repo_context`: The concatenated specs from Step 1
- `viewport`: "desktop" (generate mobile variant separately if needed)

**Step 3: Refine with design spec alignment**

Call `refine_design` with feedback referencing specific spec requirements:
- Token compliance: "Use these exact CSS custom properties: --color-primary-500, --space-md, etc."
- Component specs: "The KPI strip should use metric-first cards with inline sparklines per INTERFACE-SPEC"
- State requirements: "Add loading skeleton, empty state, and error state variants"
- Navigation: "Wire sidebar navigation to show/hide page sections"

**Step 4: Enhance with Claude-native interactivity**

AIDesigner returns static HTML. Claude adds:
- Working JavaScript navigation (nav clicks show/hide pages)
- Drill-down interactions (list row → detail view)
- State demo controls (loading/empty/error toggle panel)
- Sort/filter simulation
- Domain-specific mock data from Classification Card

**Step 5: Store outputs**

Save both the AIDesigner output and the enhanced version:
```
.aidesigner/runs/[timestamp]/design.html     ← AIDesigner visual output
prototype.html                                 ← Enhanced with interactivity
```

### When AIDesigner Adds Most Value

| Scenario | Use AIDesigner? | Why |
|----------|----------------|-----|
| Dashboard with complex data visualization | Yes | Visual density and layout balance benefit from specialized rendering |
| Simple CRUD list/detail pages | Optional | Claude-native is usually sufficient |
| Mobile viewport variant | Yes | Responsive proportions and touch targets benefit from specialized rendering |
| Variant comparison (A/B) | Yes | Generate both variants via AIDesigner for consistent visual quality |
| Rapid iteration after critique | Refine_design | Faster iteration with visual feedback |

### What AIDesigner Does NOT Replace

- Token injection (Phase 2) — still required, AIDesigner uses them via repo_context
- Mock data population (Phase 5) — Claude still provides domain-specific data
- Interactive behavior (Phase 4) — AIDesigner returns static HTML, Claude adds JS
- Variant comparison logic (Phase 6) — Claude still manages the decision framework
- Multi-viewport rendering (Phase 7) — Claude still captures and documents breakpoints

## 5b. Figma Integration (Tier 2 — when available)

If Figma API is available, additionally generate:

1. **Figma Variables** — Push design tokens as Figma variables
2. **Component frames** — Create Figma frames for each component with correct tokens
3. **Page layouts** — Create Figma page frames matching IA wireframes with styled components
4. **Variant set** — Create component variants in Figma matching the variant prototypes

This is optional and supplementary to the HTML prototype, not a replacement.

## 6. Downstream Integration

| Skill | What It Reads | How |
|-------|--------------|-----|
| `design-critique` | Prototype HTML | Screenshots for visual evaluation, interaction testing |
| `code-generation` | Prototype as visual reference | Ensures production code matches prototype appearance |
| `design-validation` | Prototype as baseline | Compares production output against prototype |
| `design-engine` | Prototype existence | Validates prototyping complete before code generation |

## 7. Common Failure Modes

**Failure 1: External dependencies.** CDN links, Google Fonts links, external scripts. The prototype must open offline with a double-click. Inline everything.

**Failure 2: Static screenshots.** A prototype without working navigation is a mockup, not a prototype. Navigation must work. Drill-down must work. If it doesn't click through, it's not serving its purpose.

**Failure 3: Generic data.** "Lorem ipsum" and "John Doe" in a prototype tell stakeholders nothing about how their actual data will look. Domain-specific mock data is non-negotiable.

**Failure 4: Ignoring states.** A prototype showing only the happy path with perfect data. The demo controls for loading/empty/error are required because stakeholders need to see those states too — they're part of the product.

**Failure 5: Pixel-perfect obsession.** The prototype is not the final product. It demonstrates the design — layout, navigation, interaction, data presentation. Spending hours on pixel-perfect shadows when the IA flow hasn't been validated is misallocated effort.

**Failure 6: No responsive behavior.** If the Classification Card's mobile strategy isn't "desktop-only," the prototype must demonstrate responsive behavior. At minimum, resize gracefully. Ideally, show the mobile layout.


---

## Example Session

```
User: Build design prototype for FleetCraft dispatch board

Single HTML file scaffolded: dev_docs/prototypes/dispatch-board.html
Uses Tailwind via CDN + design tokens injected as CSS vars

Sections shown:
  Live map (mock with 8 truck dots)
  Truck list (sticky header, virtualized appearance)
  Job detail panel (with truck info, driver, ETA, route)
  Empty state, loading skeleton, error states all toggleable via demo controls
  Mobile layout shown via viewport simulator buttons (375/768/1280)

Demo controls (top-right):
  Toggle states: loading | populated | empty | error
  Toggle: dark/light mode
  Toggle: density (compact/comfortable)
  Toggle: viewport

Interactions:
  Drag-drop simulated (HTML5 DnD)
  Tooltip on hover
  Modal opens on truck click

Responsive: collapses to single column on <768px

Output: dev_docs/prototypes/dispatch-board.html
Chain → aidesigner-frontend, design-html, web-design-review
```

---

## Chain Dispatch

### Workflow positions:
- **ui-redesign** — This is Step 7. Next: Skill: aidesigner-frontend
