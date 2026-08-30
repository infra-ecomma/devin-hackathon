**TBK Labs** · Curated Kit

---

# Meta-Design

_Product-aware UI audit: design tokens, typography, hierarchy, contrast, density, alignment, visual state system._

**CATEGORY** Skills · Design  •  **TRIGGER** `/meta-design`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Audits the visual substrate of an application: tokens (colors, spacing, shadows), typography (sizes, weights, line heights), vertical rhythm (consistency), hierarchy (visual weight signals importance).
- Produces findings with file paths and CSS changes. Not "improve contrast" but "file X class Y color #AAA to #333 for WCAG AA".
- Focuses on systematic issues, not preferences. Detects: unused tokens, inconsistent spacing, broken vertical rhythm, hierarchy confusion.

## What It Does

This skill audits product design systems by checking tokens, typography, spacing, hierarchy, contrast, visual states, and consistency.

**Phase 1: Token Audit** — Check if design uses defined token system (colors, spacing, shadows, etc.). Detect unused tokens or hardcoded values that should be tokens.

**Phase 2: Typography** — Verify font sizes, weights, line heights follow a scale. Check for orphaned or inconsistent typography.

**Phase 3: Spacing & Rhythm** — Check vertical rhythm (line height multiplier). Verify spacing follows a scale. Detect: gaps too large/small, misaligned elements.

**Phase 4: Hierarchy** — Verify visual weight signals importance. Headings larger than body text. Primary actions visually dominant. Secondary actions de-emphasized.

**Phase 5: Contrast** — Check color contrast ratios (WCAG AA minimum). Identify low-contrast text or borders.

**Phase 6: Visual States** — Check: hover states clear, focus states visible, disabled states obvious, loading/error states clear.

**Phase 7: Consistency** — Check: consistent button styles, card styles, spacing patterns, icon treatments across UI.

**Phase 8: Report** — Produce findings (with CSS file paths and proposed changes) organized by severity (critical, high, medium, low).

## How to Use

This skill is invoked by the `/product-ux-audit` workflow.

1. Workflow calls this skill after code audit phase.
2. Skill audits design tokens, typography, spacing, hierarchy, contrast, states, consistency.
3. Skill produces findings with file paths and CSS changes.
4. Findings returned to workflow for final report.

## What NOT to Do

- **Don't audit mockups** — Audit actual CSS/design system in production code.
- **Don't provide design preferences** — Provide systematic issues (token usage, rhythm, contrast).
- **Don't ignore accessibility** — Contrast, hierarchy, states are accessibility requirements.
- **Don't miss token issues** — Hardcoded values that should be tokens create maintenance debt.

## Quick Reference

| Property | Value |
|---|---|
| **Skill name** | meta-design |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ |
| **Scope** | 8 audit phases (tokens, typography, spacing, hierarchy, contrast, states, consistency, report) |
| **Output** | Findings with CSS file paths and proposed changes, organized by severity |
| **Part Of** | `/product-ux-audit` workflow |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-meta-design]]
