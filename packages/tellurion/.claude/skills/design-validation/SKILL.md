---
name: design-validation
description: "Final validation before handoff — the terminal skill in the design pipeline. Cross-browser rendering verification, responsive testing at 5 breakpoints (375/768/1024/1280/1440px), dark mode verification, interaction and keyboard testing, handoff documentation generation, and design diff for redesigns. Uses Playwright (if available) for automated multi-viewport screenshots and interaction testing, or browser tools for manual verification. Produces a validation report and developer handoff document; blocking failures loop back to code-generation. Triggers on: validate the design, cross-browser test, responsive test, handoff documentation, design diff, before/after comparison, final check, ready to ship, QA the UI, verify the output, /design-validation."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Agent, WebSearch, WebFetch
version: 1.1
maintainer: TBK Labs
updated: 2026-07-03
type: skill
---

> **CHAIN:** Terminal skill — no onward dispatch. Blocking failures loop back → code-generation; on pass, outputs go to humans (validation report + handoff document).


# design-validation — Final Gate Before Handoff

## When to Use / When NOT to Use

**Use when:**
- Generated or rebuilt UI code is about to be handed off — this skill is the final gate
- The user says "validate the design", "final check", "ready to ship", "QA the UI", or asks for a cross-browser / responsive test
- A redesign needs a before/after design diff with per-change rationale
- An orchestrator (design-engine, deep-audit, apex-ui, apex-design, /fix) reaches its validation step

**Do NOT use when:**
- There is no rendered output yet — validation runs against real rendering, never against specs (Gate 1); at spec stage use design-critique
- You need a design opinion or a visual-quality score — that is design-critique's job
- You only need a quick single-breakpoint look — this skill runs the full 13-phase gate; use responsive-testing for a lightweight per-page plan

## 1. Why This Skill Exists

Code generation and critique happen in a development environment. The real product runs in multiple browsers, at multiple viewports, in light and dark mode, on fast and slow connections. design-validation bridges that gap — it tests the generated output in conditions that match real-world usage and produces handoff documentation that developers and designers need to maintain the system.

This skill runs last in the pipeline. If it finds issues, they loop back to code-generation for fixes. When it passes, the output is ready for handoff.

## 2. Hard Gates

**Gate 1.** Generated code must exist and be buildable/renderable. Validation cannot run against design specs — it runs against actual rendered output.

**Gate 2.** The validation report must include screenshots as evidence. "Responsive looks fine" is not validation — screenshots at each breakpoint are.

**Gate 3.** Every failure must reference the upstream artifact it violates (IA-SPEC.md content hierarchy, DESIGN-SYSTEM.md token, INTERFACE-SPEC.md visual decision). A failure without a source is an opinion, not a validation finding.

**Gate 4.** Handoff documentation must be generated regardless of validation outcome. Even if everything passes, developers need the reference docs.

## 3. Prerequisites

**Required:**
- Generated code (from `code-generation`) — buildable, renderable
- Design System Specification (`.claude/DESIGN-SYSTEM.md`) — for token verification
- IA Specification (`.claude/IA-SPEC.md`) — for structural verification

**Strongly recommended:**
- Interface Specification (`.claude/INTERFACE-SPEC.md`) — for visual verification
- Critique Report (from `design-critique`) — for known issues baseline
- Prototype (from `design-prototype`) — for comparison baseline

**Optional:**
- Playwright installed — for automated multi-viewport testing
- Previous version of the UI — for design diff (redesigns only)

## 4. The Validation Process

Thirteen phases, run in this order. Treat the list as a checklist: complete (or explicitly
skip) each phase before starting the next, and record every skipped phase in the validation
report with its reason (no Playwright, no dark mode tokens, not a redesign). A phase silently
omitted is an incomplete validation, not a pass.

1. Rendering Setup
2. Cross-Browser Rendering
3. Responsive Verification
4. Network Condition Testing
5. Dark Mode Verification (if applicable)
6. Interaction Verification
7. Data Resilience Testing
8. Cognitive Load Assessment
9. Design Diff (redesigns only)
10. Visual Regression Testing
11. Handoff Documentation
12. Failure Classification
13. Validation Report

### Phase 1: Rendering Setup

Get the generated code running in a viewable state.

```bash
# Check if the project has a dev server
cat package.json | grep -E "\"dev\"|\"start\"|\"serve\""

# Start the development server
npm run dev &
# or: npm start &
# or: open the HTML file directly

# Wait for server to be ready
sleep 3
curl -s http://localhost:3000 > /dev/null && echo "Server ready" || echo "Server not ready"
```

