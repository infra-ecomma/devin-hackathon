---
name: responsive-design
description: Adapt designs across screen sizes, devices, and contexts — breakpoints, fluid layouts, touch targets, cross-device compatibility. Use when implementing responsive design, fixing mobile layouts, or ensuring cross-device quality. Directly addresses the responsive verification gap. Triggers on "responsive", "mobile layout", "breakpoints", "cross-device".
---

> **CHAIN:** After this skill → design-engine, react-rules, nextjs, shadcn, web-design-review


# Responsive Design


## Overview

Systematic cross-device adaptation. Not just breakpoints — full layout, interaction, content, and navigation rethinking per context. Closes the responsive verification gap that ships broken mobile on every build.

Systematic cross-device adaptation. Not just breakpoints — full layout, interaction, content, and navigation rethinking per context. Closes the responsive verification gap that ships broken mobile on every build.

---

## Phase 1 — Assess Source Context

Before adapting, understand what exists:
- What is the designed-for viewport? (Usually desktop-first — confirm.)
- Which elements are fixed-width vs. fluid?
- Which interactions are pointer-dependent (hover, right-click)?
- What content is truly essential vs. supplementary at smaller sizes?
- Are there data tables, complex grids, or multi-column layouts that need restructuring?

---

## Phase 2 — Plan Adaptation Strategy

Define the approach per device tier before writing a single line of CSS.

### Breakpoint Tiers

| Tier | Range | Primary Use |
|------|-------|-------------|
| Mobile S | 320-374px | Oldest small phones, minimum viable |
| Mobile | 375-767px | Primary mobile target |
| Tablet | 768-1023px | iPad portrait, small landscape |
| Desktop | 1024-1279px | Laptop, small desktop |
| Desktop L | 1280px+ | Standard desktop and wide |

**Rule:** Design mobile-first in code even if design-first was desktop. `min-width` media queries scale up, not down.

### Layout Adaptations

**Mobile:**
- Single column. No exceptions for primary content.
- Navigation collapses to hamburger or bottom tab bar.
- Hero reduces to 60vh max — no full-screen hero on mobile.
- Cards stack vertically.
- Sidebars become accordions or move below main content.

**Tablet:**
- 2-column layouts where desktop uses 3-4.
- Sidebar may remain if screen width allows (768px+).
- Navigation may use condensed horizontal or hamburger.

**Desktop:**
- Full multi-column layouts.
- Sidebar navigation visible.
- Hover states active and meaningful.

### Interaction Adaptations

**Touch targets (mobile/tablet):**
- Minimum 44x44px tap target (Apple HIG) — 48x48px recommended (Material).
- Spacing between adjacent targets: minimum 8px.
- No hover-only interactions — everything hoverable must also work on tap.
- Swipe gestures where expected (carousels, drawers, delete actions).

**Pointer devices (desktop):**
- Hover states required on all interactive elements.
- Right-click context menus acceptable.
- Smaller click targets acceptable (minimum 32px).
- Tooltips on hover for icon-only buttons.

### Content Adaptations

- **Truncate** headlines on mobile if they wrap to 4+ lines.
- **Hide** supplementary content (decorative images, secondary stats, marketing copy) below 768px.
- **Simplify** data tables: hide non-essential columns, enable horizontal scroll, or restructure as card lists.
- **Prioritize** above-the-fold content — the primary CTA must be visible without scrolling on all breakpoints.

### Navigation Adaptations

| Pattern | Use When |
|---------|----------|
| Hamburger menu | 5+ nav items, complex nav tree |
| Bottom tab bar | Mobile app-like product, 3-5 primary destinations |
| Condensed horizontal | 3-4 items, simple structure |
| Sticky header | Long-scroll pages, frequent nav use |

---

## Phase 3 — Implement

### Fluid Techniques

```css
/* Fluid typography — scales between two sizes without breakpoints */
font-size: clamp(1rem, 2.5vw, 1.5rem);

/* Fluid spacing */
padding: clamp(1rem, 5vw, 3rem);

/* Fluid grid — auto-fills columns at minimum width */
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

/* Container queries — component-level responsiveness */
@container (min-width: 400px) { ... }
```

### CSS Custom Properties for Breakpoints

