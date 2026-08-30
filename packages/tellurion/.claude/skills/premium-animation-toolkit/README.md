**TBK Labs** · Curated Kit

---

# Premium Animation Toolkit

_Reference for Phase 5 (BUILD) when creating WOW-factor landing pages. Full ecosystem beyond GSAP — CSS-only techniques, component libraries, Awwwards criteria, micro-interaction patterns. **Awwwards 10/10 criteria**: Design 40% (custom typography, intentional color palette, hierarchy through negative space, no stock/template feel), Usability 30% (<3s load, 60fps animations, no layout shifts, Core Web Vitals LCP <1.5s + CLS <0.05 + INP <100ms), Creativity 20% (custom interaction patterns NOT template defaults, unconventional navigation, ONE signature WOW moment), Content 10% (real content NEVER lorem ipsum, copy that serves design, real photography). Score thresholds: 8.0+ = Site of the Day candidate, 7.5+ = Honorable Mention. **Key insight**: "The last 3 weeks of refinement — timing tweaks, edge-case testing, micro-interaction polish — separate 6.2 from 7.5." **Library ecosystem in 3 tiers**: Tier 1 Must-Know (GSAP + ScrollTrigger via cdnjs, Lenis for smooth scroll via unpkg, CSS Scroll-Driven Animations native). Tier 2 Situational (Anime.js 17KB for SVG, Motion/Framer for React, CountUp.js for numbers, Typed.js for typewriter, Swiper for carousels, Atropos for 3D tilt). Tier 3 Specialty (Three.js 3D/WebGL hero only, Spline embeddable 3D, Lottie After-Effects→web, Particles.js subtle ambient, Barba.js page transitions). **CSS-only scroll animations** (use FIRST, add JS only for what CSS can't): fade-in on scroll via `animation-timeline: view()`, parallax via `animation-timeline: scroll(root block)`, progress bar via `growProgress linear` keyframes. **Performance rules**: 60fps animations required (transform + opacity only, never properties triggering layout), GPU acceleration via `will-change: transform`, reduce motion via `prefers-reduced-motion` media query, mobile-disable expensive animations via matchMedia. **Micro-interaction patterns**: hover transforms, click micro-feedback, focus states, scroll progress, loading states. Plus 8 techniques specifically for 9/10 score (custom typography pairs, generous whitespace, asymmetric grids, motion timing curves, color reveal, multi-layer parallax, signature loading, one signature WOW moment per page)._

**CATEGORY** Skills · Marketing  •  **TRIGGER** `premium animation toolkit`, `Awwwards 10/10 criteria`, `GSAP ScrollTrigger Lenis`, `CSS scroll-driven animations`, `animation-timeline view`, `Anime.js Motion Framer CountUp Typed Swiper Atropos`, `Three.js Spline Lottie Particles Barba`, `signature WOW moment`, `60fps animations`, `prefers-reduced-motion`, `Core Web Vitals LCP CLS INP`, `7/10 vs 9/10 animation layer`  •  **RATING** ★★★★★ (9/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- "Last 3 weeks of refinement separate 6.2 from 7.5" — names the specific time investment that produces quality. Most teams ship landing pages once they "work"; Awwwards-quality teams ship after 3 weeks of timing tweaks + edge-case testing + micro-interaction polish. The number (3 weeks) is concrete; the activities (timing, edge cases, micro-interactions) are specific. Operators know exactly what to spend the time on.
- 3-tier library ecosystem (Must-Know / Situational / Specialty) with specific bundle sizes prevents the canonical "include 12 libraries because they sound cool" failure. Tier 1: 3 libraries always. Tier 2: pick what design needs. Tier 3: ONE library max for one signature moment. Bundle stays performant; quality stays high.
- "Use CSS-Only Scroll Animations FIRST, add JS libraries only for what CSS can't do" is the right performance philosophy. CSS scroll-driven animations are native, zero JS overhead, work even when JS fails. Teams that reach for GSAP immediately ship slower pages. The "CSS first" rule produces faster pages by default.

---

## What It Does

This skill is the comprehensive reference for premium landing page animations. Awwwards criteria + 3-tier library ecosystem + CSS-only techniques + performance rules + micro-interaction patterns + 8 techniques for 9/10 score.

**Awwwards 10/10 scoring criteria (4 dimensions).**

| Criterion | Weight | What Jury Looks For |
|-----------|--------|---------------------|
| Design | 40% | Custom typography, intentional color palette, visual hierarchy through negative space, no stock/template feel |
| Usability | 30% | <3s load, 60fps animations, no layout shifts, Core Web Vitals (LCP <1.5s, CLS <0.05, INP <100ms) |
| Creativity | 20% | Custom interaction patterns (not template defaults), unconventional navigation, ONE signature WOW moment |
| Content | 10% | Real content (NEVER lorem ipsum), copy that serves design, real photography |

**Score thresholds**: 8.0+ = Site of the Day candidate; 7.5+ = Honorable Mention.

**Key insight**: "The last 3 weeks of refinement — timing tweaks, edge-case testing, micro-interaction polish — separate 6.2 from 7.5."

**3-tier library ecosystem.**

**Tier 1 — Must-Know (use in every build).** GSAP + ScrollTrigger via cdnjs (scroll animations, parallax, pins, timelines). Lenis via unpkg (smooth scroll, momentum, anchor navigation). CSS Scroll-Driven Animations native (simple reveals, progress bars, parallax with zero JS).

**Tier 2 — Situational (use when design calls for it).** Anime.js (17KB, SVG animations, icon animations). Motion/Framer Motion (React projects, spring physics, natural transitions). CountUp.js (number counters, simpler than custom GSAP). Typed.js (typewriter text effects). Swiper (touch-friendly carousels/sliders, industry standard). Atropos (3D tilt/parallax on cards, mouse-driven depth).

**Tier 3 — Specialty (for specific WOW moments only).** Three.js (3D scenes, WebGL backgrounds; heavy — only for hero centerpieces). Spline (embeddable 3D objects, easier than Three.js, design tool). Lottie (designer-created vector animations, After Effects → JSON → web). Particles.js / tsParticles (particle backgrounds, subtle ambient motion). Barba.js (page transitions, SPA-like feel on multi-page sites).

**CSS-Only Scroll Animations** (use FIRST, add JS libraries only for what CSS can't do).

**Fade-In on Scroll**: `animation-timeline: view()`, `animation-range: entry 0% cover 40%`, `@keyframes fadeInUp { from { opacity: 0; transform: translateY(50px) } to { opacity: 1; transform: translateY(0) } }`.

**Parallax**: `animation-timeline: scroll(root block)`, `@keyframes parallaxMove { from { transform: translateY(0) } to { transform: translateY(30%) } }`.

**Progress Bar**: fixed top + linear-gradient + `transform-origin: left`, `animation: growProgress linear`, `animation-timeline: scroll(root block)`.

**Performance rules**.

60fps required: transform + opacity ONLY (these properties trigger compositor only, not layout). NEVER animate width/height/top/left (trigger layout reflow). GPU acceleration via `will-change: transform`. Respect `prefers-reduced-motion` media query (accessibility). Mobile-disable expensive animations via `gsap.matchMedia()`. Lazy-load below-the-fold animations.

**Micro-interaction patterns**. Hover transforms (subtle scale, color shift, shadow lift). Click micro-feedback (button press depth, ripple). Focus states (clear keyboard navigation visibility). Scroll progress (header bar growing as user scrolls). Loading states (skeleton screens, not spinners).

**8 techniques for 9/10 score**. (1) Custom typography pairs (not Google Fonts defaults). (2) Generous whitespace (40-60% blank space). (3) Asymmetric grids (escape the 12-column straitjacket). (4) Motion timing curves (cubic-bezier, not linear). (5) Color reveal (single accent color appearing on scroll). (6) Multi-layer parallax (3+ depth layers). (7) Signature loading state (not generic spinner). (8) ONE signature WOW moment per page (the thing you remember).

---

## How to Use

1. **Read this BEFORE Phase 5 BUILD.** Animation references are mandatory.
2. **Use CSS-only scroll animations first.** Add JS libraries only for what CSS can't do.
3. **Limit to Tier 1 libraries by default.** Add Tier 2 only if design needs it.
4. **Use Tier 3 (Three.js, Spline) ONLY for hero centerpieces.** Heavy; one signature moment.
5. **Spend 3 weeks on refinement after "working."** 6.2 → 7.5 lives in polish.
6. **Animate transform + opacity ONLY.** Never width/height/top/left (layout reflow).
7. **Respect `prefers-reduced-motion`.** Accessibility + performance.
8. **One signature WOW moment per page.** Don't compete with yourself.

---

## Awwwards Scoring Criteria

| Criterion | Weight | Key Requirements |
|-----------|--------|------------------|
| Design | 40% | Custom typography, intentional colors, no template feel |
| Usability | 30% | <3s load, 60fps, no layout shifts, Core Web Vitals |
| Creativity | 20% | Custom interactions, ONE signature WOW moment |
| Content | 10% | Real content, never lorem ipsum |

---

## 3-Tier Library Ecosystem

| Tier | Libraries | Use |
|------|-----------|-----|
| Must-Know | GSAP + ScrollTrigger · Lenis · CSS Scroll-Driven | Every build |
| Situational | Anime.js · Motion · CountUp · Typed · Swiper · Atropos | Design-specific |
| Specialty | Three.js · Spline · Lottie · Particles · Barba | One signature moment |

---

## Performance Rules

| Rule | Why |
|------|-----|
| Animate transform + opacity only | These trigger compositor only; never layout |
| Never animate width/height/top/left | Layout reflow = jank |
| Use `will-change: transform` | GPU acceleration |
| Respect `prefers-reduced-motion` | Accessibility |
| Disable parallax/pins on mobile via matchMedia | Performance |
| Lazy-load below-the-fold | Initial render speed |

---

## Core Web Vitals Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP (Largest Contentful Paint) | <1.5s | Good |
| CLS (Cumulative Layout Shift) | <0.05 | Good |
| INP (Interaction to Next Paint) | <100ms | Good |

---

## 8 Techniques for 9/10 Score

| # | Technique |
|---|-----------|
| 1 | Custom typography pairs (not Google Fonts defaults) |
| 2 | Generous whitespace (40-60% blank space) |
| 3 | Asymmetric grids (escape 12-column straitjacket) |
| 4 | Motion timing curves (cubic-bezier, not linear) |
| 5 | Color reveal (single accent appearing on scroll) |
| 6 | Multi-layer parallax (3+ depth layers) |
| 7 | Signature loading state (not generic spinner) |
| 8 | ONE signature WOW moment per page |

---

## Sample Output (CSS-only scroll animations)

```css
/* Fade-in on scroll — zero JS */
.reveal {
  animation: fadeInUp linear;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Parallax background — zero JS */
.parallax-bg {
  animation: parallaxMove linear;
  animation-timeline: scroll(root block);
}

@keyframes parallaxMove {
  from { transform: translateY(0); }
  to { transform: translateY(30%); }
}

/* Progress bar — zero JS */
.progress-bar {
  position: fixed; top: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, #DC2626, #F97316);
  transform-origin: left;
  animation: growProgress linear;
  animation-timeline: scroll(root block);
}

@keyframes growProgress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .reveal, .parallax-bg, .progress-bar {
    animation: none;
  }
}
```

This is the canonical CSS-only animation stack — fade-in on scroll, parallax, progress bar, all without JavaScript. `animation-timeline: view()` reveals elements as they enter viewport; `animation-timeline: scroll(root block)` ties animation to scroll progress; `prefers-reduced-motion` media query disables animations for accessibility. Zero JS bundle cost; works even when JS fails. Falls back gracefully on older browsers (no animation, but content renders).

---

## What NOT to Do

- **Don't include all 3 tiers of libraries by default.** Tier 1 baseline, Tier 2/3 only when needed.
- **Don't animate properties that trigger layout reflow.** Transform + opacity only.
- **Don't skip `prefers-reduced-motion`.** Accessibility requirement.
- **Don't use lorem ipsum.** Awwwards content criterion is 10% but lorem ipsum auto-fails.
- **Don't add 5 WOW moments per page.** Compete with yourself; signature moment is singular.
- **Don't ship without 3 weeks refinement.** 6.2 → 7.5 lives in polish.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | premium-animation-toolkit |
| **Category** | Skills · Marketing |
| **Rating** | ★★★★★ (9/10) |
| **Awwwards Criteria** | Design 40% · Usability 30% · Creativity 20% · Content 10% |
| **Score Thresholds** | 8.0+ Site of the Day · 7.5+ Honorable Mention |
| **Library Tiers** | 3 (Must-Know · Situational · Specialty) |
| **Core Web Vitals** | LCP <1.5s · CLS <0.05 · INP <100ms |
| **Performance Rule** | Animate transform + opacity only |
| **CSS Scroll API** | `animation-timeline: view()` / `scroll(root block)` |
| **Signature Moments per Page** | One |
| **Refinement Investment** | 3 weeks (6.2 → 7.5) |
| **Pairs With** | `creative-build` skill (sibling — required reading for Phase 5 BUILD) · `gsap-animation-guide` skill (sibling — GSAP-specific patterns) · `premium-design-dna` skill (sibling — design DNA pairs with animation) · `premium-design-dna` skill (sibling — broader premium techniques) · `creative-iterate` skill (sibling — refinement phase) |
| **Bundle** | `SKILL.md` + `README.md` + `premium-animation-toolkit.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-11