If no dev server exists (e.g., prototype HTML files), open them directly via browser tools.

### Phase 2: Cross-Browser Rendering

**With Playwright (recommended):**

```bash
# Install Playwright if not present
npx playwright install chromium firefox webkit 2>/dev/null

# Run rendering tests
npx playwright test --config=validation.config.ts
```

Generate a Playwright test file:

```typescript
// validation.config.ts — generated for this validation run
import { test, expect } from '@playwright/test';

const pages = [
  // From IA-SPEC.md page inventory
  { name: 'Overview', url: '/' },
  { name: 'Entity List', url: '/entities' },
  { name: 'Entity Detail', url: '/entities/1' },
  // ... all pages
];

const viewports = [
  { name: 'desktop-wide', width: 1440, height: 900 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const browsers = ['chromium', 'firefox', 'webkit'];

for (const browser of browsers) {
  for (const viewport of viewports) {
    for (const page of pages) {
      test(`${page.name} - ${browser} - ${viewport.name}`, async ({ browser: b }) => {
        const context = await b.newContext({ viewport });
        const p = await context.newPage();
        await p.goto(page.url);
        await p.waitForLoadState('networkidle');
        await p.screenshot({
          path: `validation/${browser}-${viewport.name}-${page.name}.png`,
          fullPage: true
        });
      });
    }
  }
}
```

**Without Playwright (manual via browser tools):**

For each page in the IA spec, capture screenshots at each viewport:
1. Navigate to the page
2. Resize to each breakpoint
3. Screenshot and save
4. Note any visual issues

### Phase 3: Responsive Verification

For each page, verify the responsive behavior matches the IA Specification:

```markdown
## Responsive Verification: [Page Name]

### Desktop Wide (1440px)
Screenshot: [reference]
IA Spec says: [expected layout from IA-SPEC.md]
Actual: [what rendered]
Status: Pass / Fail
Issues: [if any]

### Desktop (1280px)
Screenshot: [reference]
IA Spec says: [expected layout]
Actual: [what rendered]
Status: Pass / Fail

### Tablet Landscape (1024px)
Screenshot: [reference]
IA Spec says: [expected — what stacks, what collapses]
Actual: [what rendered]
Status: Pass / Fail

### Tablet Portrait (768px)
Screenshot: [reference]
IA Spec says: [expected]
Actual: [what rendered]
Status: Pass / Fail

### Mobile (375px)
Screenshot: [reference]
IA Spec says: [expected — what moves to tabs, what hides]
Actual: [what rendered]
Status: Pass / Fail
```

**Key checks per viewport:**
- Content hierarchy preserved (above-fold content still accessible)
- Navigation adapts correctly (sidebar collapse, hamburger, bottom tabs)
- Touch targets ≥ 44×44px on mobile
- Text remains readable (no overflow, no truncation of critical data)
- Tables adapt (horizontal scroll, card view, or column hiding)
- Charts adapt (resize, simplify, or hide on small viewports)

### Phase 4: Network Condition Testing

All prior tests run on a local dev server with zero latency. Real users face slow and flaky networks. This phase tests the UI under realistic conditions.

**With Playwright:**
```typescript
// Network throttling test
test.describe('Network conditions', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate Slow 3G
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50000,  // 400 Kbps
      uploadThroughput: 25000,    // 200 Kbps
      latency: 2000               // 2s RTL
    });
  });

  for (const pageEntry of pages) {
    test(`${pageEntry.name} - loading states under slow network`, async ({ page }) => {
      await page.goto(pageEntry.url, { waitUntil: 'commit' });
      // Capture loading state
      await page.screenshot({ path: `validation/network/${pageEntry.name}-loading.png` });
      // Wait for full load
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `validation/network/${pageEntry.name}-loaded.png` });
    });
  }
});
```

**Verification checklist:**
- [ ] Loading skeletons appear immediately (not a blank white page)
- [ ] Skeleton layout matches the final content layout (no CLS on load)
- [ ] Content appears progressively (above-fold first, below-fold lazy)
- [ ] Interactive elements are disabled during data fetch (no premature clicks)
- [ ] Stale data indicators appear when background refresh is slow
- [ ] Error states render gracefully when requests timeout (not unhandled promise rejections)

**Without Playwright:** Document that network condition testing was not performed and flag it as a known gap in the validation report.

