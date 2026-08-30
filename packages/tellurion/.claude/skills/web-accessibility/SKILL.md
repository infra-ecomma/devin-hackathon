---
name: web-accessibility
description: WCAG 2.1 accessibility implementation — semantic HTML, keyboard navigation, ARIA attributes, color contrast, screen reader support, axe-core testing. Use when building accessible UI, fixing a11y issues, or ensuring compliance. Triggers on "accessibility", "a11y", "WCAG", "screen reader", "keyboard navigation", "ARIA".
---

> **CHAIN:** After this skill → design-engine, react-rules, nextjs, shadcn, web-design-review


# Web Accessibility — WCAG 2.1 Implementation


## When to use

- native element is unavailable:**

## Overview

Standards-compliant accessibility for production UI. Covers semantic HTML, keyboard navigation, ARIA, color contrast, screen reader behavior, and automated testing.

Standards-compliant accessibility for production UI. Covers semantic HTML, keyboard navigation, ARIA, color contrast, screen reader behavior, and automated testing.

---

## WCAG 2.1 Conformance Levels

| Level | Requirement | Use Case |
|---|---|---|
| A | Minimum | Not acceptable for production |
| AA | Standard | Required for most public-facing sites |
| AAA | Enhanced | Government, healthcare, financial services |

**Target: AA conformance minimum on every build.**

---

## Semantic HTML — First Defense

Use native elements before ARIA. Native elements carry built-in keyboard and screen reader behavior.

```html
<!-- Correct: native semantics -->
<button type="button">Submit</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<article>...</article>
<aside>...</aside>

<!-- Wrong: div soup requiring full ARIA rebuild -->
<div class="btn" onclick="...">Submit</div>
<div class="nav">...</div>
```

**Landmark regions every page must have:**
`<header>`, `<nav>`, `<main>`, `<footer>` — screen readers use these to jump sections.

---

## Keyboard Navigation — Complete Pattern

| Key | Expected Behavior |
|---|---|
| Tab | Move focus forward through interactive elements |
| Shift+Tab | Move focus backward |
| Enter | Activate links, buttons, submit forms |
| Space | Activate buttons, toggle checkboxes |
| Arrow keys | Navigate within widgets (menus, tabs, sliders) |
| ESC | Close dialogs, dropdowns, menus — return focus to trigger |
| Home / End | Jump to first / last item in a list widget |

**Focus management rules:**
- Modal opens → focus moves to first focusable element inside modal
- Modal closes → focus returns to the button that opened it
- Dynamic content loads → focus moves to new content heading
- Never lose focus to `document.body` on close

---

## ARIA Attributes — When and How

**Roles — use when native element is unavailable:**
```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
<div role="tablist">
<div role="tab" aria-selected="true" aria-controls="panel-1">
<div role="alert">              <!-- auto-announced, no focus needed -->
<div role="status">             <!-- polite, non-urgent announcements -->
```

**Labels — every interactive element must have a name:**
```html
<!-- Option 1: visible label -->
<button aria-label="Close dialog">×</button>

<!-- Option 2: label by reference -->
<div id="modal-title">Confirm Delete</div>
<dialog aria-labelledby="modal-title">

<!-- Option 3: described by -->
<input aria-describedby="password-hint" type="password">
<span id="password-hint">Must be 8+ characters</span>
```

**Live regions — dynamic content announcements:**
```html
<div aria-live="polite">   <!-- waits for silence — status updates -->
<div aria-live="assertive"> <!-- interrupts — errors, critical alerts -->
<div aria-atomic="true">   <!-- announce full region, not just changed part -->
```

---

## Color Contrast Requirements

| Text Type | AA Minimum | AAA Enhanced |
|---|---|---|
| Normal text (< 18pt) | 4.5:1 | 7:1 |
| Large text (18pt+ or 14pt bold) | 3:1 | 4.5:1 |
| UI components & icons | 3:1 | — |
| Decorative elements | No requirement | — |

**Tools:** `webaim.org/resources/contrastchecker` or browser DevTools color picker.

**Never convey information by color alone.** Always pair with icon, label, or pattern.

---

## React Component Patterns

**Accessible Modal:**
```tsx
function Modal({ isOpen, onClose, title, children }) {
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) firstFocusRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">{title}</h2>
      {children}
      <button ref={firstFocusRef} onClick={onClose}>Close</button>
    </div>
  );
}
```

