**TBK Labs** · Curated Kit

---

# Motion Design

_Add purposeful animations with GPU-optimized properties and reduced-motion compliance._

**CATEGORY** Skills · Design  •  **TRIGGER** `animation`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Motion with purpose only**: Every animation must justify its UX reason (direct attention, confirm actions, provide feedback)—no decorative effects.
- **Performance-first approach**: Animates only transform and opacity (GPU-composited) and bans properties that trigger layout recalculation (width, height, padding, top/left).
- **Accessibility built in**: Respects prefers-reduced-motion and uses appropriate easing (ease-out-quart) to avoid distracting motion.

## What It Does

This skill adds motion to interfaces with purpose—directing attention, confirming actions, and providing feedback. It treats motion as communication, not decoration: every animation must have a UX reason.

The skill specifies which properties animate and which don't: transform (translate, rotate, scale) and opacity run on the GPU compositor without layout recalculation and are safe to animate. Width, height, padding, top, left, and margin trigger layout recalculation and cause jank—never animate these.

Scroll-triggered animations are handled through Intersection Observer for performance. Easing curves matter: ease-out-quart and ease-out-quint feel natural for interaction responses.

Bounce and elastic easing are banned (feel cheap). Stagger sequences are coded with timeline control to avoid cascading animation delays that slow perceived responsiveness. All animations respect user preference: prefers-reduced-motion disables decorative animations while preserving essential feedback (loading states, button presses).

## How to Use

1. **Identify motion moments**: Where do users need feedback (button click, page transition, form validation)?
2. **Choose animation type**: Entrance (fade/slide), state transition (hover, active), or scroll-driven.
3. **Select animatable properties**: Use transform and opacity only.
4. **Specify easing**: Use ease-out-quart or ease-out-quint.
5. **Implement with prefers-reduced-motion**: Disable decorative motion for users who prefer reduced motion.
6. **Test performance**: Verify 60fps on target devices.

## What NOT to Do

- Do not animate layout-affecting properties (width, height, padding, top, left); use transform and opacity instead.
- Do not add decorative animations without a UX reason—motion must communicate, not distract.
- Do not use bounce or elastic easing; they feel cheap and unprofessional.
- Do not ignore prefers-reduced-motion; users who set this preference should get accessible, non-distracting experiences.

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | motion-design |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ (8/10) |
| **Command** | `animation` / `motion` / `hover effects` / `transitions` |
| **Bundle** | `SKILL.md` + `README.md` + `motion-design.docx` |
| **Pairs with** | design-validation, responsive-design, shadcn |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-motion-design]]
