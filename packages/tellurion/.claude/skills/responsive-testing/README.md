**TBK Labs** · Curated Kit

---

# Responsive Testing

_Per-page responsive testing template. Every page must be tested at 4 breakpoints before it ships: Mobile (375px — iPhone SE / small Android), Tablet (768px — iPad / medium tablet), Laptop (1024px — standard laptop), Desktop (1440px — wide monitor). Each breakpoint has a typical layout pattern (single column / 2-column with collapsing sidebar / full sidebar with 2-3 column grids / max content width with comfortable density). Test in browser DevTools (F12 → device toggle → set widths 375/768/1024/1440) or via Playwright (loop the breakpoints array, setViewportSize per case, goto pageUrl, assert layout). Per-breakpoint checklist covers: no horizontal overflow, all interactive elements ≥44×44px on mobile, navigation accessible, primary CTAs visible, content readable, images scaled correctly, text not truncated unintentionally. Reload at each width to catch SSR/hydration layout issues. Template is copied per page and filled in with results._

**CATEGORY** Skills · Testing  •  **TRIGGER** `responsive testing`, `breakpoint testing`, `responsive template`, `375 768 1024 1440`, `mobile tablet laptop desktop testing`, `viewport testing`, `horizontal overflow check`  •  **RATING** ★★★★★ (10/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Four specific breakpoints, not "test on mobile and desktop." 375 / 768 / 1024 / 1440 covers the population. Mobile-only (375) testing misses the tablet layout that breaks at 768. Desktop-only testing misses everything. The four-breakpoint rule maps to actual device populations: iPhone SE through wide monitor.
- Per-page test template, not a one-time check. The template is copied per page and filled in. Every page has its own responsive test record; teams can see exactly which pages have been tested at which breakpoints. Without per-page tracking, "we tested it" becomes vague and pages slip through untested.
- Playwright loop pattern included. Same test runs at all 4 breakpoints with viewport size set per case. Operators can paste the breakpoints array, write one set of assertions, and the test framework iterates. The pattern reduces 4 separate tests to 1 parameterized test.

---

## What It Does

This skill is the per-page responsive testing template. Every page in the project must be tested at 4 breakpoints before shipping; this template provides the test plan and checklist.

**The four breakpoints.** Mobile (375px — iPhone SE / small Android; single column layout, stacked cards, hamburger menu). Tablet (768px — iPad / medium tablet; 2-column layouts, sidebar may collapse). Laptop (1024px — standard laptop; full sidebar, 2-3 column grids). Desktop (1440px — wide monitor; max content width, comfortable density). The four cover the real device population; missing any leaves a class of users with broken UX.

**DevTools testing (manual).** Open Chrome/Edge DevTools (F12), click the device toggle icon (top-left), select Responsive mode, set widths to 375 / 768 / 1024 / 1440 sequentially. Reload at each width to catch SSR/hydration layout issues — some bugs only appear on initial render at a specific viewport. Manual testing is for one-off verification; automated testing is for regression prevention.

**Playwright testing (automated).** Loop the breakpoints array, set viewport size per iteration, goto the page URL, assert layout. The loop pattern: `for (const bp of breakpoints) { test(\`${pageName} renders at ${bp.name}\`, async ({page}) => { await page.setViewportSize(bp); await page.goto(pageUrl); /* assertions */ })}`. One test definition, four parameterized executions, one record per breakpoint failure.

**Per-breakpoint checklist.** At every viewport: (1) No horizontal overflow — `document.body.scrollWidth <= viewport.width`. (2) All interactive elements ≥44×44px on mobile (WCAG 2.5.5). (3) Navigation accessible — hamburger menu works on mobile, full nav on desktop. (4) Primary CTAs visible above fold. (5) Content readable — text not too small (16px minimum) or too large. (6) Images scaled correctly — not pixelated, not stretched, not cropping the subject. (7) Text not truncated unintentionally — ellipsis is OK when intentional, not OK when content disappears.

**Common failure modes.** Horizontal overflow at 375px (a fixed-width element wider than viewport pushes the page sideways). Hamburger menu broken at 768px (the breakpoint where sidebar collapses to hamburger, but the hamburger doesn't open). Touch targets too small at 375px (buttons designed at 16px stay 16px instead of growing to 44×44). Hero image cropped at 1440px (image was designed for 1024px and stretches awkwardly at wider viewports). Form fields stack incorrectly on mobile (designed for two-column form, doesn't reflow to single column at 375px).

**SSR/hydration catch.** Reload at each viewport (don't just resize). Server-side rendering can produce different markup than client-side hydration at certain widths; the bug only appears on reload. Playwright `page.goto()` does a fresh load per test, so this is automatic; manual DevTools testing requires explicit reload.

**Per-page record.** Copy the template per page. Fill in results: which breakpoints passed, which failed, what failed, screenshot of failure. Pages with all 4 breakpoints passing get shipped; failures get fixed and re-tested. The per-page record makes responsive coverage auditable across the project.

---

## How to Use

1. **Test every page at all 4 breakpoints before shipping.** Per-page record makes coverage auditable.
2. **Reload at each viewport, don't just resize.** SSR/hydration bugs only appear on reload.
3. **Use Playwright loop for automation.** One test definition, four parameterized runs.
4. **Manual DevTools for one-off verification.** Cheaper than writing a test for a single check.
5. **Run the 7-item per-breakpoint checklist.** Overflow, touch targets, nav, CTAs, readability, images, truncation.
6. **Enforce 44×44px touch targets on mobile.** WCAG 2.5.5; smaller fails.
7. **Don't trust "looks fine" without measurement.** Use `document.body.scrollWidth` to detect overflow; visual inspection misses 1-2px overflows.
8. **Update the responsive test record per page change.** New page or significant layout change = re-run all 4 breakpoints.

---

## The Four Breakpoints

| Breakpoint | Width | Device | Typical Layout |
|-----------|-------|--------|----------------|
| **Mobile** | 375px | iPhone SE / small Android | Single column, stacked cards, hamburger menu |
| **Tablet** | 768px | iPad / medium tablet | 2-column layouts, sidebar may collapse |
| **Laptop** | 1024px | Standard laptop | Full sidebar, 2-3 column grids |
| **Desktop** | 1440px | Wide monitor | Max content width, comfortable density |

---

## Per-Breakpoint Checklist

| Check | Mobile (375) | Tablet (768) | Laptop (1024) | Desktop (1440) |
|-------|--------------|--------------|---------------|----------------|
| No horizontal overflow | Critical | Critical | Critical | Critical |
| Touch targets ≥44×44px | Critical | Important | N/A | N/A |
| Navigation accessible | Hamburger works | Sidebar collapses correctly | Full nav | Full nav |
| Primary CTAs visible | Above fold | Above fold | Above fold | Above fold |
| Content readable | ≥16px text | ≥16px text | ≥16px text | ≥16px text |
| Images scaled correctly | No crop/stretch | No crop/stretch | No crop/stretch | No crop/stretch |
| Text not truncated | Only intentional | Only intentional | Only intentional | Only intentional |

---

## Sample Output (Playwright responsive test)

```typescript
// tests/e2e/responsive/orders-page.spec.ts
import { test, expect } from "@playwright/test";

const breakpoints = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const bp of breakpoints) {
  test.describe(`Orders page at ${bp.name} (${bp.width}px)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/orders");
    });

    test("no horizontal overflow", async ({ page }) => {
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(bp.width);
    });

    test("main content visible", async ({ page }) => {
      await expect(page.locator("main")).toBeVisible();
    });

    test("primary CTA above fold", async ({ page }) => {
      const cta = page.getByRole("button", { name: "New Order" });
      const ctaBox = await cta.boundingBox();
      expect(ctaBox!.y).toBeLessThan(bp.height);
    });

    if (bp.width <= 768) {
      test("hamburger menu visible and clickable", async ({ page }) => {
        const burger = page.getByRole("button", { name: /menu/i });
        await expect(burger).toBeVisible();
        const box = await burger.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      });
    }

    if (bp.width >= 1024) {
      test("sidebar visible (not collapsed)", async ({ page }) => {
        await expect(page.locator("aside")).toBeVisible();
      });
    }
  });
}
```

This is the loop pattern in action — one test file produces 4 test suites (mobile/tablet/laptop/desktop), each with overflow check + visibility check + CTA position + breakpoint-specific assertions (hamburger on mobile/tablet, sidebar on laptop+). Add more pages by changing the URL; same loop, same coverage.

---

## What NOT to Do

- **Don't skip the 768px tablet breakpoint.** Sidebar-collapse bugs live here exclusively.
- **Don't just resize the DevTools window.** Reload at each viewport to catch SSR/hydration bugs.
- **Don't accept "looks fine" without `document.body.scrollWidth` measurement.** 1-2px overflows are invisible but cause horizontal scrollbars.
- **Don't ship without 44×44px touch targets on mobile.** WCAG 2.5.5 fail.
- **Don't write 4 separate tests when the loop pattern works.** DRY across breakpoints.
- **Don't trust manual testing for regression prevention.** Manual is one-off; automated is forever.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | responsive-testing |
| **Category** | Skills · Testing |
| **Rating** | ★★★★★ (10/10) |
| **Breakpoints** | 375 (mobile) · 768 (tablet) · 1024 (laptop) · 1440 (desktop) |
| **Checklist Items** | 7 per breakpoint (overflow, touch targets, nav, CTAs, readability, images, truncation) |
| **Manual Tool** | Chrome/Edge DevTools (F12 → device toggle → Responsive mode) |
| **Automated Tool** | Playwright loop pattern with `page.setViewportSize` |
| **Coverage Tracking** | Per-page test record |
| **Pairs With** | `accessibility-tests` skill (sibling — a11y at all viewports; touch targets specifically) · `mobile-verify` skill (sibling — mobile-specific verification beyond 375px width) · `ai-feature-testing` skill (sibling — AI features that render UI need responsive testing too) · `test-patterns` skill (sibling — the canonical TS test cookbook; component/Playwright patterns these responsive checks extend) · `testing-gotchas` skill (sibling — responsive-specific gotchas like SSR/hydration mismatches) |
| **Bundle** | `SKILL.md` + `README.md` + `responsive-testing.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-11
