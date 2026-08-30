---
name: design-token-guide
description: "Use when setting up or fixing a project design-token system — turning hardcoded hex, shadows, and spacing into one source of truth (a primary color scale, a chosen neutral system, semantic colors, and shadow/radius/spacing/type scales) shipped as CSS custom properties or a Tailwind 4 @theme with a token-to-component map. Triggers on: design tokens, token system, CSS custom properties, Tailwind theme, semantic colors, shadow scale, radius scale, spacing scale, design-token-guide."
---

# Design Token Guide

## What Are Design Tokens?

Design tokens are the single source of truth for your visual decisions. Instead of hardcoding `#4f46e5` in 47 files, you define it once as `--color-primary` and reference the token everywhere. When the brand color changes, you update one line.

Tokens cover: colors, shadows, border radius, spacing, typography, and transitions.

---

## Step 1: Choose Your Primary Color

Your primary color is the most important visual decision. It appears on buttons, links, active states, focus rings, and brand accents.

**Choose a shade in the 600 range as your primary.** Then generate the full scale:

| Shade | Usage |
|-------|-------|
| 50 | Subtle backgrounds (selected row, active nav item) |
| 100 | Light backgrounds (badges, pills) |
| 200 | Borders on primary elements |
| 300 | Hover states on light backgrounds |
| 400 | Secondary text on dark backgrounds |
| 500 | Icons, secondary buttons |
| 600 | **Primary buttons, links, active states** |
| 700 | Hover state for primary buttons |
| 800 | Pressed state, dark accents |
| 900 | Headings on light backgrounds (use sparingly) |
| 950 | Near-black for maximum contrast text |

**Example primary scales:**

```
Indigo:  #eef2ff #e0e7ff #c7d2fe #a5b4fc #818cf8 #6366f1 #4f46e5 #4338ca #3730a3 #312e81 #1e1b4b
Blue:    #eff6ff #dbeafe #bfdbfe #93c5fd #60a5fa #3b82f6 #2563eb #1d4ed8 #1e40af #1e3a8a #172554
Emerald: #ecfdf5 #d1fae5 #a7f3d0 #6ee7b7 #34d399 #10b981 #059669 #047857 #065f46 #064e3b #022c22
```

---

## Step 2: Choose Your Neutral System

Neutrals are used for text, backgrounds, borders, and dividers. They make up 80% of your UI's surface area.

| System | Character | Best For |
|--------|-----------|----------|
| `gray` | Pure, balanced | Most applications |
| `slate` | Cool, slightly blue | Dark themes, developer tools |
| `zinc` | Warm-cool balance | Modern SaaS |
| `neutral` | Truly neutral | When brand color should dominate |
| `stone` | Warm, slightly yellow | Friendly, approachable apps |

**Pick one and commit.** Mixing neutral systems (gray borders + slate backgrounds) creates visual tension.

---

## Step 3: Define Semantic Colors

Semantic colors communicate meaning. They should be consistent across your entire app.

```css
/* Success: green family */
--color-success-light: oklch(0.95 0.05 150);  /* bg for success alerts */
--color-success: oklch(0.65 0.2 150);          /* icons, badges */
--color-success-dark: oklch(0.45 0.15 150);    /* text on light bg */

/* Warning: amber family */
--color-warning-light: oklch(0.95 0.08 85);
--color-warning: oklch(0.75 0.15 85);
--color-warning-dark: oklch(0.55 0.12 85);

/* Error: red family */
--color-error-light: oklch(0.95 0.05 25);
--color-error: oklch(0.65 0.2 25);
--color-error-dark: oklch(0.5 0.18 25);

/* Info: blue family */
--color-info-light: oklch(0.95 0.04 240);
--color-info: oklch(0.65 0.15 240);
--color-info-dark: oklch(0.5 0.12 240);
```

**Rule:** Never use semantic colors for decoration. Red means error. Green means success. If you use red for a non-error accent, users will think something is wrong.

---

## Step 4: Define Shadows

Shadows create depth hierarchy. Define 3-4 levels:

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

**Usage mapping:**

| Token | Component |
|-------|-----------|
| `shadow-xs` | Subtle input borders |
| `shadow-sm` | Cards at rest |
| `shadow-md` | Cards on hover, dropdowns |
| `shadow-lg` | Modals, popovers |
| `shadow-xl` | Floating action buttons, toasts |

**Add transition for interactive elements:**
```css
--shadow-card: var(--shadow-sm);
--shadow-card-hover: var(--shadow-md);

.card {
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease;
}
.card:hover {
  box-shadow: var(--shadow-card-hover);
}
```

---

## Step 5: Define Border Radius Scale

Radius defines the personality of your UI. Sharp = corporate. Rounded = friendly. Very rounded = playful.

```css
--radius-sm: 0.25rem;  /* 4px - small buttons, badges */
--radius-md: 0.375rem; /* 6px - inputs, standard buttons */
--radius-lg: 0.5rem;   /* 8px - cards, containers */
--radius-xl: 0.75rem;  /* 12px - modals, large panels */
--radius-2xl: 1rem;    /* 16px - hero sections */
--radius-full: 9999px; /* pills, avatars */
```

