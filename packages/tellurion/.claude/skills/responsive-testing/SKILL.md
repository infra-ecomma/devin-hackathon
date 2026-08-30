---
name: responsive-testing
description: "Use when a page needs to be verified across screen sizes before it ships, to catch horizontal scroll, tiny touch targets, overlapping or lost content, and broken tables. Provides a copy-per-page manual test plan across four breakpoints (mobile 375, tablet 768, laptop 1024, desktop 1440) with DevTools and Playwright setup, per-breakpoint pass/fail checklists, common responsive layout patterns (stack-to-grid, sidebar, responsive table/form/nav), a bug-cause-fix table, an automated Playwright sweep asserting no horizontal scroll and no console errors, and per-breakpoint accessibility concerns. Triggers on: responsive testing, breakpoints, mobile/tablet/desktop layout, viewport testing, horizontal scroll, touch target size, test across screen sizes, /responsive-testing."
---

# Responsive Testing Template

## Overview

Every page must be tested at 4 breakpoints before it ships. This template provides the test plan. Copy it for each page and fill in the results.

---

## Breakpoint Reference

| Breakpoint | Device | Width | Typical Layout |
|-----------|--------|-------|----------------|
| **Mobile** | iPhone SE / small Android | 375px | Single column, stacked cards, hamburger menu |
| **Tablet** | iPad / medium tablet | 768px | 2-column layouts, sidebar may collapse |
| **Laptop** | Standard laptop | 1024px | Full sidebar, 2-3 column grids |
| **Desktop** | Wide monitor | 1440px | Max content width, comfortable density |

### Testing in Browser DevTools

1. Open Chrome/Edge DevTools (F12)
2. Click the device toggle icon (top-left of DevTools)
3. Select "Responsive" mode
4. Set specific widths: 375, 768, 1024, 1440
5. Reload at each width to catch SSR/hydration layout issues

### Testing with Playwright

```typescript
const breakpoints = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const bp of breakpoints) {
  test(`${pageName} renders correctly at ${bp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto(pageUrl);
    await expect(page.locator("main")).toBeVisible();
    // Add specific assertions per breakpoint
  });
}
```

---

## Per-Page Test Plan

Copy this section for each page you're testing.

### Page: _______________

**Route:** _______________

#### Mobile (375px)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| No horizontal scroll | | |
| Touch targets >= 44px | | |
| Text readable without zoom | | |
| Images scale properly | | |
| Forms fill available width | | |
| Navigation accessible (hamburger menu) | | |
| Cards stack vertically | | |
| Tables scroll horizontally (not page) | | |
| Modals/dialogs fit within viewport | | |
| Buttons full-width or appropriately sized | | |
| No text truncation that hides critical info | | |
| No overlapping elements | | |

#### Tablet (768px)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| No horizontal scroll | | |
| Sidebar collapses or overlays | | |
| 2-column layouts activate | | |
| Table shows most important columns | | |
| Cards arrange in 2-column grid | | |
| Navigation accessible | | |
| Forms have comfortable width | | |
| Modals appropriately sized (not full-screen) | | |
| Charts readable at this width | | |
| No wasted whitespace | | |

#### Laptop (1024px)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Full sidebar visible | | |
| 2-3 column grids active | | |
| All table columns visible | | |
| Charts at full detail | | |
| Comfortable reading width for text | | |
| All features visible (nothing hidden) | | |
| Proper spacing between sections | | |
| Action buttons visible (not in overflow) | | |

#### Desktop (1440px)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Content has max-width (not stretched edge-to-edge) | | |
| No excessive whitespace | | |
| Comfortable information density | | |
| Large charts/tables use available space well | | |
| Multi-column layouts well-proportioned | | |
| Text line length comfortable (60-80 characters) | | |

---

## Common Responsive Patterns

### Pattern: Stacked to Grid

```
Mobile (375px):        Tablet (768px):        Desktop (1024px):
[  Card A  ]           [Card A] [Card B]      [Card A] [Card B] [Card C]
[  Card B  ]           [Card C] [Card D]      [Card D] [Card E] [Card F]
[  Card C  ]
[  Card D  ]
```

Implementation:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Pattern: Sidebar Layout

```
Mobile:          Tablet:           Desktop:
[hamburger]      [mini-sidebar]    [full sidebar]
[  content ]     [   content  ]    [  content   ]
```

Implementation:
```html
<aside class="hidden md:block md:w-16 lg:w-64 transition-all">
<main class="flex-1">
```

### Pattern: Responsive Table

```
Mobile:              Tablet/Desktop:
[Card view]          [Full table with all columns]
  Name: John
  Status: Active
  Phone: 555-0123