```css
:root {
  --spacing-section: clamp(3rem, 8vw, 8rem);
  --columns-grid: 1;
}
@media (min-width: 768px) { :root { --columns-grid: 2; } }
@media (min-width: 1024px) { :root { --columns-grid: 3; } }
```

### Overflow Protection

```css
/* Prevent horizontal scroll on any element */
img, video, iframe, table { max-width: 100%; }
* { box-sizing: border-box; }
body { overflow-x: hidden; }
```

---

## Phase 4 — Verify on Real Devices

Do not mark responsive work done until verified. Browser DevTools responsive mode is not sufficient.

### Verification Checklist

- [ ] 375px — no horizontal scroll, all content readable
- [ ] 375px — all tap targets 44px minimum
- [ ] 375px — navigation opens and closes correctly
- [ ] 375px — primary CTA visible above fold
- [ ] 768px — layout transitions correctly to tablet layout
- [ ] 1024px — desktop layout activates, no awkward in-between state
- [ ] 1440px — content doesn't stretch to unreadable line lengths (max ~80ch)
- [ ] All breakpoints — form inputs don't zoom on iOS (font-size: 16px minimum)
- [ ] All breakpoints — images load appropriate sizes (srcset or CSS)

### Playwright Verification (Automated)

Run this after every responsive implementation to catch regressions:

```js
const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile',  width: 375,  height: 812  },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900  },
];

for (const vp of viewports) {
  test(`responsive: no issues at ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // All tap targets >= 44px on mobile/tablet
    if (vp.width < 1024) {
      const smallTargets = await page.evaluate(() => {
        const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
        const violations = [];
        interactive.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            violations.push({
              tag: el.tagName,
              text: el.textContent?.slice(0, 30),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        });
        return violations;
      });
      if (smallTargets.length > 0) {
        console.warn(`${vp.name}: ${smallTargets.length} tap targets below 44px:`,
          smallTargets.slice(0, 5));
      }
    }

    // Form inputs don't trigger iOS zoom (font-size >= 16px)
    const smallInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      const violations = [];
      inputs.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 16) {
          violations.push({ tag: el.tagName, fontSize });
        }
      });
      return violations;
    });
    expect(smallInputs).toHaveLength(0);

    // Screenshot for visual regression
    await page.screenshot({
      path: `test-results/responsive-${vp.name}.png`,
      fullPage: true,
    });
  });
}
```

---

## Dos and Don'ts

**Do:**
- Write mobile-first CSS (`min-width` queries, not `max-width`).
- Use `clamp()` for fluid type and spacing between breakpoints.
- Verify tap target sizes programmatically before shipping.
- Test real content, not placeholder text (long words break differently).

**Don't:**
- Use `px` for font-size on body text (breaks user zoom preferences).
- Hide content with `display: none` as the only mobile strategy.
- Assume DevTools mobile emulation catches all issues.
- Set `user-scalable=no` in the viewport meta tag.
- Ship without running the verification checklist.

---

## Kit Integration

- **During GSD** — fires after every UI build step before the step is marked complete; blocks progress until responsive verification checklist passes
- **During Rescue** — runs when "responsive" or "mobile" is in the bug report
- **During quality gates** — part of the pre-deploy checklist alongside design-critique
- **On demand** — triggered by "responsive", "mobile layout", "breakpoints", "cross-device"


---

## Chain Dispatch

### If UI was touched, also invoke:
Skill: design-engine
Skill: react-rules
Skill: nextjs
Skill: shadcn
Skill: web-design-review


---

<!-- AUDIT-2026-04-26 batch-3: appended sections from MSK/08-quality-testing/responsive-tests -->


## Setup Guide

### Playwright Viewport Testing (Primary)

No additional dependencies — Playwright handles viewport resizing natively.

**Define your breakpoints as a shared constant:**

```typescript
// e2e/config/breakpoints.ts
export const BREAKPOINTS = {
  mobileS: { width: 320, height: 568 },   // iPhone SE (1st gen)
  mobile: { width: 375, height: 812 },     // iPhone 14
  mobileL: { width: 428, height: 926 },    // iPhone 14 Pro Max
  tablet: { width: 768, height: 1024 },    // iPad
  laptop: { width: 1024, height: 768 },    // Small laptop
  desktop: { width: 1440, height: 900 },   // Standard desktop
  wide: { width: 1920, height: 1080 },     // Full HD
  ultrawide: { width: 2560, height: 1080 },// Ultrawide (if supported)
} as const;

