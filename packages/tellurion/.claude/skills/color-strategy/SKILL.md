---
name: color-strategy
description: Strategic color application — semantic assignment, accent placement, OKLCH color space, 60/30/10 rule, WCAG contrast compliance. Use when adding color to monochromatic designs, fixing color issues, or establishing a color system. Bans purple-blue gradients and gray-on-color. Triggers on "color", "palette", "color system", "contrast", "dark mode colors".
---

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# Color Strategy


## Overview

Color communicates. It doesn't decorate. Every color decision must carry meaning: brand, status, hierarchy, or action. Color added without a semantic reason creates noise.

Color communicates. It doesn't decorate. Every color decision must carry meaning: brand, status, hierarchy, or action. Color added without a semantic reason creates noise.

---

## Core Principle

**One color does one job. Do it well.**

A brand accent that also signals "danger" confuses users. A CTA button color that appears in the footer nav dilutes the action signal. Define what each color communicates before placing it anywhere.

---

## Phase 1 — Audit Existing Color

Before adding color, understand what's there:

- How many distinct colors are in use?
- Which colors are semantic (error, success, warning) vs. brand vs. neutral?
- Are any colors doing double duty (same color = CTA and informational highlight)?
- What is the dominant background color? What is the dominant foreground?
- Are there contrast failures on existing combinations?

---

## Phase 2 — Establish the Color System

### Color Roles

Every color in the system must have a defined role:

| Role | Purpose |
|------|---------|
| **Background** | Page, card, section backgrounds (neutral) |
| **Surface** | Elevated components — modals, dropdowns, tooltips |
| **Border** | Dividers, input borders, separators |
| **Text Primary** | Body text, headings |
| **Text Secondary** | Supporting text, captions, labels |
| **Text Muted** | Placeholders, disabled text |
| **Brand / Accent** | Primary CTAs, links, active states |
| **Brand Secondary** | Secondary actions, highlights |
| **Semantic: Success** | Confirmations, completed states, positive metrics |
| **Semantic: Warning** | Caution states, pending, near-limit |
| **Semantic: Error** | Failures, destructive actions, validation errors |
| **Semantic: Info** | Neutral informational, help, tooltips |

### The 60/30/10 Rule

- **60%** — Dominant neutral (background, surfaces, text)
- **30%** — Secondary color (section accents, supporting elements)
- **10%** — Accent/brand color (CTAs, key highlights, interactive elements)

If the accent color appears more than 10% of the visible area, it's no longer an accent — it's competing with the neutrals.

---

## Phase 3 — OKLCH Color Space

Use OKLCH for all custom color values. It is perceptually uniform — stepping lightness produces visually equal steps, unlike HSL.

```css
/* OKLCH format: oklch(lightness chroma hue) */
/* Lightness: 0 (black) to 1 (white) */
/* Chroma: 0 (gray) to ~0.4 (vivid) */
/* Hue: 0-360 degrees */

:root {
  /* Brand accent */
  --color-accent: oklch(0.55 0.22 250);

  /* Accent scale */
  --color-accent-50:  oklch(0.97 0.04 250);
  --color-accent-100: oklch(0.93 0.08 250);
  --color-accent-500: oklch(0.55 0.22 250); /* Base */
  --color-accent-700: oklch(0.38 0.18 250);
  --color-accent-900: oklch(0.22 0.10 250);

  /* Semantic colors */
  --color-success: oklch(0.62 0.18 145);
  --color-warning: oklch(0.72 0.18 75);
  --color-error:   oklch(0.55 0.22 25);
  --color-info:    oklch(0.62 0.14 230);
}
```

---

## Phase 4 — Accent Application

### Where Accent Color Goes

**Yes:**
- Primary CTA buttons (one per screen section maximum)
- Active navigation state
- Form focus rings
- Link text (underlined)
- Progress bars and completion indicators
- Key metric callouts

**No:**
- Decorative backgrounds
- Section dividers
- Icon fills unless the icon is the only interactive element
- Text that isn't a link or label

### Accent on Dark Mode

