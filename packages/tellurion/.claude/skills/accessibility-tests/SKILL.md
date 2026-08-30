---
name: accessibility-tests
description: "Use when a feature has a UI, takes user input, or is user-facing and you need to prove it works for people with disabilities. Lays out a layered a11y testing strategy — jest-axe at the unit level, @axe-core/playwright at the page level, eslint-plugin-jsx-a11y at dev time, plus manual keyboard, screen-reader, and contrast checks — with copy-paste templates, common-pitfall fixes, and the WCAG 2.1 AA proof artifacts (scan results, keyboard tests, pages-scanned table, screen-reader log) a suite must produce. Triggers on: accessibility testing, a11y, axe-core, jest-axe, WCAG, keyboard navigation test, screen reader test, focus management, color contrast, /accessibility-tests."
score: 8.50
axes:
  composability: 8
  craft: 10
  coverage: 8
  robustness: 8
  leverage: 8
  efficiency: 7
  fidelity: 9
deployed-in: [TBK Labs]
scored-by: TBK Labs
scored-on: 2026-05-18
---

# Accessibility Tests

## What It Is

Accessibility (a11y) testing verifies that your application can be used by people with disabilities — including those who navigate with keyboards, use screen readers, have low vision, experience color blindness, or have motor impairments that prevent precise mouse use. Automated tools like axe-core catch approximately 30-40% of WCAG violations (missing alt text, insufficient contrast, missing form labels, broken ARIA). The remaining 60-70% requires manual and semi-automated testing: keyboard navigation flows, screen reader announcements, focus management in dynamic UI (modals, dropdowns, toast notifications), and reading order verification. A robust a11y testing strategy layers automated scanning (fast, catches the obvious) with targeted manual testing (slow, catches the subtle) and runs both in CI and during development.

## What It Catches

- **Missing form labels** — an input has a placeholder but no `<label>` element or `aria-label`, so screen readers announce it as "edit text" with no context
- **Insufficient color contrast** — text at 3.5:1 ratio on a light gray background fails WCAG AA (requires 4.5:1 for normal text, 3:1 for large text)
- **Keyboard traps** — user Tabs into a modal or custom dropdown and cannot Tab out because focus is not managed, requiring a mouse click to escape
- **Missing alt text on images** — decorative images that should have `alt=""` have no alt attribute at all, causing screen readers to announce the filename ("DSC_0847.jpg")
- **Broken ARIA patterns** — a custom select uses `role="listbox"` but doesn't implement `aria-activedescendant` or arrow key navigation, making it unusable for keyboard users
- **Focus not moved after navigation** — SPA route change renders new content but focus stays at the top of the page (or worse, on a now-invisible element), leaving screen reader users lost
- **Dynamic content not announced** — a toast notification appears visually but has no `aria-live` region, so screen readers never announce it
- **Touch targets too small** — buttons are 24x24px instead of the 44x44px minimum, causing misclicks for users with motor impairments

## When It's Required

- The feature has a user interface (C4) — every UI needs baseline a11y testing
- The feature involves user input (C5) — forms are the highest-risk area for a11y violations
- The feature is user-facing (C14) — public-facing features have legal compliance requirements (ADA, Section 508, EAA)
- Any project that will be used by government agencies, healthcare organizations, education institutions, or large enterprises (contractual WCAG compliance requirements)
- Any project in the EU (European Accessibility Act takes effect June 2025)

**There is no valid "skip when" for accessibility.** Even internal tools should meet baseline keyboard navigation and screen reader support. The question is how deep you go, not whether you test at all.

## Setup Guide

### Layer 1: Automated scanning in unit tests (jest-axe)

```bash
npm install --save-dev jest-axe @types/jest-axe
```

Runs axe-core against rendered component HTML in Jest/Vitest. Fast, catches structural violations.

### Layer 2: Automated scanning in E2E tests (Playwright + axe)

```bash
npm install --save-dev @axe-core/playwright
```

Runs axe-core against the real rendered page in a browser. Catches violations that only appear with real CSS applied.

### Layer 3: ESLint plugin for development-time catching

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

Catches common React a11y issues at lint time — missing alt, onClick without keyboard handler, non-interactive elements with click handlers.

### Layer 4: Manual testing tools

- **Keyboard** — Tab, Shift+Tab, Enter, Space, Escape, Arrow keys. No additional setup.
- **Screen readers** — VoiceOver (macOS: Cmd+F5), NVDA (Windows, free), JAWS (Windows, paid)
- **Browser extensions** — axe DevTools, Lighthouse Accessibility, WAVE
- **Color contrast** — WebAIM Contrast Checker, Stark (Figma plugin)

### ESLint configuration

```javascript
// .eslintrc.js (partial)
module.exports = {
  plugins: ['jsx-a11y'],
  extends: ['plugin:jsx-a11y/recommended'],
  rules: {
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['to', 'href'],
    }],
    'jsx-a11y/label-has-associated-control': ['error', {
      assert: 'either',
    }],
  },
};
```

## Template

### Unit-level a11y testing with jest-axe

