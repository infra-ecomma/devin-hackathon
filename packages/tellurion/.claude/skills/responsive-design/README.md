**TBK Labs** · Curated Kit

---

# Responsive Design

_Systematically adapt layouts, interactions, and content across 5 breakpoints—not just shrinking desktop for mobile._

**CATEGORY** Skills · Design  •  **TRIGGER** `responsive`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Full context adaptation, not just breakpoints**: Rethinks layout, interaction, content hierarchy, and navigation per device tier—not just CSS media queries.
- **Closes responsive verification gap**: Systematically tests 5 device tiers (mobile small, mobile, tablet, desktop, large desktop) and catches issues before ship.
- **Planned strategy before CSS**: Defines adaptation approach (fluid columns, breakpoints, hidden elements) per tier before writing code.

## What It Does

This skill systematically adapts designs across screen sizes and device contexts. It's not just shrinking desktop designs for mobile—it rethinks layout, interaction, content hierarchy, and navigation per device tier. The skill starts by understanding what exists: What viewport was the design built for?

Which elements are fixed-width vs. fluid? Then it defines a tier-based strategy: Mobile S (320-374px, minimum viable), Mobile (375-767px, primary target), Tablet (768-1023px), Desktop (1024-1440px), Large Desktop (1440px+).

For each tier, the skill rethinks layout (how many columns, what content is visible), interaction (touch vs. pointer, gesture support), and navigation (sidebar vs. hamburger, tab vs.

drawer). The skill produces a responsive specification that code generation consumes: "At 768px, sidebar collapses to hamburger; at 1440px, sidebar reappears. Table pagination at mobile, infinite scroll at desktop." It also defines touch target sizes (44px minimum), readable text sizes (16px minimum on mobile), and image optimization per tier. The skill tests across all 5 tiers and flags issues: layout shifts, text overflow, touch targets too small, images slow to load, navigation unreachable.

## How to Use

1. **Document the source design**: Specify which viewport the design targets and which elements are fixed vs. fluid.
2. **Define tier strategy**: For each of 5 tiers, specify layout, content, interaction changes.
3. **Establish touch/text minimums**: Set 44px touch targets, 16px minimum text on mobile.
4. **Test each tier**: Verify layout stability, typography readability, interaction reachability at each breakpoint.
5. **Optimize images**: Specify image sizes and loading strategy per tier.

## What NOT to Do

- Do not use breakpoints without rethinking content and interaction—just shrinking desktop to mobile creates unusable layouts.
- Do not assume same interaction works across tiers—touch and pointer require different affordances.
- Do not skip mobile S (320px) testing; old phones and narrow windows still exist.
- Do not assume touch target sizes are optional; missed targets cause app store complaints.

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | responsive-design |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ (8/10) |
| **Command** | `responsive` / `mobile layout` / `breakpoints` / `cross-device` |
| **Bundle** | `SKILL.md` + `README.md` + `responsive-design.docx` |
| **Pairs with** | mobile-design, design-validation, interface-design |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-responsive-design]]