### Phase 5: Dark Mode Verification (if applicable)

If the Design System includes dark mode tokens:

```bash
# Check for dark mode support
grep -rn "prefers-color-scheme\|dark-mode\|theme-dark\|data-theme" src/ --include="*.css" --include="*.tsx" | head -10
```

For each page, verify dark mode:

| Check | Status |
|-------|--------|
| All backgrounds use semantic tokens (not hardcoded white/gray) | Pass/Fail |
| All text colors use semantic tokens (not hardcoded black/gray) | Pass/Fail |
| Borders and dividers adapt to dark mode | Pass/Fail |
| Shadows adapt (softer/different in dark mode) | Pass/Fail |
| Charts and data visualizations adapt | Pass/Fail |
| Images have appropriate dark mode treatment | Pass/Fail |
| Status colors maintain contrast in dark mode | Pass/Fail |
| Focus rings visible in dark mode | Pass/Fail |

### Phase 6: Interaction Verification

Test that key interactions work as specified in the Interface Specification:

```markdown
## Interaction Verification

### Navigation
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Click nav item | Show corresponding page | [result] | Pass/Fail |
| Active state on current page | Nav item highlighted | [result] | Pass/Fail |
| Sidebar collapse (mobile) | Hamburger menu | [result] | Pass/Fail |

### Drill-down Flow
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Click list row | Navigate to detail | [result] | Pass/Fail |
| Back button | Return to list, scroll position preserved | [result] | Pass/Fail |
| Panel slide (if applicable) | Smooth slide animation | [result] | Pass/Fail |

### State Transitions
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Page load | Skeleton → content | [result] | Pass/Fail |
| Empty state | Guidance message + CTA | [result] | Pass/Fail |
| Error state | Error message + recovery action | [result] | Pass/Fail |
| Data refresh | Brief opacity dip → updated data | [result] | Pass/Fail |

### Keyboard Navigation
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Tab through page | Logical order | [result] | Pass/Fail |
| Enter on focused button | Activates | [result] | Pass/Fail |
| Escape from modal/panel | Closes | [result] | Pass/Fail |
| Arrow keys in table | Navigate rows | [result] | Pass/Fail |
```

### Phase 7: Data Resilience Testing

Test component behavior against unexpected or malformed data that real APIs return in production.

**Generate malformed mock data:**
For each entity in the data contracts, create edge-case fixtures:

```typescript
// [Entity].malformed.mocks.ts
export const malformedFixtures = {
  nullFields: {
    ...validEntity,
    name: null,          // Required field is null
    metrics: undefined,  // Object field missing entirely
  },
  emptyStrings: {
    ...validEntity,
    name: '',
    description: '',
  },
  extremeValues: {
    ...validEntity,
    name: 'A'.repeat(500),            // Extremely long string
    count: Number.MAX_SAFE_INTEGER,    // Huge number
    percentage: -0.001,                // Negative where positive expected
    date: 'not-a-date',               // Invalid date format
  },
  emptyCollections: {
    ...validEntity,
    items: [],           // Empty array
    metadata: {},        // Empty object
  },
  apiError: {
    status: 500,
    message: 'Internal Server Error',
    data: null,
  },
};
```

**Verification checklist:**
- [ ] Components render gracefully with null/undefined fields (no white screen crash)
- [ ] Long strings truncate with ellipsis + tooltip (not overflow or layout break)
- [ ] Extreme numbers display with appropriate formatting (not raw `9007199254740991`)
- [ ] Empty collections show the empty state from Design System (not a broken layout)
- [ ] API errors show the error state (not an unhandled exception)
- [ ] No `TypeError: Cannot read properties of null` in console

**Scoring:** White screen crash on malformed data = P0. Layout breakage = P1. Missing error boundary = P1.

### Phase 8: Cognitive Load Assessment

Evaluate the cognitive burden of the generated UI beyond visual correctness.

#### Reading Level Check
```bash
# If text content is extractable, analyze reading level
# Flesch-Kincaid Grade Level should be ≤ 8 for general audiences, ≤ 12 for professional tools
```

Evaluate all user-facing text:
- **Button labels:** Should be 1-3 words, action-oriented (verbs)
- **Error messages:** Should explain what went wrong AND what to do next
- **Empty states:** Should tell the user why it's empty and how to populate
- **Tooltips:** Should add context, not repeat the label
- **Navigation labels:** Should be self-explanatory without context

