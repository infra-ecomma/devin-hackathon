**TBK Labs** · Curated Kit

---

# Design Mirror

_Capture any site's design system and apply it to your codebase—colors, fonts, spacing, rhythm, and aesthetic._

**CATEGORY** Skills · Code  •  **TRIGGER** `make it look like, match the design of, mirror this design, copy the style from, inspired by [url], replicate site aesthetic`  •  **RATING** ★★★★☆  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Captures design systems from inspiration sites and applies them surgically to your existing codebase (Tailwind classes, CSS files, component styles) without rewriting HTML structure or JavaScript, keeping all functionality intact.
- Extracts and builds a complete design token map (colors, typography, spacing scale, border radii, shadows, animations) from live site inspection, providing the blueprint to align your design with the inspiration site's aesthetic.
- Works across frameworks by updating the styling layer only — your existing components, state management, and business logic stay unchanged, making the rebrand work immediately without integration friction.


## What It Does

This skill captures the visual design language of any website (colors, typography, spacing, component shapes, animations) and applies it to your existing codebase, making your app look visually cohesive with an inspiration site. You're not copying functionality or HTML structure—you're understanding and replicating the design system: the palette (primary, secondary, neutrals), the type scale (heading sizes, font weights, line heights), spacing patterns (margins, paddings), border radii, shadows, hover states, and overall aesthetic feel. This is useful when you want your admin dashboard to feel like Stripe, or your e-commerce site to match a modern competitor, or when rebranding and want to match a design reference.

The workflow starts with capture: the skill takes a screenshot of the inspiration site via Bright Data's Web Unlocker (handling anti-bot measures) and scrapes the underlying HTML and CSS. This gives you both the visual appearance (screenshot) and the technical implementation (CSS). Next, the skill extracts the full design system: analyzing the screenshot to identify all colors used (primary buttons, text, backgrounds, borders), measuring typography (font families, sizes, weights, line heights), calculating spacing scale (padding and margin patterns), detecting component shapes (border radii on cards, buttons), and identifying animations (transitions on hover, fades on load).

The analysis phase combines visual inspection (what does it look like?) with technical inspection (what CSS rules create this?). The skill builds a complete design token map: "primary: #1f2937, font-family: Inter, spacing scale [0.5rem, 1rem, 2rem...]". This token map becomes the blueprint for your redesign.

Then comes application: the skill translates that design system into your existing codebase, updating CSS classes, design tokens, and component styles without rewriting your HTML structure or component logic. If you have 100 components, the skill updates the styling layer only—all your existing functionality and state management stays intact. The final output is your existing codebase with styling updated to match the inspiration site. The changes are surgical: Tailwind classes get updated, CSS files get refactored to use the new token map, and color/spacing variables get swapped. You can see a before/after comparison, verify the new design matches the inspiration site, and iterate if needed. The updated code stays in your existing framework and patterns—no unwanted refactoring or infrastructure changes.

## What NOT to Do

- Do not rewrite HTML structure or JavaScript logic—surgical precision only. Apply design tokens, colors, spacing, and typography to existing code without refactoring components.
- Do not overwrite your existing design system without merging—if you have a design system already, integrate the new tokens with it rather than wholesale replacement.
- Do not ignore contrast and accessibility when applying new colors—ensure the replicated design meets WCAG standards on your pages; some websites have poor contrast that you shouldn't copy.


## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | design-mirror |
| **Category** | Skills · Code |
| **Rating** | ★★★★☆ |
| **Bundle** | `SKILL.md` + `README.md` + `design-mirror.docx` + `references/` |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-design-mirror]]
