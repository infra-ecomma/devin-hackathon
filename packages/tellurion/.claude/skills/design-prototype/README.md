**TBK Labs** · Curated Kit

---

# Design Prototype

_Generate interactive single-file HTML prototypes with working navigation, form states, and responsive behavior testing before code handoff._

**CATEGORY** Skills · Design  •  **TRIGGER** `prototype`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Eliminates specification ambiguity**: Prose design specs are open to interpretation; clickable prototypes make design intent tangible before engineering.
- **Single-file disposable artifacts**: No build step, no dependencies—share the .html directly for stakeholder testing and iteration.
- **Generates comparison variants**: Produces multiple design directions for the same page, enabling team decisions based on seeing, not imagining.

## What It Does

This skill generates interactive HTML prototypes from design system specifications and information architecture documentation. It reads DESIGN_DECISIONS.md (layout, color, typography) and IA_SPECIFICATION.md (page structure, navigation flows) and produces working prototypes that let stakeholders click through workflows. Each prototype is a single .html file with embedded CSS (Tailwind or Pico) and vanilla JS—no build tools, no dependencies.

Navigation links work. Forms accept input (no server required). Loading states, empty states, and error states are interactive.

Modals open and close. Tabs switch content. The prototype behaves like a real app without backend integration.

The skill generates one prototype per key page (home, main feature, settings), plus variant versions for A/B testing different layout or interaction approaches. Each variant is individually deployable for user testing. The skill also verifies responsive behavior across 5 breakpoints (mobile, tablet, small desktop, desktop, large desktop) and flags layout issues. Output is immediately shareable—just email the .html file or host on any static server. Prototypes are disposable—their value is in what they reveal before production effort, not in code longevity.

## How to Use

1. **Complete DESIGN_DECISIONS.md**: Specify layout, color, typography, and interaction patterns.
2. **Document IA_SPECIFICATION.md**: List all pages, navigation structure, and user flows.
3. **Call design-prototype**: Specify which pages to prototype and any variants to generate.
4. **Test responsiveness**: The skill verifies across breakpoints and reports issues.
5. **Share prototypes**: Download the .html files and distribute for user testing or stakeholder review.
6. **Iterate**: Update DESIGN_DECISIONS or IA_SPECIFICATION and regenerate prototypes.

## What NOT to Do

- Do not use prototypes as production code—they're for testing and feedback, not shipping.
- Do not generate variants for every pixel-level decision; focus on meaningful flow/interaction differences.
- Do not skip mobile viewport testing; responsive verification catches layout issues early.
- Do not populate with placeholder data that looks nothing like real data; prototypes need realistic content to test properly.

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | design-prototype |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ (8/10) |
| **Command** | `prototype` / `interactive prototype` / `clickable mockup` |
| **Bundle** | `SKILL.md` + `README.md` + `design-prototype.docx` |
| **Pairs with** | interface-design, information-architecture, design-validation |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-design-prototype]]