**Accessible Tab UI:**
```tsx
// Tab gets role="tab", aria-selected, aria-controls
// Panel gets role="tabpanel", aria-labelledby
// Arrow keys navigate between tabs (not Tab key)
// Only selected tab is in tab order (tabIndex=0), others tabIndex=-1
```

**Accessible Form Field:**
```tsx
<div>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-describedby="email-error"
    aria-invalid={hasError}
  />
  {hasError && (
    <span id="email-error" role="alert">
      Please enter a valid email address
    </span>
  )}
</div>
```

---

## axe-core Testing

```typescript
import { checkA11y } from 'axe-playwright';

test('homepage passes axe', async ({ page }) => {
  await page.goto('/');
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

**Run on:** every page, every interactive state (open modal, form error state, loading state).

---

## Do's and Don'ts

**Do:**
- Test with keyboard only — complete every user flow without a mouse
- Test with a screen reader (NVDA free / VoiceOver built-in macOS)
- Use `<button>` for actions, `<a href>` for navigation — never reverse these
- Add `skip to main content` link as first focusable element on page
- Announce dynamic content changes via `aria-live` regions

**Don't:**
- `outline: none` without a custom `:focus-visible` replacement — keyboard users go blind
- `tabindex > 0` — breaks natural tab order, causes confusion
- `aria-label` on non-interactive elements (`<div>`, `<span>`) — screen readers ignore roles
- Placeholder-only form labels — placeholder disappears on input
- Icon-only buttons without `aria-label` — "×" is meaningless to screen readers

---

## Kit Pipeline Integration

| Phase | Accessibility Hook |
|---|---|
| Design Review | Contrast ratios checked before component build |
| GSD Build | Semantic HTML enforced, ARIA added during dev |
| Testing | axe-core scan on every route before PR merge |
| Launch Gate | Manual keyboard-only walkthrough of critical flows |
| Rescue | axe audit run first — catches 30-40% of issues automatically |


---

## Chain Dispatch

### If UI was touched, also invoke:
Skill: design-engine
Skill: react-rules
Skill: nextjs
Skill: shadcn
Skill: web-design-review


---

<!-- AUDIT-2026-04-26 batch-3: appended sections from MSK/11-new-capabilities/accessibility-guide -->


## Automated Testing: axe-core in CI

### With Playwright

```bash
pnpm add -D @axe-core/playwright --filter @{{PROJECT_NAME}}/web
```

```typescript
// apps/web/tests/a11y/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "Home", path: "/" },
  { name: "Login", path: "/login" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Settings", path: "/settings" },
];