// The 4 breakpoints every project must test at minimum
export const REQUIRED_BREAKPOINTS = ['mobile', 'tablet', 'laptop', 'desktop'] as const;
```

**Playwright config with responsive projects:**

```typescript
import { defineConfig } from '@playwright/test';
import { BREAKPOINTS } from './e2e/config/breakpoints';

export default defineConfig({
  projects: [
    {
      name: 'mobile',
      use: {
        viewport: BREAKPOINTS.mobile,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'tablet',
      use: {
        viewport: BREAKPOINTS.tablet,
        hasTouch: true,
      },
    },
    {
      name: 'desktop',
      use: {
        viewport: BREAKPOINTS.desktop,
      },
    },
  ],
});
```

### Alternatives

- **Responsively App** — open-source tool that shows your site at multiple viewports simultaneously (development aid, not automated testing)
- **Chromatic** — captures Storybook stories at multiple viewports for visual comparison
- **Percy** — responsive snapshots at configured widths as part of visual regression

## Template

### Layout assertions at breakpoints

```typescript
// e2e/responsive/navigation.responsive.spec.ts
import { test, expect } from '@playwright/test';
import { BREAKPOINTS } from '../config/breakpoints';

test.describe('Navigation responsive behavior', () => {
  test('shows hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.goto('/');

    // Desktop nav should be hidden
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

    // Hamburger button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    // Tapping hamburger opens mobile nav
    await menuButton.click();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();

    // All nav links are accessible
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
  });

  test('shows full navigation on desktop', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.goto('/');

    // Desktop nav should be visible
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

    // Hamburger should not be visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeHidden();
  });

  test('shows full navigation on tablet in landscape', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // Tablet landscape
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });
});
```

### Horizontal overflow detection

```typescript
// e2e/responsive/overflow.responsive.spec.ts
import { test, expect } from '@playwright/test';
import { BREAKPOINTS, REQUIRED_BREAKPOINTS } from '../config/breakpoints';

for (const bp of REQUIRED_BREAKPOINTS) {
  test(`no horizontal overflow at ${bp} (${BREAKPOINTS[bp].width}px)`, async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS[bp]);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasOverflow).toBe(false);
  });
}

// Run against every page route
const routes = ['/', '/features', '/pricing', '/dashboard', '/settings'];

for (const route of routes) {
  test(`no horizontal overflow on ${route} at mobile`, async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasOverflow).toBe(false);
  });
}
```

### Touch target size validation

```typescript
// e2e/responsive/touch-targets.responsive.spec.ts
import { test, expect } from '@playwright/test';
import { BREAKPOINTS } from '../config/breakpoints';

test.describe('Touch target sizes', () => {
  test('all interactive elements meet 44px minimum on mobile', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tooSmall = await page.evaluate(() => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex="0"]'
      );
      const violations: { tag: string; text: string; width: number; height: number }[] = [];

      interactive.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Skip hidden elements
        if (rect.width === 0 || rect.height === 0) return;
        // Skip elements that are visually hidden (e.g., skip links)
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        if (rect.width < 44 || rect.height < 44) {
          violations.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      });

      return violations;
    });

    if (tooSmall.length > 0) {
      console.error('Touch targets too small:', JSON.stringify(tooSmall, null, 2));
    }
    expect(tooSmall).toEqual([]);
  });
});
```

### Data table responsive behavior

```typescript
// e2e/responsive/data-table.responsive.spec.ts
import { test, expect } from '@playwright/test';
import { BREAKPOINTS } from '../config/breakpoints';

