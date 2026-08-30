**TBK Labs** · Curated Kit

---

# Accessibility Tests

_Layered a11y testing strategy that combines automated scanning (jest-axe in unit tests, axe-core in Playwright E2E) with targeted manual checks (keyboard navigation, screen reader announcements, focus management in dynamic UI, reading order verification). Automated tools catch ~30-40% of WCAG violations — the missing alt text, insufficient contrast, missing form labels, broken ARIA. The remaining 60-70% requires manual testing. Catches the specific failure modes: missing form labels (screen reader announces "edit text" with no context), insufficient color contrast (3.5:1 fails WCAG AA 4.5:1 minimum), keyboard traps (Tab into modal, can't Tab out), missing alt text on images (screen reader announces "DSC_0847.jpg"), broken ARIA patterns (custom select without arrow-key navigation), focus not moved after SPA route change, dynamic content without `aria-live` regions, touch targets under 44×44px. **No valid "skip when" for accessibility** — every UI needs baseline a11y; the question is how deep you go, not whether to test._

**CATEGORY** Skills · Testing  •  **TRIGGER** `accessibility tests`, `a11y testing`, `jest-axe`, `axe-core playwright`, `WCAG 2.2 AA`, `keyboard navigation tests`, `screen reader testing`, `focus management testing`  •  **RATING** ★★★★★ (10/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- The 30/70 rule named explicitly. Automated tools (jest-axe + axe-core in Playwright) catch ~30-40% of WCAG violations — the structural ones (missing alt, contrast, labels, broken ARIA). The remaining 60-70% requires manual or semi-automated testing. Without this split, teams either rely on automated alone (and ship sites with keyboard traps that axe can't detect) or skip automation in favor of manual (and miss the structural easy wins). The layered strategy is the only one that catches both.
- "No valid skip when for accessibility." The skill explicitly rejects the "internal tools don't need a11y" argument. Even internal tools need baseline keyboard nav and screen reader support. Operators in regulated industries (healthcare, government, EU post-June-2025) have legal compliance requirements that ignore the internal/external distinction. The no-skip rule prevents the cost-cutting that produces ADA lawsuits.
- Concrete failure-mode list with screen-reader output. Not "improve accessibility" — "an input has a placeholder but no `<label>` element or `aria-label`, so screen readers announce it as 'edit text' with no context." Operators reading these examples can pattern-match against their own UI without having to install JAWS to discover the problem.

---

## What It Does

This skill is the a11y testing strategy that pairs automated scanning with targeted manual testing. The layered approach catches both the structural violations automation handles well and the dynamic-UI/interaction violations that require human-in-the-loop testing.

**The 30/70 problem.** Automated a11y tools (axe-core via jest-axe or Playwright) catch ~30-40% of WCAG violations. Structural violations they catch well: missing alt text, insufficient contrast, missing form labels, broken ARIA roles. Violations they miss: keyboard navigation flows (can a keyboard user complete the signup flow?), screen reader announcement quality (does NVDA say something useful when this modal opens?), focus management in dynamic UI (after closing a modal, does focus return to the trigger?), reading order verification (does screen reader announcement match visual order?).

**Layer 1 — Automated unit tests (jest-axe).** Runs axe-core against rendered component HTML in Jest/Vitest. Fast feedback during development. Install via `npm install --save-dev jest-axe @types/jest-axe`. Per-component test: render the component, run `axe()`, assert no violations. Catches structural violations at unit-test speed.

**Layer 2 — Automated E2E tests (Playwright + axe).** Runs axe-core against the real rendered page in a browser. Install via `npm install --save-dev @axe-core/playwright`. Catches violations that only appear with real CSS applied (contrast issues that depend on computed background colors, focus rings that depend on browser styling). Runs in CI as part of the E2E suite.

**Layer 3 — Manual keyboard navigation.** Test each critical flow using only the keyboard. Tab through the page; verify focus is visible at every stop; verify focus order matches visual order; verify Escape closes modals; verify Enter activates buttons; verify Arrow keys work in custom dropdowns. Document the keyboard test as part of the QA checklist for each feature.

**Layer 4 — Manual screen reader testing.** Test critical flows with NVDA (Windows) or VoiceOver (macOS). Verify form fields are announced with their label + context. Verify dynamic content (toast notifications, modal openings) is announced via `aria-live` regions. Verify SPA route changes move focus and announce the new page. This is the slowest layer but catches the violations users actually report.

**Common failure modes caught.** Missing form labels (`<input placeholder="Email">` with no `<label for=...>` or `aria-label` — screen reader says "edit text"). Insufficient contrast (3.5:1 on light backgrounds; WCAG AA requires 4.5:1 normal text, 3:1 large text). Keyboard traps (Tab into modal that doesn't trap focus and steals focus from main content; user can't escape). Missing alt text (decorative images with `alt=""` are fine; meaningful images without alt are not). Broken ARIA patterns (custom `role="listbox"` without `aria-activedescendant` or arrow keys). Focus not moved after navigation (SPA route change renders new content but focus stays at top; screen reader users lost). Dynamic content not announced (toast appears visually; no `aria-live` region; screen reader silent). Touch targets too small (24×24px buttons; WCAG 2.5.5 requires 44×44px).

**When required.** UI features (C4), user input features (C5), user-facing features (C14). Plus contractual requirements (government, healthcare, education, large enterprises). Plus legal (ADA in US, Section 508 for government, EAA in EU starting June 2025). The no-skip rule applies even to internal tools — baseline keyboard nav and screen reader support is non-negotiable.

---

## How to Use

1. **Add Layer 1 (jest-axe) to every component test.** Cheap; catches structural violations during development.
2. **Add Layer 2 (Playwright + axe) to E2E suite.** Catches CSS-dependent violations.
3. **Run Layer 3 (manual keyboard) on every critical flow before shipping.** Tab through the page; Escape closes modals; Enter activates buttons.
4. **Run Layer 4 (manual screen reader) on every release.** NVDA on Windows or VoiceOver on macOS.
5. **Don't rely on automated alone.** 30-40% coverage. Missing 60-70% is shipping with keyboard traps and broken focus management.
6. **Honor the no-skip rule.** Even internal tools need baseline a11y. Legal compliance ignores the internal/external distinction.
7. **Test with real CSS, not just rendered HTML.** Contrast and focus rings depend on computed styles; Layer 2 is what catches these.
8. **Make a11y findings ship-blocking like other test failures.** "Fix later" produces backlog that never gets closed.

---

## The Four Layers

| Layer | Tool | Speed | Catches |
|-------|------|-------|---------|
| 1 | jest-axe in unit tests | Fast (per-component) | Structural violations on rendered HTML |
| 2 | @axe-core/playwright in E2E | Medium (per-page) | Violations dependent on real CSS |
| 3 | Manual keyboard navigation | Slow (per-flow) | Keyboard traps, focus order, custom controls |
| 4 | Manual screen reader (NVDA/VoiceOver) | Slowest (per-flow) | Announcement quality, focus management, ARIA live regions |

---

## Common Failure Modes Caught

| Failure Mode | Example |
|--------------|---------|
| Missing form labels | `<input placeholder="Email">` with no label — screen reader: "edit text" |
| Insufficient contrast | 3.5:1 light gray text — WCAG AA requires 4.5:1 |
| Keyboard traps | Tab into modal, can't Tab out without mouse click |
| Missing alt text | Meaningful image without alt attribute — screen reader announces filename |
| Broken ARIA | `role="listbox"` without `aria-activedescendant` or arrow keys |
| Focus not moved | SPA route change leaves focus at top — screen reader user lost |
| Dynamic content not announced | Toast notification with no `aria-live` region |
| Touch targets too small | 24×24px button — WCAG 2.5.5 requires 44×44px |

---

## Sample Output (jest-axe test)

```typescript
// LoginForm.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginForm } from './LoginForm';

expect.extend(toHaveNoViolations);

describe('LoginForm accessibility', () => {
  it('has no a11y violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has visible labels on all inputs', () => {
    const { getByLabelText } = render(<LoginForm />);
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
  });
});
```

```typescript
// signup.e2e.spec.ts (Playwright + axe)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('signup page has no a11y violations', async ({ page }) => {
  await page.goto('/signup');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('keyboard-only user can complete signup', async ({ page }) => {
  await page.goto('/signup');
  await page.keyboard.press('Tab'); // focus email
  await page.keyboard.type('test@example.com');
  await page.keyboard.press('Tab'); // focus password
  await page.keyboard.type('SecureP@ss123');
  await page.keyboard.press('Tab'); // focus submit
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/welcome');
});
```

```
# Manual screen-reader test record (NVDA on Windows)

Flow: Open password reset modal
Expected: NVDA announces "Reset password, dialog. Enter your email address to receive a reset link."
Actual: NVDA announces "Reset password" only — missing dialog role + instructions
Finding: Modal container needs role="dialog" aria-modal="true" aria-labelledby + aria-describedby
Fix: Add ARIA attributes; re-test
```

This is what layered a11y testing produces — jest-axe catches structural issues fast, Playwright + axe catches CSS-dependent issues at E2E speed, manual keyboard test catches focus flows, manual screen reader test catches announcement quality. All four together cover the WCAG surface.

---

## What NOT to Do

- **Don't rely on automated tools alone.** 30-40% coverage; missing keyboard traps and announcement quality.
- **Don't skip a11y for "internal tools."** Baseline keyboard nav and screen reader support are non-negotiable.
- **Don't accept "fix later" for a11y findings.** Backlog never closes; ship-blocking is the only way.
- **Don't test only happy paths.** Error states, loading states, edge cases need a11y too.
- **Don't ignore touch target size.** 44×44px minimum; smaller fails WCAG 2.5.5.
- **Don't trust contrast at sight.** Use a contrast checker (Layer 2 + Layer 4); 3.5:1 looks similar to 4.5:1 but fails AA.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | accessibility-tests |
| **Category** | Skills · Testing |
| **Rating** | ★★★★★ (10/10) |
| **Layers** | 4 (jest-axe unit · Playwright+axe E2E · manual keyboard · manual screen reader) |
| **Automated Coverage** | ~30-40% of WCAG violations |
| **Manual Coverage** | ~60-70% (keyboard, screen reader, focus management) |
| **WCAG Target** | 2.2 AA (4.5:1 normal text contrast, 44×44px touch targets) |
| **Legal Compliance** | ADA (US) · Section 508 (US Gov) · EAA (EU, June 2025+) |
| **Pairs With** | `responsive-testing` skill (sibling — responsive + a11y often catch related issues) · `mobile-verify` skill (sibling — mobile a11y needs touch-target focus) · `ai-feature-testing` skill (sibling — AI features need a11y too) · `test-patterns` skill (sibling — the canonical TS test cookbook; component test patterns these a11y checks build on) · `testing-gotchas` skill (sibling — a11y gotchas live there) |
| **Bundle** | `SKILL.md` + `README.md` + `accessibility-tests.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-11
