---
name: motion-design
description: Add purposeful animations and micro-interactions — entrance effects, state transitions, hover states, scroll-driven motion. Enforces proper easing (ease-out-quart/quint, bans bounce/elastic), prefers-reduced-motion compliance, and performance-first approach. Triggers on "animation", "transitions", "micro-interactions", "motion", "hover effects", "make it feel alive".
---

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# Motion Design


## Overview

Motion communicates. It directs attention, confirms actions, and makes interfaces feel alive. Every animation must justify its existence with a UX reason. If you can't name why it exists, it shouldn't.

Motion communicates. It directs attention, confirms actions, and makes interfaces feel alive. Every animation must justify its existence with a UX reason. If you can't name why it exists, it shouldn't.

---

## Core Principle

**Motion is cause and effect, not decoration.**
- User clicks button → button state changes with tactile feedback
- Page loads → content enters in a hierarchy that guides the eye
- Error occurs → element draws attention without being jarring
- Task completes → positive micro-animation confirms success

---

## Motion Hierarchy

Execute in this order — never animate lower tiers before higher tiers are correct.

**1. Page Load Stagger** (highest priority)
Hero content fades in first, then secondary content staggers in with ~50-80ms delay between elements. The eye follows the narrative order of the page.

**2. State Transitions**
Interactive state changes — button hover, active, disabled, loading, error, success. These must feel instant-ish (100-200ms) or they feel broken.

**3. Micro-interactions**
Small confirmations — checkbox check, like button, copy-to-clipboard, toggle flip. These are delight moments. Duration: 150-300ms.

**4. Hover Effects** (lowest priority)
Subtle scale, shadow elevation, color shift. Pure polish — remove first if performance becomes an issue.

---

## Easing Reference

### Approved Easings

| Name | CSS Value | Use When |
|------|-----------|----------|
| ease-out-quart | `cubic-bezier(0.25, 1, 0.5, 1)` | Most entrances — feels natural, snappy |
| ease-out-quint | `cubic-bezier(0.22, 1, 0.36, 1)` | Hero elements, large entrances |
| ease-out-expo | `cubic-bezier(0.16, 1, 0.3, 1)` | Dramatic entrance, drawer open |
| ease-in-out-quart | `cubic-bezier(0.77, 0, 0.175, 1)` | Element moving across screen |
| ease-in-quart | `cubic-bezier(0.5, 0, 0.75, 0)` | Exits only — things leaving the screen |

### Banned Easings

**bounce** — `cubic-bezier(0.34, 1.56, 0.64, 1)` and all elastic variants. These feel toyish and unpolished in professional products. No exceptions.

**linear** for opacity/transform — only acceptable for background color on hover states.

**ease** (default CSS) — too slow in, too slow out. Always specify explicitly.

---

## Duration Guidelines

| Motion Type | Duration |
|-------------|----------|
| Micro-interaction (toggle, check) | 100-200ms |
| State transition (hover, focus) | 150-250ms |
| Element entrance (fade/slide) | 250-400ms |
| Panel/drawer open | 300-450ms |
| Page transition | 400-600ms |
| Loading skeleton shimmer | 1200-1500ms (loop) |

**Rule:** If it feels slow, halve the duration. Users notice slowness more than they notice speed.

---

## Implementation Patterns

### Entrance Animation (CSS)

```css
/* Base state — hidden before animation */
.animate-in {
  opacity: 0;
  transform: translateY(16px);
}

/* Animated state */
.animate-in.is-visible {
  animation: enterUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes enterUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Staggered List Entrance

```css
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 60ms; }
.list-item:nth-child(3) { animation-delay: 120ms; }
/* Cap stagger at ~8 items — beyond that, delay the group not individual items */
```

### State Transition (Button)

```css
.btn {
  transition:
    background-color 150ms ease-out,
    box-shadow 150ms ease-out,
    transform 100ms ease-out;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.btn:active { transform: translateY(0); box-shadow: none; }
```

### Scroll-Driven Entrance (JS with IntersectionObserver)

```js
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible')),
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
```

---

## prefers-reduced-motion Compliance

Non-negotiable. Every animation must respect this preference.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

For JS animations (GSAP, Framer Motion):
```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReduced ? 0 : 0.4;
```

---

## Performance Rules

- Animate only `transform` and `opacity` — these run on the GPU compositor without layout recalculation.
- Never animate `width`, `height`, `top`, `left`, `margin`, `padding` — these trigger layout and cause jank.
- Use `will-change: transform` sparingly (only if you have a measured jank problem — it consumes GPU memory).
- Keep simultaneous animations under 10 elements. Stagger instead of running in parallel.

---

## GSAP Usage Rules

Use GSAP only for:
- Complex stagger sequences with timeline control
- Scroll-triggered animations beyond IntersectionObserver capability
- Physics-based interactions (drag, momentum)

Do NOT use GSAP for:
- Simple hover state changes (use CSS transition)
- Single-element entrance animations (use CSS animation)
- Button state feedback (use CSS)

When using GSAP, always read the current API docs — training data is outdated for GSAP 3.x.

---

## Dos and Don'ts

**Do:**
- Name every animation by its UX purpose before implementing it.
- Start with CSS, reach for JS only when CSS is insufficient.
- Test at 0.25x speed to verify easing curves feel right.
- Add `prefers-reduced-motion` before shipping, not after.

**Don't:**
- Use bounce or elastic easing. Ever.
- Animate width/height/margin/padding — use transform scale instead.
- Add animation to every element because "it feels flat."
- Use GSAP for simple transitions that CSS handles natively.
- Animate anything that triggers layout (forced reflow = jank).

---

## Kit Integration

- **During GSD** — fires when UI polish/animation steps are reached in the build plan
- **During design-critique** — referenced when scoring Emotional Journey dimension
- **During /kit planning** — used when brand brief calls for premium/animated feel
- **On demand** — triggered by "animation", "transitions", "micro-interactions", "motion", "hover effects", "make it feel alive"




---

## Example Session

```
User: Add motion to the FleetCraft pricing page

Motion budget:
  Hero entry sequence (page load): nav → eyebrow → H1 → sub → CTAs, stagger 0.08s, ease-out
  Card reveals on scroll: ScrollTrigger.batch, stagger 0.06s, fade-up 16px
  CTA hover: lift -2px + shadow expand, 180ms ease-out
  Toggle (monthly/annual): width morph 220ms cubic-bezier(0.22, 1, 0.36, 1)
  FAQ expand: native details + smooth-height JS, 240ms

Reduced-motion fallback:
  Hero entry → instant
  Scroll reveals → opacity only, no transform
  Toggle → instant width swap

Performance:
  Transform + opacity only (no top/left/width-height)
  matchMedia guards: pin animations desktop-only

Verification:
  Lighthouse motion-stability check: no CLS introduced
  Reduced-motion preference: tested manual + Devtools toggle
  60fps profile: no jank in pricing page interactions

Saved: web/src/app/pricing/animations.ts + dev_docs/design/motion-pricing.md
Chain → design-critique, web-accessibility (verify reduced-motion paths)
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
