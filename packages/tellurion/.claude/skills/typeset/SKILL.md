---
name: typeset
description: Typography audit and improvement — font choices, hierarchy, sizing/scale, readability, consistency. Turns generic type into intentional, crafted typography. Use when fonts feel default, hierarchy is unclear, or text is hard to read. Triggers on "typography", "fonts", "type hierarchy", "readability", "text sizing", "font pairing".
---

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# Typeset


## Overview

Typography is the invisible skeleton of a design. When it is working, users don't notice it — they just read comfortably and understand hierarchy immediately. When it is broken, every other design decision suffers. Generic system fonts and inconsistent sizing are the most common signals of AI-produced UI.

Typography is the invisible skeleton of a design. When it is working, users don't notice it — they just read comfortably and understand hierarchy immediately. When it is broken, every other design decision suffers. Generic system fonts and inconsistent sizing are the most common signals of AI-produced UI.

---

## Core Principle

**Every type decision must be intentional. "Default" is not a choice.**

Font families, sizing scale, line-height, letter-spacing, and measure all interact. A change to one without adjusting the others produces imbalance. Audit all five before touching any single one.

---

## Phase 1 — Audit Existing Typography

Before changing anything, record what exists:

- How many font families are in use? (flag anything over 3)
- Is the primary font a system font stack (`-apple-system`, `ui-sans-serif`, `sans-serif`)? If so, why?
- Is there a consistent type scale, or are sizes arbitrary (`13px`, `14px`, `15px`, `16px`)?
- Are heading line-heights below 1.3? Are body line-heights between 1.4 and 1.6?
- Are measure (characters per line) values within 45–75 characters for body text?
- Is letter-spacing applied to body text? (flag — it degrades readability below 18px)

---

## Phase 2 — Font Pairing

Two families maximum for 99% of projects. Three only when a monospace is needed for code.

### Pairing Logic

**Display + Body pairing:** One expressive face for headings and hero text, one high-legibility face for body and UI labels. They must create contrast — pairing two similar grotesks produces no hierarchy.

| Display personality | Body complement |
|---------------------|----------------|
| Geometric sans (Inter, Geist) | Same family, lighter weight — no pairing needed |
| Transitional serif (Playfair, Fraunces) | Clean grotesque (Inter, DM Sans) |
| Slab serif (Rockwell, Courier Prime) | Humanist sans (Source Sans, Libre Franklin) |
| Display script or decorative | Never — decorative display faces need neutral body |

**Source:** Google Fonts, Fontshare, Bunny Fonts. Avoid fonts that require JavaScript rendering or block the critical path.

```css
/* Load display weight and body weight separately — avoid loading all 9 weights */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Inter:wght@400;500;600&display=swap');

:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
}
```

---

## Phase 3 — Type Scale

Use a modular scale rather than arbitrary sizes. Pick one ratio and derive all sizes from it.

| Ratio | Name | Use |
|-------|------|-----|
| 1.067 | Minor Second | Tight UI density, dashboards |
| 1.125 | Major Second | Standard web UI |
| 1.250 | Major Third | Marketing sites, editorial |
| 1.333 | Perfect Fourth | Display-heavy design, large screens |

```css
/* Major Third scale (×1.25) anchored at 16px base */
:root {
  --text-xs:   0.64rem;   /* 10.24px — labels, badges */
  --text-sm:   0.8rem;    /* 12.8px  — captions, helper text */
  --text-base: 1rem;      /* 16px    — body copy */
  --text-lg:   1.25rem;   /* 20px    — large body, lead paragraphs */
  --text-xl:   1.563rem;  /* 25px    — H4, card headings */
  --text-2xl:  1.953rem;  /* 31px    — H3 */
  --text-3xl:  2.441rem;  /* 39px    — H2 */
  --text-4xl:  3.052rem;  /* 49px    — H1 */
  --text-5xl:  3.815rem;  /* 61px    — Hero display */
}
```

Never use adjacent sizes from the scale for the same visual purpose. If a heading and its subheading are both `--text-xl`, there is no hierarchy.

---

## Phase 4 — Line-Height Rules