#### Information Density Verification
For each page, count:
- **Distinct data points visible above the fold:** Should not exceed 20 for Professional users, 12 for Manager users, 7 for Consumer users (derived from Classification Card's User Archetype)
- **Number of distinct actions available:** Should not exceed 7 primary + 5 secondary (Miller's Law)
- **Nesting depth of visual containers:** Should not exceed 3 levels (card > section > element)

#### Content-Length Flexibility Test
Test with realistic content variations:
- **Shortest realistic content:** Single-digit numbers, 2-character names, no optional fields
- **Longest realistic content:** 4-digit numbers with decimals, 30-character names, all optional fields populated, multi-line descriptions
- **Mixed content:** Some items at minimum, others at maximum

Verify that:
- [ ] Layouts don't break with extreme content lengths
- [ ] Text truncation uses ellipsis and has tooltip with full content
- [ ] Numbers don't overflow their containers
- [ ] Long names don't push adjacent elements off-screen
- [ ] Tables handle 3 rows and 300 rows gracefully

### Phase 9: Design Diff (redesigns only)

If this is a redesign (previous version exists), produce a before/after comparison:

```markdown
## Design Diff

### Global Changes
| Aspect | Before | After | Rationale |
|--------|--------|-------|-----------|
| Color palette | [previous] | [current] | [from Intelligence/Intent/Card] |
| Typography | [previous] | [current] | [source] |
| Spacing system | [previous] | [current] | [source] |
| Navigation model | [previous] | [current] | [source] |

### Per-Page Changes
#### [Page Name]
| Zone | Before | After | Why |
|------|--------|-------|-----|
| KPI Strip | [previous layout] | [current layout] | [Intelligence finding / Card constraint] |
| Main content | [previous] | [current] | [source] |

### Metrics Impact
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Accessibility score | [previous] | [current] | [delta] |
| Performance score | [previous] | [current] | [delta] |
| Design system compliance | [previous] | [current] | [delta] |
```

Every change must trace back to an upstream artifact. Unexplained changes are either bugs or scope creep.

### Phase 10: Visual Regression Testing

Automated pixel-level comparison to catch subtle visual regressions between builds.

**First run (baseline creation):**
```bash
# Save baseline screenshots
mkdir -p validation/baseline
# Playwright captures at all viewports × all pages (from Phase 2)
# These become the comparison baseline
```

**Subsequent runs (comparison):**
```typescript
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';

function compareScreenshots(baseline: string, current: string, diff: string): number {
  const img1 = PNG.sync.read(fs.readFileSync(baseline));
  const img2 = PNG.sync.read(fs.readFileSync(current));
  const { width, height } = img1;
  const diffImg = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(
    img1.data, img2.data, diffImg.data, width, height,
    { threshold: 0.1 }  // Tolerance for anti-aliasing
  );

  fs.writeFileSync(diff, PNG.sync.write(diffImg));
  const mismatchPercent = (mismatchedPixels / (width * height)) * 100;
  return mismatchPercent;
}
```

**Thresholds:**
| Mismatch % | Classification | Action |
|-----------|---------------|--------|
| 0-0.1% | No change | Pass |
| 0.1-1% | Minor difference | Informational — likely anti-aliasing or font rendering |
| 1-5% | Significant change | Requires review — include diff image in report |
| 5%+ | Major regression | Blocking failure — visual regression detected |

**Output:** For each page × viewport combination, include baseline screenshot, current screenshot, and diff image (mismatched pixels highlighted in red) in the validation report.

### Phase 11: Handoff Documentation

Generate the developer handoff document regardless of validation outcome.

```markdown
# Developer Handoff Document
Project: [name]
Generated: [date]
Design System Version: [from DESIGN-SYSTEM.md]

## Quick Reference

### Design Tokens
| Category | File | Token Count |
|----------|------|-------------|
| Colors | tokens/colors.css | [count] |
| Spacing | tokens/spacing.css | [count] |
| Typography | tokens/typography.css | [count] |
| Shape | tokens/shape.css | [count] |
| Motion | tokens/motion.css | [count] |

### Spacing Quick Reference
| Token | Value | Usage |
|-------|-------|-------|
| --space-xs | [value] | Inline gaps, icon padding |
| --space-sm | [value] | Input padding, tight card padding |
| --space-md | [value] | Standard card padding, section gaps |
| --space-lg | [value] | Section spacing, page margins |
| --space-xl | [value] | Major section separation |

### Typography Quick Reference
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| --text-xs | [value] | normal | Captions, badges, metadata |
| --text-sm | [value] | normal/medium | Labels, secondary text |
| --text-base | [value] | normal | Body text |
| --text-lg | [value] | medium/semibold | Section headers |
| --text-xl | [value] | semibold/bold | Page section titles |
| --text-2xl | [value] | bold | Page titles, KPI values |

### Color Quick Reference
| Purpose | Token | Value |
|---------|-------|-------|
| Primary action | --color-primary-500 | [value] |
| Success | --color-success | [value] |
| Warning | --color-warning | [value] |
| Error | --color-error | [value] |
| Text primary | --color-neutral-900 | [value] |
| Text secondary | --color-neutral-600 | [value] |
| Background | --color-neutral-50 | [value] |
| Surface | --color-neutral-0 / white | [value] |

## Component Inventory
| Component | File | Props | States | Stories |
|-----------|------|-------|--------|---------|
| [name] | [path] | [count] | [count]/[total] | [path] |

## Interaction Specifications
[From INTERFACE-SPEC.md motion and interaction spec — condensed for developer reference]

### Transitions
| Trigger | Duration | Easing | CSS |
|---------|----------|--------|-----|
| [trigger] | var(--duration-fast) | ease-out | transition: all var(--duration-fast) ease-out |

### Keyboard Shortcuts
| Key | Action | Context |
|-----|--------|---------|
| [key combo] | [action] | [where it works] |

## Accessibility Requirements
[From DESIGN-SYSTEM.md accessibility spec — condensed]
- Minimum contrast: 4.5:1 (normal text), 3:1 (large text)
- Focus rings: [specification]
- Screen reader: [requirements]
- Keyboard: [full keyboard nav requirement]

## Responsive Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 768px | [summary from IA-SPEC.md] |
| Tablet Portrait | 768-1023px | [summary] |
| Tablet Landscape | 1024-1279px | [summary] |
| Desktop | 1280-1439px | [summary] |
| Desktop Wide | ≥ 1440px | [summary] |

## Known Issues & Decisions
[From validation findings that were deferred or accepted]

## Cognitive Load Notes
- Maximum data points per page: [count per page]
- Reading level target: [Grade X — derived from User Archetype]
- Content length constraints: [min/max for key fields]
- Information density strategy: [progressive disclosure / tabs / collapse]

## Validation Environment
- **Primary OS:** [macOS / Windows / Linux]
- **Browsers tested:** [Chrome vX, Firefox vX, Safari vX — from Playwright or manual]
- **Display density:** [Standard 1x / HiDPI 2x / Both]
- **Network conditions tested:** [Local only / Throttled Slow 3G / Both]
- **Known cross-platform gaps:** [e.g., "Font rendering on Windows may appear slightly thinner than macOS screenshots"]
```

### Phase 12: Failure Classification

Validation findings are classified into two categories that determine pipeline behavior:

**Blocking Failures** — Pipeline halts, must be fixed by code-generation before handoff:
- Layout completely broken at any standard viewport
- Content unreadable in dark mode (contrast below WCAG AA)
- Navigation non-functional (links/buttons don't work)
- Critical accessibility failures (no keyboard navigation, missing landmarks)
- White screen crash on any data state
- CLS > 0.25 (Cumulative Layout Shift — causes user disorientation)

**Noted Issues** — Documented in handoff report for human review, do not block pipeline:
- Minor pixel discrepancies (< 5% mismatch in visual regression)
- Sub-optimal performance scores (LCP > 2.5s but page is functional)
- Font rendering differences across browsers
- Minor spacing inconsistencies (1-2px off from token value)
- Dark mode polish items (e.g., image brightness not adjusted)

The validation report must clearly separate these two categories. Blocking failures trigger the fix loop back to code-generation. Noted issues are recorded in the handoff document with screenshots and evidence.

### Phase 13: Validation Report

```markdown
# Design Validation Report
Project: [name]
Generated: [date]
Validation method: [Playwright automated / Browser tools manual / Hybrid]

## Summary
| Check | Pass | Fail | Total |
|-------|------|------|-------|
| Cross-browser rendering | [n] | [n] | [n] |
| Responsive behavior | [n] | [n] | [n] |
| Dark mode | [n] | [n] | [n] |
| Interactions | [n] | [n] | [n] |
| Keyboard navigation | [n] | [n] | [n] |
| **Total** | **[n]** | **[n]** | **[n]** |

## Verdict: [PASS / PASS WITH NOTES / FAIL]

### If PASS: Ready for handoff. Handoff document generated.
### If PASS WITH NOTES: Ready for handoff with documented known issues.
### If FAIL: [n] blocking issues require fixes before handoff.

## Cognitive Load Assessment
| Check | Result | Evidence |
|-------|--------|----------|
| Reading level ≤ target | [pass/fail] | [Flesch-Kincaid score] |
| Information density within bounds | [pass/fail] | [data point counts per page] |
| Content flexibility tested | [pass/fail] | [screenshots at min/max content] |
| Truncation handles gracefully | [pass/fail] | [screenshots with long content] |

## Failures (if any)
[Each failure with: what, where, expected vs actual, upstream source, screenshot, fix recommendation]

## Screenshots
[Organized by: browser × viewport × page]

## Handoff Document
[Link to generated handoff documentation]
```

## 5. Downstream Integration

This is the terminal skill in the pipeline. Its outputs go to humans, not other skills.
The one exception is the fix loop: blocking failures (Phase 12) go back to `code-generation`
and re-validate until they clear — nothing is ever dispatched onward.

| Output | Recipient |
|--------|-----------|
| Validation report | Development team — confirms readiness |
| Handoff document | Developers — reference during implementation |
| Design diff | Stakeholders — shows what changed and why |
| Screenshots | Design team — baseline for future visual regression |

## 6. Common Failure Modes

**Failure 1: Validating specs instead of rendered output.** "The INTERFACE-SPEC says the button is blue" is not validation. Render it. Look at it. Screenshot it. Validate what's actually there.

**Failure 2: Desktop-only testing.** If the IA spec defines responsive behavior and the Classification Card says mobile matters, testing only at 1280px is a failure. All 5 breakpoints.

**Failure 3: Handoff without context.** A handoff document that lists component files without explaining the design decisions behind them. The handoff should be readable by a developer who wasn't involved in the design process.

**Failure 4: Design diff without rationale.** "The sidebar is now dark blue instead of white" is not a design diff. "The sidebar is now dark blue (--neutral-900) because Intelligence Report found 4/5 competitors use dark sidebar as domain convention (Track A, Convention #2)" is a design diff.

**Failure 5: Skipping known issues.** If the critique found P2/P3 issues that were deferred, they must appear in the validation report and handoff document. Deferred is not forgotten.

**Failure 6: No screenshots.** A validation report without screenshots is a trust exercise. Always include visual evidence.


---

## Example Session

```
User: Validate the rebuilt dispatch board against the spec

Inputs read:
  dev_docs/design/section-layouts.md (locked spec)
  dev_docs/design/CLASSIFICATION.md
  web/src/app/dispatch/page.tsx (current build)

Responsive verification (Playwright, 5 viewports):
  375 mobile: pass — 0 horizontal overflow, touch targets ≥44pt
  768 tablet portrait: pass — sidebar collapses correctly
  1024 tablet landscape: pass
  1280 desktop: pass
  1440 desktop wide: pass — full 3-pane layout

Interaction verification (every-click matrix):
  47 interactive elements catalogued, 47 tested
  46 pass, 1 fail — keyboard shortcut "u" for undo not wired

Design diff (current vs spec):
  Hero typography off by 0.5rem (clamp range was 4-4.5rem, current 3.5-4)
  Truck status colors match tokens ✓
  Section transitions: 60px instead of spec'd 80px

Cognitive-load assessment:
  Dispatcher persona (Maria from persona library) simulated through 3 critical tasks
  Avg clicks per task: 3.2 (target ≤4) ✓
  Avg time on screen: 8s (acceptable)

Verdict: PASS WITH NOTES
  Note 1: undo keyboard shortcut — high-priority fix (Sprint W23)
  Note 2: typography clamp range — low-priority tune

Output: audits/design-validation-dispatch-2026-05-14.md + 18 screenshots
Chain → none (terminal). Report + handoff delivered; noted issues logged for human review.
```

---

## Chain Dispatch

Terminal skill — nothing is dispatched onward. Blocking failures (Phase 12) loop back to
`code-generation` for fixes and re-validation; on PASS the validation report and handoff
document go to humans. Orchestrators that call this skill as their validation step
(design-engine, deep-audit, apex-ui, apex-design, /fix) resume their own flow after it
returns — that resumption is theirs, not this skill's.
