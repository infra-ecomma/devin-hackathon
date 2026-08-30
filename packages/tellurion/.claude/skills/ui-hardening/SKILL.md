---
name: ui-hardening
description: Harden UI for production — text overflow, i18n (RTL, CJK, translation expansion), error states per HTTP status, edge cases (1000+ items, rapid clicks, offline, slow networks). Use before launch or during hardening steps. Triggers on "harden", "i18n", "edge cases", "text overflow", "production ready".
score: 7.50
axes:
  composability: 8
  craft: 8
  coverage: 7
  robustness: 7
  leverage: 7
  efficiency: 8
  fidelity: 8
deployed-in: [TBK Labs]
scored-by: TBK Labs
scored-on: 2026-05-18
---

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# UI Hardening


## Overview

Production UIs fail on real data, real users, and real network conditions. Hardening is the systematic process of finding those failure modes before users do.

Production UIs fail on real data, real users, and real network conditions. Hardening is the systematic process of finding those failure modes before users do.

---

## Phase 1 — Text Overflow & Truncation

Design with perfect content. Real content is messy. Harden every text container.

### Rules

- **All user-generated text** gets `overflow: hidden` + `text-overflow: ellipsis` or a max-height constraint.
- **Headlines** — test with 3x the expected length. "Account Settings" becomes "Manage Your Personal Account Settings and Preferences".
- **Buttons** — test with long labels. "Save" becomes "Save and Continue to Next Step". Define a max-width and truncate or wrap to 2 lines max.
- **Table cells** — every cell needs overflow handling. Define truncation column-by-column.
- **Tooltips** — must appear on truncated text so users can read the full content.

### CSS Patterns

```css
/* Single-line truncation */
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Multi-line clamp (2 lines) */
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Container with max-height */
.text-container {
  max-height: 4.5em; /* 3 lines at 1.5 line-height */
  overflow: hidden;
}
```

---

## Phase 2 — Internationalization (i18n)

### Translation Expansion Budget

English text expands when translated. Build space for it.

| English Length | Expected Expansion |
|---------------|-------------------|
| 1-10 chars | Up to 300% |
| 11-30 chars | Up to 200% |
| 31-50 chars | Up to 180% |
| 51-70 chars | Up to 130% |
| 70+ chars | Up to 130% |

**Rule:** Every fixed-width text container must be tested with a string 40% longer than the English version.

### RTL (Right-to-Left) Support

Arabic, Hebrew, Persian — layout mirrors horizontally.

```css
/* Use logical properties instead of left/right */
margin-inline-start: 1rem;  /* not margin-left */
padding-inline-end: 1rem;   /* not padding-right */
border-inline-start: 2px solid; /* not border-left */

/* Text alignment */
[dir="rtl"] .text-left { text-align: right; }

/* Icons that indicate direction must flip */
[dir="rtl"] .icon-arrow { transform: scaleX(-1); }
```

**RTL Checklist:**
- [ ] Layout mirrors correctly (columns swap, nav items reverse)
- [ ] Icons with directional meaning flip (arrows, chevrons, back buttons)
- [ ] Text alignment follows reading direction
- [ ] Form fields and inputs align correctly
- [ ] Absolute/fixed positioned elements use logical properties

### CJK (Chinese, Japanese, Korean) Support

```css
/* CJK text needs tighter line-height */
:lang(zh), :lang(ja), :lang(ko) {
  line-height: 1.6;
  word-break: break-all; /* CJK breaks at any character */
}

/* Minimum font size for legibility */
:lang(zh) { font-size: max(14px, 0.875rem); }
```

---

## Phase 3 — Error State Coverage

Every HTTP status code that your app can receive needs a designed state. No blank screens.

### Error State Matrix

| Status | User-Facing Message | UI Treatment |
|--------|--------------------|--------------------|
| 400 | "Check your input and try again" | Inline field errors, highlight problem fields |
| 401 | "Please sign in to continue" | Redirect to login, preserve intended destination |
| 403 | "You don't have access to this" | Explain why, offer alternative action |
| 404 | "This page doesn't exist" | Helpful suggestion, search, or home link |
| 409 | "This conflicts with existing data" | Show what conflicts, offer resolution |
| 422 | "Some fields need attention" | Highlight invalid fields with specific guidance |
| 429 | "Too many requests — please wait" | Show retry countdown or "try again in X seconds" |
| 500 | "Something went wrong on our end" | Apologize, log ref number, offer retry |
| 502/503 | "We're down briefly" | Maintenance mode page, status link |
| Network | "Check your connection" | Offline indicator, retry button |