| Context | Line-height | Rationale |
|---------|------------|-----------|
| Body text | 1.4–1.6 | Comfortable for multi-sentence reading |
| Lead / large body | 1.3–1.4 | Slightly tighter at larger sizes |
| H3–H4 | 1.2–1.3 | Headings are scanned, not read |
| H1–H2 / Display | 1.0–1.15 | Large text needs tight leading |
| UI labels, buttons | 1.0–1.2 | Single-line, no wrapping expected |

```css
body        { line-height: 1.6; }
h1, h2      { line-height: 1.1; }
h3, h4      { line-height: 1.25; }
.lead       { line-height: 1.4; }
.label      { line-height: 1.2; }
```

---

## Phase 5 — Letter-Spacing and Measure

**Letter-spacing:**
- Body text: `0` or `−0.01em` maximum. Positive tracking at small sizes degrades readability.
- Display headings (≥48px): `−0.02em` to `−0.04em`. Large type at default tracking looks loose.
- ALL-CAPS labels and overlines: `0.05em` to `0.1em`. Caps need tracking to remain readable.
- Never apply `letter-spacing` to body copy to "open it up" — it signals a design shortcut.

**Measure (line length):**
- Optimal: 55–75 characters per line for body text
- Acceptable: 45–85 characters
- Outside this range: constrain with `max-width` on the text container, not the page

```css
.prose {
  max-width: 65ch; /* ch unit = width of "0" in current font — tracks with font size */
}
```

---

## Banned Patterns

**System font as primary display face:** `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI'` is acceptable for dense UI but communicates zero brand intent. Any public-facing page needs a deliberate font choice.

**More than 3 font families:** Every additional family increases load time and reduces visual cohesion. Hierarchy is achieved through weight, size, and color — not additional families.

**Inconsistent sizing:** A list of sizes like `12, 13, 14, 15, 16, 17, 18, 20, 22, 24` is not a type scale. Replace with a scale and eliminate intermediate values.

**Positive letter-spacing on body copy:** Opening up body text tracking creates a thin, airy feeling that degrades readability under 18px.

**Line-height 1.0 on body text:** Tight leading on multi-line body copy creates an impenetrable block of text.

---

## Dos and Don'ts

**Do:**
- Derive all sizes from a single modular scale.
- Set line-height in unitless values, not `px` or `rem`.
- Use `max-width: 65ch` on prose containers to enforce measure.
- Tighten letter-spacing on large display text (≥48px).
- Load only the weights you use — each extra weight weight adds 30–100KB.

**Don't:**
- Use system fonts as the primary display face on any public-facing page.
- Pair two similar grotesque fonts — they produce visual noise, not contrast.
- Apply letter-spacing to body copy below 18px.
- Use more than 3 font families in a single project.
- Set heading line-heights above 1.3 — large text must be compact.

---

## Kit Integration

- **During GSD** — fires when design tokens are being set or when a UI task includes text components
- **During /kit planning** — consulted when interpreting brand typography from a brief
- **During design-critique** — referenced when scoring Type & Hierarchy dimension
- **During color-strategy** — text contrast checks reference type sizing from this skill
- **On demand** — triggered by "typography", "fonts", "type hierarchy", "readability", "text sizing", "font pairing"




---

## Example Session

```
User: Set typography for FleetCraft

Font pairing:
  Display: Söhne Breit (geometric, industrial-feeling)
  Body: Söhne (humanist sans, paired with Breit)
  Mono: Söhne Mono (for truck IDs, timestamps, data)

Type scale (modular, 1.25 ratio, mobile-first):
  Display 2xl: clamp(2.5rem, 6vw, 4rem) — H1 hero
  Display xl:  clamp(2rem, 5vw, 3rem)   — H1 section
  Display lg:  clamp(1.5rem, 4vw, 2.25rem) — H2
  Display md:  clamp(1.25rem, 3vw, 1.5rem) — H3
  Body lg:     clamp(1rem, 1.5vw, 1.125rem)  — large body
  Body md:     1rem (16px) — default body
  Body sm:     0.875rem (14px) — secondary
  Mono md:     0.9375rem (15px) — table data

Line-height:
  Display: 1.1
  Body: 1.55
  Mono: 1.4

Letter-spacing:
  Display: -0.02em (tighter for impact)
  Body: 0
  Mono: 0.01em (slightly looser for legibility)

Output: web/src/styles/typography.css + dev_docs/design/typeset.md
Chain → color-strategy, design-critique
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