test.describe('Data table responsive behavior', () => {
  test('table scrolls horizontally on mobile without page overflow', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.goto('/users');

    const table = page.locator('.data-table-wrapper');
    await expect(table).toBeVisible();

    // Table wrapper should handle overflow, not the page
    const tableOverflow = await table.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowX;
    });
    expect(['auto', 'scroll']).toContain(tableOverflow);

    // Page should not have horizontal overflow
    const pageOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(pageOverflow).toBe(false);
  });

  test('table shows all columns on desktop', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.goto('/users');

    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last active' })).toBeVisible();
  });
});
```

## Common Pitfalls

| Pitfall | Why It Happens | Fix |
|---------|---------------|-----|
| **Testing only at exact breakpoint widths** | Layout tested at 768px (tablet breakpoint) but nobody checks 769px or 767px where transitions happen. | Test at breakpoints AND at breakpoint +/- 1px. The edge of a media query range is where layout bugs live. |
| **Using viewport width in Chrome as "mobile testing"** | Chrome DevTools mobile view doesn't replicate Safari iOS behavior — no dynamic viewport height, no rubber-banding, no notch safe areas. | Viewport resizing in Playwright catches responsive CSS issues. Safari-specific behavior requires WebKit testing (separate concern, covered in cross-browser tests). |
| **Forgetting `100vw` includes scrollbar on Windows** | `width: 100vw` is viewport width including scrollbar. On Windows (non-overlay scrollbars), this creates 15-17px horizontal overflow. | Use `width: 100%` on block elements instead of `100vw`. Or use `overflow-x: hidden` on the body (but only if you understand the implications for positioned elements). |
| **Not testing zoom** | WCAG requires content to work at 200% zoom. Many layouts break because breakpoints are in px but zoom changes the effective viewport. | Test at 375px viewport (mobile) AND at 1440px viewport at 200% zoom (which gives you an effective ~720px). Both should produce usable layouts. |
| **Ignoring landscape orientation on mobile** | iPhone in landscape is 812x375 — a very wide, very short viewport. Fixed headers can consume 60%+ of the visible area. | Test at landscape dimensions. Ensure fixed headers have `max-height` or collapse in landscape. Test that modals don't exceed viewport height. |
| **Testing responsive in isolation** | Responsive tests check layout but nobody tests if the mobile layout is actually usable — can users reach the CTA? Is the form input visible above the keyboard? | Combine responsive layout assertions with functional E2E tests at mobile viewport. Layout correctness without functionality is pointless. |

## Proof Artifact

The responsive test suite must produce:

1. **All responsive tests passing** across required breakpoints
   ```
   [mobile]  › navigation.responsive.spec.ts — 3 passed
   [tablet]  › navigation.responsive.spec.ts — 3 passed
   [desktop] › navigation.responsive.spec.ts — 3 passed
   [mobile]  › overflow.responsive.spec.ts — 6 passed
   [mobile]  › touch-targets.responsive.spec.ts — 1 passed
   16 passed (28s)
   ```

2. **Breakpoint coverage table** — every tested page/component at every tested viewport:
   ```
   | Page/Component | 375px | 768px | 1024px | 1440px |
   |----------------|:-----:|:-----:|:------:|:------:|
   | Home           |  yes  |  yes  |  yes   |  yes   |
   | Dashboard      |  yes  |  yes  |  yes   |  yes   |
   | Navigation     |  yes  |  yes  |  yes   |  yes   |
   | Data table     |  yes  |  —    |  —     |  yes   |
   | Checkout form  |  yes  |  yes  |  —     |  yes   |
   ```

3. **Zero horizontal overflow** — proof that no page has horizontal scroll at any tested viewport width

4. **Touch target compliance** — test output confirming all interactive elements meet 44x44px minimum at mobile viewport

5. **Screenshots at each breakpoint** (optional but recommended) — paired with visual regression baselines showing the responsive adaptation visually

---

## Example Session

```
User: Run responsive-design checks on fleetcraft.io

Breakpoints tested: 320, 375, 428, 768, 1024, 1440, 1920 (7 widths)
Routes: /, /pricing, /product, /resources, /blog/[slug], /app/dispatch

Playwright responsive suite executed:
  Navigation: PASS at all breakpoints (hamburger ≤768, full ≥1024)
  Overflow: PASS — no horizontal scroll at any width
  Touch targets: 4 violations at 375px (footer links 36px) → fixed to py-3 → re-run PASS
  Data table responsive: PASS (table-wrapper handles overflow, not page)
  Landscape iPhone: PASS — fixed header collapsed correctly

Common pitfalls checked:
  ✓ Tested at breakpoints AND ±1px
  ✓ No 100vw (used 100%)
  ✓ Verified 200% zoom still usable
  ✓ Landscape orientation tested
  ✓ Functional E2E paired with responsive layout

Output: e2e/responsive/*.spec.ts + audits/responsive-2026-05-14.md
Chain → web-design-review, web-accessibility
```