### Error Message Rules

- **Be specific** — "Email is already in use" beats "Invalid input".
- **Be human** — No error codes in user-facing messages. No stack traces.
- **Offer a path** — Every error state includes a next action the user can take.
- **Preserve user input** — Never wipe a form on error. Repopulate fields.

---

## Phase 4 — Edge Case Testing

### Data Edge Cases

**Volume:**
- [ ] List with 1000+ items — does it paginate, virtualize, or crash?
- [ ] List with 0 items — is there an empty state (not a blank space)?
- [ ] Single item list — does the layout hold?
- [ ] Extremely long single value (URL, file path, name with 200+ chars)

**Content:**
- [ ] All fields empty (new user, no data populated)
- [ ] All fields at maximum length simultaneously
- [ ] Special characters: `<script>`, `"`, `'`, `&`, emoji, Unicode
- [ ] Numbers at extremes: 0, negative, very large (10,000,000+)
- [ ] Null/undefined values — never render "null" or "undefined" to the user

### Interaction Edge Cases

**Rapid clicking:**
- Double-click on submit buttons — does it submit twice?
- Rapid toggle of switches/checkboxes — does state become inconsistent?
- Fast navigation between tabs/pages — does data from previous requests pollute?

**Concurrent actions:**
- User edits a record while another user deletes it
- User submits a form while session expires
- User opens same page in two tabs — do they diverge?

### Network Edge Cases

**Slow connections:**
- 3G simulation — do skeleton loaders appear, or does the user see nothing?
- Request timeout — is there a timeout with a user-facing message?
- Partial data load — does a page with some data loaded and some pending render correctly?

**Offline mode:**
- [ ] Network disconnects mid-session — is there an offline banner?
- [ ] Actions taken offline queue or fail gracefully?
- [ ] Reconnection — does data resync?

---

## Phase 5 — Accessibility Hardening

- All interactive elements reachable via keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys)
- Focus indicators visible — not hidden with `outline: none` without a custom replacement
- `aria-live` regions on dynamic content that changes without a page reload
- Form errors announced to screen readers (`aria-describedby`, `role="alert"`)
- Images have `alt` text; decorative images have `alt=""`
- Color is never the only indicator of state (red = error must also have an icon or text label)

---

## Dos and Don'ts

**Do:**
- Test with real production-scale data, not placeholder content.
- Write the error states before the happy path — they're more likely to be seen.
- Use logical CSS properties (inline-start/end) from the start, not after adding i18n.
- Debounce rapid-click actions at the handler level, not just the button level.

**Don't:**
- Show raw error codes or stack traces to users.
- Design only the happy path and call the feature done.
- Use `visibility: hidden` to "hide" error states — they still take space and confuse layout tests.
- Assume all users have fast connections.

---

## Kit Integration

- **During GSD** — fires at the hardening step in the build plan, before QA begins
- **During Rescue** — consulted when bugs are data-related, edge-case-related, or i18n-related
- **During quality gates** — checklist runs alongside responsive-design verification
- **On demand** — triggered by "harden", "i18n", "edge cases", "text overflow", "production ready"




---

## Example Session

```
User: Harden FleetCraft dispatch board UI for edge cases

Edge cases probed (data + locale + state):
  - Truck name with 87 chars (real customer) — overflowed → fixed with text-truncate + tooltip
  - Driver with Arabic name — RTL breakdown → added dir="auto" + tested LTR fallback
  - 0 trucks state — showed empty grid with no help → empty state added
  - 5,000 trucks — table chunked correctly via virtualization but headers stuck overlapping → fixed sticky-header z-index
  - Network slow (Slow 3G throttle): skeleton appears, but action buttons need disabled state during load → added pending state
  - Network offline: app showed map errors → catch + offline banner added
  - Locale en-IN: number "5,000" rendered as "5,000.00" instead of "5,000" → fixed numberFormat call

Hardening commits (6):
  Text overflow on truck name + driver name fields
  Empty state component (with helpful CTA)
  Pending state on action buttons during async ops
  Offline banner via online/offline event
  Locale-aware numberFormat + dateFormat
  Sticky-header z-index fix

Tests added: storybook story per edge case + integration test for offline

Output: web/src/components/Dispatch/* + dev_docs/audits/ui-hardening.md
Chain → quality-gate, web-design-review
```

---

## Chain Dispatch

### Always invoke after this skill:
Skill: design-critique
Skill: quality-gate

### If UI was touched, also invoke:
Skill: web-design-review
Skill: responsive-design
Skill: web-accessibility