**Pick a personality and be consistent:**

| Personality | sm | md | lg | xl |
|------------|----|----|----|----|
| Corporate | 2px | 4px | 6px | 8px |
| Balanced | 4px | 6px | 8px | 12px |
| Friendly | 6px | 8px | 12px | 16px |
| Playful | 8px | 12px | 16px | 24px |

---

## Step 6: Define Spacing Rhythm

Use Tailwind's 4px increment scale. Define section-level spacing for consistency:

```css
/* Section spacing */
--space-section: 2rem;      /* 32px - between major sections */
--space-card-padding: 1.5rem; /* 24px - inside cards */
--space-stack: 1rem;         /* 16px - between stacked elements */
--space-inline: 0.75rem;    /* 12px - between inline elements */
--space-tight: 0.5rem;      /* 8px - compact spacing */

/* Page layout */
--space-page-x: 1.5rem;     /* horizontal page padding */
--space-page-y: 2rem;       /* vertical page padding */
--content-max-width: 80rem;  /* 1280px max content width */
```

**Rule:** Never use arbitrary spacing values (`p-[13px]`, `m-[7px]`). Use the scale. If the scale doesn't have what you need, you're probably over-customizing.

---

## Step 7: Choose Fonts

| Font | Character | Performance |
|------|-----------|-------------|
| Inter | Clean, modern, universal | 30-50KB |
| system-ui | Native platform font | 0KB (already loaded) |
| Geist | Vercel-style, sharp | 30-50KB |
| DM Sans | Friendly, geometric | 30-50KB |
| Plus Jakarta Sans | Premium, distinctive | 30-50KB |

**For most projects:** Use `Inter` for headings and body, or `system-ui` for zero-cost performance.

**Font weight rule:** Use only 2 weights:
- `400` (regular) for body text
- `600` (semibold) for headings and emphasis

Never use `700` (bold) for headings -- it's too heavy. Never use `300` (light) -- it's unreadable at small sizes.

---

## Implementation: CSS Custom Properties

```css
/* globals.css or app.css */
:root {
  /* Primary */
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;

  /* Neutrals (slate) */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;
  --color-neutral-950: #020617;

  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Spacing */
  --space-section: 2rem;
  --space-card: 1.5rem;
  --space-stack: 1rem;
}
```

## Implementation: Tailwind 4 @theme

```css
/* app.css with Tailwind 4 */
@import "tailwindcss";

@theme {
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  --radius-card: 0.5rem;
  --radius-button: 0.375rem;
  --radius-input: 0.375rem;
}
```

This makes tokens available as Tailwind utilities:
```html
<div class="bg-primary-600 text-primary-50 rounded-card shadow-card hover:shadow-card-hover">
```

---

## Token-to-Component Mapping

| Token | Components That Use It |
|-------|----------------------|
| `primary-600` | Primary buttons, active nav links, focus rings |
| `primary-700` | Primary button hover state |
| `primary-100` | Selected row background, active badge |
| `neutral-50` | Page background |
| `neutral-100` | Card background, table header |
| `neutral-200` | Borders, dividers |
| `neutral-500` | Placeholder text, secondary icons |
| `neutral-700` | Body text |
| `neutral-900` | Headings |
| `shadow-card` | Card resting state |
| `shadow-card-hover` | Card hover state, dropdown menus |
| `radius-lg` | Cards, containers |
| `radius-md` | Buttons, inputs |
| `radius-sm` | Badges, small elements |

---

## Example Session

```
User: Establish design tokens for FleetCraft

Token system written to: web/src/styles/tokens.css (CSS vars) + tailwind.config.ts (Tailwind theme)

Tokens defined (categories):
  Colors — graphite scale (50-900), orange scale, cream surfaces, semantic (success/warning/alert/info)
  Spacing — 0/1/2/3/4/6/8/12/16 (rem-based)
  Radius — sm (4px) / md (8px) / lg (12px) / pill (9999px)
  Shadow — subtle / elevated / floating / focus-ring
  Typography — display-2xl through body-sm + mono-md
  Z-index — 0/10/20/30/40/50 (modal=50)
  Motion duration — fast 120ms / base 220ms / slow 380ms; ease curves

ESLint rule wired: no-arbitrary-hex-in-jsx (forces token usage)
Enforced via tailwind.config: every token has a class shortcut

Token-to-component map snapshot:
  graphite-900 → text-primary, primary button bg
  orange-500 → CTA button bg, status accent
  cream-50 → page bg
  shadow-elevated → cards, dropdowns
  radius-md → buttons, inputs
  radius-lg → cards, modals

Storybook story published: tokens.stories.tsx (visual swatches)
Output: web/src/styles/tokens.css + tailwind.config.ts + dev_docs/design/tokens.md
Chain → color-strategy, typeset, design-system-architect
```