```typescript
// components/LoginForm.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginForm } from './LoginForm';

expect.extend(toHaveNoViolations);

describe('LoginForm accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations in error state', async () => {
    const { container } = render(
      <LoginForm error="Invalid email or password" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when loading', async () => {
    const { container } = render(<LoginForm isLoading />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Page-level a11y testing with Playwright + axe

```typescript
// e2e/a11y/dashboard.a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard accessibility', () => {
  test('has no critical accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']) // WCAG 2.1 AA
      .exclude('.third-party-widget') // Exclude elements you don't control
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('has no violations after opening modal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Keyboard navigation testing

```typescript
// e2e/a11y/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test('Tab order follows visual layout on main nav', async ({ page }) => {
    await page.goto('/');

    // Tab through main navigation
    await page.keyboard.press('Tab'); // Skip to main content link
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();

    await page.keyboard.press('Tab'); // Logo/home link
    await expect(page.getByRole('link', { name: /home/i })).toBeFocused();

    await page.keyboard.press('Tab'); // First nav item
    await expect(page.getByRole('link', { name: 'Features' })).toBeFocused();
  });

  test('modal traps focus and Escape closes it', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Create project' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Focus should be inside the modal
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Tab through all focusable elements — focus should not leave the modal
    const focusableInModal = dialog.locator(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusableInModal.count();

    for (let i = 0; i < count + 1; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(el);
      });
      expect(focused).toBe(true);
    }

    // Escape closes the modal
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Focus returns to the trigger button
    await expect(
      page.getByRole('button', { name: 'Create project' })
    ).toBeFocused();
  });

  test('dropdown menu supports arrow key navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'User menu' }).click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Arrow down moves through items
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeFocused();

    // Enter activates the item
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/settings/);
  });
});
```

### Reusable a11y scan helper

```typescript
// e2e/helpers/a11y.ts
import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';

export async function expectNoA11yViolations(
  page: Page,
  options?: {
    exclude?: string[];
    tags?: string[];
  }
) {
  let builder = new AxeBuilder({ page })
    .withTags(options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa']);

  for (const selector of options?.exclude || []) {
    builder = builder.exclude(selector);
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    const formatted = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
      help: v.helpUrl,
    }));
    console.error('Accessibility violations:', JSON.stringify(formatted, null, 2));
  }

  expect(results.violations).toEqual([]);
}
```

## Common Pitfalls

| Pitfall | Why It Happens | Fix |
|---------|---------------|-----|
| **"axe found 0 violations" treated as fully accessible** | Teams run automated scans, get a clean report, and declare the feature accessible. Automated tools catch 30-40% of issues at best. | Automated scanning is the floor, not the ceiling. Layer in keyboard navigation tests, screen reader spot-checks, and manual testing for every new interactive component. |
| **Custom components ignore ARIA patterns** | A custom `<Select>` looks great visually but doesn't implement `role="listbox"`, `aria-expanded`, `aria-activedescendant`, or keyboard navigation. | Follow WAI-ARIA Authoring Practices Guide for every custom widget pattern. Or use headless UI libraries (Radix UI, React Aria, Headless UI) that handle ARIA correctly. |
| **Focus management ignored in SPAs** | Route changes render new content but focus stays on the previous page's elements. Screen reader users hear nothing, don't know the page changed. | On route change, move focus to the main content heading or a `<main>` landmark. Use `aria-live="polite"` for route announcements. |
| **Color is the only indicator** | Error states shown only with red borders, success shown only with green checkmarks. Color-blind users miss the signal entirely. | Always pair color with text, icons, or patterns. Error states need error text. Required fields need "(required)" not just a red asterisk. |
| **Skip link missing or broken** | No skip-to-content link, or it exists but is permanently `display: none` (so it's invisible even to keyboard users who need it). | Style skip links as `position: absolute; left: -9999px;` and bring them on-screen with `:focus` styles. Test by pressing Tab on page load — the skip link should appear. |
| **Testing only the "happy path" state** | Forms tested empty but not in error state, loading state, or disabled state. Each state can introduce new violations. | Test every component state: default, hover, focus, active, disabled, error, loading, empty, full. Each state is a separate axe run. |

## Proof Artifact

The accessibility test suite must produce:

1. **axe-core scan results** — zero violations at WCAG 2.1 AA level across all tested pages/components
   ```
   ✓ Dashboard has no critical accessibility violations
   ✓ Dashboard has no violations after opening modal
   ✓ Login page has no axe violations
   ✓ Login page has no axe violations in error state
   8 passed (12s)
   ```

2. **Keyboard navigation test results** — all keyboard interaction tests passing (Tab order, focus trapping, Escape behavior, arrow key navigation)

3. **Pages scanned list** — every page or route that was scanned, with the axe tags applied:
   ```
   | Page            | axe Tags                      | Violations |
   |-----------------|-------------------------------|------------|
   | /               | wcag2a, wcag2aa, wcag21aa     | 0          |
   | /dashboard      | wcag2a, wcag2aa, wcag21aa     | 0          |
   | /settings       | wcag2a, wcag2aa, wcag21aa     | 0          |
   | /pricing        | wcag2a, wcag2aa, wcag21aa     | 0          |
   ```

4. **Manual screen reader testing log** (for critical features) — a checklist documenting that a human tested the primary flows with at least one screen reader:
   ```
   | Flow             | Screen Reader     | Result | Notes                          |
   |------------------|-------------------|--------|--------------------------------|
   | Sign up          | VoiceOver/Safari  | Pass   | All form fields announced      |
   | Checkout         | NVDA/Firefox      | Pass   | Price total announced on update|
   | Dashboard nav    | VoiceO