for (const { name, path } of pages) {
  test(`${name} page has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude(".third-party-widget") // Exclude elements you cannot control
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
```

### With Jest + jsdom

```bash
pnpm add -D jest-axe --filter @{{PROJECT_NAME}}/web
```

```typescript
// apps/web/src/components/__tests__/button.a11y.test.tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "../button";

expect.extend(toHaveNoViolations);

test("Button component has no accessibility violations", async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Keyboard Navigation Patterns

### Skip Link

```tsx
// apps/web/src/components/skip-link.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

// In layout:
// <SkipLink />
// <nav>...</nav>
// <main id="main-content" tabIndex={-1}>...</main>
```

### Focus Trap (for modals/dialogs)

```bash
pnpm add focus-trap-react --filter @{{PROJECT_NAME}}/web
```

```tsx
import FocusTrap from "focus-trap-react";

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <FocusTrap focusTrapOptions={{ onDeactivate: onClose, clickOutsideDeactivates: true }}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Dialog Title</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </FocusTrap>
  );
}
```

### Roving Tabindex (for toolbars, tab lists, menus)

```tsx
// Only one item in the group is tabbable at a time.
// Arrow keys move focus within the group.
export function TabList({ tabs, activeTab, onSelect }: TabListProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === "ArrowRight") newIndex = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") newIndex = (index - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") newIndex = 0;
    if (e.key === "End") newIndex = tabs.length - 1;

    if (newIndex !== index) {
      e.preventDefault();
      onSelect(tabs[newIndex].id);
      document.getElementById(`tab-${tabs[newIndex].id}`)?.focus();
    }
  };

  return (
    <div role="tablist">
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## ARIA Reference for Common Components

| Component | Role | Key ARIA Attributes |
|-----------|------|-------------------|
| Modal | `dialog` | `aria-modal="true"`, `aria-labelledby` |
| Dropdown Menu | `menu` | `aria-expanded`, `aria-haspopup="true"` |
| Menu Item | `menuitem` | `aria-disabled` if inactive |
| Tab List | `tablist` | -- |
| Tab | `tab` | `aria-selected`, `aria-controls` |
| Tab Panel | `tabpanel` | `aria-labelledby` |
| Accordion Header | `button` | `aria-expanded`, `aria-controls` |
| Accordion Panel | `region` | `aria-labelledby` |
| Toast/Alert | `alert` or `status` | `aria-live="polite"` or `"assertive"` |
| Combobox | `combobox` | `aria-expanded`, `aria-activedescendant`, `aria-autocomplete` |
| Progress Bar | `progressbar` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| Toggle | `switch` | `aria-checked` |

### Toast/Notification Pattern

```tsx
// Use aria-live region so screen readers announce dynamic content
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div aria-live="polite" aria-atomic="false" className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} role={toast.type === "error" ? "alert" : "status"}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

---

## Screen Reader Testing Guide

### VoiceOver (macOS) Basics

1. Turn on: `Cmd + F5`
2. Navigate by heading: `VO + Cmd + H`
3. Navigate by landmark: `VO + Cmd + L`
4. Read next element: `VO + Right Arrow`
5. Interact with group: `VO + Shift + Down Arrow`
6. Stop reading: `Ctrl`

### NVDA (Windows) Basics

1. Start NVDA: `Ctrl + Alt + N`
2. Navigate by heading: `H`
3. Navigate by landmark: `D`
4. Read next line: `Down Arrow`
5. Enter forms mode: `Enter` on a form field
6. Exit forms mode: `Escape`

### What to Test

- [ ] Page title is announced on navigation
- [ ] Headings form a logical outline (h1 > h2 > h3, no skipped levels)
- [ ] Form labels are read with their inputs
- [ ] Error messages are announced when they appear
- [ ] Modal focus moves into dialog and announces title
- [ ] Dynamic content changes are announced (toasts, live regions)

---

## Focus Management Patterns

### After Route Changes (SPA)

```tsx
// apps/web/src/hooks/use-route-focus.ts
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useRouteFocus() {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Move focus to main content after route change
    mainRef.current?.focus();
  }, [pathname]);

  return mainRef;
}

// Usage in layout:
// const mainRef = useRouteFocus();
// <main ref={mainRef} tabIndex={-1} id="main-content">
```

### After Modal Close

```tsx
// Store the element that opened the modal, restore focus when closing
const triggerRef = useRef<HTMLElement | null>(null);

function openModal(event: React.MouseEvent<HTMLButtonElement>) {
  triggerRef.current = event.currentTarget;
  setIsOpen(true);
}

function closeModal() {
  setIsOpen(false);
  // Return focus to the trigger button
  triggerRef.current?.focus();
}
```

---

## Reduced Motion

Respect users who have enabled "reduce motion" in their OS settings.

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// In JS, check the preference before triggering animations
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
}
```

---

## Common Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| `<div onClick={...}>` as a button | Not focusable, no keyboard support | Use `<button>` |
| Placeholder as label | Disappears on input, low contrast | Use visible `<label>` |
| `outline: none` without replacement | Invisible focus indicator | Replace with custom visible focus style |
| Color-only error indicators | Invisible to colorblind users | Add icon + text alongside color |
| Auto-playing video/audio | Disruptive, violates WCAG | Require user action to play |
| Removing content at certain zoom levels | Content hidden at 200% zoom | Use responsive design, test at 200% |
| `tabindex="5"` (positive tabindex) | Breaks natural tab order | Use `tabindex="0"` or `-1` only |
| ARIA attributes on elements that already have semantics | Confusing to screen readers | Use native HTML elements first |

---

## Example Session

```
User: Pre-merge a11y check on FleetCraft dispatch board PR

Automated checks (axe-core via Playwright):
  Run on 4 pages, 3 viewports each: 12 audits
  Total findings: 18

Manual checks:
  Keyboard-only tab through full dispatch flow: 0 traps
  Screen reader (NVDA + VoiceOver): all interactive elements announced correctly
  200% zoom: no horizontal scroll, all text readable

Findings (sample):
  HIGH (3): missing aria-label on 3 icon-only buttons → fixed
  HIGH (2): focus-visible style missing on 2 custom controls → added 2px orange outline
  MED (8): color-only indicators (red dots) → added text label "Alert" alongside
  LOW (5): missing language attribute on <html> → added lang="en"

Re-run after fixes: 0 violations
PR comment posted with axe-core report + manual test summary
Output: audits/a11y-pr-289.md
Chain → wcag-remediation, quality-gate
```

---
