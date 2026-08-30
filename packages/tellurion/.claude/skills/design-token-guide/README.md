**TBK Labs** · Curated Kit

---

# Design Token Guide

_Single source of truth for visual decisions — colors / shadows / border radius / spacing / typography / transitions. Define once, reference everywhere. **"Instead of hardcoding `#4f46e5` in 47 files, you define it once as `--color-primary` and reference the token everywhere. When the brand color changes, you update one line."** **Token Categories Covered**: colors (primary scale 50-950 + neutral system + semantic), shadows (5 elevations), border radius (sm/md/lg/full), spacing (4px base scale), typography (font family + scale + weight + line-height), transitions (durations + easings). **3-Step Primary Color Selection**: (1) **Choose 600-shade as primary** (appears on buttons + links + active states + focus rings), (2) **Generate full 11-shade scale** (50-950), (3) **Apply by usage**: 50 subtle backgrounds + 100 badges/pills + 200 borders + 300 hover on light + 400 secondary text on dark + 500 icons + 600 **primary buttons/links** + 700 hover for primary + 800 pressed + 900 headings (sparingly) + 950 near-black max contrast. **3 Common Primary Scales** (Tailwind): Indigo (`#4f46e5` at 600), Blue (`#2563eb` at 600), Emerald (`#059669` at 600). **5 Neutral Systems with Character**: gray (pure balanced, most apps), slate (cool slightly blue, dark themes + dev tools), zinc (warm-cool balance, modern SaaS), neutral (truly neutral, brand-dominant), stone (warm slightly yellow, friendly approachable). **CRITICAL Rule**: pick ONE neutral system and commit — mixing gray borders + slate backgrounds creates visual tension. **3 Semantic Color Families** using OKLCH (perceptually uniform): success (green family, `oklch(0.65 0.2 150)` base + light bg + dark text variants), warning (amber family, hue 85), error (red family, hue 25). **Each semantic color has 3 variants**: light (bg for alerts), base (icons + badges), dark (text on light bg). **Token Naming Convention**: `--color-{role}` not `--color-{color-name}` — use `--color-primary` not `--color-indigo-600` so theme swaps don't break code. **5 Shadow Elevations**: sm (subtle, cards at rest), md (default cards + dropdowns), lg (modals + popovers), xl (overlays), 2xl (drawers + sheets). **Border Radius Scale**: none (0), sm (2-4px buttons + inputs), md (6-8px cards), lg (12-16px modals), full (9999px pills + avatars). **Spacing 4px Base Scale**: 0/1/2/3/4/5/6/8/10/12/16/20/24/32 — every increment = 4px (1 = 4px, 2 = 8px, 4 = 16px, 8 = 32px). **Typography Tokens**: font-sans + font-mono families, scale (xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36 / 5xl 48), weight (400 normal / 500 medium / 600 semibold / 700 bold), line-height (tight 1.2 / normal 1.5 / relaxed 1.75). **Transition Tokens**: duration (fast 150ms / normal 250ms / slow 400ms), easing (linear / in-out / spring). **Why OKLCH over HSL**: perceptually uniform (lightness changes look uniform across hues), wide gamut (P3 support), HDR-ready, predictable color manipulation. **Token Storage Patterns**: CSS custom properties on `:root` (recommended), Tailwind theme config (for utility-first), design-tokens JSON + transform script (for multi-platform). **Theme Swap Rule**: dark mode = override token values on `[data-theme="dark"]`, NEVER duplicate component styles._

**CATEGORY** Skills · Product  •  **TRIGGER** `design tokens`, `color system primary scale`, `Tailwind shade 600`, `neutral gray slate zinc neutral stone`, `semantic success warning error`, `OKLCH perceptually uniform`, `--color-primary CSS custom property`, `shadow elevation sm md lg`, `border radius scale`, `4px spacing base`, `font scale xs base xl`, `dark mode theme override`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- "Define `#4f46e5` once as `--color-primary`, reference everywhere" — names the canonical "we hardcoded the brand color in 47 files" failure that makes rebrands impossible.
- "Pick ONE neutral system and commit. Mixing gray + slate creates visual tension" — names the canonical "every developer picked their favorite gray" failure that produces incoherent UIs.
- "Use `--color-primary` not `--color-indigo-600`" — names the canonical "theme swap broke because tokens were color-named" failure.

---

## What It Does

This skill is the design token system reference.

**Token Categories**:

| Category | Purpose |
|----------|---------|
| Colors | Primary scale + neutral + semantic |
| Shadows | 5 elevations |
| Border radius | sm/md/lg/full |
| Spacing | 4px base scale |
| Typography | Family + scale + weight + line-height |
| Transitions | Durations + easings |

**Primary Color 11-Shade Scale**:

| Shade | Usage |
|-------|-------|
| 50 | Subtle backgrounds |
| 100 | Badges, pills |
| 200 | Borders on primary |
| 300 | Hover on light bg |
| 400 | Secondary text on dark |
| 500 | Icons, secondary buttons |
| **600** | **Primary buttons, links, active** |
| 700 | Hover for primary |
| 800 | Pressed state |
| 900 | Headings (sparingly) |
| 950 | Near-black max contrast |

**5 Neutral Systems**:

