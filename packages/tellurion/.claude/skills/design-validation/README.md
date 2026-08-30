**TBK Labs** · Curated Kit

---

# Design Validation

_Test responsive design across 5 breakpoints and light/dark modes using Playwright before handoff._

**CATEGORY** Skills · Design  •  **TRIGGER** `validate the design`  •  **RATING** ★★★☆☆ (6/10 behavioral, measured 2026-07-03)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Eliminates manual responsive testing**: Playwright automates capture across 5 breakpoints, eliminating guesswork about layout stability.
- **Tests real-world conditions**: Validates light/dark modes, interaction states, content overflow scenarios, and navigation links—not just static mockups.
- **Produces handoff documentation**: Generates multi-viewport screenshots and accessibility reports that developers and designers need to maintain the system.

## What It Does

This skill is the final quality gate before code handoff. It runs rendered output (not design specs) through Playwright to test multiple real-world conditions: responsive behavior across 5 breakpoints (375px mobile, 768px tablet portrait, 1024px tablet landscape, 1280px desktop, 1440px desktop wide), light and dark mode rendering, interaction states (hover, focus, active), form validation, error states, and empty states.

For each page in your information architecture, it captures before/after screenshots at each breakpoint, enabling design-to-design diffs for redesigns. It tests content edge cases (extreme text lengths, long names, number overflow) to ensure layouts don't break.

It validates that navigation links work, buttons are clickable, and form inputs accept input. The skill generates a comprehensive report documenting: which breakpoints pass/fail, which states are missing or broken, color contrast issues (if any), and interaction failures.

For P0 failures (layout breaks, missing states, inaccessible elements), it recommends fixes and loops back to code generation. Output includes: multi-viewport screenshot bundle, validation report, and handoff documentation for developers.

## How to Use

1. **Generate or build your code**: The skill validates actual rendered output, not specifications.
2. **Specify pages to validate**: List each page/state that needs testing (home, dashboard, settings, error page, empty state, etc.).
3. **Run design-validation**: The skill tests across breakpoints, light/dark modes, and interaction states.
4. **Review validation report**: Check which tests pass and which fail.
5. **If failures exist**: Review findings and loop back to code generation for fixes, then re-validate.
6. **Once passing**: The output is ready for handoff to developers.

## What NOT to Do

- Do not run validation against design specs; the skill requires actual rendered output.
- Do not skip dark mode testing; validation includes light and dark mode verification.
- Do not assume "looks good on my screen" is sufficient; responsive testing catches breakpoint-specific issues.
- Do not treat layout overflow as minor; validate that content doesn't push elements off-screen at any breakpoint.

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | design-validation |
| **Category** | Skills · Design |
| **Rating** | ★★★☆☆ (6/10 behavioral, measured 2026-07-03) |
| **Command** | `validate the design` / `responsive test` / `cross-browser test` / `/design-validation` |
| **Bundle** | `SKILL.md` + `README.md` + `design-validation.docx` |
| **Pairs with** | design-prototype, design-critique, responsive-design, web-design-review |

---

**TBK Labs** · Curated Kit · 2026-07-03

Vault note: [[skill-design-validation]]