Dark mode is not "invert the colors." Accent colors shift:
- Reduce chroma by 10-15% (vivid colors bloom on dark backgrounds)
- Increase lightness by 10-15% (for contrast against dark surfaces)
- Test actual WCAG contrast — don't assume it passes

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-accent: oklch(0.68 0.18 250); /* Lighter, less saturated */
  }
}
```

---

## Phase 5 — WCAG Contrast Compliance

Non-negotiable for all text/background pairs.

| Element | Minimum Ratio | Target Ratio |
|---------|--------------|-------------|
| Body text (≥18px) | 3:1 | 4.5:1 |
| Small text (<18px) | 4.5:1 | 7:1 |
| UI components (borders, icons) | 3:1 | 4.5:1 |
| Decorative elements | No requirement | — |

### Testing Contrast

```css
/* Check these combinations specifically — they commonly fail: */
/* Gray text on colored background */
/* White text on brand medium */
/* Muted text on card surfaces */
/* Placeholder text in inputs */
/* Disabled state text */
```

Tools: `color-contrast()` in CSS (where supported), Figma contrast plugin, or WebAIM Contrast Checker.

---

## Banned Patterns

**Purple-blue gradients:** `linear-gradient(135deg, #667eea, #764ba2)` — overused to the point of meaninglessness. Signals AI-generated design instantly.

**Gray text on colored backgrounds:** `color: #666` on any non-white surface almost certainly fails contrast. Always verify with actual values.

**Vibrant color everywhere:** If everything is colorful, nothing stands out. Restrain the palette.

**Opacity for color variants:** `rgba(accent, 0.5)` is not a design system — it produces unpredictable results on different backgrounds. Define explicit tints.

**Semantic color overloading:** Using the brand blue for both CTAs and informational notices removes the signal from both.

---

## Dark Mode Strategy

Define dark mode as a separate token layer — don't use `filter: invert()` or ad-hoc overrides.

```css
:root {
  --bg-primary: oklch(1 0 0);         /* white */
  --text-primary: oklch(0.13 0 0);    /* near-black */
  --surface: oklch(0.97 0 0);         /* off-white */
}

[data-theme="dark"] {
  --bg-primary: oklch(0.13 0 0);      /* near-black */
  --text-primary: oklch(0.93 0 0);    /* near-white */
  --surface: oklch(0.18 0 0);         /* dark surface */
}
```

---

## Dos and Don'ts

**Do:**
- Assign every color a named role before placing it.
- Use OKLCH for perceptually consistent scales.
- Test contrast on every unique text/background combination.
- Constrain — fewer colors used well beat many colors used poorly.

**Don't:**
- Use purple-blue gradients as a shortcut for "looks premium."
- Put gray text on colored backgrounds without a contrast check.
- Add color because something "looks flat" — fix hierarchy first.
- Use raw hex values directly in components — always go through tokens.

---

## Kit Integration

- **During GSD** — fires when color tokens are defined or when UI receives its first color pass
- **During design-critique** — referenced when scoring Color with Purpose dimension
- **During /kit planning** — consulted when interpreting brand colors from brief
- **On demand** — triggered by "color", "palette", "color system", "contrast", "dark mode colors"




---

## Example Session

```
User: Apply color strategy to FleetCraft

Inputs from brand brief:
  Primary brand: graphite #1A1D1F
  Accent: cadmium orange #FF7A1A (safety-vest reference)
  Background: cream #F2EFE9

60/30/10 application:
  60% — cream surface (#F2EFE9)
  30% — graphite (text, primary nav, data panels)
  10% — cadmium orange (CTA buttons, status alerts, active states only)

OKLCH conversion + step system (5 stops each):
  graphite: 0.20 0.01 250 → 0.15 / 0.20 / 0.35 / 0.55 / 0.75
  orange: 0.71 0.18 50 → 0.55 / 0.65 / 0.71 / 0.78 / 0.85

Banned by rule:
  Purple-blue gradient (banned at this brand) → not used
  Gray-on-color combos → none introduced
  Pure black/white → swapped to graphite/cream tokens

WCAG audit:
  Text on cream: 12.4:1 ✓ AAA
  Orange CTA text on graphite: 4.8:1 ✓ AA
  Muted text 0.55 graphite on cream: 4.6:1 ✓ AA (was 3.2:1 — fixed)

Dark mode:
  Surface flips to graphite, text to cream, accent stays
  Orange opacity reduced to 0.92 to prevent vibration on dark

Saved: web/src/styles/tokens.css + dev_docs/design/color-strategy.md
Chain → design-critique, quality-gate, web-design-review
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
