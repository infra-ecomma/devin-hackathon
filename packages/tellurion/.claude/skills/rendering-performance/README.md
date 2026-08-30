**TBK Labs** · Curated Kit

---

# Rendering Performance

*Profile renders and animations, fix unnecessary re-renders, improve frame rates.*

**CATEGORY** Skills · DevOps  •  **TRIGGER** `"slow rendering"`, `"jank"`, `"janky animations"`, `"why does everything re-render"`, `"laggy scrolling"`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Uses Chrome DevTools React Profiler and Performance traces to identify exactly which components are re-rendering unnecessarily and how long each render takes, rather than guessing based on "the app feels slow."
- Distinguishes between "render is slow" (component's render function takes > 16ms, missing 60 FPS) and "everything re-renders" (parent component re-renders, causing all children to re-render even though their props didn't change) — different causes require different fixes.
- Applies targeted fixes (React.memo, useMemo, useCallback, moving state closer to leaves) and re-measures frame rate before/after, proving that jank is fixed rather than reshuffling which component is slow.

## What It Does

Rendering Performance is a profiling workflow for React and vanilla JavaScript applications that measures frame rate and component re-render performance, identifies unnecessary re-renders or slow render functions, applies memoization and state optimizations, and validates the improvement with before/after frame rate measurements.

### Symptom Classification and Baseline Measurement

The skill starts by classifying the symptom: When does slowness occur (initial load, interaction, scrolling, animation)? On which device/browser (mobile is more performance-sensitive)? Is it a React app or vanilla JavaScript? For React: the skill uses React Profiler (DevTools → Profiler tab) to record a re-render cycle, capturing which components rendered, why (props changed, parent re-rendered, hooks changed), and how long each component's render function took. For vanilla JavaScript: the skill uses Chrome DevTools Performance tab to record a trace, identifying long tasks (> 50ms), frame drops (indicated by red blocks in the Performance timeline), and expensive JavaScript functions. The baseline captures specific metrics: average frame rate (target 60 FPS = one frame every 16ms), longest frame time, which component re-renders most frequently.

### Root Cause Diagnosis

For React: the skill analyzes the Profiler output to find components that rendered but didn't have prop changes — those are unnecessary re-renders. For example, if a list component re-renders when its sibling's state changes, the list is probably not memoized. If a button component re-renders 50 times during a single user click, a handler is probably defined inline (creating a new function every render). For vanilla JavaScript: the skill analyzes the Performance trace to find long tasks (JavaScript running > 50ms without yielding), expensive DOM operations (forced reflows by querying offsetHeight, then modifying styles), or excessive event listeners.

### Optimization Application

For React: the skill applies memoization (React.memo for child components, useMemo for expensive calculations, useCallback for stable handler references), moves state closer to where it's used (so state changes don't trigger ancestor re-renders), and splits components so expensive renders don't block cheap ones. For vanilla JavaScript: the skill applies requestAnimationFrame to batch DOM updates, uses event delegation instead of individual listeners, removes synchronous reflows (query then modify patterns), and uses Web Workers for expensive calculations. Each fix is applied with minimal code changes.

### Before/After Frame Rate Validation

After applying fixes, the skill records DevTools profiles again using the same interaction (scroll, click, type) and same device simulation (mobile throttling if needed). It measures: average frame rate (target 60 FPS), longest frame time (target < 50ms), and component re-render count. If frame rate improved from 40 FPS to 58 FPS, the fix worked. If re-render count dropped from 150 to 30 for the same interaction, memoization worked. The skill documents the before/after measurements.

## How to Use

1. Invoke the skill: `"my app is janky"` or `/rendering-performance` with a description of what's slow.
2. The skill asks: When does slowness occur (load, interaction, scroll, animation)? Is it React or vanilla JavaScript?
3. The skill guides you through recording a DevTools profile (React Profiler for React, Performance tab for vanilla JS) during the slow interaction.
4. The skill analyzes the profile and identifies the root cause (unnecessary re-renders, slow render function, long tasks, expensive DOM operations).
5. The skill recommends specific fixes and applies them.
6. The skill guides you through recording a new profile (same interaction, same throttling).
7. You see before/after frame rate improvement.

## What NOT to Do

- Don't apply memoization to every component. Memoization has a cost (shallow prop comparison). Only memoize components that re-render unnecessarily. The skill's Profiler analysis tells you which ones.
- Don't assume render time and re-render count are the same problem. A component might render only once but take 100ms (slow render function). Or it might render 50 times in 50ms (unnecessary re-renders). Fixes are different.
- Don't optimize without measuring frame rate first. Some optimizations are premature — if your app is already 58 FPS and you can't perceive jank, optimizing further wastes time.
- Don't forget to measure on mobile. Performance characteristics on desktop don't translate to mobile — more powerful desktop hardware hides performance problems that become obvious on a phone.

## Quick Reference

| Property | Value |
|---|---|
| **Skill name** | rendering-performance |
| **Category** | Skills · DevOps |
| **Rating** | ★★★★☆ |
| **Command** | `/rendering-performance` |
| **Bundle** | `SKILL.md` + `README.md` + `rendering-performance.docx` |
| **Pairs With** | optimize, debug-optimize-lcp, core-web-vitals-fix |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-rendering-performance]]