| System | Character | Best For |
|--------|-----------|----------|
| gray | Pure balanced | Most apps |
| slate | Cool blue | Dark themes, dev tools |
| zinc | Warm-cool | Modern SaaS |
| neutral | Truly neutral | Brand-dominant |
| stone | Warm yellow | Friendly apps |

**3 Semantic Color Families** (OKLCH):

| Family | Base Hue | Variants |
|--------|----------|----------|
| Success | 150 (green) | light bg + base + dark text |
| Warning | 85 (amber) | light + base + dark |
| Error | 25 (red) | light + base + dark |

**5 Shadow Elevations**:

| Elevation | Use For |
|-----------|---------|
| sm | Cards at rest |
| md | Default cards + dropdowns |
| lg | Modals + popovers |
| xl | Overlays |
| 2xl | Drawers + sheets |

**Border Radius**:

| Token | Pixels | Use For |
|-------|--------|---------|
| none | 0 | Sharp edges |
| sm | 2-4 | Buttons, inputs |
| md | 6-8 | Cards |
| lg | 12-16 | Modals |
| full | 9999 | Pills, avatars |

**Spacing 4px Base Scale**: 0/1/2/3/4/5/6/8/10/12/16/20/24/32 (each = N × 4px)

**Typography Scale**:

| Token | Pixels |
|-------|--------|
| xs | 12 |
| sm | 14 |
| base | 16 |
| lg | 18 |
| xl | 20 |
| 2xl | 24 |
| 3xl | 30 |
| 4xl | 36 |
| 5xl | 48 |

**Transition Tokens**:

| Duration | ms | Easing |
|----------|----|----|
| fast | 150 | in-out |
| normal | 250 | in-out |
| slow | 400 | spring |

**Naming Rule**: `--color-{role}` not `--color-{color-name}`.

---

## How to Use

1. **Pick primary at 600 shade.** Generate full 11-scale.
2. **One neutral system. Don't mix.** Visual tension.
3. **OKLCH for semantic colors.** Perceptually uniform.
4. **Name by role, not color.** `--color-primary` not `--color-indigo-600`.
5. **4px base spacing scale.** Every increment = 4px.
6. **Dark mode = token override.** Never duplicate styles.
7. **CSS custom properties on `:root`.** Recommended default.
8. **One source of truth.** Update once, propagates everywhere.

---

## Sample Output (full token CSS)

```css
:root {
  /* Primary scale — Indigo */
  --color-primary-50:  #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;  /* Primary */
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;

  /* Role-based aliases (use these in components, not the scale directly) */
  --color-primary: var(--color-primary-600);
  --color-primary-hover: var(--color-primary-700);
  --color-primary-active: var(--color-primary-800);

  /* Neutral — Zinc */
  --color-neutral-50:  #fafafa;
  --color-neutral-100: #f4f4f5;
  --color-neutral-200: #e4e4e7;
  --color-neutral-500: #71717a;
  --color-neutral-900: #18181b;

  --color-bg: var(--color-neutral-50);
  --color-bg-card: white;
  --color-text: var(--color-neutral-900);
  --color-text-muted: var(--color-neutral-500);
  --color-border: var(--color-neutral-200);

  /* Semantic — OKLCH */
  --color-success: oklch(0.65 0.2 150);
  --color-warning: oklch(0.75 0.15 85);
  --color-error:   oklch(0.65 0.2 25);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Spacing (4px base) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --text-base: 16px;
  --leading-normal: 1.5;
  --weight-semibold: 600;

  /* Transitions */
  --duration-normal: 250ms;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --color-bg: var(--color-neutral-900);
  --color-bg-card: var(--color-neutral-800);
  --color-text: var(--color-neutral-50);
  --color-text-muted: var(--color-neutral-400);
  --color-border: var(--color-neutral-700);
}
```

Role-based aliases + scale tokens + dark mode override via `[data-theme="dark"]`. Component CSS uses `var(--color-primary)` not `var(--color-primary-600)`.

---

## What NOT to Do

- **Don't hardcode hex codes.** Tokens or nothing.
- **Don't mix neutral systems.** Pick one and commit.
- **Don't name by color.** Role-based names.
- **Don't duplicate styles for dark mode.** Token override only.
- **Don't skip the scale.** 11 shades, not just 3.
- **Don't use random hex for semantic.** OKLCH for uniformity.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | design-token-guide |
| **Category** | Skills · Product |
| **Rating** | ★★★★☆ (8/10) |
| **Token Categories** | 6 (colors / shadows / radius / spacing / typography / transitions) |
| **Color Scale** | 11 shades (50-950) |
| **Neutral Systems** | 5 (gray / slate / zinc / neutral / stone) |
| **Semantic Colors** | 3 families × 3 variants each |
| **Shadow Elevations** | 5 (sm / md / lg / xl / 2xl) |
| **Spacing Base** | 4px |
| **Color Space** | OKLCH for semantic |
| **Naming Rule** | Role-based not color-based |
| **Storage** | CSS custom properties on `:root` |
| **Pairs With** | `anti-slop-rules` skill · `form-patterns` skill · `tooltip-format` skill · `scaffold-backend` skill (form layer) · `responsive-design` skill |
| **Bundle** | `SKILL.md` + `README.md` |

---

**TBK Labs** · Curated Kit · 2026-05-12