```

Implementation:
```html
<!-- Mobile: card view -->
<div class="block md:hidden">
  {data.map(item => <MobileCard item={item} />)}
</div>

<!-- Desktop: table view -->
<div class="hidden md:block">
  <Table data={data} columns={columns} />
</div>
```

### Pattern: Responsive Form

```
Mobile (375px):              Desktop (1024px):
[  Full-width input  ]      [Input A      ] [Input B      ]
[  Full-width input  ]      [Input C      ] [Input D      ]
[  Full-width button ]      [         Submit button       ]
```

Implementation:
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input name="firstName" />
  <Input name="lastName" />
  <Input name="email" className="md:col-span-2" />
</div>
```

### Pattern: Responsive Navigation

```
Mobile:                    Desktop:
[logo] [hamburger]         [logo] [nav items...] [user menu]
                           [sidebar navigation ]
```

Key points:
- Hamburger menu on mobile (< 768px)
- Collapsed icon sidebar on tablet (768-1024px)
- Full sidebar with labels on desktop (> 1024px)
- Bottom navigation is an alternative for mobile (for 3-5 primary actions)

---

## Common Responsive Bugs

| Bug | Cause | Fix |
|-----|-------|-----|
| Horizontal scroll | Fixed-width element wider than viewport | Use `max-w-full`, `overflow-x-auto` on containers |
| Tiny touch targets | Desktop-sized buttons on mobile | Min 44x44px, use `min-h-[44px] min-w-[44px]` |
| Unreadable text | Font too small on mobile | Min 14px (`text-sm`), prefer 16px (`text-base`) for body |
| Overlapping elements | Absolute positioning without responsive adjustments | Use flexbox/grid instead of absolute |
| Lost content | `hidden` without responsive prefix | Use `hidden md:block` to show at larger sizes |
| Stretched images | No max-width constraint | `max-w-full h-auto` on all images |
| Broken tables | Too many columns for viewport | Wrap in `overflow-x-auto`, or use card view on mobile |
| Inaccessible modals | Modal taller than viewport | `max-h-[90vh] overflow-y-auto` on modal content |
| Cut-off dropdowns | Dropdown opens downward off-screen | Use positioning libraries (Radix, Floating UI) |

---

## Automated Responsive Testing

Add to your E2E test suite:

```typescript
// e2e/responsive.spec.ts
import { test, expect } from "@playwright/test";

const pages = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Trips", path: "/trips" },
  { name: "Drivers", path: "/drivers" },
  { name: "Billing", path: "/billing" },
];

const breakpoints = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const page of pages) {
  for (const bp of breakpoints) {
    test(`${page.name} at ${bp.name} (${bp.width}px)`, async ({ page: p }) => {
      await p.setViewportSize({ width: bp.width, height: bp.height });
      await p.goto(page.path);

      // No horizontal scroll
      const scrollWidth = await p.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await p.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance

      // Main content visible
      await expect(p.locator("main")).toBeVisible();

      // No console errors
      const errors: string[] = [];
      p.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      expect(errors).toHaveLength(0);
    });
  }
}
```

---

## Accessibility at Each Breakpoint

Responsive design is not just about layout. Accessibility requirements change with breakpoints:

| Breakpoint | Accessibility Concern |
|-----------|----------------------|
| Mobile | Touch targets (44px min), no hover-only interactions, screen reader order matches visual order |
| Tablet | Sidebar focus trap when open, swipe gestures have button alternatives |
| Laptop | Keyboard navigation through all interactive elements, visible focus indicators |
| Desktop | Skip-to-content link, landmark regions (`main`, `nav`, `aside`), proper heading hierarchy |

**Test keyboard navigation at laptop/desktop.** Tab through the entire page and verify:
- Focus order is logical (left-to-right, top-to-bottom)
- Focus is visible (ring or outline)
- All interactive elements are reachable
- No focus traps (except modals, which are intentional)
- Escape closes modals/dropdowns
